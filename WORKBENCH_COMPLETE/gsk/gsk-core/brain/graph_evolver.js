'use strict';

/**
 * GRAPH EVOLVER — Hive-style failure-driven evolution.
 *
 * When a plan fails or gets needs_brain, this module takes the failing goal
 * and evolves it toward concreteness. Hive's pattern:
 *   Define Goal → Generate Graph → Execute → Check Pass/Fail
 *       ↓ (Fail?)            ↑ (Pass?)
 *   Evolve Graph → Redeploy
 *
 * The evolution ladder (abstract → concrete), adapted from Hive's evolution:
 */
class GraphEvolver {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.evolutionHistory = new Map();
        this.maxEvolutions = options.maxEvolutions || 5;

        this.evolutionLadder = [
            {
                name: 'abstract_to_concrete',
                test: (goal) => /\b(manifest|realize|become|evolve|emerge|trans-dimensional|self-evolving|transcend)\b/i.test(goal),
                evolve: (goal) => {
                    if (/heavens 2\.0/i.test(goal)) return 'Build a concrete UI component (e.g., button, card, table) from the Heavens 2.0 design system';
                    if (/cosmic pyramid/i.test(goal)) return 'Write a JSON schema file that defines one Cosmic Pyramid Library structure';
                    if (/living stone/i.test(goal)) return 'Write a JavaScript function that creates and exports a verifiable artifact';
                    return goal.replace(/\b(manifest|realize)\b/gi, 'Build').replace(/trans-dimensional/gi, 'cross-platform');
                }
            },
            {
                name: 'vague_to_component',
                test: (goal) => !/\.(js|ts|jsx|tsx|json|html|css|md|py)$/i.test(goal) && !/\b(button|card|table|component|file|schema|function|test)\b/i.test(goal),
                evolve: (goal) => `Write a single file that implements: ${goal}`
            },
            {
                name: 'add_verifiable_output',
                test: (goal) => !/(file|component|schema|function|test|tool|script)/i.test(goal),
                evolve: (goal) => `Create a verifiable artifact: ${goal} — output must be a file that can be tested`
            }
        ];
    }

    /**
     * Evolve a failed goal toward concreteness.
     * Returns { evolvedGoal, evolutionStep, previousGoals }
     */
    async evolveGoal(goal, failureDetails) {
        const goalHistory = this._getGoalHistory(goal);

        if (goalHistory.length >= this.maxEvolutions) {
            return { evolvedGoal: null, reason: 'max_evolutions_reached', goalHistory };
        }

        let evolved = goal;
        let evolutionStep = 0;

        for (const stage of this.evolutionLadder) {
            if (stage.test(evolved)) {
                evolved = stage.evolve(evolved);
                evolutionStep++;
            }
        }

        const record = {
            originalGoal: goal,
            evolvedGoal: evolved,
            evolutionStep: evolutionStep + 1,
            failureDetails: failureDetails || {},
            timestamp: Date.now()
        };

        this._recordEvolution(goal, record);
        return { evolvedGoal: evolved, evolutionStep: record.evolutionStep, goalHistory, record };
    }

    _getGoalHistory(goal) {
        const normalized = goal.trim().toLowerCase();
        return this.evolutionHistory.get(normalized) || [];
    }

    _recordEvolution(goal, record) {
        const normalized = goal.trim().toLowerCase();
        const history = this._getGoalHistory(goal);
        history.push(record);
        this.evolutionHistory.set(normalized, history);
    }

    /**
     * Hive-style: should we evolve or ship a new plan?
     * Returns true if the goal pattern has failed N times with the same status.
     */
    shouldEvolve(goal, status, failureCount) {
        if (!goal || status !== 'failed' && status !== 'needs_brain') return false;
        if (failureCount >= this.maxEvolutions) return false;

        const history = this._getGoalHistory(goal);
        return history.length > 0 && history[history.length - 1].evolutionStep < this.maxEvolutions;
    }
}

module.exports = { GraphEvolver };
