const { tokenize, ngrams, cosineSimilarity, fuzzyScore } = require('./utils');
const { KnowledgeBase } = require('./knowledge');

class BrainEngine {
    constructor() {
        this.knowledge = new KnowledgeBase();
        this.contextMemory = [];
        this.maxMemory = 100;
        this.nGramModel = {};
        this.nGramOrder = 3;
        this.bootTime = Date.now();
        this.stats = { totalQueries: 0, localHits: 0, llmCalls: 0, apisCalled: 0, learnedItems: 0 };
        this.personality = 'curious, knowledgeable, thoughtful';
        this.conversationHistory = [];
        this.maxHistory = 50;
        this.seedNGrams();

        // ─── NEW: Vector Memory ──────────────────────────────────────
        this.vectorMemory = [];       // { id, text, vec, type, ts }
        this.maxVectorMemory = 5000;
        this.vectorHitThreshold = 0.3;

        // ─── NEW: Response Cache ─────────────────────────────────────
        this.responseCache = new Map();
        this.maxCacheSize = 500;

        // ─── NEW: Skill Registry ─────────────────────────────────────
        this.skills = null;
    }

    // ─── VECTOR MEMORY ──────────────────────────────────────────────

    _textToVector(text) {
        const tokens = tokenize(text.toLowerCase());
        const vec = {};
        for (const t of tokens) {
            if (t.length < 2) continue;
            vec[t] = (vec[t] || 0) + 1;
        }
        // Normalize
        const mag = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0));
        if (mag > 0) for (const k in vec) vec[k] /= mag;
        return vec;
    }

    _vectorCosine(vecA, vecB) {
        let dot = 0, magA = 0, magB = 0;
        const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
        for (const k of allKeys) {
            const a = vecA[k] || 0;
            const b = vecB[k] || 0;
            dot += a * b;
            magA += a * a;
            magB += b * b;
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
    }

    remember(text, type = 'episodic', metadata = null) {
        const vec = this._textToVector(text);
        const entry = { id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text, vec, type, ts: Date.now(), metadata, accessCount: 0 };
        this.vectorMemory.push(entry);
        if (this.vectorMemory.length > this.maxVectorMemory) this.vectorMemory.shift();
        return entry;
    }

    recall(query, limit = 5, minScore = 0.15) {
        const qVec = this._textToVector(query);
        const scored = [];
        for (const mem of this.vectorMemory) {
            const score = this._vectorCosine(qVec, mem.vec);
            if (score >= minScore) scored.push({ ...mem, score });
        }
        scored.sort((a, b) => b.score - a.score);
        const results = scored.slice(0, limit);
        for (const r of results) r.accessCount = (r.accessCount || 0) + 1;
        return results;
    }

    getVectorMemoryStats() {
        return {
            totalMemories: this.vectorMemory.length,
            types: this.vectorMemory.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {}),
            oldest: this.vectorMemory.length > 0 ? this.vectorMemory[0].ts : null,
            newest: this.vectorMemory.length > 0 ? this.vectorMemory[this.vectorMemory.length - 1].ts : null
        };
    }

    // ─── RESPONSE CACHE ─────────────────────────────────────────────

    _cacheKey(question, context) {
        const ctx = (context || '').slice(0, 100);
        return question.toLowerCase().trim().slice(0, 200) + '|' + ctx;
    }

    _getCached(question, context) {
        const key = this._cacheKey(question, context);
        const cached = this.responseCache.get(key);
        if (cached && (Date.now() - cached.ts) < 3600000) { // 1 hour TTL
            cached.hits = (cached.hits || 0) + 1;
            return cached.response;
        }
        return null;
    }

    _setCached(question, context, response) {
        const key = this._cacheKey(question, context);
        this.responseCache.set(key, { response, ts: Date.now(), hits: 1 });
        if (this.responseCache.size > this.maxCacheSize) {
            // Evict oldest
            const oldest = this.responseCache.entries().next().value;
            if (oldest) this.responseCache.delete(oldest[0]);
        }
    }

    getCacheStats() {
        return { size: this.responseCache.size, maxSize: this.maxCacheSize };
    }

    // ─── EXISTING METHODS ───────────────────────────────────────────

    seedNGrams() {
        const corpus = [];
        for (const [cat, entries] of Object.entries(this.knowledge.data)) {
            if (cat === 'meta' || !Array.isArray(entries)) continue;
            for (const entry of entries) {
                corpus.push(entry.q + ' ' + (entry.a || ''));
            }
        }
        const seedText = corpus.join('. ');
        const tokens = tokenize(seedText);
        for (let n = 2; n <= this.nGramOrder; n++) {
            const grams = ngrams(tokens, n);
            for (const gram of grams) {
                if (!this.nGramModel[n]) this.nGramModel[n] = {};
                if (!this.nGramModel[n][gram]) this.nGramModel[n][gram] = 0;
                this.nGramModel[n][gram]++;
            }
        }
    }

    learnFromText(text) {
        const tokens = tokenize(text);
        for (let n = 2; n <= this.nGramOrder; n++) {
            const grams = ngrams(tokens, n);
            for (const gram of grams) {
                if (!this.nGramModel[n]) this.nGramModel[n] = {};
                if (!this.nGramModel[n][gram]) this.nGramModel[n][gram] = 0;
                this.nGramModel[n][gram]++;
            }
        }
        this.stats.learnedItems++;
    }

    generateText(seed, maxTokens = 30) {
        const tokens = tokenize(seed);
        const result = [...tokens];
        for (let i = 0; i < maxTokens; i++) {
            const context = result.slice(-(this.nGramOrder - 1)).join(' ');
            const candidates = [];
            for (const [gram, count] of Object.entries(this.nGramModel[this.nGramOrder] || {})) {
                const parts = gram.split(' ');
                const prefix = parts.slice(0, -1).join(' ');
                if (prefix === context) {
                    candidates.push({ word: parts[parts.length - 1], count });
                }
            }
            if (candidates.length === 0) break;
            const totalWeight = candidates.reduce((s, c) => s + c.count, 0);
            let r = Math.random() * totalWeight;
            let nextWord = null;
            for (const c of candidates) {
                r -= c.count;
                if (r <= 0) { nextWord = c.word; break; }
            }
            if (!nextWord) break;
            result.push(nextWord);
        }
        return result.join(' ');
    }

    // ─── ENHANCED QUERY ────────────────────────────────────────────
    // Uses: cache → vector memory → knowledge base → skills → n-gram

    query(input, conversation = []) {
        this.stats.totalQueries++;
        const q = input.toLowerCase().trim();
        if (!q) return { answer: 'Please ask me something!', source: 'local', confidence: 0 };

        // 1. Check cache
        const cached = this._getCached(q, conversation.slice(-2).map(m => m.content || '').join(' '));
        if (cached) {
            return { answer: cached, source: 'cache', confidence: 0.8 };
        }

        // 2. Search vector memory
        const memories = this.recall(q, 3);
        if (memories.length > 0 && memories[0].score > this.vectorHitThreshold) {
            const best = memories[0];
            this.stats.localHits++;
            const ctx = this.addToContext(q, best.text);
            this._setCached(q, '', best.text);
            return {
                answer: best.text,
                source: 'memory:' + best.type,
                confidence: best.score,
                context: ctx,
                memorySource: best
            };
        }

        // 3. Search knowledge base
        const knowledgeResults = this.knowledge.search(q);
        if (knowledgeResults.length > 0 && knowledgeResults[0].score > 1.5) {
            const best = knowledgeResults[0];
            this.stats.localHits++;
            const ctx = this.addToContext(q, best.entry.a);
            const response = best.entry.a;
            this._setCached(q, '', response);
            this.remember(q + ' ' + response, 'knowledge');
            return {
                answer: response,
                source: best.category,
                confidence: Math.min(1, best.score / 5),
                context: ctx,
                followup: this.generateFollowup(best.entry)
            };
        }

        // 4. Search learned entries
        for (const entry of this.knowledge.learned) {
            const score = fuzzyScore(q, entry.q + ' ' + entry.a);
            if (score > 0.6) {
                this.stats.localHits++;
                const ctx = this.addToContext(q, entry.a);
                this._setCached(q, '', entry.a);
                return { answer: entry.a, source: 'learned', confidence: score, context: ctx };
            }
        }

        // 5. Generate text from n-gram
        const genText = this.generateText(q, 15);
        if (genText && genText.length > q.length + 5) {
            this.stats.localHits++;
            const ctx = this.addToContext(q, genText);
            this._setCached(q, '', genText);
            return { answer: genText, source: 'n-gram', confidence: 0.4, context: ctx };
        }

        return null;
    }

    addToContext(q, a) {
        const ctx = { q, a, ts: Date.now() };
        this.contextMemory.push(ctx);
        if (this.contextMemory.length > this.maxMemory) this.contextMemory.shift();
        this.conversationHistory.push({ role: 'user', content: q });
        this.conversationHistory.push({ role: 'assistant', content: a });
        if (this.conversationHistory.length > this.maxHistory * 2) this.conversationHistory = this.conversationHistory.slice(-this.maxHistory * 2);
        return ctx;
    }

    generateFollowup(entry) {
        const topics = entry.tags || [];
        if (topics.length === 0) return null;
        const related = this.knowledge.search(topics[0]);
        const filtered = related.filter(r => r.entry.q !== entry.q);
        if (filtered.length > 0) return filtered[0].entry.q;
        return null;
    }

    getRecentContext(count = 5) {
        return this.conversationHistory.slice(-count * 2);
    }

    learn(question, answer) {
        this.knowledge.learn(question, answer);
        this.learnFromText(question + ' ' + answer);
        this.stats.learnedItems++;
        // Also store in vector memory
        this.remember(question + ' ' + answer, 'learned');
        return this.knowledge.learned.length;
    }

    getStatus() {
        return {
            uptime: Math.floor((Date.now() - this.bootTime) / 1000),
            totalQueries: this.stats.totalQueries,
            localHits: this.stats.localHits,
            llmCalls: this.stats.llmCalls,
            apisCalled: this.stats.apisCalled,
            learnedItems: this.stats.learnedItems,
            knowledgeEntries: this.knowledge.stats.entries,
            learnedEntries: this.knowledge.learned.length,
            nGramSize: Object.keys(this.nGramModel[this.nGramOrder] || {}).length,
            contextMemorySize: this.contextMemory.length,
            conversationHistory: this.conversationHistory.length,
            vectorMemory: this.vectorMemory.length,
            cacheSize: this.responseCache.size
        };
    }

    getLearningCurve() {
        return {
            learnedItems: this.stats.learnedItems,
            nGramGrowth: Object.keys(this.nGramModel[this.nGramOrder] || {}).length,
            contextMemory: this.contextMemory.length,
            vectorMemory: this.vectorMemory.length,
            localHitRate: this.stats.totalQueries > 0 ? (this.stats.localHits / this.stats.totalQueries * 100).toFixed(1) + '%' : '0%',
            totalQueries: this.stats.totalQueries
        };
    }

    resetLearned() {
        const count = this.knowledge.learned.length;
        this.knowledge.learned = [];
        this.stats.learnedItems = 0;
        this.vectorMemory = [];
        this.responseCache.clear();
        return count;
    }
}

module.exports = { BrainEngine };
