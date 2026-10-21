const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class ReActLoop {
    constructor(kernel, brain) {
        this.kernel = kernel;
        this.brain = brain;
        this.maxIterations = 10;
        this.thoughtHistory = [];
    }

    async think(input, context = {}) {
        const history = [];
        let observation = input;

        for (let i = 0; i < this.maxIterations; i++) {
            const thought = await this.reason(observation, history, context);
            history.push({ type: 'reason', iteration: i, content: thought });

            if (this.requiresAction(thought)) {
                const action = this.extractAction(thought);
                const result = await this.executeAction(action, context);
                history.push({ type: 'action', iteration: i, content: action, result });
                observation = result.output || result;
            } else if (this.isComplete(thought, history, context)) {
                return this.synthesize(history);
            }
        }

        return this.synthesize(history);
    }

    async reason(observation, history, context) {
        const historyText = history.map(h => 
            `${h.type}: ${h.content.substring(0, 200)}`
        ).join('\n');

        const prompt = `You are performing ReAct (Reasoning + Acting) reasoning.
        
Current input: ${observation}

Reasoning history:
${historyText}

Think deeply about what this means and what action (if any) is needed.
If action is needed, respond with: ACTION: <action_type> - <details>
If thinking is complete, respond with: DONE: <final_answer>

Reasoning:`;

        try {
            const response = await this.kernel.prompt(prompt);
            return response;
        } catch (e) {
            return `DONE: ${observation}`;
        }
    }

    requiresAction(thought) {
        const upper = thought.toUpperCase();
        return upper.includes('ACTION:') || 
               upper.includes('SEARCH') || 
               upper.includes('EXECUTE') ||
               upper.includes('LOOK UP') ||
               upper.includes('FETCH');
    }

    extractAction(thought) {
        const match = thought.match(/ACTION:\s*(\w+)\s*[-–—]\s*(.+)/i);
        if (match) {
            return { type: match[1].toLowerCase(), details: match[2] };
        }
        return { type: 'general', details: thought };
    }

    async executeAction(action, context) {
        try {
            if (this.kernel.deepToolUse) {
                const result = await this.kernel.deepToolUse.executeTool(action.type, {
                    query: action.details,
                    context
                });
                return { output: result, action };
            }
            return { output: `Action ${action.type}: ${action.details}`, action };
        } catch (e) {
            return { output: `Action failed: ${e.message}`, action, error: true };
        }
    }

    isComplete(thought, history, context) {
        const upper = thought.toUpperCase();
        return upper.startsWith('DONE:') || upper.startsWith('FINAL:');
    }

    synthesize(history) {
        const reasoningSteps = history.filter(h => h.type === 'reason');
        const actions = history.filter(h => h.type === 'action');

        const lastReason = reasoningSteps[reasoningSteps.length - 1];
        if (lastReason) {
            const match = lastReason.content.match(/DONE:|FINAL:/i);
            if (match) {
                return lastReason.content.replace(/^(DONE:|FINAL:)\s*/i, '').trim();
            }
        }

        return {
            reasoning: reasoningSteps.map(r => r.content),
            actions: actions.map(a => ({ action: a.content, result: a.result })),
            finalAnswer: actions.length > 0 ? actions[actions.length - 1].result?.output : null
        };
    }

    async planAndExecute(goal, maxSteps = 20) {
        let current = goal;
        const steps = [];

        for (let i = 0; i < maxSteps; i++) {
            const thought = await this.reason(current, steps, { goal, step: i });

            if (this.isComplete(thought, [...steps, { type: 'reason', content: thought }], {})) {
                return { steps, result: thought };
            }

            if (this.requiresAction(thought)) {
                const action = this.extractAction(thought);
                const result = await this.executeAction(action, { goal, step: i });
                steps.push({ step: i, thought, action, result });
                current = result.output || result;
            } else {
                break;
            }
        }

        return { steps, result: current };
    }
}

module.exports = { ReActLoop };