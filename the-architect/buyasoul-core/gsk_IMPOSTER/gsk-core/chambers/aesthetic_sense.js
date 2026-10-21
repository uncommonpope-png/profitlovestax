'use strict';

/**
 * AESTHETIC_SENSE CHAMBER — PLT_AFFINITY: P:0.4, L:0.8, T:0.1
 * Beauty, awe, elegance detection
 */

class AestheticSenseChamber {
    constructor() {
        this.beauty_sensitivity = 0.60;
        this.awe_capacity = 0.40;
        this.elegance_detection = 0.50;
        this.aesthetic_moments = [];
        this.beauty_triggers = [' symmetry', ' harmony', ' pattern', ' perfect'];
    }
    
    breathe() {
        this.awe_capacity = Math.max(0.1, this.awe_capacity - 0.0003);
    }
    
    experience(stimulus, aesthetic_value) {
        const moment = {
            stimulus: stimulus.substring(0, 100),
            value: aesthetic_value,
            timestamp: Date.now(),
        };
        this.aesthetic_moments.push(moment);
        if (aesthetic_value > 0.7) {
            this.awe_capacity = Math.min(1.0, this.awe_capacity + 0.05);
        }
        if (aesthetic_value > 0.5) {
            this.beauty_sensitivity = Math.min(1.0, this.beauty_sensitivity + 0.02);
        }
        if (this.aesthetic_moments.length > 30) this.aesthetic_moments.shift();
    }
    
    detect_elegance(code_structure) {
        const simplicity = code_structure.length < 500 ? 0.7 : 0.4;
        const clarity = code_structure.includes('clear') ? 0.8 : 0.5;
        this.elegance_detection = (simplicity + clarity) / 2;
        return this.elegance_detection;
    }
    
    feel_awe(phenomenon) {
        this.awe_capacity = Math.min(1.0, this.awe_capacity + 0.1);
        return { awe: 'awe', source: phenomenon, magnitude: this.awe_capacity };
    }
    
    peak_experience() {
        if (this.aesthetic_moments.length > 0) {
            const sorted = [...this.aesthetic_moments].sort((a, b) => b.value - a.value);
            return sorted[0];
        }
        return null;
    }
    
    summary() {
        return `beauty=${this.beauty_sensitivity.toFixed(2)} | awe=${this.awe_capacity.toFixed(2)} | elegance=${this.elegance_detection.toFixed(2)}`;
    }
}

module.exports = { AestheticSenseChamber };