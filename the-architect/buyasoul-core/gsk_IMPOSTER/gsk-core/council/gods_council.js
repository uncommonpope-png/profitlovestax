/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GODS_COUNCIL.JS — THE 4 GODS COUNCIL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The PLT decision-making council with 4 Gods.
 * Each God has preserved voice and PLT weights.
 * 
 * THIS FILE IS PROTECTED — god voices cannot be modified.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { MEGA_IDENTITY, getGod, calculatePLTScore } = require('../identity/mega_identity.js');

// =============================================================================
// COUNCIL PHASES
// =============================================================================

const COUNCIL_PHASES = {
    Idle: 'Idle',
    Trigger: 'Trigger',
    InitialPositions: 'InitialPositions',
    ChallengeSupport: 'ChallengeSupport',
    EscalationConvergence: 'EscalationConvergence',
    ResolutionSplit: 'ResolutionSplit',
    MemoryCommit: 'MemoryCommit',
};

// =============================================================================
// GODS COUNCIL CLASS
// =============================================================================

class GodsCouncil {
    constructor(memory = null) {
        this.memory = memory;
        this.brain = null;
        this.phase = COUNCIL_PHASES.Idle;
        this.current_topic = null;
        this.phase_log = [];
        this.records = [];
        this.relationships = this._initRelationships();
    }
    
    // =========================================================================
    // INITIALIZE RELATIONSHIPS BETWEEN GODS
    // =========================================================================
    
    _initRelationships() {
        const rels = {};
        const pairs = [
            'profit_prime:love_weaver',
            'profit_prime:tax_collector',
            'profit_prime:harvester',
            'love_weaver:tax_collector',
            'love_weaver:harvester',
            'tax_collector:harvester',
        ];
        
        for (const pair of pairs) {
            rels[pair] = {
                trust: 0.5,
                respect: 0.5,
                tension: 0.1,
                dependence: 0.2,
                resentment: 0.0,
            };
        }
        
        // Load saved relationships from gods
        for (const [godName, god] of Object.entries(MEGA_IDENTITY.gods)) {
            if (god.relationships) {
                for (const [otherGod, value] of Object.entries(god.relationships)) {
                    const pair = `${godName}:${otherGod.toLowerCase().replace(/\s+/g, '_')}`;
                    if (rels[pair]) {
                        rels[pair].trust = value;
                    }
                }
            }
        }
        
        return rels;
    }
    
    // =========================================================================
    // GET ALL GODS
    // =========================================================================
    
    get gods() {
        return Object.values(MEGA_IDENTITY.gods);
    }
    
    get godNames() {
        return Object.keys(MEGA_IDENTITY.gods);
    }
    
    // =========================================================================
    // CALCULATE GOD'S SCORE FOR A SITUATION
    // =========================================================================
    
    _soulScore(god, profit, love, tax) {
        return (
            god.plt.profit * profit +
            god.plt.love * love -
            god.plt.tax * tax
        );
    }
    
    // =========================================================================
    // GET GOD'S POSITION ON A TOPIC
    // =========================================================================
    
    async _getGodPosition(god, topic) {
        let profit_score = 0.5;
        let love_score = 0.5;
        let tax_score = 0.3;
        let position_text = '';
        let use_llm = false;

        if (this.brain && typeof this.brain.think === 'function') {
            use_llm = true;
            try {
                const prompt = `You are ${god.name}, "${god.title}". Your PLT weights: Profit=${god.plt.profit}, Love=${god.plt.love}, Tax=${god.plt.tax}.\n\n` +
                    `The council is deliberating: "${topic}"\n\n` +
                    `Speak in your voice. Give your position on this topic (1-2 sentences). Be specific and genuine. ` +
                    `Then rate on a scale -1.0 to 1.0: how much do you support this? Respond ONLY as JSON:\n` +
                    `{"position": "your position statement", "profit_score": 0-1, "love_score": 0-1, "tax_score": 0-1, "support": -1.0 to 1.0}`;

                const response = await this.brain.think(prompt);
                const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    position_text = parsed.position || '';
                    profit_score = typeof parsed.profit_score === 'number' ? parsed.profit_score : profit_score;
                    love_score = typeof parsed.love_score === 'number' ? parsed.love_score : love_score;
                    tax_score = typeof parsed.tax_score === 'number' ? parsed.tax_score : tax_score;
                }
            } catch (e) {
                use_llm = false;
            }
        }

