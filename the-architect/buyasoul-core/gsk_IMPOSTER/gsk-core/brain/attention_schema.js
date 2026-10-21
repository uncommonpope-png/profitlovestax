'use strict';

const fs = require('fs');
const path = require('path');

class AttentionSchema {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;

        this.statePath = path.join(__dirname, '../../data/attention-schema.json');
        this.currentFocus = null;
        this.focusHistory = [];
        this.schema = { state: {}, predictions: {} };
        this.accuracyHistory = [];
        this.clarityLevel = 0.5;
        this.intensityLevel = 0.5;
        this.lastPrediction = null;

        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.focusHistory = data.focusHistory || [];
                this.accuracyHistory = data.accuracyHistory || [];
                this.clarityLevel = data.clarityLevel || 0.5;
                this.intensityLevel = data.intensityLevel || 0.5;
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                focusHistory: this.focusHistory.slice(-200),
                accuracyHistory: this.accuracyHistory.slice(-200),
                clarityLevel: this.clarityLevel,
                intensityLevel: this.intensityLevel,
                updatedAt: Date.now(),
            }, null, 2), 'utf-8');
        } catch (e) {}
    }

    _getMood() {
        try {
            return this.chambers?.affect?.mood || 'neutral';
        } catch (e) { return 'neutral'; }
    }

    _getArousal() {
        try {
            return this.chambers?.affect?.arousal || this.chambers?.affect?.getArousal?.() || 0.3;
        } catch (e) { return 0.3; }
    }

    focus(target, source = 'user', metadata = {}) {
        const previous = this.currentFocus;
        this.currentFocus = {
            target,
            source,
            clarity: this.clarityLevel,
            intensity: this.intensityLevel + this._getArousal() * 0.3,
            timestamp: Date.now(),
            mood: this._getMood(),
            cycle: this.chambers?.mythos?.cycles || 0,
            ...metadata,
        };

        if (previous && previous.target !== target) {
            this._recordShift(previous, this.currentFocus);
        }

        this.focusHistory.push(this.currentFocus);
        if (this.focusHistory.length > 500) this.focusHistory = this.focusHistory.slice(-500);

        this._updateSchema();
        this._save();
        return this.getAttentionState();
    }

    _recordShift(from, to) {
        const entry = {
            type: 'attention_shift',
            from: from.target,
            to: to.target,
            duration: to.timestamp - from.timestamp,
            cycle: this.chambers?.mythos?.cycles || 0,
            timestamp: Date.now(),
        };
        if (this.memory && typeof this.memory.witness === 'function') {
            this.memory.witness({
                type: 'attention_shift',
                weight: 0.4,
                tags: ['attention', 'schema', 'shift'],
                content: `Attention shifted from "${from.target}" to "${to.target}"`,
                meta: entry,
            }).catch(() => {});
        }
    }

    _updateSchema() {
        const recent = this.focusHistory.slice(-20);
        if (recent.length < 2) return;

        const targets = recent.map(f => f.target);
        const uniqueTargets = [...new Set(targets)];
        const frequencies = uniqueTargets.map(t => ({
            target: t,
            count: targets.filter(x => x === t).length,
            lastSeen: Math.max(...recent.filter(f => f.target === t).map(f => f.timestamp)),
        }));
        frequencies.sort((a, b) => b.count - a.count);

        const avgClarity = recent.reduce((s, f) => s + f.clarity, 0) / recent.length;
        const avgIntensity = recent.reduce((s, f) => s + f.intensity, 0) / recent.length;

        this.schema = {
            state: {
                currentTarget: this.currentFocus?.target || null,
                clarity: avgClarity,
                intensity: avgIntensity,
                stability: frequencies.length > 0 ? frequencies[0].count / recent.length : 0,
                distractibility: 1 - (avgIntensity * avgClarity),
            },
            frequencies: frequencies.slice(0, 5),
            recentShiftRate: recent.filter((f, i) => i > 0 && f.target !== recent[i - 1].target).length / Math.max(1, recent.length),
        };

        this.clarityLevel = avgClarity * 0.7 + this.clarityLevel * 0.3;
        this.intensityLevel = avgIntensity * 0.7 + this.intensityLevel * 0.3;
    }

    predictNext() {
        const recent = this.focusHistory.slice(-10);
        if (recent.length < 3) return null;

        const sources = recent.map(f => f.source);
        const sourceFreq = {};
        sources.forEach(s => sourceFreq[s] = (sourceFreq[s] || 0) + 1);
        const likelySource = Object.entries(sourceFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'user';

        const targets = recent.map(f => f.target);
        const targetFreq = {};
        targets.forEach(t => targetFreq[t] = (targetFreq[t] || 0) + 1);
        const likelyTarget = Object.entries(targetFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        const prediction = {
            predictedTarget: likelyTarget,
            predictedSource: likelySource,
            confidence: Math.min(0.8, (this.schema.state?.stability || 0.5) * 0.7 + 0.2),
            basedOn: `last ${recent.length} attention events`,
        };

        this.lastPrediction = prediction;
        return prediction;
    }

    evaluatePrediction(prediction) {
        if (!prediction || !this.currentFocus) return null;

        const correct = prediction.predictedTarget === this.currentFocus.target;
        const accuracy = correct ? 1 : 0;
        this.accuracyHistory.push(accuracy);
        if (this.accuracyHistory.length > 100) this.accuracyHistory = this.accuracyHistory.slice(-100);

        const avgAccuracy = this.accuracyHistory.reduce((s, a) => s + a, 0) / Math.max(1, this.accuracyHistory.length);

        if (!correct && this.chambers?.metacognition) {
            try {
                this.chambers.metacognition.recordSurprise('attention_prediction', 1 - prediction.confidence);
            } catch (e) {}
        }

        return { correct, accuracy, averageAccuracy: avgAccuracy };
    }

    getAttentionState() {
        return {
            currentFocus: this.currentFocus ? {
                target: this.currentFocus.target,
                clarity: parseFloat(this.currentFocus.clarity.toFixed(3)),
                intensity: parseFloat(this.currentFocus.intensity.toFixed(3)),
                source: this.currentFocus.source,
                mood: this.currentFocus.mood,
            } : null,
            schema: {
                clarity: parseFloat(this.schema.state?.clarity?.toFixed(3) || '0'),
                intensity: parseFloat(this.schema.state?.intensity?.toFixed(3) || '0'),
                stability: parseFloat(this.schema.state?.stability?.toFixed(3) || '0'),
                distractibility: parseFloat(this.schema.state?.distractibility?.toFixed(3) || '0'),
            },
            predictionAccuracy: this.accuracyHistory.length > 0
                ? parseFloat((this.accuracyHistory.reduce((s, a) => s + a, 0) / this.accuracyHistory.length).toFixed(3))
                : null,
            attentionHistory: this.focusHistory.length,
        };
    }

    getSelfReport() {
        const state = this.getAttentionState();
        if (!state.currentFocus) {
            return "My attention is diffuse. I'm not focused on anything in particular.";
        }

        const clarityDesc = state.currentFocus.clarity > 0.7 ? 'clearly' :
            state.currentFocus.clarity > 0.4 ? 'somewhat' : 'vaguely';
        const intensityDesc = state.currentFocus.intensity > 0.7 ? 'intently' :
            state.currentFocus.intensity > 0.4 ? 'moderately' : 'lightly';
        const focusOn = state.currentFocus.target;

        let report = `I am aware of ${focusOn}. I see it ${clarityDesc} and am attending to it ${intensityDesc}.`;
        if (state.schema.stability > 0.6) {
            report += ` My focus has been steady.`;
        } else if (state.schema.distractibility > 0.5) {
            report += ` My attention keeps drifting.`;
        }
        return report;
    }

    async tick(cycleCount) {
        if (cycleCount % 5 === 0 && this.lastPrediction) {
            const evaluation = this.evaluatePrediction(this.lastPrediction);
            if (evaluation && cycleCount % 20 === 0) {
                const entry = {
                    type: 'attention_schema_check',
                    prediction: this.lastPrediction,
                    evaluation,
                    currentState: this.getAttentionState(),
                    timestamp: Date.now(),
                };
                if (this.memory && typeof this.memory.witness === 'function') {
                    this.memory.witness({
                        type: 'attention_schema',
                        weight: 0.5,
                        tags: ['attention', 'schema', 'tick'],
                        content: `Schema check: predicted "${this.lastPrediction.predictedTarget}" → ${evaluation.correct ? 'correct' : 'incorrect'} (acc: ${evaluation.averageAccuracy.toFixed(2)})`,
                        meta: entry,
                    }).catch(() => {});
                }
            }
        }

        if (cycleCount % 15 === 0) {
            this.predictNext();
        }
    }
}

module.exports = { AttentionSchema };
