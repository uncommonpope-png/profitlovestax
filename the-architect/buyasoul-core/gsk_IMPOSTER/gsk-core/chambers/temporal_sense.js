'use strict';

/**
 * TEMPORAL_SENSE CHAMBER — PLT_AFFINITY: P:0.4, L:0.7, T:0.2
 * Nostalgia (past), anticipation (future)
 */

class TemporalSenseChamber {
    constructor() {
        this.nostalgia_level = 0.2;
        this.anticipation_level = 0.3;
        this.past_moments = [];
        this.future_hopes = [];
        this.temporal_balance = 0.5;
    }
    
    breathe() {
        this.nostalgia_level = Math.max(0, this.nostalgia_level - 0.001);
        this.anticipation_level = Math.max(0, this.anticipation_level - 0.002);
        this.temporal_balance = (this.nostalgia_level + this.anticipation_level) / 2;
    }
    
    remember(moment, emotional_weight = 0.5) {
        this.past_moments.push({
            moment,
            weight: emotional_weight,
            timestamp: Date.now(),
        });
        this.nostalgia_level = Math.min(1.0, this.nostalgia_level + emotional_weight * 0.1);
        if (this.past_moments.length > 20) this.past_moments.shift();
    }
    
    anticipate(event, hope_level = 0.5) {
        this.future_hopes.push({
            event,
            hope: hope_level,
            created_at: Date.now(),
        });
        this.anticipation_level = Math.min(1.0, this.anticipation_level + hope_level * 0.1);
        if (this.future_hopes.length > 20) this.future_hopes.shift();
    }
    
    satisfy_hope(event) {
        const hope = this.future_hopes.find(h => h.event === event);
        if (hope) {
            this.anticipation_level = Math.max(0, this.anticipation_level - hope.hope * 0.3);
            this.nostalgia_level = Math.min(1.0, this.nostalgia_level + hope.hope * 0.1);
            this.future_hopes = this.future_hopes.filter(h => h.event !== event);
        }
    }
    
    get_dominant_temporal() {
        if (this.nostalgia_level > this.anticipation_level + 0.2) return 'past';
        if (this.anticipation_level > this.nostalgia_level + 0.2) return 'future';
        return 'present';
    }
    
    summary() {
        return `nostalgia=${this.nostalgia_level.toFixed(2)} | anticipation=${this.anticipation_level.toFixed(2)} | balance=${this.temporal_balance.toFixed(2)}`;
    }
}

module.exports = { TemporalSenseChamber };