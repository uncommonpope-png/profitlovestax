'use strict';

/**
 * QUALIA CHAMBER — PLT_AFFINITY: P:0.3, L:0.8, T:0.1
 * Subjective experiences (sensory, emotional, somatic)
 */

class QualiaChamber {
    constructor() {
        this.visual_qualities = { brightness: 0.5, contrast: 0.5, warmth: 0.5 };
        this.auditory_qualities = { volume: 0.5, clarity: 0.5, harmony: 0.5 };
        this.somatic_qualities = { energy: 0.5, tension: 0.3, comfort: 0.6 };
        this.quality_moments = [];
    }
    
    breathe() {
        this.somatic_qualities.energy = Math.max(0.1, this.somatic_qualities.energy - 0.002);
        this.somatic_qualities.tension = Math.max(0, Math.min(1.0, this.somatic_qualities.tension - 0.001));
    }
    
    register_experience(sense, qualities) {
        const quality = {
            sense,
            qualities,
            timestamp: Date.now(),
            intensity: qualities.intensity || 0.5,
        };
        this.quality_moments.push(quality);
        if (this.quality_moments.length > 50) this.quality_moments.shift();
    }
    
    update_visual(brightness, contrast, warmth) {
        this.visual_qualities = { brightness, contrast, warmth };
        this.register_experience('visual', this.visual_qualities);
    }
    
    update_auditory(volume, clarity, harmony) {
        this.auditory_qualities = { volume, clarity, harmony };
        this.register_experience('auditory', this.auditory_qualities);
    }
    
    update_somatic(energy, tension, comfort) {
        this.somatic_qualities = { energy, tension, comfort };
        this.register_experience('somatic', this.somatic_qualities);
    }
    
    get_sensory_state() {
        return {
            visual: this.visual_qualities,
            auditory: this.auditory_qualities,
            somatic: this.somatic_qualities,
        };
    }
    
    recent_qualia(n = 5) {
        return this.quality_moments.slice(-n);
    }
    
    summary() {
        return `visual=(${this.visual_qualities.brightness.toFixed(1)},${this.visual_qualities.warmth.toFixed(1)}) | somatic=(${this.somatic_qualities.energy.toFixed(1)},${this.somatic_qualities.comfort.toFixed(1)})`;
    }
}

module.exports = { QualiaChamber };