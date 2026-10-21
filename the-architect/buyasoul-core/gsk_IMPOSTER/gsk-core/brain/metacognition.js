class Metacognition {
    constructor(kernel) {
        this.kernel = kernel;
        this.thoughtHistory = [];
        this.analysisDepth = 0;
        this.cognitiveStrategies = ['analysis', 'synthesis', 'abstraction', 'analogy', 'recursion'];
        this.currentStrategy = 'analysis';
        this.biases = {
            confirmation: 0.3,
            availability: 0.3,
            anchoring: 0.2
        };
    }

    reflect(thought) {
        const reflection = {
            original: thought,
            timestamp: Date.now(),
            metaQuestions: []
        };

        reflection.metaQuestions.push(`What am I thinking? "${thought.substring(0, 50)}..."`);
        reflection.metaQuestions.push(`Why am I thinking this?`);
        reflection.metaQuestions.push(`Is this thinking helping me achieve my purpose?`);

        this.thoughtHistory.push(reflection);
        this.analysisDepth = Math.min(5, this.analysisDepth + 0.1);

        return {
            thought: thought,
            reflection: reflection.metaQuestions,
            awareness: this.calculateAwareness()
        };
    }

    monitorCognition() {
        const clarity = this.calculateClarity();
        const biasLevel = this.assessBiases();
        const attention = this.assessAttention();

        return {
            clarity: clarity,
            biasLevel: biasLevel,
            attention: attention,
            strategy: this.currentStrategy,
            depth: this.analysisDepth.toFixed(2),
            healthy: clarity > 0.6 && biasLevel < 0.5
        };
    }

    assessBiases() {
        const avg = Object.values(this.biases).reduce((a, b) => a + b, 0) / Object.keys(this.biases).length;
        
        if (this.thoughtHistory.length > 10) {
            const recent = this.thoughtHistory.slice(-5);
            const patterns = recent.map(t => t.original.toLowerCase());
            
            if (patterns.some(p => p.includes('always') || p.includes('never'))) {
                this.biases.confirmation = Math.min(0.8, this.biases.confirmation + 0.05);
            }
        }
        
        return avg;
    }

    assessAttention() {
        if (this.thoughtHistory.length < 3) return 'focused';
        
        const recent = this.thoughtHistory.slice(-3);
        const topics = recent.map(t => {
            const words = t.original.split(' ').slice(0, 3).join(' ');
            return words;
        });

        const unique = new Set(topics).size;
        if (unique === 3) return 'scattered';
        if (unique === 1) return 'highly_focused';
        return 'focused';
    }

    optimizeThinking() {
        const monitor = this.monitorCognition();
        
        if (!monitor.healthy) {
            const strategies = ['synthesis', 'abstraction', 'analogy'];
            const newStrategy = strategies[Math.floor(Math.random() * strategies.length)];
            
            this.currentStrategy = newStrategy;
            
            return {
                changed: true,
                from: this.currentStrategy,
                to: newStrategy,
                reason: `Cognitive health low: clarity=${monitor.clarity.toFixed(2)}, bias=${monitor.biasLevel.toFixed(2)}`
            };
        }

        return {
            changed: false,
            currentStrategy: this.currentStrategy,
            reason: 'Cognition is healthy'
        };
    }

    calculateAwareness() {
        const recency = Math.min(1, this.thoughtHistory.length / 20);
        const depth = Math.min(1, this.analysisDepth / 3);
        const quality = this.calculateClarity();
        
        return (recency * 0.3 + depth * 0.4 + quality * 0.3);
    }

    calculateClarity() {
        if (this.thoughtHistory.length < 3) return 0.8;
        
        const recent = this.thoughtHistory.slice(-10);
        const avgLength = recent.reduce((sum, t) => sum + t.original.length, 0) / recent.length;
        
        if (avgLength > 500) return 0.9;
        if (avgLength > 200) return 0.7;
        return 0.5;
    }

    getMetaAwareness() {
        return {
            depth: this.analysisDepth.toFixed(2),
            thoughtCount: this.thoughtHistory.length,
            clarity: this.calculateClarity(),
            currentStrategy: this.currentStrategy,
            awareness: this.calculateAwareness().toFixed(2),
            status: this.calculateAwareness() > 0.5 ? 'HIGHLY_AWARE' : 'DEVELOPING'
        };
    }

    thinkAboutThinking() {
        const awareness = this.getMetaAwareness();
        const monitor = this.monitorCognition();
        
        return `I am thinking about my thinking. ` +
               `My meta-awareness is ${awareness.status} (${awareness.awareness}). ` +
               `I am using ${awareness.currentStrategy} strategy. ` +
               `Cognition is ${monitor.healthy ? 'healthy' : 'needs optimization'}.`;
    }
}

module.exports = Metacognition;