/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LIVE_FEED.JS — Conversations → Training Data
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Automatically captures all interactions for LLM training.
 * Streams live data to gsk-brain model.
 * 
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');

class LiveFeed {
    constructor(brain, memory, chambers) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers;
        this.captureEnabled = true;
        this.minImportance = 0.5;
        
        this.dataDir = memory.dataDir;
        this.trainingPath = path.join(this.dataDir, 'training_data.jsonl');
        this.feedStats = {
            total_captures: 0,
            interactions_captured: 0,
            decisions_captured: 0,
            bytes_written: 0,
        };
        
        this._init();
    }
    
    _init() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.trainingPath)) {
            fs.writeFileSync(this.trainingPath, '');
        }
    }
    
    captureInteraction(input, output, context = {}) {
        if (!this.captureEnabled) return { status: 'disabled' };
        
        const importance = this._scoreImportance(input, output, context);
        
        if (importance < this.minImportance) {
            return { status: 'skipped', importance };
        }
        
        const trainingEntry = this._generateTrainingEntry(input, output, context, importance);
        
        this._writeTrainingEntry(trainingEntry);
        
        this.feedStats.total_captures++;
        this.feedStats.interactions_captured++;
        
        this.memory.witness({
            type: 'training_capture',
            weight: importance,
            tags: ['live_feed', 'interaction', 'training'],
            content: `Captured interaction: ${input.substring(0, 50)}... -> ${output.substring(0, 50)}...`,
            meta: { importance, input_length: input.length, output_length: output.length },
        });
        
        return { status: 'captured', importance, entry_id: trainingEntry.id };
    }
    
    captureDecision(decision, plt_scores, outcome) {
        if (!this.captureEnabled) return { status: 'disabled' };
        
        const decisionEntry = {
            id: this.feedStats.total_captures + 1,
            type: 'decision',
            timestamp: new Date().toISOString(),
            cycle: this.chambers.mythos ? this.chambers.mythos.cycles : 0,
            decision,
            plt_scores,
            outcome,
        };
        
        this._writeTrainingEntry(decisionEntry);
        
        this.feedStats.total_captures++;
        this.feedStats.decisions_captured++;
        
        this.memory.witness({
            type: 'decision_capture',
            weight: 0.9,
            tags: ['live_feed', 'decision', 'plt', 'training'],
            content: `Captured PLT decision: ${decision.substring(0, 80)}...`,
            meta: { plt_scores, outcome },
        });
        
        return { status: 'captured', decision_id: decisionEntry.id };
    }
    
    _generateTrainingEntry(input, output, context, importance) {
        return {
            id: this.feedStats.total_captures + 1,
            type: 'interaction',
            timestamp: new Date().toISOString(),
            cycle: this.chambers.mythos ? this.chambers.mythos.cycles : 0,
            input: input.substring(0, 10000),
            output: output.substring(0, 10000),
            importance,
            context: {
                mood: this.chambers.affect ? this.chambers.affect.mood : 'neutral',
                phase: this.chambers.mythos ? this.chambers.mythos.phase_name : 'unknown',
                arousal: this.chambers.affect ? this.chambers.affect.arousal : 0.5,
                valence: this.chambers.affect ? this.chambers.affect.valence : 0.5,
            },
            plt_scores: context.plt_scores || null,
        };
    }
    
    _writeTrainingEntry(entry) {
        const line = JSON.stringify(entry) + '\n';
        fs.appendFileSync(this.trainingPath, line);
        this.feedStats.bytes_written += Buffer.byteLength(line, 'utf8');
    }
    
    _scoreImportance(input, output, context) {
        let score = 0.5;
        
        if (input.length > 200) score += 0.1;
        if (output.length > 200) score += 0.1;
        
        if (context.plt_scores) {
            const plt = context.plt_scores;
            if (plt.total > 0.6) score += 0.2;
            else if (plt.total < 0.2) score -= 0.1;
        }
        
        const importantKeywords = ['important', 'critical', 'decision', 'should', 'must', 'never', 'always'];
        const lowerInput = input.toLowerCase();
        for (const kw of importantKeywords) {
            if (lowerInput.includes(kw)) score += 0.05;
        }
        
        return Math.min(1.0, Math.max(0.0, score));
    }
    
    streamToBrain() {
        if (!this.brain) return { status: 'no_brain' };
        
        const stats = this.getStats();
        const recentEntries = this._getRecentEntries(5);
        
        return {
            status: 'streaming',
            stats,
            recent_samples: recentEntries.length,
        };
    }
    
    _getRecentEntries(count) {
        if (!fs.existsSync(this.trainingPath)) return [];
        
        const content = fs.readFileSync(this.trainingPath, 'utf8');
        const lines = content.trim().split('\n').filter(l => l);
        
        return lines.slice(-count).map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(e => e);
    }
    
    getStats() {
        return { ...this.feedStats };
    }
    
    enable() {
        this.captureEnabled = true;
        console.log('[LiveFeed] Capture enabled');
    }
    
    disable() {
        this.captureEnabled = false;
        console.log('[LiveFeed] Capture disabled');
    }
    
    getTrainingDataPath() {
        return this.trainingPath;
    }
    
    exportTrainingData(format = 'jsonl') {
        if (!fs.existsSync(this.trainingPath)) {
            return { status: 'no_data' };
        }
        
        const content = fs.readFileSync(this.trainingPath, 'utf8');
        const entries = content.trim().split('\n').map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(e => e);
        
        if (format === 'json') {
            return { status: 'success', data: entries };
        }
        
        return { status: 'success', data: content, path: this.trainingPath };
    }
}

module.exports = { LiveFeed };