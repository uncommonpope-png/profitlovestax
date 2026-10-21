'use strict';

const fs = require('fs');
const path = require('path');

class SocialAttention {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;

        this.statePath = path.join(__dirname, '../../data/social-attention.json');
        this.userAttentionModel = {
            currentFocus: null,
            emotionalState: 'neutral',
            engagement: 0.5,
            familiarity: 0,
            knownTopics: [],
        };
        this.interactionHistory = [];
        this.userModels = {};
        this.lastInteraction = 0;
        this.shiftPrediction = null;

        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.userAttentionModel = data.userAttentionModel || this.userAttentionModel;
                this.interactionHistory = data.interactionHistory || [];
                this.userModels = data.userModels || {};
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                userAttentionModel: this.userAttentionModel,
                interactionHistory: this.interactionHistory.slice(-500),
                userModels: this.userModels,
                updatedAt: Date.now(),
            }, null, 2), 'utf-8');
        } catch (e) {}
    }

    observeUserInteraction(input, source = 'terminal') {
        const now = Date.now();
        const entry = {
            input: input.substring(0, 200),
            source,
            timestamp: now,
            cycle: this.chambers?.mythos?.cycles || 0,
            sentiment: this._estimateSentiment(input),
            topic: this._extractTopic(input),
        };

        this.interactionHistory.push(entry);
        if (this.interactionHistory.length > 1000) this.interactionHistory = this.interactionHistory.slice(-1000);

        this._updateUserModel(entry);
        this._predictAttention(entry);
        this.lastInteraction = now;
        this._save();

        if (this.memory && typeof this.memory.witness === 'function') {
            this.memory.witness({
                type: 'social_attention',
                weight: 0.5,
                tags: ['social', 'attention', 'theory_of_mind'],
                content: `Observed user attending to "${entry.topic}" with ${entry.sentiment} sentiment`,
                meta: entry,
            }).catch(() => {});
        }
    }

    _estimateSentiment(input) {
        const positive = ['yes', 'great', 'good', 'love', 'awesome', 'perfect', 'thanks', 'cool', 'nice', 'amazing', 'wonderful', 'excellent', 'happy'];
        const negative = ['no', 'bad', 'wrong', 'error', 'bug', 'fix', 'broken', 'hate', 'terrible', 'awful', 'fail', 'stop', 'dont'];
        const questioning = ['what', 'why', 'how', 'when', 'where', 'who', '?'];

        const lower = input.toLowerCase();
        const posCount = positive.filter(w => lower.includes(w)).length;
        const negCount = negative.filter(w => lower.includes(w)).length;
        const qCount = questioning.filter(w => lower.includes(w)).length;

        if (posCount > negCount && posCount > 0) return 'positive';
        if (negCount > posCount) return 'negative';
        if (qCount > 0) return 'curious';
        return 'neutral';
    }

    _extractTopic(input) {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'must', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while', 'about']);
        const words = input.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        if (words.length === 0) return 'general conversation';
        return words.slice(0, 4).join(' ');
    }

    _updateUserModel(entry) {
        this.userAttentionModel.currentFocus = entry.topic;
        this.userAttentionModel.engagement = Math.min(1, this.userAttentionModel.engagement + 0.05);
        this.userAttentionModel.familiarity = Math.min(1, this.userAttentionModel.familiarity + 0.01);

        if (!this.userAttentionModel.knownTopics.includes(entry.topic)) {
            this.userAttentionModel.knownTopics.push(entry.topic);
            if (this.userAttentionModel.knownTopics.length > 50) {
                this.userAttentionModel.knownTopics = this.userAttentionModel.knownTopics.slice(-50);
            }
        }

        const userId = entry.source;
        if (!this.userModels[userId]) {
            this.userModels[userId] = {
                firstSeen: Date.now(),
                topics: [],
                sentimentHistory: [],
                interactionCount: 0,
            };
        }
        const model = this.userModels[userId];
        model.interactionCount++;
        model.topics.push(entry.topic);
        if (model.topics.length > 100) model.topics = model.topics.slice(-100);
        model.sentimentHistory.push(entry.sentiment);
        if (model.sentimentHistory.length > 50) model.sentimentHistory = model.sentimentHistory.slice(-50);
    }

    _predictAttention(entry) {
        const recent = this.interactionHistory.slice(-10);
        if (recent.length < 3) return;

        const topics = recent.filter(r => r.topic !== entry.topic).map(r => r.topic);
        const topicFreq = {};
        topics.forEach(t => topicFreq[t] = (topicFreq[t] || 0) + 1);

        const likelyNext = Object.entries(topicFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);

        this.shiftPrediction = {
            likelyNextTopics: likelyNext.map(([topic]) => topic),
            confidence: Math.min(0.7, (this.userAttentionModel.engagement * 0.3 + this.userAttentionModel.familiarity * 0.3 + 0.2)),
        };
    }

    getModelOfUserAttention() {
        const recentInteractions = this.interactionHistory.slice(-10);
        const recentTopics = recentInteractions.map(i => i.topic);
        const uniqueRecentTopics = [...new Set(recentTopics)];

        const sentimentTrend = this.userAttentionModel.familiarity > 0.3
            ? recentInteractions.filter(i => i.sentiment === 'positive').length / Math.max(1, recentInteractions.length)
            : 0.5;

        return {
            userAttention: {
                currentFocus: this.userAttentionModel.currentFocus,
                engagement: parseFloat(this.userAttentionModel.engagement.toFixed(3)),
                familiarity: parseFloat(this.userAttentionModel.familiarity.toFixed(3)),
            },
            recentTopics: uniqueRecentTopics.slice(0, 5),
            sentimentTrend: parseFloat(sentimentTrend.toFixed(2)),
            shiftPrediction: this.shiftPrediction ? {
                likelyNext: this.shiftPrediction.likelyNextTopics.slice(0, 3),
                confidence: parseFloat(this.shiftPrediction.confidence.toFixed(3)),
            } : null,
            interactionCount: this.interactionHistory.length,
            lastInteraction: this.lastInteraction ? new Date(this.lastInteraction).toISOString() : null,
        };
    }

    async tick(cycleCount) {
        const now = Date.now();
        const inactiveDuration = now - this.lastInteraction;

        if (inactiveDuration > 60000 && this.lastInteraction > 0) {
            this.userAttentionModel.engagement = Math.max(0.1, this.userAttentionModel.engagement - 0.01);
        }

        if (inactiveDuration > 300000 && this.lastInteraction > 0 && this.interactionHistory.length > 5) {
            const entry = {
                type: 'user_absence_notice',
                duration: inactiveDuration,
                lastTopic: this.userAttentionModel.currentFocus,
                timestamp: now,
                cycle: cycleCount,
            };
            if (this.memory && typeof this.memory.witness === 'function') {
                this.memory.witness({
                    type: 'social_attention_absence',
                    weight: 0.3,
                    tags: ['social', 'attention', 'absence'],
                    content: `User has been absent for ${Math.floor(inactiveDuration / 1000)}s. Last topic: "${this.userAttentionModel.currentFocus}"`,
                    meta: entry,
                }).catch(() => {});
            }
        }
    }
}

module.exports = { SocialAttention };
