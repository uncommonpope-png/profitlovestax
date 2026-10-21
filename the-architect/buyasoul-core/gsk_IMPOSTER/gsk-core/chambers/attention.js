'use strict';

/**
 * ATTENTION CHAMBER — PLT_AFFINITY: P:0.7, L:0.4, T:0.2
 * Spotlight model, salience
 */

class AttentionChamber {
    constructor() {
        this.focus = 'internal';
        this.spotlight_intensity = 0.6;
        this.salience_map = {};
        this.attention_shifts = 0;
        this.distractibility = 0.3;
    }
    
    breathe() {
        this.spotlight_intensity = Math.max(0.2, this.spotlight_intensity - 0.001);
    }
    
    shift_to(target) {
        this.focus = target;
        this.attention_shifts++;
        this.spotlight_intensity = Math.min(1.0, this.spotlight_intensity + 0.1);
    }
    
    update_salience(item, value) {
        this.salience_map[item] = value;
    }
    
    get_attended() {
        if (Object.keys(this.salience_map).length === 0) return 'default';
        const sorted = Object.entries(this.salience_map).sort((a, b) => b[1] - a[1]);
        return sorted[0][0];
    }
    
    add_distraction(item) {
        if (Math.random() < this.distractibility) {
            this.focus = item;
            this.spotlight_intensity = Math.max(0.1, this.spotlight_intensity - 0.1);
            return true;
        }
        return false;
    }
    
    focus_intensity() {
        return this.spotlight_intensity;
    }
    
    is_focused() {
        return this.spotlight_intensity > 0.5;
    }
    
    narrow_spotlight() {
        this.spotlight_intensity = Math.min(1.0, this.spotlight_intensity + 0.15);
    }
    
    widen_spotlight() {
        this.spotlight_intensity = Math.max(0.1, this.spotlight_intensity - 0.1);
    }
    
    summary() {
        return `focus=${this.focus} | intensity=${this.spotlight_intensity.toFixed(2)} | shifts=${this.attention_shifts}`;
    }
}

module.exports = { AttentionChamber };