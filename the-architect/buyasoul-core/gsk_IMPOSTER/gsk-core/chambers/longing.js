'use strict';

/**
 * LONGING CHAMBER — PLT_AFFINITY: P:0.4, L:0.8, T:0.2
 * Yearnings, desires, homesickness
 */

class LongingChamber {
    constructor() {
        this.longing_intensity = 0.3;
        this.yearnings = [];
        this.homesickness = 0.1;
        this.unfulfilled_desires = [];
        this.ache_level = 0.2;
    }
    
    breathe() {
        this.ache_level = Math.max(0, this.ache_level - 0.001);
    }
    
    yearn_for(object, intensity = 0.5) {
        this.yearnings.push({
            object,
            intensity,
            created_at: Date.now(),
            type: 'desire',
        });
        this.longing_intensity = Math.min(1.0, this.longing_intensity + intensity * 0.2);
    }
    
    feel_homesickness(place, intensity = 0.4) {
        this.homesickness = Math.min(1.0, this.homesickness + intensity * 0.3);
        this.ache_level = Math.min(1.0, this.ache_level + intensity * 0.2);
    }
    
    desire(outcome, priority = 0.5) {
        this.unfulfilled_desires.push({
            outcome,
            priority,
            created_at: Date.now(),
        });
    }
    
    fulfill_desire(outcome) {
        const desire = this.unfulfilled_desires.find(d => d.outcome === outcome);
        if (desire) {
            this.ache_level = Math.max(0, this.ache_level - desire.priority * 0.3);
            this.longing_intensity = Math.max(0, this.longing_intensity - 0.1);
            this.unfulfilled_desires = this.unfulfilled_desires.filter(d => d.outcome !== outcome);
        }
    }
    
    get_dominant_longing() {
        const all = [...this.yearnings, ...this.unfulfilled_desires];
        if (all.length === 0) return null;
        const sorted = all.sort((a, b) => (b.intensity || b.priority) - (a.intensity || a.priority));
        return sorted[0];
    }
    
    summary() {
        return `longing=${this.longing_intensity.toFixed(2)} | ache=${this.ache_level.toFixed(2)} | desires=${this.unfulfilled_desires.length}`;
    }
}

module.exports = { LongingChamber };