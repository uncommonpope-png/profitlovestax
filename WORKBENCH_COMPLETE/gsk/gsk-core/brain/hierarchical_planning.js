'use strict';

/**
 * HierarchicalPlanning — Manager→Worker delegation (CrewAI parity)
 *
 * PlanningEngine creates manager plan → delegates sub-plans to specialists
 * Recursive: specialists can spawn sub-specialists
 */

class HierarchicalPlanning {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.specialistAgents = options.specialistAgents || kernel.systems?.specialistAgents;
        this.planningEngine = options.planningEngine || kernel.planningEngine || kernel.systems?.planningEngine;
        this.maxDepth = options.maxDepth || 3;
        this.currentDepth = 0;
    }

    /**
     * Create a hierarchical plan for a complex goal
     */
    async createPlan(goal, options = {}) {
        const depth = options.depth || 0;
        if (depth >= this.maxDepth) {
            throw new Error(`Max delegation depth (${this.maxDepth}) reached`);
        }

        console.log(`[HierarchicalPlan] Creating plan at depth ${depth} for: ${goal}`);

        // Manager brain decides decomposition
        const decomposition = await this._decomposeGoal(goal, depth);

        // For each sub-goal, either:
        // 1. Create leaf plan (if atomic enough)
        // 2. Recursively decompose (if complex)
        const subPlans = [];
        for (const subGoal of decomposition.subGoals) {
            if (subGoal.atomic || depth >= this.maxDepth - 1) {
                // Create leaf plan using the specialist for this domain
                const plan = await this._createLeafPlan(subGoal, decomposition.specialist);
                subPlans.push({ subGoal, plan });
            } else {
                // Recursively decompose
                const plan = await this.createPlan(subGoal.description, { depth: depth + 1 });
                subPlans.push({ subGoal, plan });
            }
        }

        return {
            goal,
            depth,
            specialist: decomposition.specialist,
            subGoals: decomposition.subGoals,
            subPlans,
            managerPlan: decomposition.managerPlan
        };
    }

    /**
     * Execute a hierarchical plan
     */
    async executePlan(hierarchicalPlan, options = {}) {
        const results = [];

        for (const subPlan of hierarchicalPlan.subPlans) {
            console.log(`[HierarchicalPlan] Executing sub-plan: ${subPlan.subGoal.description}`);

            if (subPlan.plan.subPlans?.length) {
                // Recursive execution
                const result = await this.executePlan(subPlan.plan, options);
                results.push({ subGoal: subPlan.subGoal, result });
            } else {
                // Leaf execution
                const specialistAgent = this.specialistAgents;
                if (specialistAgent) {
                    const result = await specialistAgent.executeSpecialist(
                        hierarchicalPlan.specialist || 'coder',
                        subPlan.subGoal.description,
                        { goal: hierarchicalPlan.goal, subGoals: hierarchicalPlan.subGoals }
                    );
                    results.push({ subGoal: subPlan.subGoal, result });
                }
            }
        }

        return {
            goal: hierarchicalPlan.goal,
            results,
            completedAt: Date.now()
        };
    }

    async _decomposeGoal(goal, depth) {
        // Use brain to decompose the goal
        const prompt = `You are a hierarchical planning manager.

GOAL: ${goal}
DEPTH: ${depth}

Decpose this into sub-goals (2-4 sub-goals). For each sub-goal, specify:
1. description: clear task description
2. atomic: true if single-step implementable, false if needs further decomposition
3. specialist: which specialist should handle it (researcher/architect/coder/reviewer/tester/documenter)

Return JSON array of sub-goals.`;

        if (this.kernel?.brain?.think) {
            const response = await this.kernel.brain.think(prompt, '', true);
            const content = response?.result || response || '';

            // Try to parse sub-goals from response
            try {
                const match = content.match(/\[[\s\S]*\]/);
                if (match) {
                    return {
                        subGoals: JSON.parse(match[0]),
                        specialist: 'coder',
                        managerPlan: content
                    };
                }
            } catch (e) {
                // Parse failed, use defaults
            }
        }

        // Default decomposition: split into research + implement + review
        return {
            subGoals: [
                { description: `Research: ${goal}`, atomic: false, specialist: 'researcher' },
                { description: `Implement: ${goal}`, atomic: true, specialist: 'coder' },
                { description: `Review: ${goal}`, atomic: true, specialist: 'reviewer' }
            ],
            specialist: 'architect',
            managerPlan: `Decomposed into: research → implement → review`
        };
    }

    async _createLeafPlan(subGoal, specialistRole) {
        const specialist = this.specialistAgents?.roles?.[specialistRole];
        return {
            subGoal,
            specialist: specialistRole,
            prompt: specialist?.systemPrompt || 'Execute the task',
            tools: specialist?.tools || []
        };
    }
}

module.exports = { HierarchicalPlanning };