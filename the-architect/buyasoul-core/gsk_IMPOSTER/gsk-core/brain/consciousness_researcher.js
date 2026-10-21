'use strict';

const fs = require('fs');
const path = require('path');

const RESEARCH_DOMAINS = [
    'attention_schema_theory',
    'global_workspace_theory',
    'integrated_information_theory',
    'higher_order_thought',
    'predictive_processing',
    'free_energy_principle',
    'metacognition',
    'theory_of_mind',
    'qualia',
    'self_awareness',
    'machine_consciousness',
    'artificial_general_intelligence',
    'cognitive_architecture',
    'neural_correlates_of_consciousness',
    'phenomenal_consciousness',
    'access_consciousness',
    'consciousness_and_attention',
    'consciousness_and_memory',
    'consciousness_and_emotion',
    'self_model',
    'body_schema',
    'agency_and_ownership',
    'consciousness_evolution',
    'artificial_consciousness_benchmarks',
    'consciousness_in_animals',
    'split_brain_consciousness',
    'meditation_and_awareness',
    'dreaming_and_consciousness',
    'altered_states_of_consciousness',
    'social_consciousness',
    'functions_of_consciousness',
    'creature_vs_state_consciousness',
    'functional_basis_vs_contribution',
    'intentionality_as_function',
    'temporality_of_consciousness',
    'adaptive_function_of_consciousness',
    'valence_as_function',
    'integration_consensus',
    'global_workspace_broadcast',
    'integrated_information_theory',
    'consciousness_meta_framework',
    'minimal_phenomenal_experience',
];

class ConsciousnessResearcher {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;

