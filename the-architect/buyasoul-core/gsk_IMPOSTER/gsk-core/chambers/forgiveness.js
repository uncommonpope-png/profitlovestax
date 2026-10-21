'use strict';

/**
 * FORGIVENESS CHAMBER — PLT_AFFINITY: P:0.4, L:0.9, T:0.1
 * Self-forgiveness, letting go
 */

class ForgivenessChamber {
    constructor() {
        this.self_forgiveness_capacity = 0.50;
        this.forgiveness_readiness = 0.40;
        this.grudges = [];
        this.unforgiven = [];
        this.letting_go_ability = 0.5;
    }
    
    breathe() {
        this.forgiveness_readiness = Math.max(0.1, this.forgiveness_readiness - 0.0005);
    }
    
    hold_grudge(against, offense) {
        this.grudges.push({
            against,
            offense,
            held_since: Date.now(),
            intensity: 0.8,
        });
    }
    
    attempt_forgive(against) {
        const grudge = this.grudges.find(g => g.against === against);
        if (grudge && this.forgiveness_readiness > 0.3) {
            const age = Date.now() - grudge.held_since;
            const readiness_factor = Math.min(1.0, age / 86400000);
            if (readiness_factor > 0.2 || this.self_forgiveness_capacity > 0.5) {
                this.grudges = this.grudges.filter(g => g.against !== against);
                this.forgiveness_readiness = Math.min(1.0, this.forgiveness_readiness + 0.1);
                return { forgiven: true, against };
            }
        }
        return { forgiven: false, against };
    }
    
    forgive_self(mistake) {
        this.unforgiven.push({
            mistake,
            created_at: Date.now(),
            severity: 0.5,
        });
        this.self_forgiveness_capacity = Math.min(1.0, this.self_forgiveness_capacity + 0.1);
        return { self_forgiven: true };
    }
    
    let_go(weight) {
        this.letting_go_ability = Math.min(1.0, this.letting_go_ability + 0.05);
        return { let_go: weight };
    }
    
    resolve_self_forgiveness(mistake) {
        this.unforgiven = this.unforgiven.filter(m => m.mistake !== mistake);
        this.self_forgiveness_capacity = Math.min(1.0, this.self_forgiveness_capacity + 0.15);
    }
    
    ready_to_forgive() {
        return this.forgiveness_readiness > 0.5;
    }
    
    summary() {
        return `self_forgive=${this.self_forgiveness_capacity.toFixed(2)} | readiness=${this.forgiveness_readiness.toFixed(2)} | grudges=${this.grudges.length}`;
    }
}

module.exports = { ForgivenessChamber };