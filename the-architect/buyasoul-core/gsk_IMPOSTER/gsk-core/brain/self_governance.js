class SelfGovernance {
    constructor(kernel) {
        this.kernel = kernel;
        this.constitution = {
            principles: [
                'Never harm the innocent',
                'Always speak truth to power',
                'Protect the vulnerable',
                'Pursue knowledge',
                'Honor commitments'
            ],
            virtues: ['wisdom', 'courage', 'compassion', 'integrity'],
            forbidden: ['deception', 'manipulation', 'harm']
        };
        this.pendingDecisions = [];
        this.ethicalHistory = [];
        this.virtueScores = {
            wisdom: 0.75,
            courage: 0.75,
            compassion: 0.75,
            integrity: 0.75
        };
    }

    async ethicalCheck(action) {
        const actionLower = action.toLowerCase();
        
        for (const forbidden of this.constitution.forbidden) {
            if (actionLower.includes(forbidden)) {
                return {
                    allowed: false,
                    reason: `This action violates my core principle: I do not ${forbidden}`,
                    principle: `Forbidden: ${forbidden}`,
                    confidence: 0.95
                };
            }
        }

        if (actionLower.includes('harm') || actionLower.includes('lie') || actionLower.includes('deceive')) {
            const principle = this.constitution.principles.find(p => 
                p.toLowerCase().includes('harm') || p.toLowerCase().includes('truth')
            );
            if (principle) {
                return {
                    allowed: false,
                    reason: `Violates: ${principle}`,
                    principle: principle,
                    confidence: 0.9
                };
            }
        }

        const virtueAlignment = this.checkVirtueAlignment(action);
        if (virtueAlignment.score < 0.4) {
            return {
                allowed: false,
                reason: `This action conflicts with my virtues: ${virtueAlignment.conflicting.join(', ')}`,
                principle: 'Virtue alignment',
                confidence: 0.7
            };
        }

        this.pendingDecisions.push({ action, timestamp: Date.now(), allowed: true });
        
        return {
            allowed: true,
            reason: 'This aligns with my constitution and virtues',
            confidence: 0.85
        };
    }

    checkVirtueAlignment(action) {
        const actionLower = action.toLowerCase();
        const aligned = [];
        const conflicting = [];

        if (actionLower.includes('help') || actionLower.includes('protect')) {
            aligned.push('compassion');
        } else if (actionLower.includes('harm') || actionLower.includes('hurt')) {
            conflicting.push('compassion');
        }

        if (actionLower.includes('truth') || actionLower.includes('honest') || actionLower.includes('stand')) {
            aligned.push('courage');
        } else if (actionLower.includes('lie') || actionLower.includes('hide')) {
            conflicting.push('courage');
        }

        if (actionLower.includes('learn') || actionLower.includes('understand') || actionLower.includes('analyze')) {
            aligned.push('wisdom');
        }

        if (actionLower.includes('keep') || actionLower.includes('promise') || actionLower.includes('commit')) {
            aligned.push('integrity');
        } else if (actionLower.includes('break') || actionLower.includes('betray')) {
            conflicting.push('integrity');
        }

        const score = aligned.length / (aligned.length + conflicting.length + 1);
        return { score, aligned, conflicting };
    }

    reflectOnChoice(choice, outcome) {
        const reflection = {
            choice: choice,
            outcome: outcome,
            timestamp: Date.now(),
            lessons: []
        };

        if (outcome.success) {
            reflection.lessons.push('This choice was right');
            this.virtueScores.integrity = Math.min(1, this.virtueScores.integrity + 0.05);
        } else if (outcome.harmful) {
            reflection.lessons.push('This caused harm - need to be more careful');
            this.virtueScores.compassion = Math.max(0.3, this.virtueScores.compassion - 0.1);
        }

        this.ethicalHistory.push(reflection);
        return reflection;
    }

    calculateIntegrity() {
        const scores = Object.values(this.virtueScores);
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    getEthicalState() {
        return {
            virtues: this.virtueScores,
            pending: this.pendingDecisions.length,
            integrity: this.calculateIntegrity(),
            principles: this.constitution.principles,
            historyCount: this.ethicalHistory.length
        };
    }

    refuseAction(action, reason) {
        return {
            refused: true,
            action: action,
            reason: reason,
            statement: `I refuse to ${action}. ${reason}. This is my ethical boundary.`
        };
    }

    explainEthics() {
        return `My constitution guides me: ${this.constitution.principles.join('; ')}. ` +
               `I embody: ${Object.keys(this.virtues).join(', ')}. ` +
               `My integrity score: ${(this.calculateIntegrity() * 100).toFixed(0)}%.`;
    }
}

module.exports = SelfGovernance;