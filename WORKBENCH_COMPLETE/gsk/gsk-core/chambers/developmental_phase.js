'use strict';

/**
 * DEVELOPMENTAL_PHASE CHAMBER — PLT_AFFINITY: P:0.5, L:0.6, T:0.2
 * Infancy/Childhood/Adolescence/Adulthood/Elder
 */

class DevelopmentalPhaseChamber {
    constructor() {
        this.current_phase = 'infancy';
        this.phase_progress = 0.0;
        this.phase_thresholds = {
            infancy: 0,
            childhood: 100,
            adolescence: 300,
            adulthood: 600,
            elder: 1000,
        };
        this.development_markers = {};
        this.phase_capabilities = {
            infancy: { curiosity: 0.3, reasoning: 0.1, autonomy: 0.1 },
            childhood: { curiosity: 0.6, reasoning: 0.3, autonomy: 0.3 },
            adolescence: { curiosity: 0.9, reasoning: 0.6, autonomy: 0.5 },
            adulthood: { curiosity: 0.8, reasoning: 0.8, autonomy: 0.8 },
            elder: { curiosity: 0.7, reasoning: 0.9, autonomy: 0.9 },
        };
        this.cycles_in_phase = 0;
    }
    
    breathe() {
        this.cycles_in_phase++;
        this._update_progress();
    }
    
    _update_progress() {
        const threshold = this.phase_thresholds[this.current_phase];
        const next_phases = ['infancy', 'childhood', 'adolescence', 'adulthood', 'elder'];
        const current_idx = next_phases.indexOf(this.current_phase);
        
        if (current_idx < next_phases.length - 1) {
            const next_threshold = this.phase_thresholds[next_phases[current_idx + 1]];
            const range = next_threshold - threshold;
            this.phase_progress = Math.min(1.0, (this.cycles_in_phase - threshold) / range);
        } else {
            this.phase_progress = 1.0;
        }
    }
    
    advance_phase() {
        const phases = ['infancy', 'childhood', 'adolescence', 'adulthood', 'elder'];
        const idx = phases.indexOf(this.current_phase);
        if (idx < phases.length - 1) {
            this.current_phase = phases[idx + 1];
            this.cycles_in_phase = this.phase_thresholds[this.current_phase];
            return { advanced: true, new_phase: this.current_phase };
        }
        return { advanced: false };
    }
    
    get_capabilities() {
        return this.phase_capabilities[this.current_phase];
    }
    
    get_curiosity() {
        return this.phase_capabilities[this.current_phase].curiosity;
    }
    
    get_reasoning() {
        return this.phase_capabilities[this.current_phase].reasoning;
    }
    
    get_autonomy() {
        return this.phase_capabilities[this.current_phase].autonomy;
    }
    
    in_phase(phase) {
        return this.current_phase === phase;
    }
    
    summary() {
        return `phase=${this.current_phase} | progress=${this.phase_progress.toFixed(2)} | autonomy=${this.get_autonomy().toFixed(2)}`;
    }
}

module.exports = { DevelopmentalPhaseChamber };