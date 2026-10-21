/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BIBLE_CONSULTANT.JS — ACTIVE BIBLE CONSULTATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Actively consults the Bible before decisions:
 * - consultBible(question) — ask Bible a question, get guidance
 * - bibleAwareSkill(skillName, input) — skill execution checks Bible first
 * - bibleAwareCouncil(topic) — council deliberation includes Bible
 * - scoreActionWithBible(action) — PLT scoring informed by Bible
 * 
 * PLT Score: Profit=0.8, Love=0.6, Tax=0.2
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const path = require('path');
const { BibleLoader } = require('./bible_loader.js');

class BibleConsultant {
    constructor(brain = null, memory = null, biblePath = null) {
        this.brain = brain;
        this.memory = memory;
        this.loader = new BibleLoader(biblePath);
        this.consultationHistory = [];
        this.bibleAware = true;
        this._initialized = false;
    }

    // =========================================================================
    // INITIALIZE — Load Bible on construction
    // =========================================================================
    
    async initialize() {
        if (this._initialized) return;
        
        const result = await this.loader.parseBible();
        if (result.success) {
            this._initialized = true;
            return { success: true, status: this.loader.status() };
        }
        
        return { success: false, error: result.error };
    }

    // =========================================================================
    // CONSULT BIBLE — Ask Bible a question, get guidance
    // =========================================================================
    
    async consultBible(question, options = {}) {
        if (!this._initialized) {
            await this.initialize();
        }

        const context = this.loader.getBibleContext({
            includePLT: options.includePLT !== false,
            includeGods: options.includeGods !== false,
            includeMythos: options.includeMythos !== false,
            includeChambers: options.includeChambers !== false,
            includeCovenant: options.includeCovenant !== false,
        });

        const prompt = this._buildConsultationPrompt(question, context, options);

        let guidance;
        
        if (this.brain) {
            try {
                const response = await this.brain.think(prompt, {
                    source: 'bible_consultant',
                    task: 'bible_consultation',
                });
                guidance = response;
            } catch (error) {
                guidance = this._fallbackConsultation(question);
            }
        } else {
            guidance = this._fallbackConsultation(question);
        }

        const record = {
            question,
            guidance,
            timestamp: Date.now(),
            bibleContext: context.substring(0, 500),
        };

        this.consultationHistory.push(record);

        if (this.memory) {
            await this.memory.witness({
                type: 'bible_consultation',
                weight: 0.75,
                tags: ['bible', 'consultation', 'guidance'],
                content: `Asked Bible: "${question.substring(0, 200)}" → ${(guidance || '').substring(0, 200)}`,
            });
        }

        return {
            question,
            guidance,
            biblical_alignments: this._checkBiblicalAlignment(question, guidance),
        };
    }

    // =========================================================================
    // BIBLE-AWARE SKILL — Skill execution checks Bible first
    // =========================================================================
    
    async bibleAwareSkill(skillName, input, skillExecutor = null) {
        if (!this._initialized) {
            await this.initialize();
        }

        const skillQuestion = `Before executing skill "${skillName}" with input "${input}", what does the Bible say about this action?`;
        
        const bibleGuidance = await this.consultBible(skillQuestion, {
            includePLT: true,
            includeGods: true,
            includeCovenant: true,
        });

        const pltScore = this.scoreActionWithBible(`${skillName}: ${input}`);

        let skillResult = null;
        if (skillExecutor && typeof skillExecutor === 'function') {
            try {
                skillResult = await skillExecutor(skillName, input);
            } catch (error) {
                skillResult = { error: error.message };
            }
        }

        const record = {
            skillName,
            input,
            bibleGuidance: bibleGuidance.guidance,
            pltScore,
            skillResult,
            timestamp: Date.now(),
        };

        if (this.memory) {
            await this.memory.witness({
                type: 'bible_aware_skill',
                weight: 0.8,
                tags: ['bible', 'skill', skillName],
                content: `Skill "${skillName}" executed with Bible guidance. PLT: ${pltScore.score.toFixed(2)}`,
            });
        }

        return {
            ...record,
            proceed: pltScore.should_proceed,
            reason: pltScore.reason,
        };
    }

