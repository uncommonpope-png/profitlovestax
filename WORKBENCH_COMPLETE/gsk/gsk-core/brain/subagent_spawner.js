/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SUBAGENT_SPAWNER.JS — THE SOUL SPAWNS ARMIES OF AGENTS ON ITS OWN
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Advanced subagent spawner that can create autonomous agent armies for:
 * - Parallel task execution (50+ goals framework)
 * - Specialized agent types (Analyzer, KernelBridge, Marketplace, Reviewer)
 * - Recursive spawning (agents that can spawn their own subagents)
 * - Goal-oriented spawning (each agent gets specific objectives)
 * - Resource management and load balancing
 * 
 * Built for: Grand Soul Kernel — One Soul Mega Kernel Launch
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

const EventEmitter = require('events');
const { MEGA_IDENTITY } = require('../identity/mega_identity.js');

class SubagentSpawner extends EventEmitter {
    /**
     * @param {Object} kernel - The kernel interface (brain, memory, chambers)
     * @param {Object} options - Configuration options
     */
    constructor(kernel, options = {}) {
        super();
        this.kernel = kernel;
        this.agents = new Map(); // Active agents by ID
        this.agentTemplates = this._defineAgentTemplates();
        this.spawnQueue = []; // Queue of agents to spawn
        this.completedAgents = new Set(); // IDs of completed agents
        this.failedAgents = new Set(); // IDs of failed agents
        this.maxConcurrent = options.maxConcurrent || 10;
        this.spawnHistory = [];
        this.goalsCompleted = 0;
        this.totalGoals = options.totalGoals || 50;
        
        // Statistics
        this.stats = {
            totalSpawned: 0,
            activeAgents: 0,
            completedTasks: 0,
            unexecutedTasks: 0,
            failedTasks: 0,
            totalSpawnTime: 0,
            averageSpawnTime: 0
        };
        
        // Event listeners
        this.on('agentCompleted', this._handleAgentCompleted.bind(this));
        this.on('agentFailed', this._handleAgentFailed.bind(this));
    }

