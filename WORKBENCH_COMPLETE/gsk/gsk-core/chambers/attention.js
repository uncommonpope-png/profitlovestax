'use strict';

class Attention {
    constructor(kernel) {
        this.kernel = kernel;
        this.attentional_focus = 'internal_state'; // What GSK is currently attending to
        this.focus_history = []; // History of attentional shifts
        this.maintenance_level = 0.5; // How well attention is maintained (0-1)
        this.reorientation_cost = 0; // Cost associated with shifting attention
        this.salience_threshold = 0.3; // Minimum salience for a percept to grab attention

        // References to other chambers/systems
        this.affect = this.kernel.chambers?.affect;
        this.memory = this.kernel.memory;
        this.thalamicGate = this.kernel.thalamicGate; // Reference to the ThalamicGate
    }

    breathe() {
        return this.tick();
    }

    /**
     * Updates the attentional focus based on internal and external cues.
     * Called by MegaChambers.breathe()
     */
    tick() {
        // Example: Shift attention to high-arousal events or unmet needs
        const arousal = this.affect?.getArousal?.() || 0.5;
        const mood = this.affect?.mood || 'neutral';
        
        let newFocus = this.attentional_focus;

        if (arousal > 0.7 && mood === 'distressed') {
            newFocus = 'threat_assessment';
        } else if (arousal > 0.6 && mood === 'excited') {
            newFocus = 'novelty_exploration';
        } else if (this.memory?.getRecentEvents?.()?.some(e => e.type === 'unexpected_stimulus')) {
            newFocus = 'unexpected_stimulus_analysis';
        }

        if (this.thalamicGate && typeof this.thalamicGate.getHighestSaliencePercept === 'function') {
            const highSaliencePercept = this.thalamicGate.getHighestSaliencePercept();
            const target = highSaliencePercept?.focusTarget || highSaliencePercept?.source || highSaliencePercept?.type;
            if (highSaliencePercept && target && highSaliencePercept.salience > this.salience_threshold && target !== this.attentional_focus) {
                newFocus = target;
            }
        }
        
        if (newFocus !== this.attentional_focus) {
            this.reorient(newFocus);
        } else {
            this.maintenance_level = Math.min(1, this.maintenance_level + 0.01); // Strengthen maintenance
            this.reorientation_cost = 0;
        }
    }

    /**
     * Redirection of attentional focus.
     * @param {string} newFocus The new target of attention.
     */
    reorient(newFocus) {
        if (newFocus === this.attentional_focus) return;

        console.log(`[Attention] Reorienting focus from '${this.attentional_focus}' to '${newFocus}'`);
        this.focus_history.push({ from: this.attentional_focus, to: newFocus, timestamp: Date.now() });
        this.attentional_focus = newFocus;
        this.maintenance_level = 0.1; // Reset maintenance
        this.reorientation_cost = 0.1; // Indicate a cost for reorientation

        // Update ThalamicGate if available
        if (this.thalamicGate) {
            this.thalamicGate.directAttention(newFocus);
        }
    }

    /**
     * Gets the current attentional state.
     */
    summary() { // Renamed from getStatus() for consistency with other chambers
        return {
            attentional_focus: this.attentional_focus,
            maintenance_level: this.maintenance_level,
            reorientation_cost: this.reorientation_cost,
            focus_history: this.focus_history.slice(-5)
        };
    }
}

module.exports = { Attention };
