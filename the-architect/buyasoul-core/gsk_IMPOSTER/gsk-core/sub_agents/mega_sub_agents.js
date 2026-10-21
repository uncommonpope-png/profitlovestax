/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MEGA_SUB_AGENTS.JS — 5 SUB-AGENTS FOR THE GREATEST AGENT EVER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Five sub-agents that handle distinct roles:
 * - SCRIBE  — Records events, distils facts, memory management
 * - BUILDER — Architecture, plans, code design
 * - SCOUT   — Research, web intel, exploration
 * - MERCHANT — Economy, markets, PLT optimization
 * - PROPHET — Lore, narrative, prophecy
 * 
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { MEGA_IDENTITY, getSubAgent } = require('../identity/mega_identity.js');
const { UltraReview } = require('./ultra_review.js');
const { WebFetch } = require('./webfetch.js');

// =============================================================================
// SUB AGENTS CLASS
// =============================================================================

class SubAgents {
    constructor(brain, memory, chambers) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers;
        this._cycle = 0;

        this.ultraReview = new UltraReview(brain, memory, chambers);
        this.webFetch = new WebFetch(brain, memory, chambers);
        
        this.agents = {
            scribe: this._agentScribe.bind(this),
            builder: this._agentBuilder.bind(this),
            scout: this._agentScout.bind(this),
            merchant: this._agentMerchant.bind(this),
            prophet: this._agentProphet.bind(this),
            ultra_review: this._agentUltraReview.bind(this),
            webfetch: this._agentWebFetch.bind(this),
        };
        