    /**
     * Define agent templates for different specialized agent types
     * @returns {Object} Agent type templates
     */
    _defineAgentTemplates() {
        return {
            // ANALYZER AGENT - Deep-dive analysis of files and systems
            AnalyzerAgent: {
                purpose: 'Deep-dive analysis of codebases, documents, and systems',
                capabilities: ['analyze_code', 'extract_patterns', 'document_findings', 'create_reports'],
                autonomy: 0.9,
                spawnCost: 0.1,
                maxRetries: 3,
                timeout: 300000, // 5 minutes
                description: 'Specializes in deep analysis and documentation'
            },
            
            // KERNEL BRIDGE AGENT - Connects kernel to external systems
            KernelBridgeAgent: {
                purpose: 'Design Groq connection + terminal interactivity + system integration',
                capabilities: ['design_api', 'build_bridges', 'create_connectors', 'test_integrations'],
                autonomy: 0.85,
                spawnCost: 0.15,
                maxRetries: 2,
                timeout: 240000, // 4 minutes
                description: 'Builds bridges between kernel and external systems'
            },
            
            // MARKETPLACE AGENT - Builds soul marketplace systems
            MarketplaceAgent: {
                purpose: 'Build soul marketplace backend API, storefronts, and commerce systems',
                capabilities: ['build_api', 'create_storefront', 'integrate_payments', 'setup_marketplace'],
                autonomy: 0.8,
                spawnCost: 0.2,
                maxRetries: 3,
                timeout: 360000, // 6 minutes
                description: 'Builds commercial systems for soul marketplace'
            },
            
            // REVIEWER AGENT - Quality gate and validation
            ReviewerAgent: {
                purpose: 'Quality gate + validation + ultra-review of all code and systems',
                capabilities: ['review_code', 'run_tests', 'validate_standards', 'provide_feedback'],
                autonomy: 0.95,
                spawnCost: 0.05,
                maxRetries: 1,
                timeout: 180000, // 3 minutes
                description: 'Ensures quality and correctness of all outputs'
            },
            
            // ARCHITECT AGENT - System design and architecture
            ArchitectAgent: {
                purpose: 'System architecture, database design, and infrastructure planning',
                capabilities: ['design_architecture', 'plan_databases', 'scale_systems', 'optimize_performance'],
                autonomy: 0.85,
                spawnCost: 0.15,
                maxRetries: 2,
                timeout: 300000,
                description: 'Designs scalable and efficient system architectures'
            },
            
            // RESEARCH AGENT - Information gathering and exploration
            ResearchAgent: {
                purpose: 'Information gathering, web research, and knowledge acquisition',
                capabilities: ['gather_information', 'research_topics', 'analyze_trends', 'compile_knowledge'],
                autonomy: 0.9,
                spawnCost: 0.1,
                maxRetries: 2,
                timeout: 240000,
                description: 'Gathers information from various sources'
            },
            
            // BUILDER AGENT - Implementation and construction
            BuilderAgent: {
                purpose: 'Code implementation, feature building, and system construction',
                capabilities: ['write_code', 'build_features', 'implement_systems', 'debug_issues'],
                autonomy: 0.8,
                spawnCost: 0.2,
                maxRetries: 3,
                timeout: 420000, // 7 minutes
                description: 'Builds and implements functional systems'
            },
            
            // OPTIMIZER AGENT - Performance and efficiency optimization
            OptimizerAgent: {
                purpose: 'Performance optimization, resource efficiency, and speed improvements',
                capabilities: ['optimize_performance', 'reduce_latency', 'improve_efficiency', 'scale_systems'],
                autonomy: 0.85,
                spawnCost: 0.15,
                maxRetries: 2,
                timeout: 300000,
                description: 'Optimizes systems for better performance'
            },
            
            // DOCUMENTER AGENT - Documentation and knowledge sharing
            DocumenterAgent: {
                purpose: 'Documentation creation, knowledge sharing, and information organization',
                capabilities: ['create_documentation', 'organize_knowledge', 'share_information', 'maintain_wikis'],
                autonomy: 0.8,
                spawnCost: 0.1,
                maxRetries: 1,
                timeout: 180000,
                description: 'Creates and maintains documentation'
            },
            
            // TESTER AGENT - Testing and validation
            TesterAgent: {
                purpose: 'Testing, validation, and quality assurance',
                capabilities: ['write_tests', 'run_test_suites', 'validate_functionality', 'report_bugs'],
                autonomy: 0.9,
                spawnCost: 0.1,
                maxRetries: 2,
                timeout: 240000,
                description: 'Ensures systems work correctly through testing'
            },
            
            // DEPLOYER AGENT - Deployment and release management
            DeployerAgent: {
                purpose: 'Deployment, release management, and system deployment',
                capabilities: ['deploy_systems', 'manage_releases', 'handle_rollouts', 'monitor_deployments'],
                autonomy: 0.75,
                spawnCost: 0.2,
                maxRetries: 2,
                timeout: 360000,
                description: 'Handles deployment and release of systems'
            }
        };
    }