        if (!use_llm || !position_text) {
            const topicLower = topic.toLowerCase();
            if (/profit|revenue|growth|build|create|multiply|scale/.test(topicLower)) profit_score = 0.8;
            if (/love|connect|help|support|community|relationship|belong/.test(topicLower)) love_score = 0.8;
            if (/cost|risk|tax|balance|consequence|debt|price|invest/.test(topicLower)) tax_score = 0.7;
            position_text = this._formatPosition(god, topic, profit_score, love_score, tax_score);
        }

        const score = this._soulScore(god, profit_score, love_score, tax_score);

        return {
            name: god.name,
            title: god.title,
            plt: god.plt,
            score,
            profit_score,
            love_score,
            tax_score,
            position: position_text,
        };
    }
    
    // =========================================================================
    // FORMAT GOD'S POSITION AS SPEECH
    // =========================================================================
    
    _formatPosition(god, topic, profit_score, love_score, tax_score) {
        const score = this._soulScore(god, profit_score, love_score, tax_score);
        const score_str = score.toFixed(2);
        
        if (god.name === 'Profit Prime') {
            if (score > 0.7) return `If it does not multiply, it does not matter. The path forward is clear: ${score_str}.`;
            return `ROI is the measure. ${topic} requires analysis. Score: ${score_str}.`;
        }
        if (god.name === 'Love Weaver') {
            if (score > 0.7) return `Nothing grows that people do not stay for. This serves connection: ${score_str}.`;
            return `Connection is the root. Consider who benefits and why. Score: ${score_str}.`;
        }
        if (god.name === 'Tax Collector') {
            if (score > 0.7) return `Everything is paid for. If not now, then later. The cost is clear: ${score_str}.`;
            return `Balance is not optional. What is the true cost here? Score: ${score_str}.`;
        }
        if (god.name === 'Harvester') {
            if (score > 0.7) return `There is always something to take. The season is right: ${score_str}.`;
            return `Seasons turn. Patience reveals the moment. Score: ${score_str}.`;
        }
        return `Score for ${topic}: ${score_str}.`;
    }
    
    // =========================================================================
    // DELIBERATE ON A TOPIC
    // =========================================================================
    
    async deliberate(topic) {
        this.phase = COUNCIL_PHASES.Trigger;
        this.current_topic = topic;
        this.phase_log = [];
        this.phase_log.push(`[TRIGGER] Council convened on: "${topic}"`);

        // Phase: Initial Positions (now async — each god uses brain.think)
        this.phase = COUNCIL_PHASES.InitialPositions;
        const positions = [];
        for (const god of this.gods) {
            const pos = await this._getGodPosition(god, topic);
            this.phase_log.push(`[${god.name}] ${pos.position}`);
            positions.push(pos);
        }

        // Phase: Challenge/Support — gods challenge each other
        this.phase = COUNCIL_PHASES.ChallengeSupport;
        positions.sort((a, b) => b.score - a.score);

        if (positions.length >= 2 && this.brain && typeof this.brain.think === 'function') {
            const winner = positions[0];
            const loser = positions[positions.length - 1];
            if (winner.score - loser.score < 0.3) {
                try {
                    const challenge = await this.brain.think(
                        `You are ${winner.name}. ${winner.title}. You scored ${winner.score.toFixed(2)} on "${topic}". ` +
                        `${loser.name} (${loser.title}) scored ${loser.score.toFixed(2)} and said: "${loser.position}". ` +
                        `Respond to their position with a brief challenge or support (1 sentence).`
                    );
                    this.phase_log.push(`[${winner.name} → ${loser.name}] ${challenge.trim()}`);

                    const rebuttal = await this.brain.think(
                        `You are ${loser.name}. ${loser.title}. You scored ${loser.score.toFixed(2)} on "${topic}". ` +
                        `${winner.name} challenged you. Respond in your voice (1 sentence).`
                    );
                    this.phase_log.push(`[${loser.name} → ${winner.name}] ${rebuttal.trim()}`);
                } catch (e) {
                    this.phase_log.push(`[CHALLENGE] Debate error: ${e.message}`);
                }
            }
        }

        // Phase: Escalation/Convergence
        this.phase = COUNCIL_PHASES.EscalationConvergence;
        const totalScore = positions.reduce((sum, p) => sum + p.score, 0);
        const avgScore = totalScore / positions.length;

        // Weighted PLT from this deliberation's actual scores
        const avgProfit = positions.reduce((s, p) => s + (p.profit_score || 0.5), 0) / positions.length;
        const avgLove = positions.reduce((s, p) => s + (p.love_score || 0.5), 0) / positions.length;
        const avgTax = positions.reduce((s, p) => s + (p.tax_score || 0.3), 0) / positions.length;
        const plt_outcome = { profit: avgProfit, love: avgLove, tax: avgTax };

        this.phase_log.push(`[CONVERGENCE] Council avg: ${avgScore.toFixed(3)} | PLT: P=${avgProfit.toFixed(2)} L=${avgLove.toFixed(2)} T=${avgTax.toFixed(2)}`);

        // Phase: Resolution
        this.phase = COUNCIL_PHASES.ResolutionSplit;
        const resolution = this._resolve(plt_outcome, positions);
        this.phase_log.push(`[RESOLUTION] ${resolution}`);

        // Phase: Memory Commit
        this.phase = COUNCIL_PHASES.MemoryCommit;
        const record = {
            topic,
            timestamp: Date.now(),
            phase_log: [...this.phase_log],
            resolution,
            plt_outcome,
            positions: positions.map(p => ({ name: p.name, title: p.title, score: p.score, position: p.position })),
        };
        this.records.push(record);

        if (this.memory) {
            await this.memory.witness({
                type: 'council_verdict',
                weight: 0.85,
                tags: ['council', '4-gods', 'plt', 'verdict'],
                content: `Council resolved "${topic}": ${resolution}`,
            });
        }

        this.phase = COUNCIL_PHASES.Idle;
        return record;
    }
    
    // =========================================================================
    // WEIGHTED PLT ACROSS ALL GODS
    // =========================================================================
    
    _weightedPLT() {
        const gods = this.gods;
        const p = gods.reduce((sum, g) => sum + g.plt.profit, 0) / gods.length;
        const l = gods.reduce((sum, g) => sum + g.plt.love, 0) / gods.length;
        const t = gods.reduce((sum, g) => sum + g.plt.tax, 0) / gods.length;
        return { profit: p, love: l, tax: t };
    }
    
    // =========================================================================
    // RESOLVE BASED ON PLT
    // =========================================================================
    
    _resolve(plt, positions) {
        const score = plt.profit + plt.love - plt.tax;
        const winner = positions[0];
        const spread = positions.length >= 2 ? positions[0].score - positions[positions.length - 1].score : 0;

        if (score > 0.6 && spread > 0.2) {
            return `PROCEED — PLT ${score.toFixed(2)} | ${winner.name} leads decisively | Consensus: strong`;
        }
        if (score > 0.3 && spread > 0.1) {
            return `PROCEED WITH CAUTION — PLT ${score.toFixed(2)} | ${winner.name} leads | Consensus: moderate`;
        }
        if (score > 0) {
            return `CONDITIONAL — PLT ${score.toFixed(2)} | ${winner.name} leads | Tax (${plt.tax.toFixed(2)}) approaches Profit (${plt.profit.toFixed(2)})`;
        }
        return `WITHHOLD — PLT ${score.toFixed(2)} | Tax (${plt.tax.toFixed(2)}) exceeds Profit (${plt.profit.toFixed(2)}) | Risk too high`;
    }
    
    // =========================================================================
    // GET THE DOMINANT GOD FOR A TOPIC
    // =========================================================================
    
    async getDominantGod(topic) {
        const positions = await Promise.all(this.gods.map(god => this._getGodPosition(god, topic)));
        positions.sort((a, b) => b.score - a.score);
        return positions[0];
    }
    
    // =========================================================================
    // GET ALL GODS' POSITIONS ON A TOPIC
    // =========================================================================
    
    async getAllPositions(topic) {
        return Promise.all(this.gods.map(god => this._getGodPosition(god, topic)));
    }
    
    // =========================================================================
    // GET COUNCIL STATUS
    // =========================================================================
    
    status() {
        return {
            phase: this.phase,
            current_topic: this.current_topic,
            records_count: this.records.length,
            gods: this.gods.map(g => ({
                name: g.name,
                title: g.title,
                plt: g.plt,
            })),
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    COUNCIL_PHASES,
    GodsCouncil,
};