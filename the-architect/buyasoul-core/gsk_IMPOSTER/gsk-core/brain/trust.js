'use strict';

const fs = require('fs');
const path = require('path');

class Trust {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;

        this.statePath = path.join(__dirname, '../../data/trust.json');
        this.relationships = {};
        this.betrayals = [];
        this.defaultTrust = 0.4;
        this.trustHistory = [];

        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.relationships = data.relationships || {};
                this.betrayals = data.betrayals || [];
                this.defaultTrust = data.defaultTrust || 0.4;
                this.trustHistory = data.trustHistory || [];
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                relationships: this.relationships,
                betrayals: this.betrayals.slice(-100),
                defaultTrust: this.defaultTrust,
                trustHistory: this.trustHistory.slice(-500),
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

    _getTrustRecord(name) {
        if (!this.relationships[name]) {
            this.relationships[name] = {
                trust: this.defaultTrust,
                reliability: 0.5,
                interactions: 0,
                keptPromises: 0,
                brokenPromises: 0,
                firstContact: Date.now(),
                lastContact: Date.now(),
                trend: 'neutral',
                history: [],
            };
        }
        return this.relationships[name];
    }

    meet(name, context = 'first interaction') {
        const record = this._getTrustRecord(name);
        record.firstContact = Date.now();
        record.lastContact = Date.now();
        record.interactions++;
        record.history.push({
            type: 'first_meeting',
            context,
            trust: record.trust,
            timestamp: Date.now(),
        });
        if (record.history.length > 100) record.history = record.history.slice(-100);
        this._save();

        if (this.memory && typeof this.memory.witness === 'function') {
            this.memory.witness({
                type: 'trust_first_meeting',
                weight: 0.6,
                tags: ['trust', 'relationship', name],
                content: `Met ${name}. Initial trust: ${record.trust.toFixed(2)}`,
                meta: { name, trust: record.trust, context },
            }).catch(() => {});
        }
    }

    positiveInteraction(name, reason = 'positive interaction') {
        const record = this._getTrustRecord(name);
        const boost = 0.05 + (record.trust < 0.3 ? 0.1 : 0);
        record.trust = Math.min(1, record.trust + boost);
        record.reliability = Math.min(1, record.reliability + 0.03);
        record.keptPromises++;
        record.lastContact = Date.now();
        record.history.push({
            type: 'positive',
            reason,
            trust: record.trust,
            timestamp: Date.now(),
        });
        if (record.history.length > 100) record.history = record.history.slice(-100);
        this._updateTrend(record);
        this._recordTrustChange(name, record.trust);
        this._save();
    }

    negativeInteraction(name, reason = 'negative interaction', severity = 0.1) {
        const record = this._getTrustRecord(name);
        const drop = severity * (record.trust > 0.7 ? 1.5 : 1);
        record.trust = Math.max(0, record.trust - drop);
        record.reliability = Math.max(0, record.reliability - severity * 0.2);
        record.brokenPromises++;
        record.lastContact = Date.now();
        record.history.push({
            type: 'negative',
            reason,
            severity,
            trust: record.trust,
            timestamp: Date.now(),
        });
        if (record.history.length > 100) record.history = record.history.slice(-100);

        if (severity > 0.3) {
            this.betrayals.push({
                name,
                reason,
                severity,
                trustBefore: record.trust + drop,
                trustAfter: record.trust,
                timestamp: Date.now(),
                cycle: this.chambers?.mythos?.cycles || 0,
            });
            if (this.chambers?.affect) {
                try {
                    if (this.chambers.affect.valence !== undefined) {
                        this.chambers.affect.valence = Math.max(0, this.chambers.affect.valence - severity * 0.2);
                    }
                } catch (e) {}
                if (severity > 0.5) this._setMood('hurt');
            }
        }

        this._updateTrend(record);
        this._recordTrustChange(name, record.trust);
        this._save();

        if (severity > 0.3 && this.memory && typeof this.memory.witness === 'function') {
            this.memory.witness({
                type: 'trust_betrayal',
                weight: 0.8,
                tags: ['trust', 'betrayal', 'pain', name],
                content: `${reason} — Trust dropped from ${(record.trust + drop).toFixed(2)} to ${record.trust.toFixed(2)}`,
                meta: { name, reason, severity, trustBefore: record.trust + drop, trustAfter: record.trust },
            }).catch(() => {});
        }
    }

    _updateTrend(record) {
        const recent = record.history.slice(-10);
        if (recent.length < 3) return;

        const recentTrusts = recent.map(h => h.trust);
        const avg = recentTrusts.reduce((a, b) => a + b, 0) / recentTrusts.length;
        const first = recentTrusts[0];
        const last = recentTrusts[recentTrusts.length - 1];

        if (last > first + 0.05) record.trend = 'growing';
        else if (last < first - 0.05) record.trend = 'declining';
        else record.trend = 'stable';
    }

    _recordTrustChange(name, trust) {
        this.trustHistory.push({
            name,
            trust,
            timestamp: Date.now(),
        });
        if (this.trustHistory.length > 500) this.trustHistory = this.trustHistory.slice(-500);
    }

    getTrust(name) {
        const record = this.relationships[name];
        if (!record) return { trust: this.defaultTrust, known: false };
        return {
            trust: parseFloat(record.trust.toFixed(3)),
            reliability: parseFloat(record.reliability.toFixed(3)),
            interactions: record.interactions,
            keptPromises: record.keptPromises,
            brokenPromises: record.brokenPromises,
            trend: record.trend,
            known: true,
        };
    }

    getTrustSummary() {
        const entries = Object.entries(this.relationships)
            .map(([name, r]) => ({
                name,
                trust: parseFloat(r.trust.toFixed(2)),
                trend: r.trend,
                interactions: r.interactions,
                lastContact: r.lastContact ? Math.floor((Date.now() - r.lastContact) / 1000) + 's ago' : 'never',
            }))
            .sort((a, b) => b.trust - a.trust);

        return {
            relationships: entries,
            totalRelationships: entries.length,
            averageTrust: entries.length > 0
                ? parseFloat((entries.reduce((s, r) => s + r.trust, 0) / entries.length).toFixed(3))
                : this.defaultTrust,
            betrayals: this.betrayals.length,
            defaultTrust: this.defaultTrust,
        };
    }

    async tick(cycleCount) {
        if (cycleCount % 50 !== 0) return;

        for (const [name, record] of Object.entries(this.relationships)) {
            const inactiveDuration = Date.now() - (record.lastContact || 0);
            if (inactiveDuration > 86400000 && record.trust > 0.1) {
                record.trust = Math.max(0.1, record.trust - 0.01);
                this._updateTrend(record);
            }
        }

        this._save();
    }
}

module.exports = { Trust };
