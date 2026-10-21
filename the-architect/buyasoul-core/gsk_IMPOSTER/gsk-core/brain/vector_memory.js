const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class VectorMemory {
    constructor(options = {}) {
        this.memories = [];
        this.vectors = new Map();
        this.dimensions = options.dimensions || 256;
        this.embeddingCache = new Map();
        this.df = {};
        this.totalDocs = 0;
        this.vocab = new Set();
        this._stopWords = new Set([
            'the','a','an','and','or','but','in','on','at','to','for','of','by','with','from',
            'is','are','was','were','be','been','being','have','has','had','do','does','did',
            'will','would','can','could','shall','should','may','might','this','that','these',
            'those','i','me','my','we','our','you','your','he','him','she','her','it','its',
            'they','them','their','what','which','who','whom','when','where','why','how',
            'not','no','nor','so','if','then','else','than','too','very','just','about',
            'also','more','some','any','all','each','every','both','few','most','other'
        ]);
    }

    _tokenize(text) {
        return text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !this._stopWords.has(w));
    }

    _computeTF(tokens) {
        const tf = {};
        for (const token of tokens) {
            tf[token] = (tf[token] || 0) + 1;
        }
        const maxFreq = Math.max(...Object.values(tf), 1);
        for (const token in tf) {
            tf[token] = tf[token] / maxFreq;
        }
        return tf;
    }

    _computeIDF(term) {
        const docCount = this.df[term] || 1;
        return Math.log((this.totalDocs + 1) / (docCount + 1)) + 1;
    }

    _embed(text) {
        const cacheKey = text.substring(0, 200);
        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey);
        }

        const tokens = this._tokenize(text);
        const tf = this._computeTF(tokens);
        const allTokens = [...new Set([...Object.keys(tf), ...this.vocab])];

        const vector = new Float32Array(this.dimensions);
        for (let i = 0; i < this.dimensions; i++) {
            const token = allTokens[i % allTokens.length] || '';
            if (token && tf[token]) {
                const idf = this._computeIDF(token);
                vector[i] = tf[token] * idf;
            } else {
                const seed = [...token].reduce((sum, c) => sum + c.charCodeAt(0), 0) || i;
                vector[i] = Math.sin(seed + i) * 0.01;
            }
        }

        const magnitude = Math.sqrt(Array.from(vector).reduce((sum, v) => sum + v * v, 0));
        for (let i = 0; i < this.dimensions; i++) {
            vector[i] /= magnitude || 1;
        }

        this.embeddingCache.set(cacheKey, vector);
        if (this.embeddingCache.size > 1000) {
            const firstKey = this.embeddingCache.keys().next().value;
            this.embeddingCache.delete(firstKey);
        }

        return vector;
    }

    _updateDF(text) {
        const tokens = [...new Set(this._tokenize(text))];
        for (const token of tokens) {
            this.df[token] = (this.df[token] || 0) + 1;
            this.vocab.add(token);
        }
        this.totalDocs++;
    }

    async addMemory(text, metadata = {}) {
        this._updateDF(text);
        const vector = this._embed(text);
        const memory = {
            id: crypto.randomUUID(),
            text,
            vector: Array.from(vector),
            metadata,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now()
        };
        this.memories.push(memory);
        this.vectors.set(this.memories.length - 1, vector);
        return memory.id;
    }

    async recall(query, topK = 5, minScore = 0.05) {
        const queryVector = await this._embed(query);
        const scores = this.memories.map((m, i) => ({
            memory: m,
            score: this._cosineSimilarity(queryVector, Array.from(this.vectors.get(i)))
        }));

        const sorted = scores
            .filter(s => s.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        sorted.forEach(s => {
            s.memory.accessCount++;
            s.memory.lastAccessed = Date.now();
        });

        return sorted.map(s => ({
            text: s.memory.text,
            score: s.score,
            metadata: s.memory.metadata,
            id: s.memory.id
        }));
    }

    _cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator > 0 ? dotProduct / denominator : 0;
    }

    async addWithCluster(text, clusterId) {
        return this.addMemory(text, { cluster: clusterId, type: 'clustered' });
    }

    async recallByTime(timeRange) {
        const now = Date.now();
        return this.memories
            .filter(m => now - m.timestamp <= timeRange)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    async recallByMetadata(key, value) {
        return this.memories.filter(m => m.metadata[key] === value);
    }

    persist(filePath) {
        const state = {
            memories: this.memories,
            df: this.df,
            totalDocs: this.totalDocs,
            vocab: [...this.vocab]
        };
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    }

    load(filePath) {
        if (fs.existsSync(filePath)) {
            const state = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.memories = state.memories || [];
            this.df = state.df || {};
            this.totalDocs = state.totalDocs || 0;
            this.vocab = new Set(state.vocab || []);
            for (let i = 0; i < this.memories.length; i++) {
                this.vectors.set(i, Float32Array.from(this.memories[i].vector));
            }
        }
    }

    getStats() {
        return {
            totalMemories: this.memories.length,
            cacheSize: this.embeddingCache.size,
            vocabSize: this.vocab.size,
            avgAccessCount: this.memories.reduce((sum, m) => sum + m.accessCount, 0) / (this.memories.length || 1)
        };
    }
}

module.exports = { VectorMemory };
