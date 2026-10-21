const crypto = require('crypto');

class PlanStep {
    constructor(description, deps = [], estimatedCost = 1) {
        this.id = crypto.randomUUID();
        this.description = description;
        this.dependencies = deps;
        this.estimatedCost = estimatedCost;
        this.status = 'pending';
        this.result = null;
        this.error = null;
        this.startTime = null;
        this.endTime = null;
    }

    get duration() {
        if (this.startTime && this.endTime) {
            return this.endTime - this.startTime;
        }
        return null;
    }
}

class Plan {
    constructor(goal) {
        this.id = crypto.randomUUID();
        this.goal = goal;
        this.steps = [];
        this.status = 'created';
        this.createdAt = Date.now();
        this.startTime = null;
        this.endTime = null;
        this.success = null;
    }

    addStep(description, deps = [], cost = 1) {
        const step = new PlanStep(description, deps, cost);
        this.steps.push(step);
        return step;
    }

    get totalEstimatedCost() {
        return this.steps.reduce((sum, s) => sum + s.estimatedCost, 0);
    }

    get pendingSteps() {
        return this.steps.filter(s => s.status === 'pending');
    }

    get readySteps() {
        return this.steps.filter(s => {
            if (s.status !== 'pending') return false;
            return s.dependencies.every(depId => {
                const dep = this.steps.find(st => st.id === depId);
                return dep && dep.status === 'completed';
            });
        });
    }
}

class PlanningEngine {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.plans = new Map();
        this.currentPlan = null;
        this.maxPlans = options.maxPlans || 50;
        this.learningRate = options.learningRate || 0.1;
    }

    async createPlan(goal, context = {}) {
        const plan = new Plan(goal);

        if (this.kernel && this.kernel.prompt) {
            const prompt = `Break down this goal into specific steps:

Goal: ${goal}

Context: ${JSON.stringify(context)}

Respond with a numbered list of steps, each on its own line. Each step should be a concrete action.`;

            try {
                const response = await this.kernel.prompt(prompt);
                const lines = response.split('\n').filter(l => /^\d+[\.\)]/.test(l.trim()));

                for (const line of lines) {
                    const stepDesc = line.replace(/^\d+[\.\)]\s*/, '').trim();
                    plan.addStep(stepDesc);
                }

                if (plan.steps.length === 0) {
                    plan.addStep(goal);
                }
            } catch (e) {
                plan.addStep(goal);
            }
        } else {
            plan.addStep(goal);
        }

        this._storePlan(plan);
        return plan;
    }

    async executePlan(plan, options = {}) {
        const { stopOnError = true, parallel = false, maxParallel = 3 } = options;

        if (plan.status === 'completed') {
            return { success: true, plan, note: 'Plan already completed' };
        }

        plan.status = 'running';
        plan.startTime = Date.now();
        this.currentPlan = plan;

        const executeStep = async (step) => {
            step.status = 'running';
            step.startTime = Date.now();

            try {
                if (this.kernel && this.kernel.dispatch) {
                    const result = await this.kernel.dispatch({ description: step.description });
                    step.result = result;
                } else {
                    step.result = { output: `Executed: ${step.description}` };
                }

                step.status = 'completed';
                step.endTime = Date.now();

                if (this.brain?.vectorMemory) {
                    await this.brain.vectorMemory.addMemory(
                        `Plan step completed: ${step.description}`,
                        { type: 'plan', planId: plan.id, stepId: step.id }
                    );
                }

                return step;
            } catch (e) {
                step.status = 'failed';
                step.error = e.message;
                step.endTime = Date.now();
                throw e;
            }
        };

        try {
            while (plan.pendingSteps.length > 0 || plan.readySteps.length > 0) {
                const ready = plan.readySteps;

                if (ready.length === 0) {
                    const pending = plan.pendingSteps.find(s =>
                        s.dependencies.every(depId => {
                            const dep = plan.steps.find(st => st.id === depId);
                            return dep?.status === 'completed';
                        })
                    );
                    if (!pending) break;
                }

                const toExecute = parallel
                    ? ready.slice(0, maxParallel)
                    : [ready[0]];

                if (parallel && toExecute.length > 1) {
                    await Promise.all(toExecute.map(executeStep));
                } else {
                    for (const step of toExecute) {
                        await executeStep(step);
                    }
                }

                if (stopOnError && plan.steps.some(s => s.status === 'failed')) {
                    break;
                }
            }

            const allCompleted = plan.steps.every(s => s.status === 'completed');
            plan.status = allCompleted ? 'completed' : 'failed';
            plan.success = allCompleted;
            plan.endTime = Date.now();

            return { success: allCompleted, plan };
        } catch (e) {
            plan.status = 'failed';
            plan.success = false;
            plan.endTime = Date.now();
            return { success: false, plan, error: e.message };
        }
    }

    async reflectOnPlan(plan, outcome) {
        const feedback = {
            planId: plan.id,
            goal: plan.goal,
            outcome,
            timestamp: Date.now()
        };

        if (plan.steps) {
            const stepDurations = plan.steps
                .filter(s => s.duration !== null)
                .map(s => ({ id: s.id, duration: s.duration, cost: s.estimatedCost }));

            const avgDuration = stepDurations.reduce((sum, s) => sum + s.duration, 0) / stepDurations.length;
            const avgCost = stepDurations.reduce((sum, s) => sum + s.cost, 0) / stepDurations.length;

            feedback.stepAnalysis = {
                totalSteps: plan.steps.length,
                completed: plan.steps.filter(s => s.status === 'completed').length,
                failed: plan.steps.filter(s => s.status === 'failed').length,
                avgDuration,
                accuracy: avgCost > 0 ? avgCost / (avgDuration / 1000) : 0
            };
        }

        if (this.brain?.vectorMemory) {
            await this.brain.vectorMemory.addMemory(
                `Plan reflection: ${plan.goal.substring(0, 100)} - Success: ${outcome.success}`,
                { type: 'reflection', ...feedback }
            );
        }

        return feedback;
    }

    _storePlan(plan) {
        if (this.plans.size >= this.maxPlans) {
            const oldestKey = this.plans.keys().next().value;
            this.plans.delete(oldestKey);
        }
        this.plans.set(plan.id, plan);
    }

    getPlan(planId) {
        return this.plans.get(planId);
    }

    getCurrentPlan() {
        return this.currentPlan;
    }

    getPlanHistory() {
        return Array.from(this.plans.values())
            .sort((a, b) => b.createdAt - a.createdAt);
    }
}

module.exports = { PlanningEngine, Plan, PlanStep };