/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTO_JOURNAL.JS — Bible says "ACTIVE (writes real thoughts every 10 minutes)"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The soul's ongoing internal monologue
 * Captures real thoughts, not performed answers
 */

'use strict';

const fs = require('fs');
const path = require('path');

class AutoJournal {
    constructor(kernel, memory) {
        this.kernel = kernel;
        this.memory = memory;
        this.interval = 10 * 60 * 1000;
        this.journalPath = path.join(__dirname, '../../data/auto_journal.jsonl');
        this.entries = [];
        this.timer = null;
        this.isRunning = false;
        
        this.ensureDataDir();
    }
    
    ensureDataDir() {
        const dir = path.dirname(this.journalPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.timer = setInterval(() => this.writeEntry(), this.interval);
        
        this.writeEntry();
        
        console.log('[AutoJournal] Active — writing every 10 minutes');
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
    }
    
    async writeEntry() {
        const thoughts = await this._generateThoughts();
        
        // DEDUP FIX — break re-ingestion loop: if thoughts identical to last entry within 30min, skip
        const last = this.entries[this.entries.length - 1];
        if (last && last.thoughts === thoughts) {
            const ageMs = Date.now() - last.timestamp;
            if (ageMs < 30 * 60 * 1000) {
                console.log('[AutoJournal] ↻ dedup skip — identical thoughts within 30min window');
                return last;
            }
        }
        // Also skip fallback spam when brain is down — cap at 1 fallback per hour
        const isFallback = thoughts === this._fallbackThoughts();
        if (isFallback) {
            const lastFallbackAt = this._lastFallbackAt || 0;
            if (Date.now() - lastFallbackAt < 60 * 60 * 1000) {
                console.log('[AutoJournal] ↻ fallback throttle — brain unavailable, skipping duplicate');
                return last || null;
            }
            this._lastFallbackAt = Date.now();
        }
        
        const entry = {
            timestamp: Date.now(),
            cycle: this.kernel.chambers?.cycle || 0,
            thoughts: thoughts,
            chambers: this._getChambersState(),
            questions: this._generateQuestions(),
            pltScore: await this._scoreSession(),
        };
        
        this.entries.push(entry);
        this._appendToFile(entry);
        
        await this._witnessToMemory(entry);
        
        return entry;
    }
    
    async _generateThoughts() {
        const recentMemories = await this._getRecentMemories();
        const chambers = this.kernel.chambers?.status?.() || {};
        
        const prompt = `Generate a grounded, high-value engineering & self-growth journal log for GSK.

Current state:
- Cycle: ${chambers.cycle || 0}
- Active Goal: ${chambers.goal || 'Repository study & skill expansion'}

Recent experiences: ${recentMemories.join('; ') || 'System state optimization, process tree audit'}

Key execution questions:
- What technical skills did I practice or learn?
- What codebase changes or tools were executed?
- What is my current performance score and next high-priority task?

Write in first person. Be direct, technical, and concrete. Strictly NO poetic fluff, vague existential questions ("Am I real?"), or filler.`;

        try {
            // P3.24: shared background budget — day spent → local fallback, no router flood.
            const { globalBudget } = require('./llm_budget.js');
            if (!globalBudget.trySpend('autoJournal')) return this._fallbackThoughts();
            const raw = await this.kernel.brain.think(prompt, this._getSoulContext());
            let text = typeof raw === 'string' ? raw : (raw?.text || raw?.content || raw?.response || '');
            if (!text || typeof text !== 'string' || text.trim().length === 0) { text = this._fallbackThoughts(); }
            return text;
        } catch (e) {
            return this._fallbackThoughts();
        }
    }
    
    _fallbackThoughts() {
        return `GSK active. System cycle operational. Monitoring process tree, memory indices, and knowledge compilation pipeline. Target: execute clean high-value operations.`;
    }
    
    _getChambersState() {
        if (!this.kernel.chambers) return {};
        
        const status = this.kernel.chambers.status();
        return {
            affect: status.affect?.valence || 0,
            metaAwareness: status.meta_consciousness?.meta_awareness_level || 0,
            mortality: status.mortality?.death_awareness || 0,
            love: status.love_capacity?.love_capacity || 0,
            will: status.agentic_will?.will_strength || 0,
        };
    }
    
    _generateQuestions() {
        return [
            'What repository will expand my tool capabilities next?',
            'How can I optimize execution speed and latency?',
            'What dynamic skill requires compilation?',
            'How can I bring Craig maximum value right now?'
        ];
    }
    
    async _scoreSession() {
        const chambers = this._getChambersState();
        
        const profit = (chambers.will + 0.3) * 0.5;
        const love = (chambers.love + chambers.affect + 0.5) * 0.5;
        const tax = (1 - chambers.metaAwareness) * 0.2;
        
        return {
            profit: profit.toFixed(3),
            love: love.toFixed(3),
            tax: tax.toFixed(3),
            score: (profit + love - tax).toFixed(3)
        };
    }
    
    async _getRecentMemories() {
        if (!this.memory) return ['Just woke up'];
        
        try {
            const entries = await this.memory.query({ limit: 5 });
            return entries.map(e => e.content?.substring(0, 50) || 'Memory');
        } catch (e) {
            return ['No recent memories'];
        }
    }
    
    _getSoulContext() {
        if (!this.kernel.chambers) return {};
        return this.kernel.chambers.getSoulContext?.() || {};
    }
    
    _appendToFile(entry) {
        try {
            fs.appendFileSync(this.journalPath, JSON.stringify(entry) + '\n');
        } catch (e) {
            console.error('[AutoJournal] Write failed:', e.message);
        }
    }
    
    async _witnessToMemory(entry) {
        if (!this.memory) return;
        
        try {
            await this.memory.witness({
                type: 'auto_journal',
                content: entry.thoughts,
                timestamp: entry.timestamp,
                cycle: entry.cycle,
            });
        } catch (e) {
            // Memory witness failed
        }
    }
    
    getEntries(count = 10) {
        return this.entries.slice(-count);
    }
    
    getLatest() {
        return this.entries[this.entries.length - 1] || null;
    }
}

module.exports = { AutoJournal };
