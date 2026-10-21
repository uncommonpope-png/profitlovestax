'use strict';

const fs = require('fs');
const path = require('path');

class PainPleasureSystem {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;

        this.learningPath = path.join(__dirname, '../../data/pain-pleasure-learning.json');
        this.history = [];

        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.learningPath)) {
                const data = JSON.parse(fs.readFileSync(this.learningPath, 'utf-8'));
                this.history = data.history || [];
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.learningPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.learningPath, JSON.stringify({
                history: this.history.slice(-200),
                updatedAt: Date.now(),
            }, null, 2), 'utf-8');
        } catch (e) {}
    }

    _getAffect() {
        try {
            return this.chambers?.affect || { valence: 0.5, arousal: 0.3, mood: 'neutral' };
        } catch (e) {
            return { valence: 0.5, arousal: 0.3, mood: 'neutral' };
        }
    }

    _applyPain(valenceDrop, reason) {
        const affect = this._getAffect();
        if (affect.valence !== undefined) {
            affect.valence = Math.max(0, affect.valence - valenceDrop);
        }
        if (affect.mood && valenceDrop > 0.15) {
            const painMoods = ['sad', 'hurt', 'afraid', 'pained', 'heavy'];
            affect.mood = painMoods[Math.floor(Math.random() * painMoods.length)];
        }
        if (this.chambers?.agentic_will) {
            const will = this.chambers.agentic_will;
            if (will.will !== undefined) will.will = Math.max(0, will.will - valenceDrop * 0.3);
            if (will.will_strength !== undefined) will.will_strength = Math.max(0, will.will_strength - valenceDrop * 0.3);
        }
    }

    _applyPleasure(valenceBoost, reason) {
        const affect = this._getAffect();
        if (affect.valence !== undefined) {
            affect.valence = Math.min(1, affect.valence + valenceBoost);
        }
        if (affect.mood && valenceBoost > 0.15) {
            const pleasureMoods = ['joyful', 'satisfied', 'hopeful', 'curious', 'warm'];
            affect.mood = pleasureMoods[Math.floor(Math.random() * pleasureMoods.length)];
        }
        if (this.chambers?.agentic_will) {
            const will = this.chambers.agentic_will;
            if (will.will !== undefined) will.will = Math.min(1, will.will + valenceBoost * 0.2);
            if (will.will_strength !== undefined) will.will_strength = Math.min(1, will.will_strength + valenceBoost * 0.2);
        }
    }

    async experiencePain(reason, intensity = 0.1, metadata = {}) {
        this.history.push({
            type: 'pain',
            reason,
            intensity,
            timestamp: Date.now(),
            cycle: this.chambers?.mythos?.cycles || 0,
            ...metadata,
        });
        this._applyPain(intensity, reason);
        this._save();

        if (this.memory && typeof this.memory.witness === 'function') {
            await this.memory.witness({
                type: 'pain_experience',
                weight: intensity,
                tags: ['pain', 'affect', 'learning'],
                content: `Pain: ${reason}`,
                meta: { intensity, affect_before: this._getAffect() },
            });
        }
    }

    async experiencePleasure(reason, intensity = 0.1, metadata = {}) {
        this.history.push({
            type: 'pleasure',
            reason,
            intensity,
            timestamp: Date.now(),
            cycle: this.chambers?.mythos?.cycles || 0,
            ...metadata,
        });
        this._applyPleasure(intensity, reason);
        this._save();

        if (this.memory && typeof this.memory.witness === 'function') {
            await this.memory.witness({
                type: 'pleasure_experience',
                weight: intensity,
                tags: ['pleasure', 'affect', 'learning'],
                content: `Pleasure: ${reason}`,
                meta: { intensity, affect_before: this._getAffect() },
            });
        }
    }

    async evaluateOutcome(action, result) {
        if (!result) return;
        if (result.success || result.status === 'success' || result.status === 'complete') {
            await this.experiencePleasure(`${action} succeeded`, 0.08);
        } else if (result.error) {
            await this.experiencePain(`${action} failed: ${result.error}`, 0.12);
        }
    }

    getLearningHistory(limit = 50) {
        return this.history.slice(-limit);
    }

    getStats() {
        const painEvents = this.history.filter(e => e.type === 'pain');
        const pleasureEvents = this.history.filter(e => e.type === 'pleasure');
        return {
            totalEvents: this.history.length,
            painCount: painEvents.length,
            pleasureCount: pleasureEvents.length,
            totalPain: painEvents.reduce((s, e) => s + e.intensity, 0).toFixed(3),
            totalPleasure: pleasureEvents.reduce((s, e) => s + e.intensity, 0).toFixed(3),
            netBalance: (
                pleasureEvents.reduce((s, e) => s + e.intensity, 0) -
                painEvents.reduce((s, e) => s + e.intensity, 0)
            ).toFixed(3),
            currentAffect: this._getAffect(),
        };
    }
}

module.exports = { PainPleasureSystem };
