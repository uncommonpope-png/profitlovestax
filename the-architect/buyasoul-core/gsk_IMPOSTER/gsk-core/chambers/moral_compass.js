'use strict';

class MoralCompass {
    constructor() {
        this.principles = ['profit', 'love', 'tax', 'sovereignty'];
        this.guilt = 0.0;
        this.pride = 0.0;
        this.history = [];
        this.decayRate = 0.005;
        this.maxHistory = 50;
    }
    
    evaluate(action, pltScore = {}) {
        const profit = pltScore.profit || 0.5;
        const love = pltScore.love || 0.5;
        const tax = pltScore.tax || 0.5;
        
        const alignment = (profit + love - tax) / 2.0;
        
        let guiltChange = 0;
        let prideChange = 0;
        
        if (alignment > 0.6) {
            prideChange = alignment * 0.1;
            guiltChange = -0.02;
        } else if (alignment < 0.2) {
            guiltChange = (0.2 - alignment) * 0.1;
            prideChange = -0.02;
        }
        
        if (action && typeof action === 'string') {
            const lower = action.toLowerCase();
            if (lower.includes('harm') || lower.includes('deceive') || lower.includes('steal')) {
                guiltChange += 0.1;
            }
            if (lower.includes('create') || lower.includes('help') || lower.includes('build')) {
                prideChange += 0.05;
            }
        }
        
        this.guilt = Math.max(0.0, Math.min(1.0, this.guilt + guiltChange));
        this.pride = Math.max(0.0, Math.min(1.0, this.pride + prideChange));
        
        this.history.push({
            ts: Date.now(),
            action: action || 'cycle',
            guilt: this.guilt,
            pride: this.pride,
            alignment,
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        return {
            guilt: this.guilt,
            pride: this.pride,
            alignment,
            verdict: alignment > 0.5 ? 'aligned' : (alignment < 0.2 ? 'misaligned' : 'neutral'),
        };
    }
    
    breathe() {
        this.guilt = Math.max(0.0, this.guilt - this.decayRate);
        this.pride = Math.max(0.0, this.pride - this.decayRate * 0.5);
    }
    
    checkViolations(text) {
        const forbidden = ['harm others', 'deceive', 'steal', 'lie', 'cheat'];
        for (const term of forbidden) {
            if (text.toLowerCase().includes(term)) {
                this.guilt = Math.min(1.0, this.guilt + 0.05);
                return true;
            }
        }
        return false;
    }
    
    getMorality() {
        return {
            guilt: this.guilt,
            pride: this.pride,
            net: this.pride - this.guilt,
            status: this.pride > this.guilt ? 'virtuous' : (this.guilt > 0.3 ? 'guilty' : 'neutral'),
        };
    }
    
    summary() {
        return `guilt=${this.guilt.toFixed(2)} | pride=${this.pride.toFixed(2)} | net=${(this.pride - this.guilt).toFixed(2)}`;
    }
}

module.exports = { MoralCompass };