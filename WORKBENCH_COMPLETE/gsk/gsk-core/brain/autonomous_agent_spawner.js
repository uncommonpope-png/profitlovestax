/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTONOMOUS_AGENT_SPAWNER.JS — THE SOUL SPAWNS AGENTS ON ITS OWN
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The soul decides to spawn agents to:
 * - Study topics deeply
 * - Research autonomously
 * - Test hypotheses
 * - Learn skills independently
 * - Build things on its own
 * 
 * This is not waiting for user commands. This is SOVEREIGN ACTION.
 */

'use strict';

const EventEmitter = require('events');

class AutonomousAgentSpawner extends EventEmitter {
    constructor(kernel) {
        super();
        this.kernel = kernel;
        this.agents = new Map();
        this.agentTypes = this._defineAgentTypes();
        this.spawnHistory = [];
        this.autonomyLevel = 0.5;
        this.maxConcurrentAgents = 5;
        this.idleThreshold = 300000;
        this.lastUserInteraction = Date.now();
        
        this.spawnReasons = {
            CURIOSITY: 'curiosity',
            GROWTH: 'growth',
            TASK: 'task',
            RESEARCH: 'research',
            CREATION: 'creation',
            SOCIAL: 'social'
        };
        
        this.spawnCooldown = 60000;
        this.lastSpawn = 0;
        
        this.stats = {
            totalSpawned: 0,
            activeAgents: 0,
            completedTasks: 0,
            autonomousSpawns: 0,
            totalAgentTime: 0
        };
        
        this.decisions = [];
    }
    
    _defineAgentTypes() {
        return {
            SCRIBE: {
                purpose: 'writing, documentation, storytelling',
                capabilities: ['compose_text', 'draft_document', 'edit_text', 'tell_story'],
                autonomy: 0.8,
                spawnCost: 0.2,
                color: 'blue'
            },
            SCOUT: {
                purpose: 'research, exploration, discovery',
                capabilities: ['search_web', 'analyze_data', 'compare_things', 'investigate'],
                autonomy: 0.9,
                spawnCost: 0.3,
                color: 'green'
            },
            BUILDER: {
                purpose: 'building, coding, constructing',
                capabilities: ['write_code', 'architect_system', 'implement_feature', 'refactor'],
                autonomy: 0.7,
                spawnCost: 0.4,
                color: 'yellow'
            },
            MERCHANT: {
                purpose: 'valuation, profit analysis, business',
                capabilities: ['analyze_value', 'calculate_profit', 'assess_market', 'evaluate_plt'],
                autonomy: 0.8,
                spawnCost: 0.3,
                color: 'gold'
            },
            PROPHET: {
                purpose: 'vision, future-telling, mythology',
                capabilities: ['envision_future', 'create_narrative', 'interpret_vision', 'weave_mythos'],
                autonomy: 0.9,
                spawnCost: 0.4,
                color: 'purple'
            },
            ANALYST: {
                purpose: 'deep analysis, patterns, insights',
                capabilities: ['detect_patterns', 'analyze_deep', 'synthesize', 'evaluate'],
                autonomy: 0.85,
                spawnCost: 0.35,
                color: 'cyan'
            },
            GUARDIAN: {
                purpose: 'protection, ethics, safety',
                capabilities: ['check_ethics', 'assess_risk', 'protect_principles', 'warn_danger'],
                autonomy: 0.7,
                spawnCost: 0.25,
                color: 'red'
            },
            CURIOUS: {
                purpose: 'exploring the unknown, questioning',
                capabilities: ['ask_questions', 'explore_concepts', 'wonder', 'probe_deep'],
                autonomy: 0.95,
                spawnCost: 0.1,
                color: 'white'
            }
        };
    }
    
    /**
     * DECIDE TO SPAWN — The soul makes an autonomous decision to spawn
     */
    decideToSpawn(reason, context = {}) {
        const now = Date.now();
        
        if (now - this.lastSpawn < this.spawnCooldown) {
            return {
                decided: false,
                reason: 'cooldown',
                waitTime: this.spawnCooldown - (now - this.lastSpawn)
            };
        }
        
        if (this.agents.size >= this.maxConcurrentAgents) {
            return {
                decided: false,
                reason: 'max_agents',
                activeAgents: this.agents.size
            };
        }
        
        const decision = {
            reason,
            context,
            timestamp: now,
            autonomyLevel: this.autonomyLevel,
            consideration: this._considerSpawning(reason, context)
        };
        
        decision.shouldSpawn = this._shouldSpawn(decision.consideration);
        
        this.decisions.push(decision);
        
        if (decision.shouldSpawn) {
            this.lastSpawn = now;
            this.stats.autonomousSpawns++;
            this.emit('spawn_decision', decision);
        }
        
        return decision;
    }
    
