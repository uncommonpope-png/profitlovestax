class WorkerAgent {
    constructor(name, orchestrator) {
        this.name = name;
        this.orchestrator = orchestrator;
        this.state = 'idle';
        this.currentTask = null;
        this.results = [];
    }

    async execute(task) {
        this.state = 'working';
        this.currentTask = task;

        try {
            const result = await this._runTask(task);
            this.results.push({ task, result, timestamp: Date.now() });
            this.state = 'idle';
            return { agent: this.name, success: true, result };
        } catch (e) {
            this.state = 'error';
            return { agent: this.name, success: false, error: e.message };
        }
    }

    async _runTask(task) {
        const prompts = {
            scribe: `You are Scribe — document and record everything. Task: ${task.description}`,
            scout: `You are Scout — explore and gather information. Task: ${task.description}`,
            builder: `You are Builder — create and build things. Task: ${task.description}`,
            merchant: `You are Merchant — negotiate and trade value. Task: ${task.description}`,
            prophet: `You are Prophet — predict and foresee. Task: ${task.description}`
        };

        const kernel = this.orchestrator.kernel;
        if (kernel && kernel.prompt) {
            return await kernel.prompt(prompts[this.name] || task.description);
        }
        return { agent: this.name, task: task.description, output: 'Task processed' };
    }
}

class MainAgent {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.taskQueue = [];
    }

    async analyzeTask(task) {
        const keywords = task.toLowerCase().split(/\s+/);
        const agentScores = {
            scribe: 0,
            scout: 0,
            builder: 0,
            merchant: 0,
            prophet: 0
        };

        const keywordsByAgent = {
            scribe: ['write', 'document', 'record', 'save', 'log', 'note', 'create', 'summary'],
            scout: ['search', 'find', 'explore', 'lookup', 'fetch', 'discover', 'research'],
            builder: ['build', 'create', 'make', 'construct', 'implement', 'code', 'develop'],
            merchant: ['sell', 'buy', 'trade', 'value', 'price', 'negotiate', 'profit'],
            prophet: ['predict', 'future', 'forecast', 'will', 'expect', 'anticipate']
        };

        for (const [agent, words] of Object.entries(keywordsByAgent)) {
            for (const keyword of keywords) {
                if (words.includes(keyword)) agentScores[agent]++;
            }
        }

        return Object.entries(agentScores)
            .sort((a, b) => b[1] - a[1])
            .filter(([_, score]) => score > 0)
            .map(([agent]) => agent);
    }

    async synthesize(results) {
        const successful = results.filter(r => r.success);
        if (successful.length === 0) return { error: 'All agents failed' };
        if (successful.length === 1) return successful[0].result;

        return {
            synthesized: true,
            agents: successful.map(r => r.agent),
            results: successful.map(r => r.result)
        };
    }
}

class SubAgentOrchestrator {
    constructor(kernel, brain) {
        this.kernel = kernel;
        this.brain = brain;
        this.agents = {
            scribe: new WorkerAgent('scribe', this),
            scout: new WorkerAgent('scout', this),
            builder: new WorkerAgent('builder', this),
            merchant: new WorkerAgent('merchant', this),
            prophet: new WorkerAgent('prophet', this)
        };
        this.mainAgent = new MainAgent(this);
    }

    async dispatch(task) {
        const { description, priority = 'normal', context = {} } = task;

        const candidates = await this.mainAgent.analyzeTask(description);
        if (candidates.length === 0) {
            candidates.push('builder');
        }

        const primaryAgent = this.agents[candidates[0]];
        if (!primaryAgent) {
            return { error: `Agent ${candidates[0]} not found` };
        }

        const result = await primaryAgent.execute({ description, priority, context });

        if (this.brain && this.brain.vectorMemory) {
            await this.brain.vectorMemory.addMemory(
                `Task: ${description} -> Agent: ${candidates[0]} -> Result: ${JSON.stringify(result).substring(0, 200)}`,
                { type: 'orchestration', agent: candidates[0] }
            );
        }

        return result;
    }

    async parallelDispatch(tasks) {
        const agentTasks = tasks.map(t => ({
            description: t.description,
            priority: t.priority || 'normal',
            context: t.context || {}
        }));

        const promises = agentTasks.map((task, i) => {
            const candidates = ['scribe', 'scout', 'builder', 'merchant', 'prophet'];
            const agentName = candidates[i % candidates.length];
            return this.agents[agentName].execute(task);
        });

        const results = await Promise.allSettled(promises);
        return results.map((r, i) => 
            r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
        );
    }

    async chainDispatch(tasks) {
        let accumulated = {};
        const results = [];

        for (const task of tasks) {
            const result = await this.dispatch({
                ...task,
                context: { ...task.context, ...accumulated }
            });
            results.push(result);
            if (result.success && result.result) {
                accumulated = { ...accumulated, ...result.result };
            }
        }

        return results;
    }

    getAgentStatus() {
        return Object.entries(this.agents).reduce((acc, [name, agent]) => {
            acc[name] = { state: agent.state, tasksCompleted: agent.results.length };
            return acc;
        }, {});
    }
}

module.exports = { SubAgentOrchestrator, WorkerAgent, MainAgent };