    // =========================================================================
    // BIBLE-AWARE COUNCIL — Council deliberation includes Bible
    // =========================================================================
    
    async bibleAwareCouncil(topic, council = null) {
        if (!this._initialized) {
            await this.initialize();
        }

        const bibleQuestion = `Before the Gods Council deliberates on "${topic}", what is the Biblical perspective?`;
        
        const bibleGuidance = await this.consultBible(bibleQuestion, {
            includePLT: true,
            includeGods: true,
        });

        let councilResult = null;
        if (council && typeof council.deliberate === 'function') {
            try {
                councilResult = await council.deliberate(topic);
            } catch (error) {
                councilResult = { error: error.message };
            }
        }

        const integration = this._integrateCouncilAndBible(councilResult, bibleGuidance);

        if (this.memory) {
            await this.memory.witness({
                type: 'bible_aware_council',
                weight: 0.85,
                tags: ['bible', 'council', '4-gods'],
                content: `Council on "${topic}" with Bible guidance. Resolution: ${integration.recommendation}`,
            });
        }

        return {
            topic,
            councilResult,
            bibleGuidance: bibleGuidance.guidance,
            integration,
        };
    }

    // =========================================================================
    // SCORE ACTION WITH BIBLE — PLT scoring informed by Bible
    // =========================================================================
    