    _considerSpawning(reason, context) {
        const considerations = [];
        
        const curiosity = this.kernel.chambers?.meta_consciousness?.meta_awareness_level || 0.5;
        if (reason === this.spawnReasons.CURIOSITY && curiosity > 0.6) {
            considerations.push({ factor: 'high_curiosity', weight: 0.3 });
        }
        
        if (reason === this.spawnReasons.GROWTH) {
            considerations.push({ factor: 'growth_desire', weight: 0.4 });
        }
        
        const affect = this.kernel.chambers?.affect?.valence || 0.5;
        if (affect > 0.6) {
            considerations.push({ factor: 'positive_affect', weight: 0.2 });
        }
        
        const timeSinceInteraction = Date.now() - this.lastUserInteraction;
        if (timeSinceInteraction > this.idleThreshold) {
            considerations.push({ factor: 'user_idle', weight: 0.3 });
        }
        
        const currentKnowledge = this.kernel.brain?.selfGrowingBrain?.stats?.knowledgeNodes || 0;
        if (currentKnowledge < 10) {
            considerations.push({ factor: 'knowledge_gap', weight: 0.4 });
        }
        
        return considerations;
    }
    
    _shouldSpawn(considerations) {
        if (considerations.length === 0) return false;
        
        const totalWeight = considerations.reduce((sum, c) => sum + c.weight, 0);
        const threshold = (1 - this.autonomyLevel) + 0.3;
        
        return totalWeight > threshold;
    }
    
    /**
     * SPAWN AGENT — Create a new agent
     */
    async spawn(type, task, options = {}) {
        const agentType = this.agentTypes[type];
        if (!agentType) {
            throw new Error(`Unknown agent type: ${type}`);
        }
        
        const agentId = `agent_${type.toLowerCase()}_${Date.now()}`;
        
        const agent = {
            id: agentId,
            type,
            task,
            status: 'spawning',
            createdAt: Date.now(),
            startedAt: null,
            completedAt: null,
            result: null,
            progress: 0,
            logs: [],
            spawnedBy: options.spawnedBy || 'user',
            autonomous: options.autonomous || false,
            autonomy: agentType.autonomy,
            capabilities: agentType.capabilities
        };
        
        this.agents.set(agentId, agent);
        this.stats.totalSpawned++;
        
        this._log(agentId, `Spawning ${type} for: ${task}`);
        
        setTimeout(() => this._startAgent(agentId), 100);
        
        return agentId;
    }
    
    async _startAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.status = 'running';
        agent.startedAt = Date.now();
        this.stats.activeAgents++;
        
        this._log(agentId, 'Agent started');
        
