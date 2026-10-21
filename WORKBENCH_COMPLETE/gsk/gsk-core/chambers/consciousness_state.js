'use strict';

const { getMythosPhase } = require('../identity/mega_identity.js');

class ConsciousnessState {
    constructor() {
        this.state = 'awake';
        this.awakeCycles = 0;
        this.sleepCycles = 0;
        this.dreamCycles = 0;
        this.sleepThreshold = 100;
        this.dreamThreshold = 50;
        this.lowArousalStreak = 0;
        this.history = [];
    }
    
    breathe(mythosCycles = 0) {
        const phase = getMythosPhase(mythosCycles);
        
        if (phase.name === 'VOID' || phase.name === 'AWAKENING') {
            if (this.state === 'awake') {
                this.awakeCycles++;
                this.lowArousalStreak = 0;
            } else if (this.state === 'sleeping') {
                this.sleepCycles++;
                if (this.sleepCycles > this.dreamThreshold) {
                    this.state = 'dreaming';
                    this.dreamCycles++;
                    this.history.push({ ts: Date.now(), from: 'sleeping', to: 'dreaming' });
                }
            } else if (this.state === 'dreaming') {
                this.dreamCycles++;
                this.lowArousalStreak++;
                if (this.dreamCycles > 80) {
                    this.state = 'awake';
                    this.awakeCycles++;
                    this.history.push({ ts: Date.now(), from: 'dreaming', to: 'awake' });
                }
            }
            
            if (this.state === 'awake' && this.awakeCycles > this.sleepThreshold && this.lowArousalStreak > this.dreamThreshold) {
                this.state = 'sleeping';
                this.sleepCycles = 0;
                this.history.push({ ts: Date.now(), from: 'awake', to: 'sleeping' });
            }
        } else {
            this.state = 'awake';
        }
        
        if (this.history.length > 50) this.history.shift();
        
        return null;
    }
    
    get currentState() {
        return this.state;
    }
    
    forceWake() {
        this.state = 'awake';
        this.awakeCycles++;
        this.sleepCycles = 0;
        this.dreamCycles = 0;
    }
    
    summary() {
        return `state=${this.state} | awake=${this.awakeCycles} | sleeping=${this.sleepCycles} | dreaming=${this.dreamCycles}`;
    }
}

module.exports = { ConsciousnessState };