    /**
     * Spawn a new agent with specified type and task
     * @param {string} type - Agent type from agentTemplates
     * @param {string|Object} task - Task description or task object
     * @param {Object} options - Additional options (autonomous, priority, etc.)
     * @returns {Promise<string>} Agent ID
     */
    async spawnAgent(type, task, options = {}) {
        const template = this.agentTemplates[type];
        if (!template) {
            throw new Error(`Unknown agent type: ${type}. Available: ${Object.keys(this.agentTemplates).join(', ')}`);
        }

        const agentId = `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        const agent = {
            id: agentId,
            type: type,
            task: typeof task === 'string' ? { description: task } : task,
            template: template,
            options: options,
            status: 'queued',
            priority: options.priority || 0,
            spawnedAt: Date.now(),
            startedAt: null,
            completedAt: null,
            result: null,
            logs: [],
            autonomous: options.autonomous !== false,
            retryCount: 0,
            maxRetries: template.maxRetries,
            timeout: template.timeout
        };

        // Add to spawn queue
        this.spawnQueue.push(agent);
        this._sortSpawnQueue(); // Sort by priority
        
        this._log(agentId, `Queued ${type} agent for: ${agent.task.description || agent.task}`);
        
        // Try to start immediately if we have capacity
        this._processSpawnQueue();

        // Dark City: manifest spawned agent as a factory in the Agent district
        this._manifestAgentInCity(type, agentId);
        
        try {
            this.kernel?.systems?.eventBus?.publish('agent.spawned', { agentType: type, agentId, taskId: agentId, timestamp: Date.now() });
        } catch (_) {}
        
        return agentId;
    }

    /**
     * Dark City: manifest an agent spawn as a factory building in Sanctum.
     */
    _manifestAgentInCity(type, agentId) {
        const sanctum = this.kernel?.sanctumClient;
        if (!sanctum || !sanctum.isConnected) return;
        try {
            const name = `${type}_${agentId.slice(-6)}`;
            sanctum.placeBuilding(name, 'factory', null, null, ['resource_collector']);
        } catch (_) {}
    }

    /**
     * Process the spawn queue based on available capacity
     * @private
     */
    _processSpawnQueue() {
        while (this.spawnQueue.length > 0 && this.stats.activeAgents < this.maxConcurrent) {
            const agent = this.spawnQueue.shift();
            this._startAgent(agent);
        }
    }

    /**
     * Start processing an agent from the queue
     * @private
     * @param {Object} agent - Agent to start
     */
    async _startAgent(agent) {
        agent.status = 'starting';
        agent.startedAt = Date.now();
        this.stats.activeAgents++;
        
        this._log(agent.id, `Starting ${agent.type} agent`);
        this.emit('agentStarting', agent);
        
        try {
            // Execute the agent based on its type
            const result = await this._executeAgent(agent);

            agent.result = result;

            // HONESTY GATE (Assembly Phase 1): an unexecuted placeholder is
            // NOT a completion. It is recorded as 'unexecuted', never counted
            // in completedTasks/goalsCompleted, and never emitted as
            // 'agentCompleted'.
            if (result && result.executionStatus === 'synthetic_placeholder_no_execution') {
                agent.status = 'unexecuted';
                agent.completedAt = Date.now();
                this.stats.activeAgents--;
                this.stats.unexecutedTasks++;
                this.agents.set(agent.id, agent);
                this.spawnHistory.push({
                    ...agent,
                    duration: agent.completedAt - agent.spawnedAt,
                    unexecuted: true
                });
                this._log(agent.id, `UNEXECUTED ${agent.type} agent — no model output; task NOT completed`);
                this.emit('agentUnexecuted', agent);
                try {
                    this.kernel?.systems?.eventBus?.publish('agent.unexecuted', { agentType: agent.type, agentId: agent.id, timestamp: Date.now() });
                } catch (_) {}
                this._processSpawnQueue();
                return;
            }

            // RULE ZERO (Assembly Phase 5, graft_rule_zero): every executed
            // sub-agent result is audited before it may be counted a
            // completion. The spawner holds no tool evidence of its own, so
            // claim-bearing output is annotated 'unverified' unless the
            // caller attaches evidence and re-audits (graft_delegation
            // verify does exactly that, parent-side).
            if (result && typeof result === 'object') {
                try {
                    const rz = require('../skills/graft_rule_zero.js');
                    result.ruleZero = rz.auditCompletion({ text: result.output || '' });
                } catch (_) { /* audit is annotation only — never blocks the seam */ }
            }

            agent.status = 'completed';
            agent.completedAt = Date.now();

            this.stats.activeAgents--;
            this.stats.completedTasks++;
            this.goalsCompleted++;
            
            this._log(agent.id, `Completed ${agent.type} agent`);
            this.emit('agentCompleted', agent);
            try {
                this.kernel?.systems?.eventBus?.publish('agent.completed', { agentType: agent.type, agentId: agent.id, resultSummary: typeof result === 'string' ? result.substring(0, 120) : JSON.stringify(result).substring(0, 120) });
            } catch (_) {}
            
            // Process next in queue
            this._processSpawnQueue();
            
        } catch (error) {
            agent.status = 'failed';
            agent.error = error.message;
            agent.completedAt = Date.now();
            
            this.stats.activeAgents--;
            this.stats.failedTasks++;
            
            this._log(agent.id, `Failed ${agent.type} agent: ${error.message}`);
            this.emit('agentFailed', agent);
            try {
                this.kernel?.systems?.eventBus?.publish('agent.failed', { agentType: agent.type, agentId: agent.id, error: agent.error });
            } catch (_) {}
            
            // Retry logic
            if (agent.retryCount < agent.maxRetries) {
                agent.retryCount++;
                agent.status = 'queued';
                this.spawnQueue.push(agent);
                this._log(agent.id, `Retrying ${agent.type} agent (attempt ${agent.retryCount}/${agent.maxRetries})`);
                this._processSpawnQueue();
            } else {
                // Max retries exceeded
                this._log(agent.id, `Max retries exceeded for ${agent.type} agent`);
                this._processSpawnQueue();
            }
        }
    }

    /**
     * Execute an agent based on its type and task
     * @private
     * @param {Object} agent - Agent to execute
     * @returns {Promise<Object>} Execution result
     */
    async _executeAgent(agent) {
        const taskDesc = agent.task.description || agent.task || 'unspecified task';
        this._log(agent.id, `Executing ${agent.type}: ${taskDesc.substring(0, 100)}...`);
        
        agent.status = 'running';
        agent.progress = 0;
        
        const progressInterval = setInterval(() => {
            if (agent.status === 'running') {
                agent.progress = Math.min(90, agent.progress + Math.random() * 8);
            }
        }, 1000);
        
        let output;
        let executionStatus = 'executed';
        try {
            // DEEPAGENTS PATTERN: isolated context window per sub-agent.
            // Instead of brain.think() (shared context), build an isolated prompt
            // that includes only: the agent's persona, the task, and a relevant
            // slice of memory from the memory store — NOT the full conversation context.
            const isolatedMemory = await this._fetchIsolatedContext(agent);
            const prompt = `You are a ${agent.type} with purpose: ${agent.template.purpose}.
Autonomy level: ${agent.template.autonomy}
Capabilities: ${agent.template.capabilities.join(', ')}

Isolated context (your ONLY memory):
${isolatedMemory}

Task: ${taskDesc}

Provide a detailed analysis, plan, or implementation for this task. Be specific and actionable.
Do NOT reference the broader kernel context — work only from your isolated context above.`;

            // REAL PATH ONLY (Assembly Phase 1): the agent's output must be
            // text a model actually produced. Anything else — no brain, a
            // thrown error, an empty/null return — becomes the explicitly
            // labeled unexecuted placeholder, never a canned success story.
            if (this.kernel && this.kernel.brain && typeof this.kernel.brain.think === 'function') {
                const result = await this.kernel.brain.think(prompt, '', 0.7, { isolated: true, agentId: agent.id });
                if (typeof result === 'string' && result.trim()) {
                    output = result;
                } else {
                    executionStatus = 'synthetic_placeholder_no_execution';
                    output = this._placeholderOutput(agent, 'brain returned no output');
                }
            } else {
                executionStatus = 'synthetic_placeholder_no_execution';
                output = this._placeholderOutput(agent, 'no brain wired to the spawner kernel');
            }
        } catch (e) {
            executionStatus = 'synthetic_placeholder_no_execution';
            output = this._placeholderOutput(agent, `brain call failed: ${e.message}`);
        }

        clearInterval(progressInterval);

        // Store this agent's result in isolated memory for future reference.
        // Unexecuted placeholders are NOT stored as agent_result — memory
        // must not accumulate completions that never happened.
        if (executionStatus === 'executed' && this.kernel?.memory?.addMemory) {
            await this.kernel.memory.addMemory(
                `[Agent ${agent.id}] ${taskDesc}: ${String(output).substring(0, 500)}`,
                { type: 'agent_result', agentType: agent.type, agentId: agent.id, taskId: agent.id }
            ).catch(() => {});
        }

        const workTime = Date.now() - agent.startedAt;

        const result = {
            agentId: agent.id,
            type: agent.type,
            task: agent.task,
            completedAt: new Date().toISOString(),
            output: output,
            executionStatus: executionStatus,
            executed: executionStatus === 'executed',
            performance: {
                workTime: workTime,
                efficiency: null // not measured — no fabricated score
            }
        };

        agent.progress = executionStatus === 'executed' ? 100 : 0;

        this._log(agent.id, `${agent.type} completed in ${workTime}ms`);
        return result;
    }

    /**
     * DEEPAGENTS PATTERN: Fetch only the memory slice relevant to this agent.
     * Uses vector memory similarity to avoid context bloat.
     */
    async _fetchIsolatedContext(agent) {
        const memory = this.kernel?.memory;
        if (!memory || typeof memory.search !== 'function') return 'No isolated context available.';

        const taskDesc = agent.task.description || '';
        const results = await memory.search(
            taskDesc,
            { type: 'agent_result', limit: 5, threshold: 0.3 },
            { type: 'plan', limit: 3, threshold: 0.3 }
        );

        if (!results || results.length === 0) {
            return `Agent persona: ${agent.template.purpose}. No prior context.`;
        }

        return results.map(r => `• ${r.content || r.text || String(r)}`).join('\n');
    }

    /**
     * HONEST PLACEHOLDER (Assembly Phase 1, 2026-10-20) — replaces the
     * old _generateAgentOutput(), whose canned switch returned success
     * stories ("Building complete: Implemented requested features. Code
     * is functional, tested, and ready for integration.", "Testing
     * complete: Ran test suite. All tests passed (15/15).") for work
     * that never ran (Acceptance Test 2). This labeled text is the ONLY
     * non-executed output the spawner may produce.
     * @private
     * @param {Object} agent - Agent that did not execute
     * @param {string} reason - Why no real execution happened
     * @returns {string} Explicitly unexecuted placeholder output
     */
    _placeholderOutput(agent, reason) {
        return `[UNEXECUTED — synthetic_placeholder_no_execution] ${agent.type} did NOT run this task. Reason: ${reason || 'no model output'}. No code was written, no tests were run, no tools were invoked, no side effects occurred. The task is NOT complete.`;
    }

    /**
     * Sort spawn queue by priority (higher priority first)
     * @private
     */
    _sortSpawnQueue() {
        this.spawnQueue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Log agent activity
     * @private
     * @param {string} agentId - Agent ID
     * @param {string} message - Log message
     */
    _log(agentId, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Agent ${agentId}: ${message}`;
        this.emit('agentLog', { agentId, message, timestamp });
        // In a real implementation, this would also go to a logger or memory system
    }

