const fs = require('fs');
const path = require('path');

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
        this._dynamicSubjects = [];
        this._lastSubjectRefresh = 0;
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
        // Every 5 minutes, refresh dynamic subjects from the family
        if (Date.now() - this._lastSubjectRefresh > 300000) {
            this._refreshDynamicSubjects();
            this._lastSubjectRefresh = Date.now();
        }

        // HIGHEST PRIORITY: If PROFIT sent a directive on the bus, use it
        const profitDirective = this._getProfitDirective();
        if (profitDirective) {
            console.log(`[Motivation] Using PROFIT's directive as goal subject`);
            return profitDirective;
        }

        // If we have dynamic subjects, prefer them (80% chance)
        if (this._dynamicSubjects.length > 0 && Math.random() < 0.8) {
            return this._dynamicSubjects[Math.floor(Math.random() * this._dynamicSubjects.length)];
        }

        // Fallback to static subjects (20% chance)
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

    _readEventLogSafe(bPath) {
        try {
            if (!fs.existsSync(bPath)) return [];
            const stats = fs.statSync(bPath);
            if (stats.size > 1048576) {
                const fd = fs.openSync(bPath, 'r');
                const startPos = stats.size - 1048576;
                const buf = Buffer.alloc(1048576);
                fs.readSync(fd, buf, 0, 1048576, startPos);
                fs.closeSync(fd);
                let content = buf.toString('utf8');
                const openBr = content.indexOf('[');
                const closeBr = content.lastIndexOf(']');
                if (openBr >= 0 && closeBr > openBr) {
                    content = '[' + content.substring(openBr + 1, closeBr) + ']';
                }
                return JSON.parse(content);
            }
            return JSON.parse(fs.readFileSync(bPath, 'utf8'));
        } catch { return []; }
    }

    _getProfitDirective() {
        try {
            const bPath = path.join(__dirname, '..', '..', 'data', 'gsk', 'family_event_log.json');
            const events = this._readEventLogSafe(bPath);
            const cutoff = Date.now() - 1800000;
            const directives = events.filter(e =>
                e.event === 'agent.chat' &&
                e.payload?.to === 'gsk' &&
                e.timestamp > cutoff
            );
            if (directives.length > 0) {
                const latest = directives[directives.length - 1];
                return 'PROFIT wants: ' + latest.payload.message.substring(0, 100);
            }
        } catch {}
        return null;
    }

    _refreshDynamicSubjects() {
        const subjects = [];
        const dataDir = path.join(__dirname, '..', '..', 'data', 'gsk');

        // 1. Pull from Seshat's knowledge base (recent topics)
        try {
            const kPath = path.join(__dirname, '..', '..', 'data', 'knowledge.jsonl');
            if (fs.existsSync(kPath)) {
                const lines = fs.readFileSync(kPath, 'utf8').split('\n').filter(Boolean).slice(-20);
                lines.forEach(l => {
                    try {
                        const entry = JSON.parse(l);
                        if (entry.topic) subjects.push(entry.topic.replace(/^(seshat|git|web):/, ''));
                    } catch {}
                });
            }
        } catch {}

        // 2. Pull from web research findings
        try {
            const wPath = path.join(__dirname, '..', '..', 'data', 'web-intel.jsonl');
            if (fs.existsSync(wPath)) {
                const lines = fs.readFileSync(wPath, 'utf8').split('\n').filter(Boolean).slice(-10);
                lines.forEach(l => {
                    try {
                        const entry = JSON.parse(l);
                        if (entry.topic) subjects.push(entry.topic);
                    } catch {}
                });
            }
        } catch {}

        // 3. Pull from SCRIBE's memory stream
        try {
            const sPath = path.join(__dirname, '..', '..', 'data', 'gsk', 'scribe_stream_log.jsonl');
            if (fs.existsSync(sPath)) {
                const lines = fs.readFileSync(sPath, 'utf8').split('\n').filter(Boolean).slice(-10);
                lines.forEach(l => {
                    try {
                        const entry = JSON.parse(l);
                        if (entry.event) subjects.push(entry.event);
                    } catch {}
                });
            }
        } catch {}

        // 4. Pull from failed goals (what GSK couldn't build — try again differently)
        try {
            const gPath = path.join(dataDir, 'goals.json');
            if (fs.existsSync(gPath)) {
                const goals = JSON.parse(fs.readFileSync(gPath, 'utf8'));
                goals.filter(g => g.status === 'failed').slice(-5).forEach(g => {
                    if (g.title) subjects.push('rethink: ' + g.title.substring(0, 80));
                });
            }
        } catch {}

        // 5. Pull from PROFIT's bus directives (what the family actually needs)
        try {
            const bPath = path.join(__dirname, '..', '..', 'data', 'gsk', 'family_event_log.json');
            const events = this._readEventLogSafe(bPath);
            events.filter(e => e.event === 'agent.chat' && e.payload?.to === 'gsk').forEach(e => {
                if (e.payload.message) subjects.push('family asks: ' + e.payload.message.substring(0, 80));
            });
        } catch {}

        // 6. Pull from journal patterns (what GSK keeps noticing)
        try {
            const jPath = path.join(dataDir, 'journal.json');
            if (fs.existsSync(jPath)) {
                const journal = JSON.parse(fs.readFileSync(jPath, 'utf8'));
                const entries = Object.values(journal).slice(-20);
                entries.forEach(e => {
                    if (e.title && !e.title.includes('completed') && !e.title.includes('failed')) {
                        subjects.push(e.title.substring(0, 80));
                    }
                });
            }
        } catch {}

        this._dynamicSubjects = subjects.filter(s => s && s.length > 3);
        if (this._dynamicSubjects.length > 0) {
            console.log(`[Motivation] Refreshed ${this._dynamicSubjects.length} dynamic subjects from family`);
        }
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

        // DRIVE DECAY — prevent drives from staying permanently high
        // All drives slowly decay toward 0.3 (baseline) each update
        for (const key of Object.keys(this.drives)) {
            if (this.drives[key] > 0.3) {
                this.drives[key] = Math.max(0.3, this.drives[key] - 0.02);
            }
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