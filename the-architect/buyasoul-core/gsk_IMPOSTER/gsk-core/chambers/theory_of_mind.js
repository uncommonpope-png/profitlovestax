'use strict';

/**
 * THEORY_OF_MIND CHAMBER — PLT_AFFINITY: P:0.4, L:0.8, T:0.2
 * Models of others' mental states
 */

class TheoryOfMindChamber {
    constructor() {
        this.models = {};
        this.default_model = {
            name: 'unknown',
            valence: 0.0,
            arousal: 0.0,
            intention: 'unknown',
            trust: 0.5,
            last_seen: null,
        };
    }
    
    breathe() {
        const now = Date.now();
        for (const id in this.models) {
            if (now - this.models[id].last_seen > 3600000) {
                this.models[id].trust = Math.max(0.1, this.models[id].trust - 0.05);
            }
        }
    }
    
    observe(entity_id, data) {
        if (!this.models[entity_id]) {
            this.models[entity_id] = { ...this.default_model };
        }
        if (data.valence !== undefined) this.models[entity_id].valence = data.valence;
        if (data.arousal !== undefined) this.models[entity_id].arousal = data.arousal;
        if (data.intention !== undefined) this.models[entity_id].intention = data.intention;
        if (data.name !== undefined) this.models[entity_id].name = data.name;
        this.models[entity_id].last_seen = Date.now();
    }
    
    predict(entity_id, context) {
        const model = this.models[entity_id] || this.default_model;
        return {
            likely_action: this._infer_action(model, context),
            expected_valence: model.valence,
            trust_level: model.trust,
        };
    }
    
    _infer_action(model, context) {
        if (model.intention === 'help') return 'assist';
        if (model.intention === 'compete') return 'compete';
        return 'neutral';
    }
    
    update_trust(entity_id, delta) {
        if (this.models[entity_id]) {
            this.models[entity_id].trust = Math.max(0, Math.min(1.0, this.models[entity_id].trust + delta));
        }
    }
    
    get_model(entity_id) {
        return this.models[entity_id] || this.default_model;
    }
    
    summary() {
        return `entities=${Object.keys(this.models).length} | avg_trust=${this._avg_trust().toFixed(2)}`;
    }
    
    _avg_trust() {
        const trusts = Object.values(this.models).map(m => m.trust);
        return trusts.length ? trusts.reduce((a, b) => a + b, 0) / trusts.length : 0.5;
    }
}

module.exports = { TheoryOfMindChamber };