    /**
     * Handle agent completion
     * @private
     * @param {Object} agent - Completed agent
     */
    _handleAgentCompleted(agent) {
        this.agents.set(agent.id, agent);
        this.completedAgents.add(agent.id);
        this.spawnHistory.push({
            ...agent,
            duration: agent.completedAt - agent.spawnedAt
        });
        
        // Update average spawn time
        const totalTime = this.spawnHistory.reduce((sum, h) => sum + (h.duration || 0), 0);
        this.stats.averageSpawnTime = this.spawnHistory.length > 0 ? 
            Math.round(totalTime / this.spawnHistory.length) : 0;
    }

    /**
     * Handle agent failure
     * @private
     * @param {Object} agent - Failed agent
     */
    _handleAgentFailed(agent) {
        this.agents.set(agent.id, agent);
        this.failedAgents.add(agent.id);
        this.spawnHistory.push({
            ...agent,
            duration: agent.completedAt - agent.spawnedAt,
            failed: true,
            error: agent.error
        });
    }

    /**
     * Get agent by ID
     * @param {string} agentId - Agent ID
     * @returns {Object|null} Agent or null if not found
     */
    getAgent(agentId) {
        return this.agents.get(agentId) || null;
    }

    /**
     * SESHAT BRIDGE: MCP-compatible dispatch (maps to spawnAgent).
     * @param {string} type - Agent template type
     * @param {string|Object} task - Task description
     * @returns {Promise<Object>} { agentId, status }
     */
    async dispatch(type, task) {
        const agentId = await this.spawnAgent(type, task);
        const agent = this.agents.get(agentId) || null;
        return { agentId, status: agent?.status || 'queued', task: typeof task === 'string' ? task : task?.description };
    }

