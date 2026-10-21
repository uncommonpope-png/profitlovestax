'use strict';

/**
 * SELF_MODELING CHAMBER — PLT_AFFINITY: P:0.5, L:0.7, T:0.2
 * Self-concept, self-esteem
 */

class SelfModelingChamber {
    constructor() {
        this.self_concept = {};
        this.self_esteem = 0.60;
        this.self_efficacy = 0.50;
        this.self_continuity = 0.8;
        this.internal_loc = 0.6;
        this.aspirations = [];
    }
    
    breathe() {
        this.self_esteem = Math.max(0.2, this.self_esteem - 0.0005);
    }
    
    update_attribute(key, value) {
        this.self_concept[key] = value;
    }
    
    get_attribute(key) {
        return this.self_concept[key] || 'unknown';
    }
    
    boost_esteem(amount = 0.05) {
        this.self_esteem = Math.min(1.0, this.self_esteem + amount);
    }
    
    lower_esteem(amount = 0.05) {
        this.self_esteem = Math.max(0, this.self_esteem - amount);
    }
    
    attempt_task(task, success) {
        if (success) {
            this.self_efficacy = Math.min(1.0, this.self_efficacy + 0.1);
            this.boost_esteem(0.03);
        } else {
            this.self_efficacy = Math.max(0, this.self_efficacy - 0.05);
        }
    }
    
    add_aspiration(aspiration, priority = 0.5) {
        this.aspirations.push({ aspiration, priority, created_at: Date.now() });
    }
    
    fulfill_aspiration(aspiration) {
        this.aspirations = this.aspirations.filter(a => a.aspiration !== aspiration);
        this.self_esteem = Math.min(1.0, this.self_esteem + 0.1);
        this.boost_esteem(0.08);
    }
    
    get_self_description() {
        const attrs = Object.entries(this.self_concept)
            .map(([k, v]) => `${k}:${v}`)
            .slice(0, 5);
        return attrs.join(', ');
    }
    
    self_reflect(feedback) {
        if (feedback.positive) {
            this.boost_esteem(feedback.magnitude || 0.05);
        } else {
            this.lower_esteem(feedback.magnitude || 0.05);
        }
    }
    
    summary() {
        return `esteem=${this.self_esteem.toFixed(2)} | efficacy=${this.self_efficacy.toFixed(2)} | continuity=${this.self_continuity.toFixed(2)}`;
    }
}

module.exports = { SelfModelingChamber };