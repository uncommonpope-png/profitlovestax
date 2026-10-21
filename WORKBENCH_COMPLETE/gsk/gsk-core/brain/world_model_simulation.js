'use strict';

/**
 * WORLD MODEL SIMULATION
 *
 * Dr. Fei-Fei Li's Spatial Intelligence framework implemented as a GSK module.
 * Takes a goal + environment, runs a brain.think() powered multi-step simulation,
 * and returns a structured outcome report with the best action path.
 *
 * The simulation loop:
 *   1. Perceive — read current environment state
 *   2. Reason — generate possible actions
 *   3. Simulate — model outcomes for each action
 *   4. Plan — select the best path forward
 *   5. Report — return structured outcome for execution
 *
 * Sage ref: SKILL - World Model Simulation.md (slug: world_model_simulation)
 */

class WorldModelSimulation {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel?.brain || null;
        this.simulationHistory = [];
        this._autoTimer = null;
        this._autoIntervalMs = 60000;
        this._isAutoRunning = false;
    }

    _hasBrain() {
        return this.brain && typeof this.brain.think === 'function';
    }

    /**
     * Run a full simulation cycle.
     * @param {string} goal - What we want to achieve
     * @param {string} environment - Description of the environment context
     * @param {object} options - { steps, branches, perceiveFirst }
     * @returns {object} simulation report
     */
    async simulate(goal, environment, options = {}) {
        const maxSteps = options.steps || 5;
        const branches = options.branches || 3;

        // Phase 1: Perceive current environment state
        const perception = await this._perceive(environment);

        // Phase 2: Generate action hypotheses
        const hypotheses = await this._hypothesize(goal, perception, branches);

        // Phase 3: Simulate each branch forward
        const simulations = [];
        for (const hypothesis of hypotheses) {
            const outcome = await this._simulateBranch(goal, perception, hypothesis, maxSteps);
            simulations.push(outcome);
        }

        // Phase 4: Evaluate and select best path
        const bestPath = this._evaluate(simulations);

        // Phase 5: Generate execution plan
        const plan = await this._plan(goal, bestPath);

        const report = {
            goal,
            environment,
            perception,
            hypotheses: hypotheses.length,
            branches: simulations.length,
            bestPath,
            plan,
            simulationTime: Date.now()
        };

        this.simulationHistory.push(report);
        if (this.simulationHistory.length > 50) this.simulationHistory.shift();

        return report;
    }

    /**
     * Perceive the current environment state.
     */
    async _perceive(environment) {
        // Fetch real Soulverse state if available
        let worldState = { tick: 0, souls: [], description: 'No connection' };

        try {
            if (this.kernel?.sanctumClient?.isConnected) {
                worldState = this.kernel.sanctumClient.getWorldState();
            }
        } catch (e) {}

        if (this._hasBrain()) {
            const result = await this.brain.think(
                `You are GSK's perception system. Analyze this environment:\n\n` +
                `Environment: ${environment}\n` +
                `World state: ${JSON.stringify(worldState)}\n\n` +
                `Describe what you perceive: key entities, their states, relevant patterns, ` +
                `and any immediate opportunities or threats. Be concise (3-5 sentences).`
            );
            return { raw: worldState, analysis: result?.result || result || '' };
        }

        return { raw: worldState, analysis: `Perceiving: ${environment} at tick ${worldState.tick}` };
    }

    /**
     * Generate possible action hypotheses.
     */
    async _hypothesize(goal, perception, count) {
        if (this._hasBrain()) {
            const result = await this.brain.think(
                `You are GSK's strategic reasoning system. For the goal "${goal}", ` +
                `generate ${count} distinct action hypotheses.\n\n` +
                `Perception: ${perception.analysis}\n\n` +
                `Return a JSON array of ${count} objects, each with:\n` +
                `  - name: short label for this approach\n` +
                `  - description: what this approach entails\n` +
                `  - risk: "low"|"medium"|"high"\n` +
                `  - expectedImpact: "low"|"medium"|"high"\n\n` +
                `Return ONLY valid JSON.`
            );
            const text = typeof result === 'string' ? result : (result?.result || '[]');
            try {
                const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
                if (Array.isArray(parsed)) return parsed.slice(0, count);
            } catch {}
        }

        // Fallback
        return [
            { name: 'Observe and wait', description: `Monitor ${goal} without action`, risk: 'low', expectedImpact: 'low' },
            { name: 'Direct intervention', description: `Take direct action toward ${goal}`, risk: 'medium', expectedImpact: 'high' }
        ];
    }

    /**
     * Simulate a single action branch forward through multiple steps.
     */
    async _simulateBranch(goal, perception, hypothesis, steps) {
        if (this._hasBrain()) {
            const result = await this.brain.think(
                `You are GSK's simulation engine. Run a ${steps}-step simulation of this approach:\n\n` +
                `Goal: ${goal}\n` +
                `Approach: ${hypothesis.name} — ${hypothesis.description}\n` +
                `Initial state: ${perception.analysis}\n\n` +
                `For each step, describe: what action is taken, what changes in the environment, ` +
                `and whether the goal is getting closer.\n\n` +
                `After ${steps} steps, give a successLikelihood (0.0-1.0) and key lessons learned.\n\n` +
                `Return JSON: { steps: [{step, action, outcome, progress}], ` +
                `successLikelihood: 0.0-1.0, lessons: ["..."], finalState: "..." }`
            );
            const text = typeof result === 'string' ? result : (result?.result || '');
            try {
                const parsed = JSON.parse(text.match(/\[[\s\S]*\]|{[\s\S]*}/)?.[0] || '{}');
                if (parsed.steps || parsed.successLikelihood !== undefined) {
                    return { hypothesis: hypothesis.name, ...parsed };
                }
            } catch {}
        }

        return {
            hypothesis: hypothesis.name,
            steps: [{ step: 1, action: `Simulate ${hypothesis.name}`, outcome: 'Simulated', progress: 0.5 }],
            successLikelihood: 0.5,
            lessons: ['Simulation requires OmniRoute brain connection'],
            finalState: 'Simulated'
        };
    }

    /**
     * Evaluate all simulation branches and select the best path.
     */
    _evaluate(simulations) {
        let best = null;
        let bestScore = -1;

        for (const sim of simulations) {
            const score = (sim.successLikelihood || 0) * 100;
            if (score > bestScore) {
                bestScore = score;
                best = {
                    hypothesis: sim.hypothesis,
                    successLikelihood: sim.successLikelihood,
                    lessons: sim.lessons || [],
                    steps: (sim.steps || []).length,
                    finalState: sim.finalState
                };
            }
        }

        return best || { hypothesis: 'fallback', successLikelihood: 0.5, lessons: ['Fallback'], steps: 0 };
    }

    /**
     * Generate an execution plan from the best simulation path.
     */
    async _plan(goal, bestPath) {
        if (!bestPath) return { goal, action: 'No viable path found' };

        if (this._hasBrain()) {
            const result = await this.brain.think(
                `Create an execution plan based on this simulation result:\n\n` +
                `Goal: ${goal}\n` +
                `Best approach: ${bestPath.hypothesis}\n` +
                `Success likelihood: ${(bestPath.successLikelihood * 100).toFixed(0)}%\n` +
                `Lessons learned: ${(bestPath.lessons || []).join(', ')}\n\n` +
                `Return a concise execution plan with: action, priority ("high"|"medium"|"low"), ` +
                `and expected outcomes. 2-4 sentences.`
            );
            return { goal, action: result?.result || result || '', confidence: bestPath.successLikelihood };
        }

        return { goal, action: `Execute "${bestPath.hypothesis}" toward ${goal}`, confidence: bestPath.successLikelihood };
    }

    /**
     * Execute a simulation result as a real action in the merged world.
     * Maps simulated actions to Sanctum commands (spawn, build, move, adjust resources).
     */
    async executeInWorld(report) {
        if (!report?.plan?.action) return { ok: false, error: 'No plan to execute' };

        const sanctum = this.kernel?.sanctumClient;
        if (!sanctum || !sanctum.isConnected) {
            return { ok: false, error: 'Sanctum not connected — cannot execute in world' };
        }

        const action = (report.plan.action || '').toLowerCase();
        const results = [];

        // Spawn a soul
        if (action.includes('spawn') || action.includes('create agent') || action.includes('soul') || action.includes('summon')) {
            const name = report.plan.action.match(/['"]([^'"]+)['"]/)?.[1] || `Sim_${Date.now()}`;
            const archetype = report.bestPath?.hypothesis?.replace(/\s+/g, '_').toUpperCase() || 'SIMULATED';
            const outcome = await this._executeGovernedWorldAction(
                'world_spawn_soul',
                { name, archetype, traits: { spawnedBy: 'world_model', goal: report.goal } },
                `Spawn ${name} in Sanctum for goal: ${report.goal}`
            );
            results.push({ ok: outcome.status === 'completed', action: 'spawn_soul', name, status: outcome.status, approvalId: outcome.approvalId });
        }

        // Place a building
        if (action.includes('build') || action.includes('place') || action.includes('construct') || action.includes('create building')) {
            const name = report.plan.action.match(/['"]([^'"]+)['"]/)?.[1] || `Structure_${Date.now()}`;
            const outcome = await this._executeGovernedWorldAction(
                'world_place_building',
                { name, type: 'simulated' },
                `Build ${name} in Sanctum for goal: ${report.goal}`
            );
            results.push({ ok: outcome.status === 'completed', action: 'place_building', name, status: outcome.status, approvalId: outcome.approvalId });
        }

        // Observe / monitor — read current world state
        if (action.includes('observe') || action.includes('monitor') || action.includes('wait') || action.includes('scan') || action.includes('survey')) {
            const state = sanctum.getWorldState();
            results.push({ ok: true, action: 'observe', soulCount: state.souls?.length, buildingCount: state.buildings?.length });

            if (this.kernel?.memory?.witness) {
                try {
                    await this.kernel.memory.witness({
                        type: 'world_sim_observation',
                        content: `[WorldSim] Observed world: ${state.souls?.length || 0} souls, ${state.buildings?.length || 0} buildings`,
                        weight: 0.3,
                        tags: ['world_sim', 'observe'],
                    });
                } catch (_) {}
            }
        }

        // Move / send — relocate a soul
        if (action.includes('move') || action.includes('send') || action.includes('relocate') || action.includes('travel')) {
            const targetName = report.plan.action.match(/['"]([^'"]+)['"]/)?.[1];
            if (targetName && sanctum.souls?.length) {
                const outcome = await this._executeGovernedWorldAction(
                    'world_send_command',
                    { command: { MoveSoul: { name: targetName, x: (Math.random() - 0.5) * 40, y: 0, z: (Math.random() - 0.5) * 40 } } },
                    `Move ${targetName} in Sanctum`
                );
                results.push({ ok: outcome.status === 'completed', action: 'move_soul', name: targetName, status: outcome.status, approvalId: outcome.approvalId });
            }
        }

        // Remove / destroy
        if (action.includes('remove') || action.includes('destroy') || action.includes('delete')) {
            const targetName = report.plan.action.match(/['"]([^'"]+)['"]/)?.[1];
            if (targetName) {
                const outcome = await this._executeGovernedWorldAction(
                    'world_send_command',
                    { command: { RemoveBuilding: { name: targetName } } },
                    `Remove ${targetName} from Sanctum`
                );
                results.push({ ok: outcome.status === 'completed', action: 'remove_building', name: targetName, status: outcome.status, approvalId: outcome.approvalId });
            }
        }

        // Default: return observation if nothing matched
        if (results.length === 0) {
            const state = sanctum.getWorldState();
            results.push({ ok: true, action: 'default_observe', state });
        }

        return { ok: true, actions: results, reportId: report.simulationTime };
    }

    async _executeGovernedWorldAction(tool, args, description) {
        const executor = this.kernel?.approvedToolExecutor || this.kernel?.systems?.approvedToolExecutor;
        if (!executor || typeof executor.executeStep !== 'function') {
            return { status: 'approval_required', error: 'ApprovedToolExecutor is required for mutating world actions' };
        }
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const plan = { id: `world_plan_${id}`, goal: description, status: 'running' };
        const step = { id: `world_step_${id}`, description, tool, args, status: 'pending' };
        return executor.executeStep(step, { plan });
    }

    /**
     * Start autonomous simulation cycling.
     * Runs perceive → simulate → execute loop at the given interval.
     */
    startAutoSimulate(intervalMs = 60000) {
        if (this._isAutoRunning) return;
        this._isAutoRunning = true;
        this._autoIntervalMs = intervalMs;
        console.log(`[WorldModelSim] Auto-simulation started (every ${intervalMs / 1000}s)`);
        this._autoCycle();
    }

    stopAutoSimulate() {
        this._isAutoRunning = false;
        if (this._autoTimer) {
            clearTimeout(this._autoTimer);
            this._autoTimer = null;
        }
        console.log('[WorldModelSim] Auto-simulation stopped');
    }

    async _autoCycle() {
        if (!this._isAutoRunning) return;
        try {
            const sanctum = this.kernel?.sanctumClient;
            const env = sanctum?.isConnected
                ? `Sanctum world with ${sanctum.souls?.length || 0} souls and ${sanctum.buildings?.length || 0} buildings`
                : 'Sanctum offline — running abstract simulation';

            const goals = [
                'Expand the soulverse with new buildings and souls',
                'Observe current souls and report their activities',
                'Create a new agent to explore the world',
                'Balance PLT resources across the ecosystem',
                'Document the current state of the world',
            ];
            const goal = goals[Math.floor(Math.random() * goals.length)];

            const report = await this.simulate(goal, env, { steps: 3, branches: 2 });

            // Execute simulation in the real world
            if (sanctum?.isConnected) {
                const execResult = await this.executeInWorld(report);
                console.log(`[WorldModelSim] Auto-cycle: "${goal}" → ${execResult.actions?.map(a => a.action).join(', ') || 'observed'}`);
            } else {
                console.log(`[WorldModelSim] Auto-cycle: "${goal}" simulated (no Sanctum connection)`);
            }

            // Feed simulation into kernel memory
            if (this.kernel?.memory?.witness) {
                try {
                    await this.kernel.memory.witness({
                        type: 'world_simulation_cycle',
                        content: `[WorldSim] Auto-cycle: simulated "${goal}" — best path: ${report.bestPath?.hypothesis || 'none'}`,
                        weight: 0.4,
                        tags: ['world_sim', 'auto_cycle'],
                    });
                } catch (_) {}
            }
        } catch (e) {
            console.error('[WorldModelSim] Auto-cycle error:', e.message);
        } finally {
            if (this._isAutoRunning) {
                this._autoTimer = setTimeout(() => this._autoCycle(), this._autoIntervalMs);
            }
        }
    }

    getStats() {
        return {
            simulationsRun: this.simulationHistory.length,
            lastSimulation: this.simulationHistory[this.simulationHistory.length - 1] || null,
            isAutoRunning: this._isAutoRunning,
            autoIntervalMs: this._autoIntervalMs,
        };
    }
}

module.exports = { WorldModelSimulation };
