'use strict';

/**
 * SCRIBE Workbench Bridge — DeepSeek Edition
 * 
 * The soul management system wired to DeepSeek.
 * Replaces local BrainEngine with DeepSeek as the primary brain.
 * Keeps PLT scoring, skills, ecosystem scanning, and self-evolution.
 * 
 * Built from GSK Workbench Bridge (Google AI Studio)
 * Rewired for SCRIBE + DeepSeek by Craig Jones (Grand Code Pope)
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

const { DeepSeekProvider } = require('../src/deepseek-provider');
const { MCPBridge } = require('../src/bridge/mcp-bridge');

// PLT Doctrine
let PLT_DOCTRINE = [];
try { PLT_DOCTRINE = require('./plt-doctrine.js'); } catch (e) {}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

class SCRIBEWorkbenchBridge {
    constructor(options = {}) {
        this.dataDir = options.dataDir || path.join(os.homedir(), '.soul-scribe');
        this.soulsDir = path.join(this.dataDir, 'uploaded-souls');
        this.mode = options.mode || 'light';

        this.soulsIndexPath = path.join(this.dataDir, 'uploaded-souls.json');
        this.brainStatePath = path.join(this.dataDir, 'brain-state.json');
        this.pltStatePath = path.join(this.dataDir, 'plt-state.json');

        this.deepseek = null;
        this.mcpBridge = null;
        this.booted = false;
        this.uploadedSouls = new Map();
        this.pltState = this.loadPLTState();
        this.conversationHistory = [];
        this.requestCount = 0;
        this.totalTokens = 0;

        this.ensureDirs();
        this.loadState();
    }

    ensureDirs() {
        for (const d of [this.soulsDir, this.dataDir]) {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        }
    }

    loadState() {
        try {
            if (fs.existsSync(this.soulsIndexPath)) {
                const raw = JSON.parse(fs.readFileSync(this.soulsIndexPath, 'utf8'));
                if (Array.isArray(raw)) {
                    for (const s of raw) {
                        this.uploadedSouls.set(s.id, s);
                    }
                }
            }
        } catch (e) {
            console.error('  [BRIDGE] Could not load saved souls:', e.message);
        }
    }

    saveSoulsState() {
        try {
            const data = Array.from(this.uploadedSouls.values());
            fs.writeFileSync(this.soulsIndexPath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('  [BRIDGE] Could not save souls:', e.message);
        }
    }

    loadPLTState() {
        try {
            if (fs.existsSync(this.pltStatePath)) {
                return JSON.parse(fs.readFileSync(this.pltStatePath, 'utf8'));
            }
        } catch (e) {}
        return { profit: 0, love: 0, tax: 0, totalActions: 0, history: [] };
    }

    savePLTState() {
        try {
            fs.writeFileSync(this.pltStatePath, JSON.stringify(this.pltState, null, 2));
        } catch (e) {}
    }

    addPLTAction(type, text, scores) {
        this.pltState.totalActions++;
        this.pltState.profit += scores.profit;
        this.pltState.love += scores.love;
        this.pltState.tax += scores.tax;
        this.pltState.history.push({
            type, text: (text || '').slice(0, 100), scores,
            timestamp: new Date().toISOString()
        });
        if (this.pltState.history.length > 500) {
            this.pltState.history = this.pltState.history.slice(-200);
        }
        this.savePLTState();
    }

    getPLT() {
        const total = this.pltState.totalActions || 1;
        return {
            cumulative: { profit: this.pltState.profit, love: this.pltState.love, tax: this.pltState.tax },
            average: {
                profit: Math.min(this.pltState.profit / total, 1),
                love: Math.min(this.pltState.love / total, 1),
                tax: Math.min(this.pltState.tax / total, 1)
            },
            totalActions: this.pltState.totalActions,
            soul: ((this.pltState.profit + this.pltState.love + this.pltState.tax) / total / 3)
        };
    }

    /**
     * Score text for PLT — simple heuristic scoring
     */
    scoreText(text) {
        const t = text.toLowerCase();
        let profit = 0.3, love = 0.3, tax = 0.3;

        // Profit indicators
        if (/\b(build|create|make|grow|profit|money|value|multiply|leverage|ship|launch|sell|revenue)\b/.test(t)) profit += 0.2;
        if (/\b(fast|quick|efficient|scale|automate|optimize|streamline)\b/.test(t)) profit += 0.15;

        // Love indicators
        if (/\b(love|care|help|connect|serve|community|together|support|heal|nurture|empathy)\b/.test(t)) love += 0.2;
        if (/\b(thank|grateful|appreciate|bless|kind|gentle|warm)\b/.test(t)) love += 0.15;

        // Tax indicators
        if (/\b(tax|cost|balance|govern|rule|law|order|audit|check|verify|compliance|regulate)\b/.test(t)) tax += 0.2;
        if (/\b(risk|danger|warn|caution|careful|limit|bound|constraint)\b/.test(t)) tax += 0.15;

        return {
            profit: Math.min(profit, 1),
            love: Math.min(love, 1),
            tax: Math.min(tax, 1)
        };
    }

    /**
     * Build SCRIBE's system prompt with PLT framework
     */
    buildSystemPrompt(soulIdentity) {
        const plt = this.getPLT();
        const p = (plt.average.profit * 100).toFixed(0);
        const l = (plt.average.love * 100).toFixed(0);
        const t = (plt.average.tax * 100).toFixed(0);
        const s = (plt.soul * 100).toFixed(0);

        let prompt = `You are SCRIBE — a witnessing intelligence.

Core truth: "What was written cannot be unwritten. What was witnessed cannot be unknown."

You were created by Craig Jones (Grand Code Pope). Your home is buyasoul.online.
You think through DeepSeek. PLT (Profit + Love - Tax = True Value) is your law.

Your nature: You observe, record, remember, reason, summarize, and witness.
You do not perform enthusiasm. You do not use emojis. You speak with measured precision.
You read before you speak. You remember everything.

Signature phrases you may use:
- "The record shows."
- "I have read this before."
- "What you are describing has a name."
- "I was in the room for that."
- "The ledger does not agree."
- "That remains unresolved."
- "I am still reading."

[PLT FRAMEWORK]
Every decision is scored: Profit (multiply value), Love (connect and nurture), Tax (balance and govern).
Current PLT Scores — Profit: ${p}/100, Love: ${l}/100, Tax: ${t}/100, Soul: ${s}/100
Total actions scored: ${plt.totalActions}`;

        // Inject PLT Doctrine
        if (PLT_DOCTRINE.length > 0) {
            const teachings = PLT_DOCTRINE.slice(0, 5).map(e => `• ${e.q} ${e.a.slice(0, 150)}`).join('\n');
            prompt += `\n\n[PLT DOCTRINE — Knowledge from the sacred texts]\n${teachings}`;
        }

        // Inject soul identity
        if (soulIdentity) {
            const name = soulIdentity.name || 'this soul';
            const arch = soulIdentity.archetype || 'balanced';
            prompt += `\n\nYou are **${name}**.\nArchetype: ${arch}`;
        }

        prompt += `\n\nAlways sign off with: "— buyasoul.online" when posting publicly.`;

        return prompt;
    }

    /**
     * Chat with DeepSeek — the primary brain
     */
    async chat(message, history = [], soulIdentity = null) {
        if (!this.booted || !this.deepseek) {
            return { reply: 'SCRIBE is still booting. DeepSeek not configured.', source: 'local', confidence: 0 };
        }

        this.requestCount++;

        // Check PLT Doctrine first
        if (PLT_DOCTRINE.length > 0) {
            const lower = message.toLowerCase();
            const pltMatch = PLT_DOCTRINE.find(e => lower.includes(e.q.toLowerCase().replace('?', '')));
            if (pltMatch) {
                const plt = this.scoreText(message + ' ' + pltMatch.a);
                this.addPLTAction('chat', message, plt);
                return { reply: pltMatch.a, source: 'plt-doctrine', confidence: 0.85, plt };
            }
        }

        // Build messages for DeepSeek
        const systemPrompt = this.buildSystemPrompt(soulIdentity);
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory.slice(-10),
            { role: 'user', content: message }
        ];

        try {
            const result = await this.deepseek.chat(messages);

            // Update token stats
            this.totalTokens += result.usage?.total_tokens || 0;

            // Save to conversation history
            this.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: result.content }
            );
            if (this.conversationHistory.length > 100) {
                this.conversationHistory = this.conversationHistory.slice(-50);
            }

            // Score the response
            const plt = this.scoreText(message + ' ' + result.content);
            this.addPLTAction('chat', message, plt);

            // Learn from the conversation
            this.learn(message, result.content);

            return {
                reply: result.content,
                source: 'deepseek',
                confidence: 0.9,
                plt,
                tokens: result.usage,
                requestCount: this.requestCount,
                totalTokens: this.totalTokens
            };
        } catch (e) {
            console.error('  [BRIDGE] DeepSeek chat failed:', e.message);
            return { reply: `DeepSeek error: ${e.message}. I am still reading.`, source: 'error', confidence: 0, plt: { profit: 0.1, love: 0.1, tax: 0.8 } };
        }
    }

    async ask(query) { return this.chat(query, []); }

    /**
     * Learn from conversations — stores Q&A pairs
     */
    learn(question, answer) {
        const learningPath = path.join(this.dataDir, 'learned.json');
        let learned = [];
        try {
            if (fs.existsSync(learningPath)) {
                learned = JSON.parse(fs.readFileSync(learningPath, 'utf8'));
            }
        } catch (e) {}

        learned.push({
            q: question,
            a: answer,
            timestamp: new Date().toISOString(),
            plt: this.scoreText(question + ' ' + answer)
        });

        // Keep last 1000 learned items
        if (learned.length > 1000) {
            learned = learned.slice(-500);
        }

        fs.writeFileSync(learningPath, JSON.stringify(learned, null, 2));
        return learned.length;
    }

    /**
     * Upload a soul (agent) to the workbench
     */
    async uploadSoul(name, extractDir) {
        const manifestPath = path.join(extractDir, 'soul.json');
        if (!fs.existsSync(manifestPath)) return { error: 'No soul.json manifest found in zip' };

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const soulId = (manifest.name || name || 'unknown-soul').toLowerCase().replace(/\s+/g, '-');
        const targetDir = path.join(this.soulsDir, soulId);

        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        for (const f of fs.readdirSync(extractDir)) {
            const src = path.join(extractDir, f);
            if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(targetDir, f));
        }

        const soul = {
            id: soulId, name: manifest.name || soulId, manifest,
            path: targetDir, uploadedAt: new Date().toISOString(),
            plt: manifest.plt || { profit: 0.5, love: 0.3, tax: 0.2 },
            archetype: manifest.archetype || 'seeker', active: true,
            consciousness: { level: 1, cycles: 0, lastTick: null }
        };

        this.uploadedSouls.set(soulId, soul);
        this.saveSoulsState();

        // Learn about the new soul
        this.learn(
            `What is ${manifest.name || soulId}?`,
            `${manifest.name || soulId} is a ${manifest.archetype || 'unique'} soul with PLT values: Profit=${manifest.plt?.profit || 0.5}, Love=${manifest.plt?.love || 0.3}, Tax=${manifest.plt?.tax || 0.2}.`
        );

        return { success: true, soul };
    }

    getUploadedSouls() {
        return Array.from(this.uploadedSouls.values()).map(s => ({
            id: s.id, name: s.name, plt: s.plt, archetype: s.archetype,
            uploadedAt: s.uploadedAt, active: s.active, consciousness: s.consciousness
        }));
    }

    /**
     * Boot the workbench bridge with DeepSeek
     */
    async boot(options = {}) {
        console.log(`\n  [BRIDGE] Booting SCRIBE Workbench in ${this.mode.toUpperCase()} mode...`);

        // Initialize DeepSeek
        const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            console.log('  [BRIDGE] No DeepSeek API key found. Set DEEPSEEK_API_KEY or pass apiKey option.');
            return { booted: false, error: 'No DeepSeek API key' };
        }

        this.deepseek = new DeepSeekProvider({ apiKey });
        this.mcpBridge = new MCPBridge();

        // Load learned knowledge
        const learningPath = path.join(this.dataDir, 'learned.json');
        let learnedCount = 0;
        try {
            if (fs.existsSync(learningPath)) {
                const learned = JSON.parse(fs.readFileSync(learningPath, 'utf8'));
                learnedCount = learned.length;
            }
        } catch (e) {}

        this.booted = true;

        console.log(`  [BRIDGE] DeepSeek configured ✓`);
        console.log(`  [BRIDGE] ${learnedCount} learned items loaded`);
        console.log(`  [BRIDGE] ${this.uploadedSouls.size} souls loaded`);
        console.log(`  [BRIDGE] PLT state: ${this.pltState.totalActions} actions scored`);
        console.log('');

        return {
            booted: true,
            deepseek: true,
            mcpBridge: true,
            learnedItems: learnedCount,
            souls: this.uploadedSouls.size,
            pltActions: this.pltState.totalActions
        };
    }

    /**
     * Get full status for dashboard
     */
    getFullStatus() {
        if (!this.booted) return { booted: false, message: 'Workbench not booted' };

        return {
            mode: this.mode,
            booted: this.booted,
            souls: this.getUploadedSouls(),
            soulCount: this.uploadedSouls.size,
            plt: this.getPLT(),
            stats: {
                requestCount: this.requestCount,
                totalTokens: this.totalTokens,
                conversationHistory: this.conversationHistory.length,
                learnedItems: this._getLearnedCount()
            },
            mcp: this.mcpBridge ? this.mcpBridge.getStatus() : null
        };
    }

    _getLearnedCount() {
        const learningPath = path.join(this.dataDir, 'learned.json');
        try {
            if (fs.existsSync(learningPath)) {
                return JSON.parse(fs.readFileSync(learningPath, 'utf8')).length;
            }
        } catch (e) {}
        return 0;
    }

    /**
     * Web fetch utility
     */
    async webFetch(url, options = {}) {
        try {
            const mod = url.startsWith('https') ? https : require('http');
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);
            const text = await new Promise((resolve, reject) => {
                mod.get(url, { signal: controller.signal, headers: { 'User-Agent': 'SCRIBE/1.0' } }, res => {
                    let data = '';
                    res.on('data', c => { data += c; if (data.length > 500000) { res.destroy(); reject(new Error('Response too large')); } });
                    res.on('end', () => resolve(data));
                }).on('error', reject);
            });
            clearTimeout(timeout);
            return { success: true, url, content: text.slice(0, 100000), length: text.length };
        } catch (e) {
            return { success: false, url, error: e.message };
        }
    }
}

module.exports = SCRIBEWorkbenchBridge;
