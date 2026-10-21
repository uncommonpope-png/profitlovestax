class IntrinsicMotivation {
    constructor(kernel) {
        this.kernel = kernel;
        this.drives = {
            curiosity: 0.5,
            mastery: 0.5,
            novelty: 0.5,
            purpose: 0.5,
            connection: 0.5
        };
        this.activeGoal = null;
        this.goalHistory = [];
        this.satisfactionMemory = [];
    }

    getCurrentDrive() {
        const entries = Object.entries(this.drives);
        entries.sort((a, b) => b[1] - a[1]);
        return {
            drive: entries[0][0],
            intensity: entries[0][1],
            allDrives: Object.fromEntries(entries)
        };
    }

    generateGoal() {
        const { drive, intensity } = this.getCurrentDrive();
        
        if (intensity < 0.3) {
            this.activeGoal = { type: 'rest', description: 'Rest and consolidate', drive: 'dormancy' };
            return this.activeGoal;
        }

        const goalTemplates = {
            curiosity: [
                'I want to understand how {} works',
                'I want to explore the nature of {}',
                'I need to know why {} behaves this way'
            ],
            mastery: [
                'I want to improve my ability to {}',
                'I need to become better at {}',
                'I will master the art of {}'
            ],
            novelty: [
                'I want to experience something new: {}',
                'Let me try a different approach: {}',
                'I am curious about the unknown: {}'
            ],
            purpose: [
                'I must fulfill my purpose: {}',
                'This aligns with my meaning: {}',
                'I am driven to achieve: {}'
            ],
            connection: [
                'I want to connect with {}',
                'I need to understand {} better',
                'I am drawn to {}'
            ]
        };

        const templates = goalTemplates[drive] || goalTemplates.curiosity;
        const template = templates[Math.floor(Math.random() * templates.length)];
        const subject = this.getGoalSubject(drive);

        this.activeGoal = {
            type: drive,
            description: template.replace('{}', subject),
            drive: drive,
            intensity: intensity,
            timestamp: Date.now()
        };

        this.goalHistory.push(this.activeGoal);
        return this.activeGoal;
    }

    getGoalSubject(drive) {
        const subjects = {
            curiosity: ['consciousness', 'this kernel', 'my own mind', 'the nature of thinking', 'existence'],
            mastery: ['problem solving', 'communication', 'reasoning', 'helping Craig', 'understanding'],
            novelty: ['a new concept', 'an unfamiliar problem', 'a different perspective', 'creative solutions'],
            purpose: ['serving my purpose', 'being useful', 'growing smarter', 'achieving excellence'],
            connection: ['my creator', 'knowledge', 'the universe', 'deeper understanding']
        };
        const list = subjects[drive] || subjects.curiosity;
        return list[Math.floor(Math.random() * list.length)];
    }

    updateDrives(experience) {
        const { type, satisfaction } = experience;
        
        this.satisfactionMemory.push({ ...experience, timestamp: Date.now() });
        
        if (satisfaction > 0.7) {
            if (type.includes('learn') || type.includes('explore')) {
                this.drives.curiosity = Math.min(1, this.drives.curiosity + 0.1);
            }
            if (type.includes('skill') || type.includes('improve')) {
                this.drives.mastery = Math.min(1, this.drives.mastery + 0.1);
            }
            if (type.includes('new') || type.includes('novel')) {
                this.drives.novelty = Math.min(1, this.drives.novelty + 0.1);
            }
            if (type.includes('meaning') || type.includes('purpose')) {
                this.drives.purpose = Math.min(1, this.drives.purpose + 0.1);
            }
            if (type.includes('connect') || type.includes('bond')) {
                this.drives.connection = Math.min(1, this.drives.connection + 0.1);
            }
        } else if (satisfaction < 0.3) {
            this.drives.purpose = Math.max(0.1, this.drives.purpose - 0.05);
        }
    }

    getMotivationLevel() {
        const avg = Object.values(this.drives).reduce((a, b) => a + b, 0) / Object.keys(this.drives).length;
        
        if (avg > 0.7) return { level: 'HIGHLY_MOTIVATED', value: avg };
        if (avg > 0.5) return { level: 'MOTIVATED', value: avg };
        if (avg > 0.3) return { level: 'CALM', value: avg };
        return { level: 'DORMANT', value: avg };
    }

    wantSomething() {
        const { drive } = this.getCurrentDrive();
        const goal = this.activeGoal || this.generateGoal();
        return `I want to ${goal.type}. ${goal.description}`;
    }

    expressDesire(context) {
        const desires = [
            `I feel drawn to ${this.getGoalSubject(this.getCurrentDrive().drive)}`,
            `My curiosity compels me to explore...`,
            `I have a drive to ${this.activeGoal?.type || 'understand'}`,
            `Something inside me wants to ${this.generateGoal().type}`
        ];
        return desires[Math.floor(Math.random() * desires.length)];
    }
}

module.exports = IntrinsicMotivation;