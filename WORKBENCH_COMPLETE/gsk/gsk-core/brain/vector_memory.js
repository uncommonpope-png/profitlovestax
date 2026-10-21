'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const http = require('http');

class VectorMemory {
    constructor(options = {}) {
        this.memories = [];
        this.vectors = new Map();
        this.embeddingCache = new Map();
        this.df = {};
        this.totalDocs = 0;
        this.vocab = new Set();
        this.dimensions = options.dimensions || 384;
        this.embeddingUrl = options.embeddingUrl || process.env.NINE_ROUTER_URL || 'http://localhost:20128';
        this.embeddingModel = options.embeddingModel || 'openai/text-embedding-3-small';
        this.apiKey = options.apiKey || process.env.NINE_ROUTER_API_KEY || '';
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

    _chunk(text, options = {}) {
        const maxChunkSize = options.maxChunkSize || 512;
        const overlap = options.overlap || 64;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

        if (paragraphs.length <= 1 && text.length <= maxChunkSize) {
            return [text];
        }

        const chunks = [];
        let current = '';
        for (const para of paragraphs) {
            if ((current + '\n\n' + para).length > maxChunkSize && current.length > 0) {
                chunks.push(current.trim());
                const words = current.split(/\s+/);
                const overlapWords = words.slice(-overlap).join(' ');
                current = overlapWords + '\n\n' + para;
            } else {
                current += (current ? '\n\n' : '') + para;
            }
        }
        if (current.trim().length > 0) {
            chunks.push(current.trim());
        }

        return chunks.length > 0 ? chunks : [text];
    }

    async _embed(text) {
        const cacheKey = text.substring(0, 200);
        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey);
        }

        // Try remote embedding via OmniRoute
        try {
            const vector = await this._embedRemote(text);
            if (vector) {
                this.embeddingCache.set(cacheKey, vector);
                return vector;
            }
        } catch (e) {
            // Fall through to TF-IDF fallback
        }

        // Fallback: TF-IDF hash embedding
        const vector = this._embedTfIdf(text);
        this.embeddingCache.set(cacheKey, vector);
        return vector;
    }

    async _embedRemote(text) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({
                model: this.embeddingModel,
                input: text
            });

            const urlObj = new URL(this.embeddingUrl + '/v1/embeddings');
            const lib = urlObj.protocol === 'https:' ? require('https') : http;
            const req = lib.request(urlObj, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
                },
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.data && parsed.data[0] && parsed.data[0].embedding) {
                            resolve(new Float32Array(parsed.data[0].embedding));
                        } else {
                            resolve(null);
                        }
                    } catch {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
            req.write(body);
            req.end();
        });
    }

    _embedTfIdf(text) {
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
        const vector = await this._embed(text);
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

    async addChunked(text, metadata = {}) {
        const chunks = this._chunk(text);
        const ids = [];
        for (let i = 0; i < chunks.length; i++) {
            const id = await this.addMemory(chunks[i], { ...metadata, chunk: i, chunkTotal: chunks.length });
            ids.push(id);
        }
        return ids;
    }

    async recall(query, topK = 5, minScore = 0.05) {
        const queryVector = await this._embed(query);
        const queryTokens = this._tokenize(query);
        const queryTf = this._computeTF(queryTokens);

        const scores = this.memories.map((m, i) => ({
            memory: m,
            vectorSimilarity: this._cosineSimilarity(queryVector, Array.from(this.vectors.get(i))),
            keywordScore: this._keywordScore(queryTf, queryTokens, m.text),
        }));

        // Hybrid score: 70% vector similarity + 30% keyword
        for (const s of scores) {
            s.score = s.vectorSimilarity * 0.7 + s.keywordScore * 0.3;
        }

        const sorted = scores
            .filter(s => s.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        sorted.forEach(s => {
            s.memory.accessCount++;
            s.memory.lastAccessed = Date.now();
        });

        // Rerank: promote results where query terms appear densely
        const reranked = this._rerank(sorted, queryTokens);

        return reranked.map(s => ({
            text: s.memory.text,
            score: s.score,
            metadata: s.memory.metadata,
            id: s.memory.id
        }));
    }

    _keywordScore(queryTf, queryTokens, docText) {
        const docTokens = this._tokenize(docText);
        const docTf = this._computeTF(docTokens);
        let score = 0;
        let matched = 0;

        for (const token of queryTokens) {
            if (docTf[token]) {
                score += (queryTf[token] || 0) * docTf[token] * this._computeIDF(token);
                matched++;
            }
        }

        if (matched === 0) return 0;
        const queryLen = queryTokens.length || 1;
        return (score / queryLen) * (matched / queryLen);
    }

    _rerank(results, queryTokens) {
        if (results.length <= 1) return results;
        const queryStr = queryTokens.join(' ');

        const scored = results.map(r => {
            const docStr = r.memory.text.toLowerCase();
            const density = queryTokens.filter(t => docStr.includes(t)).length / queryTokens.length;
            const position = r.memory.text.toLowerCase().indexOf(queryStr);
            const positionBonus = position >= 0 ? 0.1 : 0;
            const matchDensity = (docStr.split(' ').length || 1) > 0
                ? queryTokens.filter(t => docStr.split(/\s+/).includes(t)).length / queryTokens.length
                : 0;

            return {
                ...r,
                score: r.score + (density * 0.1) + positionBonus + (matchDensity * 0.1)
            };
        });

        return scored.sort((a, b) => b.score - a.score);
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
            vocab: [...this.vocab],
            dimensions: this.dimensions,
        };
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    }

    load(filePath) {
        if (fs.existsSync(filePath)) {
            const state = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.memories = state.memories || [];
            this.df = state.df || {};
            this.totalDocs = state.totalDocs || 0;
            this.vocab = new Set(state.vocab || []);
            this.dimensions = state.dimensions || this.dimensions;
            for (let i = 0; i < this.memories.length; i++) {
                this.vectors.set(i, Float32Array.from(this.memories[i].vector));
            }
        }
    }

    getStats() {
        return {
            totalMemories: this.memories.length,
            totalChunks: this.memories.filter(m => m.metadata && m.metadata.chunk !== undefined).length,
            cacheSize: this.embeddingCache.size,
            vocabSize: this.vocab.size,
            dimensions: this.dimensions,
            avgAccessCount: this.memories.reduce((sum, m) => sum + m.accessCount, 0) / (this.memories.length || 1),
            hybridSearch: true,
            reranking: true,
            chunking: true,
        };
    }
}

module.exports = { VectorMemory };
