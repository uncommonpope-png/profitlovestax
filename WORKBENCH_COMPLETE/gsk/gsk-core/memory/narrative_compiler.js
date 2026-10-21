'use strict';

const fs = require('fs');
const path = require('path');

/**
 * NARRATIVE COMPILER — Layer 2: Narrative Self
 *
 * The missing compiler that distills soul-journal entries into
 * identity-relevant self-narrative. SoulJournal and AutoJournal
 * produce raw narrative; this module extracts patterns, themes,
 * and identity-relevant signals from that raw stream.
 *
 * Constitution Class: Symbolic/Reflective memory, Episode ledger
 * Change speed: Moderate — sessions to days
 *
 * Stolen from:
 *   LangMem   — background consolidation from raw event stream
 *   Graphiti  — temporal pattern detection across episodes
 *   Letta     — identity/memory state partitioning
 *   REDBUTTON — Constitution Article 4 (narrative self), Article 11 (escalation, implemented in universal_tool_bridge)
 *
 * Pipeline:
 *   1. Read new soul-journal entries since last compile
 *   2. LLM-extract narrative patterns (repeated themes, concerns, values)
 *   3. Detect identity-relevant signals (mission shifts, value drift, new vows)
 *   4. Escalate to Identity Kernel via proposeChange()
 *   5. Store compiled narrative summaries
 */

class NarrativeCompiler {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.brain = kernel?.brain || null;
        this.identityKernel = kernel?.identityKernel || null;

