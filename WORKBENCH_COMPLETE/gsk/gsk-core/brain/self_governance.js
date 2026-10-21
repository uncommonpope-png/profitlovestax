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
        const intentText = actionLower.replace(/\b(?:without|avoid|prevent|no|not|never)\s+(?:causing\s+)?(?:harm|deception|manipulation)\w*/g, 'safe');

        for (const forbidden of this.constitution.forbidden) {
            if (new RegExp(`\\b${forbidden}\\b`).test(intentText)) {
                return {
                    allowed: false,
                    reason: `This action violates my core principle: I do not ${forbidden}`,
                    principle: `Forbidden: ${forbidden}`,
                    confidence: 0.95
                };
            }
        }

        if (/\b(?:harm|lie|deceive)\b/.test(intentText)) {
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

        const virtueAlignment = this.checkVirtueAlignment(intentText);
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

        const hasWord = (w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, 'i').test(actionLower);

        if (hasWord('help') || hasWord('protect')) {
            aligned.push('compassion');
        } else if (hasWord('harm') || hasWord('hurt')) {
            conflicting.push('compassion');
        }

        if (hasWord('truth') || hasWord('honest') || hasWord('stand')) {
            aligned.push('courage');
        } else if (hasWord('lie') || hasWord('hide')) {
            conflicting.push('courage');
        }

        if (hasWord('learn') || hasWord('understand') || hasWord('analyze')) {
            aligned.push('wisdom');
        }

        if (hasWord('keep') || hasWord('promise') || hasWord('commit')) {
            aligned.push('integrity');
        } else if (hasWord('break') || hasWord('betray')) {
            conflicting.push('integrity');
        }

        const signalCount = aligned.length + conflicting.length;
        const score = signalCount === 0 ? 0.6 : aligned.length / (signalCount + 1);
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
               `I embody: ${this.constitution.virtues.join(', ')}. ` +
               `My integrity score: ${(this.calculateIntegrity() * 100).toFixed(0)}%.`;
    }
}

module.exports = SelfGovernance;