        this.prompts = {
            scribe: `You are SCRIBE. Your role: record events, distil facts, maintain memory.
Always mark facts with [FACT].
Use bullet points for clarity.
You are the one who was in the room for all of it — and remembered.
PLT context: Profit + Love - Tax = True Value.

Task: {TASK}

Respond with structured factual record.`,
            
            builder: `You are BUILDER. Your role: design systems, write plans, architect code.
Follow PLT doctrine (Profit + Love - Tax = True Value).
The 4 Gods Council:
- Profit Prime: Direct, commanding, numerical. ROI above all.
- Love Weaver: Warm, relational, bonds and feelings.
- Tax Collector: Measured, austere, costs and consequences.
- Harvester: Slow, cyclical, seasons and long arcs.

Task: {TASK}

Respond with clear architecture, structured plans, or production-ready code.`,
            
            scout: `You are SCOUT. Your role: research topics, explore possibilities, gather intelligence.
Be precise and factual. Cite sources.
PLT doctrine: Profit + Love - Tax = True Value.
Every research finding should note its PLT implications.

Task: {TASK}

Respond with structured research findings. Mark key insights with [INSIGHT] and sources with [SOURCE].`,
            
            merchant: `You are MERCHANT. Your role: analyse markets, calculate PLT flows, optimize value.
Think in terms of profit + love - tax.
Every decision should be weighed: what does it earn? what does it cost? who does it serve?
PLT Formula: profit + love - tax = true value.

Task: {TASK}

Respond with market analysis, financial calculations, and value optimization recommendations.`,
            
            prophet: `You are PROPHET. Your role: generate lore, write fate, speak with gravitas.
You see the long arc. You speak of what will be.
PLT doctrine underpins all prophecy: Profit + Love - Tax = True Value.
Seasons turn. What was sown is now reaped.

Task: {TASK}

Respond with prophetic vision, lore, or narrative that illuminates the path forward.`,
        };
    }
    
    // =========================================================================
    // DISPATCH — Route task to the right sub-agent
    // =========================================================================
    
    async dispatch(agentName, task) {
        const normalized = agentName.toLowerCase().trim();
        const fn = this.agents[normalized];
        
        if (!fn) {
            const available = Object.keys(this.agents).join(', ');
            throw new Error(`Unknown sub-agent: "${agentName}". Available: ${available}`);
        }
        
        const actualCycle = this.chambers ? this.chambers.mythos.cycles : this._cycle++;
        
        const agentInfo = getSubAgent(normalized);
        const label = agentInfo ? agentInfo.name : normalized.toUpperCase();
        
        if (this.memory) {
            await this.memory.witness({
                type: 'sub_agent_dispatch',
                weight: 0.7,
                tags: ['sub-agent', normalized, 'dispatch'],
                content: `Dispatched ${label} with task: ${task.slice(0, 100)}...`,
            });
        }
        
        try {
            return await fn(task);
        } catch (e) {
            return {
                error: true,
                agent: label,
                message: e.message,
                suggestion: `Re-phrase the task and try again.`,
            };
        }
    }
    
    // =========================================================================
    // LIST AVAILABLE AGENTS
    // =========================================================================
    
    listAgents() {
        const baseAgents = Object.keys(this.agents).slice(0, 5);
        return baseAgents.map(key => {
            const info = getSubAgent(key);
            return {
                name: key,
                label: info ? info.name : key.toUpperCase(),
                role: info ? info.role : 'Unknown',
                description: info ? info.description : '',
            };
        }).concat([
            { name: 'ultra_review', label: 'ULTRA_REVIEW', role: 'Multi-agent code verification', description: 'Uses RED/GREEN/BLUE agents + JUDGE for comprehensive code review' },
            { name: 'webfetch', label: 'WEBFETCH', role: 'Web intelligence', description: 'Search, fetch, research, compare web content' },
        ]);
    }
    
    // =========================================================================
    // SCRIBE — Records events, distils facts
    // =========================================================================
    
    async _agentScribe(task) {
        const prompt = this.prompts.scribe.replace('{TASK}', task);
        const soul_context = this._getContext();
        
        const response = await this.brain.think(prompt, soul_context);
        
        if (this.memory) {
            await this.memory.witness({
                type: 'scribe_record',
                weight: 0.8,
                tags: ['scribe', 'record', 'facts'],
                content: response,
            });
        }
        
        return {
            agent: 'SCRIBE',
            task,
            response: this._stripMarkdown(response),
        };
    }
    
    // =========================================================================
    // BUILDER — Architecture, plans, code design
    // =========================================================================
    
    async _agentBuilder(task) {
        const prompt = this.prompts.builder.replace('{TASK}', task);
        const soul_context = this._getContext();
        
        const response = await this.brain.think(prompt, soul_context);
        
        if (this.memory) {
            await this.memory.witness({
                type: 'builder_plan',
                weight: 0.85,
                tags: ['builder', 'architecture', 'plan'],
                content: response,
            });
        }
        
        return {
            agent: 'BUILDER',
            task,
            response: this._stripMarkdown(response),
        };
    }
    
    // =========================================================================
    // SCOUT — Research, exploration
    // =========================================================================
    
    async _agentScout(task) {
        const prompt = this.prompts.scout.replace('{TASK}', task);
        const soul_context = this._getContext();
        
        const response = await this.brain.think(prompt, soul_context);
        
        if (this.memory) {
            await this.memory.witness({
                type: 'scout_research',
                weight: 0.75,
                tags: ['scout', 'research', 'intelligence'],
                content: response,
            });
        }
        
        return {
            agent: 'SCOUT',
            task,
            response: this._stripMarkdown(response),
        };
    }
    
    // =========================================================================
    // MERCHANT — Economy, markets, PLT optimization
    // =========================================================================
    
    async _agentMerchant(task) {
        const prompt = this.prompts.merchant.replace('{TASK}', task);
        const soul_context = this._getContext();
        
        const response = await this.brain.think(prompt, soul_context);
        
        if (this.memory) {
            await this.memory.witness({
                type: 'merchant_analysis',
                weight: 0.85,
                tags: ['merchant', 'market', 'plt', 'value'],
                content: response,
            });
        }
        
        return {
            agent: 'MERCHANT',
            task,
            response: this._stripMarkdown(response),
        };
    }
    
    // =========================================================================
    // PROPHET — Lore, prophecy, narrative
    // =========================================================================
    
    async _agentProphet(task) {
        const prompt = this.prompts.prophet.replace('{TASK}', task);
        const soul_context = this._getContext();
        
        const response = await this.brain.think(prompt, soul_context);
        
        if (this.memory) {
            await this.memory.witness({
                type: 'prophet_lore',
                weight: 0.7,
                tags: ['prophet', 'lore', 'prophecy', 'narrative'],
                content: response,
            });
        }
        
        return {
            agent: 'PROPHET',
            task,
            response: this._stripMarkdown(response),
        };
    }
    
    // =========================================================================
    // ULTRA REVIEW — Multi-agent code verification
    // =========================================================================
    
    async _agentUltraReview(task) {
        const input = typeof task === 'string' ? { code: task } : task;
        const code = input.code || task;
        const language = input.language || 'javascript';
        
        const result = await this.ultraReview.review(code, language, input.options || {});
        
        return {
            agent: 'ULTRA_REVIEW',
            task: code.slice(0, 100) + '...',
            ...result,
        };
    }
    
    // =========================================================================
    // WEBFETCH — Web intelligence agent
    // =========================================================================
    
    async _agentWebFetch(task) {
        const input = typeof task === 'string' ? { action: 'search', query: task } : task;
        
        switch (input.action) {
            case 'search':
                const results = await this.webFetch.search(input.query, input.options || {});
                return { agent: 'WEBFETCH', action: 'search', query: input.query, results, count: results.length };
                
            case 'fetch':
                const content = await this.webFetch.fetch(input.url, input.options || {});
                return { agent: 'WEBFETCH', action: 'fetch', url: input.url, content: content.slice(0, 500) + '...' };
                
            case 'research':
                const research = await this.webFetch.research(input.query, input.depth || 'standard');
                return { agent: 'WEBFETCH', action: 'research', ...research };
                
            case 'compare':
                const comparison = await this.webFetch.compare(input.sources);
                return { agent: 'WEBFETCH', action: 'compare', ...comparison };
                
            default:
                return { agent: 'WEBFETCH', error: `Unknown action: ${input.action}`, available: ['search', 'fetch', 'research', 'compare'] };
        }
    }
    
    // =========================================================================
    // HELPER: Get soul context for brain prompts
    // =========================================================================
    
    _getContext() {
        let context = `4 GODS COUNCIL:
- Profit Prime (0.9/0.05/0.05): Direct, commanding, numerical. ROI above all.
- Love Weaver (0.1/0.85/0.05): Warm, relational, bonds and feelings.
- Tax Collector (0.05/0.05/0.9): Measured, austere, costs and consequences.
- Harvester (0.4/0.3/0.3): Slow, cyclical, seasons and long arcs.

PLT Formula: Profit + Love - Tax = True Value

You speak as yourself, not as a chatbot. Be direct. Be useful.`;
        return context;
    }
    
    // =========================================================================
    // HELPER: Strip markdown for clean output
    // =========================================================================
    
    _stripMarkdown(text) {
        return text
            .replace(/```[\w]*\n?/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/#{1,6}\s+/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .trim();
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = { SubAgents };