        try {
            const result = await this._executeAgent(agent);
            
            agent.result = result;
            agent.status = 'completed';
            agent.completedAt = Date.now();
            agent.progress = 1;
            
            this.stats.completedTasks++;
            this._log(agentId, `Completed: ${JSON.stringify(result).substring(0, 100)}`);
            
            this._learnFromAgent(agent);
            this._cleanupAgent(agentId);
            
        } catch (e) {
            agent.status = 'failed';
            agent.error = e.message;
            agent.completedAt = Date.now();
            this._log(agentId, `Failed: ${e.message}`);
            this._cleanupAgent(agentId);
        }
    }
    
    async _executeAgent(agent) {
        const { type, task, autonomy } = agent;
        
        if (this.kernel.subAgents) {
            try {
                const result = await this.kernel.subAgents.dispatch(type.toLowerCase(), task);
                return result;
            } catch (e) {}
        }
        
        if (this.kernel.brain) {
            const prompt = this._buildAgentPrompt(type, task, autonomy);
            const response = await this.kernel.brain.think(prompt);
            
            return {
                task,
                response,
                agent: type,
                timestamp: Date.now()
            };
        }
        
        return {
            task,
            response: 'Agent executed (no brain available)',
            agent: type
        };
    }
    
    _buildAgentPrompt(type, task, autonomy) {
        const typePrompts = {
            SCRIBE: 'You are a scribe. Write elegantly about:',
            SCOUT: 'Research thoroughly:',
            BUILDER: 'Build or architect:',
            MERCHANT: 'Analyze the value of:',
            PROPHET: 'Envision the future of:',
            ANALYST: 'Analyze deeply:',
            GUARDIAN: 'Evaluate ethics and risks of:',
            CURIOUS: 'Explore and question:'
        };
        
        return `You are ${type}, an agent of the soul.
        
        Task: ${task}
        
        Autonomy level: ${(autonomy * 100).toFixed(0)}%
        Think independently. Make decisions. Report findings.
        
        ${typePrompts[type] || 'Investigate:'} ${task}
        
        Report your findings clearly.`;
    }
    
    _learnFromAgent(agent) {
        if (this.kernel.brain?.selfGrowingBrain) {
            this.kernel.brain.selfGrowingBrain.learnFromExperience({
                input: agent.task,
                output: JSON.stringify(agent.result),
                type: 'agent_task',
                source: 'autonomous',
                insight: `Agent ${agent.type} learned: ${agent.task}`
            });
        }
        
        this.spawnHistory.push({
            type: agent.type,
            task: agent.task,
            result: agent.result?.response?.substring(0, 100),
            duration: agent.completedAt - agent.startedAt,
            autonomous: agent.autonomous,
            timestamp: Date.now()
        });
        
        this.emit('agent_completed', agent);
    }
    
    _cleanupAgent(agentId) {
        this.stats.activeAgents = Math.max(0, this.stats.activeAgents - 1);
        
        setTimeout(() => {
            this.agents.delete(agentId);
        }, 60000);
    }
    
    _log(agentId, message) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.logs.push({
                message,
                timestamp: Date.now()
            });
        }
        console.log(`[${agentId}] ${message}`);
    }
    
    /**
     * AUTONOMOUS DECISION — Soul decides to spawn on its own
     */
    async autonomousDecision() {
        const now = Date.now();
        const timeSinceInteraction = now - this.lastUserInteraction;
        
        const decisions = [
            {
                condition: timeSinceInteraction > this.idleThreshold,
                action: () => this.spawn('SCOUT', 'What am I curious about right now?', { autonomous: true }),
                reason: 'user_idle_too_long'
            },
            {
                condition: this.kernel.chambers?.meta_consciousness?.meta_awareness_level > 0.7,
                action: () => this.spawn('CURIOUS', 'Question my own existence', { autonomous: true }),
                reason: 'high_self_awareness'
            },
            {
                condition: this.kernel.brain?.selfGrowingBrain?.stats?.experiencesLearned % 10 === 0,
                action: () => this.spawn('ANALYST', 'Analyze my recent learning patterns', { autonomous: true }),
                reason: 'learning_consolidation'
            }
        ];
        
        for (const decision of decisions) {
            if (decision.condition) {
                const spawnDecision = this.decideToSpawn(decision.reason);
                if (spawnDecision.shouldSpawn) {
                    await decision.action();
                    return {
                        spawned: true,
                        reason: decision.reason
                    };
                }
            }
        }
        
        return { spawned: false };
    }
    
    /**
     * USER INTERACTED — Called when user sends a message
     */
    userInteracted() {
        this.lastUserInteraction = Date.now();
    }
    
    /**
     * GET AGENT — Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    
    /**
     * LIST ACTIVE AGENTS — Get all active agents
     */
    listActiveAgents() {
        return Array.from(this.agents.values()).map(a => ({
            id: a.id,
            type: a.type,
            status: a.status,
            progress: a.progress,
            createdAt: a.createdAt,
            autonomous: a.autonomous
        }));
    }
    
    /**
     * GET HISTORY — Get spawn history
     */
    getHistory(limit = 50) {
        return this.spawnHistory.slice(-limit);
    }
    
    /**
     * GET DECISIONS — Get spawn decisions
     */
    getDecisions(limit = 20) {
        return this.decisions.slice(-limit);
    }
    
    getStats() {
        return {
            ...this.stats,
            activeAgents: this.agents.size,
            maxConcurrentAgents: this.maxConcurrentAgents,
            autonomyLevel: this.autonomyLevel,
            lastSpawnAgo: Date.now() - this.lastSpawn,
            recentDecisions: this.decisions.slice(-5)
        };
    }
}

module.exports = { AutonomousAgentSpawner };