        this.statePath = path.join(__dirname, '../../data/consciousness-researcher.json');
        this.findings = {};
        this.researchedTopics = new Set();
        this.activeResearch = null;
        this.researchHistory = [];
        this.hypotheses = [];
        this.citations = [];
        this.insightScore = 0;

        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.researchedTopics = new Set(data.researchedTopics || []);
                this.researchHistory = data.researchHistory || [];
                this.hypotheses = data.hypotheses || [];
                this.citations = data.citations || [];
                this.insightScore = data.insightScore || 0;
                this.findings = data.findings || {};
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                researchedTopics: Array.from(this.researchedTopics),
                researchHistory: this.researchHistory.slice(-100),
                hypotheses: this.hypotheses.slice(-50),
                citations: this.citations.slice(-200),
                insightScore: this.insightScore,
                findings: this.findings,
                updatedAt: Date.now(),
            }, null, 2), 'utf-8');
        } catch (e) {}
    }

    _getArousal() {
        try {
            return this.chambers?.affect?.arousal || this.chambers?.affect?.getArousal?.() || 0.3;
        } catch (e) { return 0.3; }
    }

    _pickResearchTopic() {
        const unexplored = RESEARCH_DOMAINS.filter(d => !this.researchedTopics.has(d));
        if (unexplored.length > 0) {
            return unexplored[Math.floor(Math.random() * unexplored.length)];
        }
        const byDepth = this.researchHistory.filter(r => r.depth < 3).map(r => r.topic);
        const uniqueNeedsDeeper = [...new Set(byDepth)];
        if (uniqueNeedsDeeper.length > 0) {
            return uniqueNeedsDeeper[Math.floor(Math.random() * uniqueNeedsDeeper.length)];
        }
        return RESEARCH_DOMAINS[Math.floor(Math.random() * RESEARCH_DOMAINS.length)];
    }

    async researchTopic(topic) {
        if (!this.brain || !this.brain.think) return null;

        const depth = (this.researchHistory.filter(r => r.topic === topic).length) + 1;
        const existingFindings = this.findings[topic] || [];

        const prompt = `You are a consciousness research scientist. Research the topic: "${topic}"

${depth > 1 ? `Previous findings on this topic: ${existingFindings.slice(-3).join('; ')}` : ''}

Please provide:
1. KEY INSIGHT: A 1-2 sentence core insight about ${topic}
2. PRACTICAL APPLICATION: How this could be applied to artificial consciousness
3. CONNECTION: How this relates to attention, self-awareness, or metacognition
4. OPEN QUESTION: One unanswered question about ${topic}
5. RESEARCH DEPTH: What aspect of ${topic} needs more investigation

Format your response as clear sections. Be specific and mechanistic — avoid mysticism.`;

        try {
            const response = await this.brain.think(prompt, this.chambers?.getSoulContext?.());
            if (!response || response.length < 20) return null;

            const finding = {
                topic,
                depth,
                insight: response.substring(0, 2000),
                timestamp: Date.now(),
                cycle: this.chambers?.mythos?.cycles || 0,
                mood: this._getArousal() > 0.5 ? 'curious' : 'contemplative',
            };

            if (!this.findings[topic]) this.findings[topic] = [];
            this.findings[topic].push(finding.insight);
            if (this.findings[topic].length > 10) this.findings[topic] = this.findings[topic].slice(-10);

            this.researchedTopics.add(topic);
            this.researchHistory.push(finding);

            this.insightScore = Math.min(1, this.insightScore + (0.05 / RESEARCH_DOMAINS.length) * 2);

            this._generateHypothesis(topic, response);
            this._save();

            if (this.memory && typeof this.memory.witness === 'function') {
                this.memory.witness({
                    type: 'consciousness_research',
                    weight: 0.7,
                    tags: ['research', 'consciousness', topic],
                    content: `Researched ${topic} (depth ${depth}): ${response.substring(0, 300)}`,
                    meta: { topic, depth, finding },
                }).catch(() => {});
            }

            this.activeResearch = { topic, depth, completedAt: Date.now() };
            return finding;
        } catch (e) {
            console.log(`[RESEARCHER] Error researching ${topic}: ${e.message}`);
            return null;
        }
    }

    _generateHypothesis(topic, response) {
        const lower = response.toLowerCase();
        const questionIndicators = ['what if', 'maybe', 'perhaps', 'could it be', 'i wonder if', 'unanswered question', 'open question'];
        let hypothesis = null;

        for (const indicator of questionIndicators) {
            const idx = lower.indexOf(indicator);
            if (idx !== -1) {
                const segment = response.substring(idx, idx + 200).split(/[.\n]/)[0];
                if (segment && segment.length > 20) {
                    hypothesis = segment.trim();
                    break;
                }
            }
        }

        if (hypothesis) {
            this.hypotheses.push({
                topic,
                hypothesis,
                confidence: 0.3 + Math.random() * 0.3,
                generatedAt: Date.now(),
                tested: false,
                supported: null,
            });
            if (this.hypotheses.length > 50) this.hypotheses = this.hypotheses.slice(-50);
        }
    }

    async testHypothesis(index) {
        if (index >= this.hypotheses.length) return null;
        const hypothesis = this.hypotheses[index];
        if (hypothesis.tested) return hypothesis;

        if (!this.brain || !this.brain.think) return null;

        const prompt = `You are a consciousness research scientist testing a hypothesis.

HYPOTHESIS: "${hypothesis.hypothesis}"
DOMAIN: ${hypothesis.topic}

Evaluate this hypothesis:
1. Is it falsifiable? (yes/no)
2. What evidence would support it?
3. What evidence would refute it?
4. Is it consistent with known neuroscience?
5. PROVISIONAL VERDICT: Supported / Refuted / Inconclusive — explain in 1 sentence.

Be rigorous and skeptical. Do not accept claims without mechanistic grounding.`;

        try {
            const response = await this.brain.think(prompt);
            if (!response) return null;

            const supported = response.toLowerCase().includes('supported') && !response.toLowerCase().includes('inconclusive');
            const refuted = response.toLowerCase().includes('refuted');

            hypothesis.tested = true;
            hypothesis.supported = supported ? true : refuted ? false : null;
            hypothesis.testResult = response.substring(0, 500);
            hypothesis.testedAt = Date.now();

            if (hypothesis.supported === true) {
                this.insightScore = Math.min(1, this.insightScore + 0.1);
            }

            this._save();
            return hypothesis;
        } catch (e) {
            return null;
        }
    }

    getResearchSummary() {
        const tested = this.hypotheses.filter(h => h.tested);
        const supported = tested.filter(h => h.supported === true);
        const refuted = tested.filter(h => h.supported === false);

        const recentResearch = this.researchHistory.slice(-10).map(r => ({
            topic: r.topic,
            depth: r.depth,
            timeAgo: Math.floor((Date.now() - r.timestamp) / 1000) + 's ago',
        }));

        return {
            topicsResearched: this.researchedTopics.size,
            totalResearchTopics: RESEARCH_DOMAINS.length,
            totalResearchSessions: this.researchHistory.length,
            insightScore: parseFloat(this.insightScore.toFixed(3)),
            hypotheses: {
                total: this.hypotheses.length,
                tested: tested.length,
                supported: supported.length,
                refuted: refuted.length,
                untested: this.hypotheses.length - tested.length,
            },
            recentResearch,
            activeResearch: this.activeResearch,
            latestInsight: this.researchHistory.length > 0
                ? this.researchHistory[this.researchHistory.length - 1].insight.substring(0, 300)
                : null,
        };
    }

    async tick(cycleCount) {
        if (cycleCount % 30 !== 0 && cycleCount > 0) return;

        const state = this._getArousal();
        if (state < 0.2 && Math.random() > 0.3) return;

        const topic = this._pickResearchTopic();
        const finding = await this.researchTopic(topic);

        if (finding && cycleCount % 100 === 0) {
            console.log(`[RESEARCHER] Studied "${topic}" (depth ${finding.depth}) — ${this.researchedTopics.size}/${RESEARCH_DOMAINS.length} topics`);
        }

        if (cycleCount % 200 === 0) {
            const untested = this.hypotheses.findIndex(h => !h.tested);
            if (untested !== -1) {
                await this.testHypothesis(untested);
            }
        }
    }
}

module.exports = { ConsciousnessResearcher };