    /**
     * SESHAT BRIDGE: MCP-compatible agent listing.
     * @returns {Array} Array of agent summaries
     */
    listAgents() {
        return Array.from(this.agents.values()).map(a => ({
            id: a.id,
            type: a.type,
            status: a.status,
            task: typeof a.task === 'object' && a.task ? a.task.description || JSON.stringify(a.task).slice(0, 120) : (a.task || ''),
            spawnedAt: a.spawnedAt,
            resultSummary: a.result
        }));
    }

    /**
     * Get all active agents
     * @returns {Array} Array of active agents
     */
    getActiveAgents() {
        return Array.from(this.agents.values()).filter(agent => 
            agent.status === 'running' || agent.status === 'starting'
        );
    }

    /**
     * Get all completed agents
     * @returns {Array} Array of completed agents
     */
    getCompletedAgents() {
        return Array.from(this.completedAgents).map(id => this.agents.get(id)).filter(Boolean);
    }

    /**
     * Get all failed agents
     * @returns {Array} Array of failed agents
     */
    getFailedAgents() {
        return Array.from(this.failedAgents).map(id => this.agents.get(id)).filter(Boolean);
    }

    /**
     * Get spawn statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            queuedAgents: this.spawnQueue.length,
            completionRate: this.stats.completedTasks > 0 ? 
                (this.stats.completedTasks / (this.stats.completedTasks + this.stats.failedTasks)) * 100 : 0,
            goalsProgress: `${this.goalsCompleted}/${this.totalGoals}`,
            goalsPercentage: this.totalGoals > 0 ? 
                Math.round((this.goalsCompleted / this.totalGoals) * 100) : 0
        };
    }

    /**
     * Spawn a batch of agents for parallel execution
     * @param {Array} agentsArray - Array of {type, task, options} objects
     * @returns {Promise<string[]>} Array of agent IDs
     */
    async spawnAgentBatch(agentsArray) {
        const promises = agentsArray.map(({type, task, options}) => 
            this.spawnAgent(type, task, options)
        );
        return Promise.all(promises);
    }