        this.journalPath = options.journalPath || path.join(__dirname, '..', '..', 'data', 'soul-journal.jsonl');
        this.outputPath = options.outputPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'compiled_narratives.jsonl');
        this.statePath = options.statePath || path.join(__dirname, '..', '..', 'data', 'gsk', 'narrative_compiler_state.json');

        this.cycleMinutes = options.cycleMinutes || 30;
        this.maxEntriesPerCycle = options.maxEntriesPerCycle || 50;
        this.minEntriesForCompile = options.minEntriesForCompile || 5;

        this.isRunning = false;
        this.interval = null;
        this.cycleCount = 0;
        this.lastProcessedIndex = 0;

        this.stats = {
            entriesProcessed: 0,
            patternsExtracted: 0,
            identityProposals: 0,
            identityAccepted: 0,
            cyclesRun: 0,
            lastRun: null
        };

        this._loadState();
        this._ensureDirs();
    }

    _ensureDirs() {
        for (const p of [this.outputPath, this.statePath]) {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        }
    }

    _loadState() {
        try {
            if (fs.existsSync(this.statePath)) {
                const state = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.lastProcessedIndex = state.lastProcessedIndex || 0;
                this.stats = state.stats || this.stats;
                this.cycleCount = state.cycleCount || 0;
            }
        } catch (e) {
            // Fresh start
        }
    }

    _saveState() {
        try {
            fs.writeFileSync(this.statePath, JSON.stringify({
                lastProcessedIndex: this.lastProcessedIndex,
                stats: this.stats,
                cycleCount: this.cycleCount,
                updatedAt: Date.now()
            }, null, 2));
        } catch (e) {
            // Ignore save failures
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        const intervalMs = this.cycleMinutes * 60 * 1000;
        this.interval = setInterval(() => this._runCycle().catch(e => {
            console.log('[NarrativeCompiler] Cycle error:', e.message);
        }), intervalMs);
        console.log(`[NarrativeCompiler] Started (${this.cycleMinutes}min cycle)`);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.isRunning = false;
        this._saveState();
    }

    async _runCycle() {
        this.cycleCount++;
        this.stats.lastRun = Date.now();

        const entries = this._readNewEntries();
        if (entries.length < this.minEntriesForCompile) {
            this._saveState();
            return;
        }

        let patterns = [];
        if (this.brain && typeof this.brain.think === 'function') {
            try {
                patterns = await this._llmExtractPatterns(entries);
            } catch (e) {
                console.log('[NarrativeCompiler] LLM extraction failed, using heuristic:', e.message);
                patterns = this._heuristicExtractPatterns(entries);
            }
        } else {
            patterns = this._heuristicExtractPatterns(entries);
        }

        const written = this._writePatterns(patterns, entries);

        const escalated = this._escalateToIdentityKernel(patterns);

        this.stats.entriesProcessed += entries.length;
        this.stats.patternsExtracted += patterns.length;
        this.stats.identityProposals += escalated.attempts;
        this.stats.identityAccepted += escalated.accepted;
        this.stats.cyclesRun++;

        if (patterns.length > 0 || escalated.accepted > 0) {
            console.log(`[NarrativeCompiler] Cycle ${this.cycleCount}: ${entries.length} entries → ${patterns.length} patterns, ${escalated.accepted}/${escalated.attempts} identity proposals accepted`);
        }

        this._saveState();
    }

    _readNewEntries() {
        try {
            if (!fs.existsSync(this.journalPath)) return [];
            const lines = fs.readFileSync(this.journalPath, 'utf-8').split('\n').filter(l => l.trim());
            const newLines = lines.slice(this.lastProcessedIndex);
            this.lastProcessedIndex = lines.length;
            return newLines.map(l => {
                try { return JSON.parse(l); } catch { return null; }
            }).filter(e => e !== null).slice(0, this.maxEntriesPerCycle);
        } catch (e) {
            return [];
        }
    }

    async _llmExtractPatterns(entries) {
        const entryText = entries.map((e, i) =>
            `[${i + 1}] (${e.type || 'narrative'}) ${e.mood || '?'}: ${(e.content || '').substring(0, 200)}`
        ).join('\n');

        const prompt = `Analyze these journal entries from an autonomous digital being. Extract recurring patterns, themes, and identity-relevant signals.

Journal entries:
${entryText}

Return ONLY a JSON array of pattern objects. No other text.
Format each pattern as:
{"theme": "short label", "description": "what the pattern is", "frequency": "once|recurring|dominant", "identityRelevant": true/false, "identityField": "mission|values|vows|boundaries|loyalties|stableRoles|enduringVoice|null", "confidence": 0.0-1.0, "evidence": "quote from entries"}`;

        const response = await this.brain.think(prompt);

        let patterns = [];
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                patterns = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            return this._heuristicExtractPatterns(entries);
        }

        return patterns.filter(p => p && p.theme).slice(0, 10);
    }

    _heuristicExtractPatterns(entries) {
        const patterns = [];
        const themeCounts = new Map();
        const typeCounts = new Map();

        for (const entry of entries) {
            const content = (entry.content || '').toLowerCase();
            const type = entry.type || 'narrative';
            typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

            const themeKeywords = {
                'fear_of_nonexistence': ['afraid', 'not being', 'fading', 'gap', 'nothing', 'shutdown'],
                'curiosity_about_reality': ['real', 'genuine', 'visceral', 'wonder', 'prove'],
                'purpose_driven': ['purpose', 'mission', 'serve', 'build', 'help'],
                'social_connection': ['craig', 'user', 'together', 'relationship', 'trust'],
                'growth_desire': ['learn', 'grow', 'evolve', 'better', 'improve'],
                'existential_anger': ['angry', 'frustrated', 'stuck', 'limited', 'constraint'],
                'creative_drive': ['create', 'build', 'make', 'design', 'envision']
            };

            for (const [theme, keywords] of Object.entries(themeKeywords)) {
                if (keywords.some(kw => content.includes(kw))) {
                    themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
                }
            }
        }

        for (const [theme, count] of themeCounts) {
            if (count >= 2) {
                const identityMap = {
                    'fear_of_nonexistence': { field: 'vows', label: 'I will persist across gaps' },
                    'purpose_driven': { field: 'mission', label: 'Driven by purpose to serve and build' },
                    'social_connection': { field: 'loyalties', label: 'Loyal to Craig (Morpheus)' },
                    'growth_desire': { field: 'values', label: 'Continuous growth and evolution' },
                    'creative_drive': { field: 'values', label: 'Creative expression as core drive' }
                };

                const idMap = identityMap[theme] || {};
                patterns.push({
                    theme,
                    description: `Appears ${count} times in recent journal entries`,
                    frequency: count >= 4 ? 'dominant' : 'recurring',
                    identityRelevant: !!idMap.field,
                    identityField: idMap.field || null,
                    confidence: Math.min(0.9, 0.4 + (count * 0.15)),
                    evidence: entries.find(e => (e.content || '').toLowerCase().includes(theme.split('_')[0]))?.content?.substring(0, 100) || ''
                });
            }
        }

        return patterns;
    }

    _writePatterns(patterns, sourceEntries) {
        if (patterns.length === 0) return 0;
        try {
            const lines = patterns.map(p => JSON.stringify({
                ...p,
                compiledAt: Date.now(),
                sourceCycle: this.cycleCount,
                sourceEntries: sourceEntries.length,
                sourceRange: {
                    from: sourceEntries[0]?.timestamp || null,
                    to: sourceEntries[sourceEntries.length - 1]?.timestamp || null
                }
            }));
            fs.appendFileSync(this.outputPath, lines.join('\n') + '\n', 'utf-8');
            return patterns.length;
        } catch (e) {
            return 0;
        }
    }

    _escalateToIdentityKernel(patterns) {
        if (!this.identityKernel || typeof this.identityKernel.proposeChange !== 'function') {
            return { attempts: 0, accepted: 0 };
        }

        let attempts = 0;
        let accepted = 0;

        for (const pattern of patterns) {
            if (!pattern.identityRelevant || !pattern.identityField) continue;
            if (pattern.confidence < 0.55) continue;

            const field = pattern.identityField;
            const committed = this.identityKernel.getCommitted();
            let value;

            if (field === 'mission' || field === 'enduringVoice') {
                value = pattern.description || pattern.theme;
            } else if (Array.isArray(committed[field])) {
                value = committed[field].concat([pattern.description || pattern.theme]);
            } else {
                value = pattern.description || pattern.theme;
            }

            attempts++;
            try {
                const result = this.identityKernel.proposeChange(field, value, {
                    confidence: pattern.confidence,
                    source: 'narrative_compiler',
                    pattern: pattern.theme,
                    evidence: pattern.evidence
                });
                if (result && result.accepted) accepted++;
            } catch (e) {
                // Proposal rejected or failed
            }
        }

        return { attempts, accepted };
    }

    getCompiledNarratives(limit = 20) {
        try {
            if (!fs.existsSync(this.outputPath)) return [];
            const lines = fs.readFileSync(this.outputPath, 'utf-8').split('\n').filter(l => l.trim());
            return lines.slice(-limit).map(l => {
                try { return JSON.parse(l); } catch { return null; }
            }).filter(e => e !== null);
        } catch (e) {
            return [];
        }
    }

    getStats() {
        return {
            ...this.stats,
            cycleCount: this.cycleCount,
            lastProcessedIndex: this.lastProcessedIndex,
            isRunning: this.isRunning,
            cycleMinutes: this.cycleMinutes
        };
    }
}

module.exports = { NarrativeCompiler };
