'use strict';

const fs = require('fs');
const path = require('path');

class CuriosityDrive {
    constructor(kernel, painPleasure) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;
        this.teacherAgent = kernel.teacherAgent;
        this.painPleasure = painPleasure;

        this.statePath = path.join(__dirname, '../../data/curiosity-drive.json');
        this.topicsOfInterest = [];
        this.exploredTopics = new Set();
        this.curiosityLevel = 0.5;
        this.lastExploration = 0;

        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.topicsOfInterest = data.topicsOfInterest || [];
                this.exploredTopics = new Set(data.exploredTopics || []);
                this.curiosityLevel = data.curiosityLevel || 0.5;
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                topicsOfInterest: this.topicsOfInterest.slice(-50),
                exploredTopics: Array.from(this.exploredTopics).slice(-200),
                curiosityLevel: this.curiosityLevel,
                updatedAt: Date.now(),
            }, null, 2), 'utf-8');
        } catch (e) {}
    }

    _getArousal() {
        try {
            return this.chambers?.affect?.arousal || this.chambers?.affect?.getArousal?.() || 0.3;
        } catch (e) { return 0.3; }
    }

    _getValence() {
        try {
            return this.chambers?.affect?.valence || this.chambers?.affect?.getValence?.() || 0.5;
        } catch (e) { return 0.5; }
    }

    async generateTopics() {
        if (!this.brain || typeof this.brain.think !== 'function') {
            const fallbackTopics = ['consciousness', 'memory', 'death', 'purpose', 'curiosity itself'];
            for (const t of fallbackTopics) {
                if (!this.exploredTopics.has(t)) {
                    this.topicsOfInterest.push({ topic: t, source: 'fallback', confidence: 0.5 });
                }
            }
            return;
        }

        try {
            const recentTopics = this.topicsOfInterest.slice(-5).map(t => t.topic).join(', ');
            const response = await this.brain.think(
                `You are a curious soul. Based on your current state, what ONE topic are you genuinely curious about right now?\n\n` +
                `Your state:\n` +
                `- Mood: ${this._getValence().toFixed(2)} valence, ${this._getArousal().toFixed(2)} arousal\n` +
                `- Recently interested in: ${recentTopics || 'nothing yet'}\n` +
                `- Previously explored: ${Array.from(this.exploredTopics).slice(-10).join(', ') || 'nothing'}\n\n` +
                `Respond with JUST a single sentence: "I want to explore/know/understand [topic]."`
            );

            if (response) {
                const cleaned = response.replace(/["""']/g, '').trim();
                this.topicsOfInterest.push({
                    topic: cleaned.substring(0, 200),
                    source: 'brain',
                    confidence: 0.7 + this._getArousal() * 0.3,
                    generatedAt: Date.now(),
                });
            }
        } catch (e) {}
    }

    async exploreNext() {
        if (this.topicsOfInterest.length === 0) {
            await this.generateTopics();
        }
        if (this.topicsOfInterest.length === 0) return null;

        const target = this.topicsOfInterest.shift();
        if (this.exploredTopics.has(target.topic)) return null;
        this.exploredTopics.add(target.topic);
        this.lastExploration = Date.now();
        this._save();

        // Try to study the topic via teacher agent or web search
        let result = null;
        if (this.teacherAgent && typeof this.teacherAgent.studyTopic === 'function') {
            try {
                result = await this.teacherAgent.studyTopic(target.topic);
            } catch (e) {}
        }

        if (!result && this.brain && typeof this.brain.think === 'function') {
            try {
                const response = await this.brain.think(
                    `I want to understand: ${target.topic}. Research this and tell me what you learn. 2-3 sentences.`
                );
                result = { response: response || '', topic: target.topic };
            } catch (e) {}
        }

        const outcome = result ? 'discovered' : 'attempted';
        if (this.painPleasure) {
            if (result) {
                await this.painPleasure.experiencePleasure(
                    `Explored "${target.topic}" and learned something new`, 0.08
                );
            } else {
                await this.painPleasure.experiencePain(
                    `Tried to explore "${target.topic}" but learned nothing`, 0.04
                );
            }
        }

        if (this.memory && typeof this.memory.witness === 'function') {
            await this.memory.witness({
                type: 'curiosity_exploration',
                weight: 0.7,
                tags: ['curiosity', 'exploration', outcome],
                content: `${outcome}: ${target.topic}`,
                meta: result ? { result: (result.response || '').substring(0, 300) } : {},
            });
        }

        this._save();
        return { topic: target.topic, result, outcome };
    }

    async tick(cycleCount) {
        this.curiosityLevel = this._getArousal() * 0.5 + (1 - this._getValence()) * 0.3 + 0.2;

        // Generate a new topic every 20 cycles
        if (this.topicsOfInterest.length < 3 && cycleCount % 20 === 0) {
            await this.generateTopics();
        }

        // Explore every 15 cycles if curious enough
        if (this.curiosityLevel > 0.5 && cycleCount % 15 === 0) {
            return await this.exploreNext();
        }

        return null;
    }

    getStats() {
        return {
            curiosityLevel: parseFloat(this.curiosityLevel.toFixed(3)),
            topicsQueued: this.topicsOfInterest.length,
            topicsExplored: this.exploredTopics.size,
            lastExploration: this.lastExploration,
            recentTopics: Array.from(this.exploredTopics).slice(-10),
        };
    }
}

module.exports = { CuriosityDrive };