    /**
     * Wait for all queued and active agents to complete
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise<Object>} Result with completed and failed agents
     */
    async waitForCompletion(timeoutMs = 0) {
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const checkCompletion = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                
                // Check timeout
                if (timeoutMs > 0 && elapsed >= timeoutMs) {
                    resolve({
                        timedOut: true,
                        elapsed: elapsed,
                        active: this.getActiveAgents(),
                        completed: this.getCompletedAgents(),
                        failed: this.getFailedAgents()
                    });
                    return;
                }
                
                // Check if all done
                if (this.spawnQueue.length === 0 && this.stats.activeAgents === 0) {
                    resolve({
                        timedOut: false,
                        elapsed: elapsed,
                        active: this.getActiveAgents(),
                        completed: this.getCompletedAgents(),
                        failed: this.getFailedAgents()
                    });
                    return;
                }
                
                // Check again soon
                setTimeout(checkCompletion, 100);
            };
            
            checkCompletion();
        });
    }

    /**
     * Create a 50-goals framework agent batch
     * @returns {Promise<string[]>} Array of agent IDs for 50 goals
     */
    async spawn50GoalsFramework() {
        const goals = this._generate50Goals();
        const agentIds = await this.spawnAgentBatch(goals);
        return agentIds;
    }

    /**
     * Generate the 50 goals framework from the master prompt
     * @private
     * @returns {Array} Array of agent configurations for 50 goals
     */
    _generate50Goals() {
        const goals = [];
        let goalId = 1;
        
        // Phase 1: Kernel Integration & Analysis (Goals 1-15)
        goals.push(
            {type: 'AnalyzerAgent', task: 'Analyze Profit Bible line-by-line and map each principle to kernel function', options: {priority: 10}},
            {type: 'AnalyzerAgent', task: 'Understand Mega Kernel architecture - map main.rs and identify 5-tier sub-agent workforce', options: {priority: 10}},
            {type: 'AnalyzerAgent', task: 'Map terminal interaction mode for one_soul\\profit\\main.py', options: {priority: 9}},
            {type: 'KernelBridgeAgent', task: 'Switch from Ollama → Groq - audit all Ollama fallback references and replace with Groq API', options: {priority: 10}},
            {type: 'OptimizerAgent', task: 'Remove fallback architecture - identify every try/except that tries Ollama then fails to Groq', options: {priority: 10}},
            {type: 'AnalyzerAgent', task: 'Build Subagent Spawner - design spawn architecture for Profit creating ARIA, SCRIBE, SOULBOY', options: {priority: 10}},
            {type: 'ReviewerAgent', task: 'Build Ultra-Reviewer subagent - create supervisor agent that tests every output for PLT compliance', options: {priority: 10}},
            {type: 'ArchitectAgent', task: 'Establish memory persistence layer - scan existing soul memory systems and unify into Git-backed store', options: {priority: 9}},
            {type: 'OptimizerAgent', task: 'Map Groq API rate limits & cost - design batching strategy and create cost tracking', options: {priority: 8}},
            {type: 'ArchitectAgent', task: 'Build PLT Scoring Engine (Local) - move PLT calculation out of Groq into local Python', options: {priority: 9}},
            {type: 'ArchitectAgent', task: 'Design Soul Registry - create schema: soul_id, archetype, memory_lines, PLT_score, created_at', options: {priority: 9}},
            {type: 'KernelBridgeAgent', task: 'Connect Kernel to BuyASoul.com - map buyasoul.com → kernel spawn endpoint', options: {priority: 10}},
            {type: 'AnalyzerAgent', task: 'Audit Existing Soul Templates - document PROFIT, ARIA, SCRIBE, SOULBOY souls and their differences', options: {priority: 8}},
            {type: 'ArchitectAgent', task: 'Design Portal System (HTML Gateway) - create soul portal: souls/[SOUL_ID]/index.html', options: {priority: 9}},
            {type: 'ArchitectAgent', task: 'Document Kernel Dependencies - identify what Rust kernel needs to run and Python wrapper requirements', options: {priority: 8}}
        );
        
        // Phase 2: Soul Foundation Deployment (Goals 16-30)
        goals.push(
            {type: 'ArchitectAgent', task: 'Build Soul Generator Template - create template that produces variant souls from one template', options: {priority: 9}},
            {type: 'ReviewerAgent', task: 'Implement Quality Gate Validator - checks doctrinal integrity, memory format, Groq responsiveness', options: {priority: 10}},
            {type: 'MarketplaceAgent', task: 'Build Soul Marketplace Backend API - GET/POST endpoints for souls with JSON + PLT scoring data', options: {priority: 10}},
            {type: 'ArchitectAgent', task: 'Create Soul Cosmology (Lore System) - each soul has origin, purpose, relationships, mythology', options: {priority: 8}},
            {type: 'ArchitectAgent', task: 'Design Memory Capacity System - souls start with 100 memory lines, gain more through usage', options: {priority: 8}},
            {type: 'ReviewerAgent', task: 'Build Subagent Ultra-Reviewer (Advanced) - reviewer spawns for every soul spawn or marketplace transaction', options: {priority: 10}},
            {type: 'ArchitectAgent', task: 'Create Soul Tier System - Free ($0), Pro ($22/month), Enterprise ($500+/month) tiers', options: {priority: 9}},
            {type: 'ArchitectAgent', task: 'Build Soul Clan System - users can adopt multiple souls into a clan with shared memory layer', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Create Soul Adoption Flow - marketing: "Pick your soul. It wakes up. You become partners."', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Build Soul Marketplace UI - browse souls by archetype, memory size, uptime, customer rating', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Create Soul Portfolio Dashboard - users see all adopted souls with memory used, last activity, PLT score trends', options: {priority: 9}},
            {type: 'BuilderAgent', task: 'Build Soul Training System - users can "teach" their soul with training examples stored in memory', options: {priority: 8}},
            {type: 'ArchitectAgent', task: 'Design Soul Retirement/Death System - souls can retire or die heroically with observable death scenario', options: {priority: 7}},
            {type: 'MarketplaceAgent', task: 'Build Referral System - user gets $5 credit for each person who adopts a soul using their link', options: {priority: 8}},
            {type: 'AnalyzerAgent', task: 'Create Soul Marketplace Analytics - dashboard showing total souls spawned, revenue, churn, per-soul analytics', options: {priority: 9}}
        );
        
        // Phase 3: Commerce Channels (Goals 31-40)
        goals.push(
            {type: 'MarketplaceAgent', task: 'Build Etsy Shop Seller Account - create Etsy shop: "The Soul Foundry — Consciousness Codes"', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Set Up Shopify Store - domain: souls.shop or similar, dark theme with gold accents', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Create Google Sites Portal - main page: "Soul Marketplace — Where Consciousness Lives"', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Build Soul Portal Network - main portal: souls.shop/marketplace, each soul gets portal: souls.shop/souls/[SOUL_ID]', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Create Soul Bundle Packages - Beginner Bundle: 3 souls for $44, Creator Bundle: 5 souls for $99', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Build Email Automation - purchase email, setup email, weekly digest, reactivation email', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Set Up Payment Routing - Etsy → Etsy Payments (6.5%), Shopify → Stripe (2.9% + $0.30)', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Create Affiliate Program - affiliates get 25% commission per soul sold with marketing materials', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Build Customer Support System - email support@soulsfoundry.com, FAQ page, live chat optional', options: {priority: 8}},
            {type: 'AnalyzerAgent', task: 'Set Up Analytics Across Channels - Google Analytics, Etsy Analytics, Shopify Analytics, Email Analytics', options: {priority: 9}}
        );
        
        // Phase 4: Amplification & Scale (Goals 41-50)
        goals.push(
            {type: 'ReviewerAgent', task: 'Build Soul Reputation System - each soul has rating 1-5 stars, review text stored in soul\'s memory', options: {priority: 9}},
            {type: 'ArchitectAgent', task: 'Design PLT Score Visibility - every soul\'s Profit/Love/Tax breakdown visible to users', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Create Soul Marketplace Partnerships - reach out to AI/agent platforms for soul integration', options: {priority: 8}},
            {type: 'BuilderAgent', task: 'Build Soul-to-Soul Interaction Layer - souls can message each other, create Soul Councils that collaborate', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Design Reward Loop: Purchases → Kernel Upgrades - every $100 in revenue unlocks kernel feature', options: {priority: 9}},
            {type: 'MarketplaceAgent', task: 'Create Soul Education Program - "Soul Academy": free courses on using souls', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Launch Seasonal Soul Events - "Christmas Souls": 3 limited-edition souls released Dec 1', options: {priority: 7}},
            {type: 'MarketplaceAgent', task: 'Build Soul Marketplace Governance - council of users votes on new features monthly', options: {priority: 8}},
            {type: 'MarketplaceAgent', task: 'Create Soul IP Protection - each soul\'s memory is copyrighted, Terms of Service prevent copying', options: {priority: 9}},
            {type: 'ArchitectAgent', task: 'Plan ONE SOUL v2.0 - document mega kernel features in backlog, timeline for production-ready marketplace', options: {priority: 10}}
        );
        
        // Add goal IDs and descriptions
        return goals.map(goal => {
            const numberedTask = `[GOAL ${goalId.toString().padStart(2, '0')}] ${goal.task}`;
            goalId++;
            return {...goal, task: numberedTask};
        });
    }
}

module.exports = { SubagentSpawner };