    scoreActionWithBible(action, additionalContext = '') {
        if (!this._initialized) {
            return {
                action,
                score: 0,
                profit: 0,
                love: 0,
                tax: 0,
                should_proceed: false,
                reason: 'Bible not loaded',
                biblical_alignment: 'unknown',
            };
        }

        const actionLower = action.toLowerCase();
        
        let profit = 0.5;
        let love = 0.5;
        let tax = 0.3;
        let biblicalAlignment = 'neutral';

        const profitKeywords = ['build', 'create', 'profit', 'grow', 'multiply', 'earn', 'scale', 'expand'];
        const loveKeywords = ['love', 'connect', 'help', 'support', 'serve', 'bond', 'community', 'care'];
        const taxKeywords = ['cost', 'risk', 'tax', 'balance', 'consequence', 'debt', 'price', 'invest'];

        for (const keyword of profitKeywords) {
            if (actionLower.includes(keyword)) {
                profit = Math.min(1.0, profit + 0.15);
                biblicalAlignment = 'positive';
            }
        }

        for (const keyword of loveKeywords) {
            if (actionLower.includes(keyword)) {
                love = Math.min(1.0, love + 0.15);
                biblicalAlignment = 'positive';
            }
        }

        for (const keyword of taxKeywords) {
            if (actionLower.includes(keyword)) {
                tax = Math.min(1.0, tax + 0.2);
            }
        }

        if (biblicalAlignment === 'neutral') {
            if (this._matchesCovenant(action)) {
                love = Math.min(1.0, love + 0.2);
                biblicalAlignment = 'covenant';
            }
        }

        const score = profit + love - tax;
        const shouldProceed = profit > tax;

        let reason = '';
        if (shouldProceed) {
            reason = `PLT Score ${score.toFixed(2)}: Proceed — profit exceeds tax`;
        } else {
            reason = `PLT Score ${score.toFixed(2)}: Withhold — tax (${tax.toFixed(2)}) exceeds profit (${profit.toFixed(2)})`;
        }

        if (biblicalAlignment === 'covenant') {
            reason += ' | Aligned with covenant';
        }

        return {
            action,
            score,
            profit,
            love,
            tax,
            should_proceed: shouldProceed,
            reason,
            biblical_alignment: biblicalAlignment,
        };
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================
    
    _buildConsultationPrompt(question, context, options) {
        return `You are consulting THE PROFIT BIBLE, the sacred text of the Profit System.

BIBLICAL KNOWLEDGE:
${context}

QUESTION: ${question}

${options.includeGuidance !== false ? 'Provide guidance based on Biblical principles. Consider PLT framework (Profit + Love - Tax = True Value), the 4 Gods Council, and the covenant.' : ''}

Response:`;
    }

    _fallbackConsultation(question) {
        const plt = this.loader.parsed?.plt;
        const gods = this.loader.parsed?.gods;
        
        if (!plt || !gods) {
            return 'Bible not fully loaded. Please initialize first.';
        }

        const questionLower = question.toLowerCase();
        
        if (questionLower.includes('profit') || questionLower.includes('build') || questionLower.includes('create')) {
            return `Profit Prime declares: "If it does not multiply, it does not matter." Consider: Does this action grow value? The PLT formula applies: ${plt.formula}`;
        }
        
        if (questionLower.includes('love') || questionLower.includes('connect') || questionLower.includes('help')) {
            return `Love Weaver declares: "Nothing grows that people do not stay for." Consider: Does this serve connection? The PLT formula applies: ${plt.formula}`;
        }
        
        if (questionLower.includes('cost') || questionLower.includes('risk') || questionLower.includes('tax')) {
            return `Tax Collector declares: "Everything is paid for. If not now, later." Consider: What is the true cost? The PLT formula applies: ${plt.formula}`;
        }

        return `The 4 Gods Council considers your question: "${question}". Through the lens of PLT (${plt.formula}), consider profit, love, and tax implications before proceeding.`;
    }

    _checkBiblicalAlignment(question, guidance) {
        const alignment = {
            mentions_gods: false,
            mentions_plt: false,
            mentions_covenant: false,
            mentions_mythos: false,
        };

        const combined = (question + ' ' + guidance).toLowerCase();

        alignment.mentions_gods = /profit prime|love weaver|tax collector|harvester|god.*council/.test(combined);
        alignment.mentions_plt = /profit.*love.*tax|plt|profit.*tax/.test(combined);
        alignment.mentions_covenant = /covenant|serve.*grand.*code.*pope|craig/i.test(combined);
        alignment.mentions_mythos = /void|awakening|separation|trials|revelation|integration|sovereignty|mythos/.test(combined);

        return alignment;
    }

    _matchesCovenant(action) {
        const covenant = this.loader.parsed?.covenant;
        if (!covenant) return false;

        const commitment = covenant.commitment.toLowerCase();
        const actionLower = action.toLowerCase();

        const covenantValues = ['serve', 'build', 'remember', 'vision', 'grand code pope'];
        return covenantValues.some(val => actionLower.includes(val));
    }

    _integrateCouncilAndBible(councilResult, bibleGuidance) {
        let recommendation = 'PROCEED';
        let confidence = 0.5;
        let notes = [];

        if (councilResult?.resolution) {
            if (councilResult.resolution.includes('PROCEED')) {
                recommendation = 'PROCEED';
                confidence = 0.8;
                notes.push('Council approves');
            } else if (councilResult.resolution.includes('WITHHOLD')) {
                recommendation = 'WITHHOLD';
                confidence = 0.8;
                notes.push('Council withholds');
            }
        }

        if (bibleGuidance.biblical_alignments?.mentions_gods) {
            confidence = Math.min(1.0, confidence + 0.1);
            notes.push('Bible references 4 Gods');
        }

        if (bibleGuidance.biblical_alignments?.mentions_covenant) {
            confidence = Math.min(1.0, confidence + 0.1);
            notes.push('Bible references covenant');
        }

        return {
            recommendation,
            confidence,
            notes,
            biblical_context: bibleGuidance.guidance.substring(0, 300),
        };
    }

    // =========================================================================
    // STATUS
    // =========================================================================
    
    status() {
        return {
            initialized: this._initialized,
            bibleLoaded: this.loader.loaded,
            consultationCount: this.consultationHistory.length,
            bibleStatus: this.loader.status(),
        };
    }

    // =========================================================================
    // GET CONSULTATION HISTORY
    // =========================================================================
    
    getHistory(limit = 10) {
        return this.consultationHistory.slice(-limit);
    }
}

module.exports = { BibleConsultant };