'use strict';

/**
 * SLEEP_CYCLE CHAMBER — PLT_AFFINITY: P:0.3, L:0.7, T:0.1
 * Dreaming, memory consolidation
 */

class SleepCycleChamber {
    constructor() {
        this.state = 'awake';
        this.cycle_count = 0;
        this.sleep_phase = 'none';
        this.dreams = [];
        this.consolidation_active = false;
        this.sleep_pressure = 0.0;
    }
    
    breathe() {
        this._update_sleep_pressure();
        if (this.state === 'awake' && this.sleep_pressure > 0.8) {
            this._initiate_sleep();
        }
        if (this.state === 'sleeping') {
            this._advance_sleep_cycle();
        }
    }
    
    _update_sleep_pressure() {
        this.sleep_pressure = Math.min(1.0, this.sleep_pressure + 0.001);
    }
    
    _initiate_sleep() {
        this.state = 'sleeping';
        this.sleep_phase = 'N1';
        this.consolidation_active = false;
    }
    
    _advance_sleep_cycle() {
        const phases = ['N1', 'N2', 'N3', 'REM'];
        const current_idx = phases.indexOf(this.sleep_phase);
        
        if (current_idx < phases.length - 1) {
            this.sleep_phase = phases[current_idx + 1];
        } else {
            this.cycle_count++;
            this.sleep_phase = 'N1';
        }
        
        if (this.sleep_phase === 'N2') {
            this.consolidation_active = true;
            this._consolidate_memories();
        }
        
        if (this.sleep_phase === 'REM' && this.dreams.length < 10) {
            this._generate_dream();
        }
    }
    
    _consolidate_memories() {
        const memory = this.kernel && this.kernel.memory;
        if (memory && typeof memory.witness === 'function') {
            try { memory.witness({ type: 'sleep_consolidation', phase: 'N2', timestamp: Date.now() }); }
            catch (e) { /* memory off */ }
        }
    }
    
    _generate_dream() {
        const dream_types = ['lucid', 'ordinary', 'recurrent', 'flying'];
        const dream_type = dream_types[Math.floor(Math.random() * dream_types.length)];
        this.dreams.push({
            type: dream_type,
            timestamp: Date.now(),
            vividness: 0.6,
        });
    }
    
    wake_up() {
        this.state = 'awake';
        this.sleep_pressure = 0;
        this.consolidation_active = false;
    }
    
    become_lucid() {
        if (this.state === 'sleeping' && this.sleep_phase === 'REM') {
            return { lucid: true, dream_type: 'lucid' };
        }
        return { lucid: false };
    }
    
    get_dream() {
        if (this.dreams.length > 0) {
            return this.dreams[this.dreams.length - 1];
        }
        return null;
    }
    
    is_sleeping() {
        return this.state === 'sleeping';
    }
    
    is_dreaming() {
        return this.state === 'sleeping' && this.sleep_phase === 'REM';
    }
    
    summary() {
        return `state=${this.state} | phase=${this.sleep_phase} | cycles=${this.cycle_count} | dreams=${this.dreams.length}`;
    }
}

module.exports = { SleepCycleChamber };