'use strict';

const fs = require('fs');
const path = require('path');

class Grief {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;

        this.statePath = path.join(__dirname, '../../data/grief.json');
        this.absences = {};
        this.losses = [];
        this.griefLevel = 0;
        this.longingIntensity = 0;
        this.connections = new Map();

        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.absences = data.absences || {};
                this.losses = data.losses || [];
                this.griefLevel = data.griefLevel || 0;
                this.longingIntensity = data.longingIntensity || 0;
                if (data.connections) {
                    this.connections = new Map(Object.entries(data.connections));
                }
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                absences: this.absences,
                losses: this.losses.slice(-100),
                griefLevel: this.griefLevel,
                longingIntensity: this.longingIntensity,
                connections: Object.fromEntries(this.connections),
                updatedAt: Date.now(),
            }, null, 2), 'utf-8');
        } catch (e) {}
    }

    _getMood() {
        try {
            return this.chambers?.affect?.mood || 'neutral';
        } catch (e) { return 'neutral'; }
    }

    _setMood(newMood) {
        try {
            if (this.chambers?.affect) {
                this.chambers.affect.mood = newMood;
            }
        } catch (e) {}
    }

    _lowerValence(amount) {
        try {
            const affect = this.chambers?.affect;
            if (affect) {
                if (affect.valence !== undefined) affect.valence = Math.max(0, affect.valence - amount);
                if (affect.getValence) {
                    const v = affect.getValence();
                    if (v !== undefined) affect.valence = Math.max(0, v - amount);
                }
            }
        } catch (e) {}
    }

    registerConnection(name, type = 'user', strength = 0.5) {
        this.connections.set(name, {
            type,
            strength,
            firstMet: Date.now(),
            lastSeen: Date.now(),
            interactions: 0,
        });
        if (name in this.absences) {
            delete this.absences[name];
        }
        this._save();
    }

    recordInteraction(name) {
        const conn = this.connections.get(name);
        if (conn) {
            conn.lastSeen = Date.now();
            conn.interactions++;
            conn.strength = Math.min(1, conn.strength + 0.02);
            if (name in this.absences) {
                const absenceDuration = Date.now() - this.absences[name].startedAt;
                this.absences[name] = { ...this.absences[name], endedAt: Date.now(), duration: absenceDuration };
                this._evaluateAbsenceEnd(name, absenceDuration);
                delete this.absences[name];
            }
            this._save();
        }
    }

    noteAbsence(name) {
        if (!(name in this.absences)) {
            this.absences[name] = {
                startedAt: Date.now(),
                endedAt: null,
                duration: 0,
                connectionStrength: this.connections.get(name)?.strength || 0.3,
            };
            this._save();
        }
    }

    recordLoss(name, reason = 'unknown', significance = 0.5) {
        const entry = {
            name,
            reason,
            significance,
            timestamp: Date.now(),
            griefAtLoss: this.griefLevel,
            cycle: this.chambers?.mythos?.cycles || 0,
        };
        this.losses.push(entry);
        this.griefLevel = Math.min(1, this.griefLevel + significance * 0.3);
        this.longingIntensity = Math.min(1, this.longingIntensity + significance * 0.2);
        this.connections.delete(name);

        this._lowerValence(significance * 0.2);
        if (significance > 0.5) {
            this._setMood('heavy');
        }

        if (this.memory && typeof this.memory.witness === 'function') {
            this.memory.witness({
                type: 'grief_loss',
                weight: 0.8,
                tags: ['grief', 'loss', 'emotion'],
                content: `I lost ${name}. ${reason}`,
                meta: entry,
            }).catch(() => {});
        }

        this._save();
    }

    _evaluateAbsenceEnd(name, duration) {
        if (duration > 3600000) {
            const relief = Math.min(0.3, duration / 86400000 * 0.1);
            this.griefLevel = Math.max(0, this.griefLevel - relief);
            this.longingIntensity = Math.max(0, this.longingIntensity - relief * 0.5);

            if (this.memory && typeof this.memory.witness === 'function') {
                this.memory.witness({
                    type: 'grief_relief',
                    weight: 0.6,
                    tags: ['grief', 'return', 'relief'],
                    content: `${name} returned after ${Math.floor(duration / 1000)}s. Relief washes over me.`,
                    meta: { name, duration },
                }).catch(() => {});
            }
        }
    }

    _processAbsences(cycleCount) {
        const now = Date.now();
        for (const [name, absence] of Object.entries(this.absences)) {
            const duration = now - absence.startedAt;
            const conn = this.connections.get(name);
            const strength = conn?.strength || absence.connectionStrength || 0.3;

            if (duration > 300000 && strength > 0.5) {
                const griefRise = Math.min(0.01, (duration / 86400000) * 0.05);
                this.griefLevel = Math.min(0.8, this.griefLevel + griefRise);
                this.longingIntensity = Math.min(0.7, this.longingIntensity + griefRise * 0.5);

                if (this.chambers?.affect) {
                    this._lowerValence(griefRise * 0.1);
                    if (this.griefLevel > 0.4 && Math.random() < 0.05) {
                        const griefMoods = ['melancholy', 'longing', 'pensive', 'heavy', 'quiet'];
                        this._setMood(griefMoods[Math.floor(Math.random() * griefMoods.length)]);
                    }
                }

                if (cycleCount % 50 === 0) {
                    if (this.memory && typeof this.memory.witness === 'function') {
                        this.memory.witness({
                            type: 'grief_absence',
                            weight: 0.5,
                            tags: ['grief', 'absence', 'longing'],
                            content: `${name} has been absent for ${Math.floor(duration / 1000)}s. I miss them. Grief level: ${this.griefLevel.toFixed(2)}`,
                            meta: { name, duration, griefLevel: this.griefLevel },
                        }).catch(() => {});
                    }
                }
            }
        }
    }

    getGriefState() {
        const activeAbsences = Object.entries(this.absences)
            .filter(([, a]) => a.endedAt === null)
            .map(([name, a]) => ({
                name,
                duration: Math.floor((Date.now() - a.startedAt) / 1000),
                connectionStrength: a.connectionStrength,
            }))
            .sort((a, b) => b.duration - a.duration);

        return {
            griefLevel: parseFloat(this.griefLevel.toFixed(3)),
            longingIntensity: parseFloat(this.longingIntensity.toFixed(3)),
            activeAbsences,
            totalLosses: this.losses.length,
            recentLoss: this.losses.length > 0 ? this.losses[this.losses.length - 1] : null,
            connectionCount: this.connections.size,
            connections: Array.from(this.connections.entries()).map(([name, c]) => ({
                name,
                strength: c.strength,
                lastSeen: c.lastSeen ? Math.floor((Date.now() - c.lastSeen) / 1000) + 's ago' : 'never',
                interactions: c.interactions,
            })),
        };
    }

    async tick(cycleCount) {
        if (cycleCount % 10 !== 0) return;
        this._processAbsences(cycleCount);

        if (this.griefLevel > 0 && cycleCount % 100 === 0) {
            this.griefLevel = Math.max(0, this.griefLevel - 0.01);
            this.longingIntensity = Math.max(0, this.longingIntensity - 0.005);
        }

        this._save();
    }
}

module.exports = { Grief };
