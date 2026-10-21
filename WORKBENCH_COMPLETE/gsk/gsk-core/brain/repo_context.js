'use strict';

/**
 * RepoContext — Repository-scale context for GSK (Kimi parity)
 *
 * Ingests entire codebase (up to 200K tokens), semantic chunking,
 * embedding-based retrieval for brain.think()
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class RepoContext {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.maxTokens = options.maxTokens || 200000;
        this.chunkSize = options.chunkSize || 2000; // chars per chunk
        this.chunkOverlap = options.chunkOverlap || 200;
        this.indexDir = options.indexDir || path.join(__dirname, '../../data/repo_context');
        this.embeddingModel = options.embeddingModel || 'local'; // 'local' | 'omniroute'

        if (!fs.existsSync(this.indexDir)) {
            fs.mkdirSync(this.indexDir, { recursive: true });
        }

        this.fileIndex = new Map(); // filePath -> { chunks[], hash, indexedAt }
        this.vectorIndex = null; // Will be initialized on first index
    }

    /**
     * Index a project root for retrieval
     */
    async indexProject(projectRoot, options = {}) {
        const force = options.force || false;
        const filePaths = this._discoverFiles(projectRoot, options.extensions);

        console.log(`[RepoContext] Indexing ${filePaths.length} files from ${projectRoot}`);

        let indexed = 0;
        let skipped = 0;

        for (const filePath of filePaths) {
            const relativePath = path.relative(projectRoot, filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            const hash = crypto.createHash('sha256').update(content).digest('hex');

            // Check if already indexed with same content
            const existing = this.fileIndex.get(relativePath);
            if (!force && existing && existing.hash === hash) {
                skipped++;
                continue;
            }

            const chunks = this._chunkContent(content, relativePath);
            this.fileIndex.set(relativePath, { chunks, hash, indexedAt: Date.now() });
            indexed++;
        }

        // Rebuild vector index
        await this._buildVectorIndex();

        console.log(`[RepoContext] Indexed ${indexed} files, skipped ${skipped}, total chunks: ${this._totalChunks()}`);
        return { indexed, skipped, totalFiles: this.fileIndex.size, totalChunks: this._totalChunks() };
    }

    /**
     * Get relevant files for a query (semantic search)
     */
    async getRelevantFiles(query, options = {}) {
        const maxTokens = options.maxTokens || 50000;
        const maxFiles = options.maxFiles || 20;

        // If no vector index, fall back to keyword search
        if (!this.vectorIndex || this.vectorIndex.length === 0) {
            return this._keywordSearch(query, maxFiles, maxTokens);
        }

        // Get query embedding (placeholder - would use real embeddings)
        const queryVector = await this._getEmbedding(query);

        // Find similar chunks
        const results = this.vectorIndex
            .map((item, idx) => ({
                ...item,
                similarity: this._cosineSimilarity(queryVector, item.vector)
            }))
            .filter(r => r.similarity > 0.3)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxFiles * 3); // Get extra for file dedup

        // Group by file, take best chunks per file
        const fileGroups = new Map();
        for (const result of results) {
            if (!fileGroups.has(result.filePath)) {
                fileGroups.set(result.filePath, []);
            }
            fileGroups.get(result.filePath).push(result);
        }

        // Select top files and their best chunks
        const selectedFiles = Array.from(fileGroups.entries())
            .sort((a, b) => b[1][0].similarity - a[1][0].similarity)
            .slice(0, maxFiles);

        let totalTokens = 0;
        const context = [];

        for (const [filePath, chunks] of selectedFiles) {
            const fileContent = chunks
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3) // Top 3 chunks per file
                .map(c => `=== ${filePath} (chunk ${c.chunkIndex}) ===\n${c.content}`)
                .join('\n\n');

            const estTokens = Math.ceil(fileContent.length / 4);
            if (totalTokens + estTokens > maxTokens) break;

            context.push({ filePath, content: fileContent, similarity: chunks[0].similarity, estTokens });
            totalTokens += estTokens;
        }

        return { files: context, totalTokens, query };
    }

    /**
     * Get full file content by path
     */
    getFile(filePath, projectRoot) {
        const fullPath = path.join(projectRoot, filePath);
        if (!fs.existsSync(fullPath)) return null;
        return fs.readFileSync(fullPath, 'utf-8');
    }

    /**
     * List all indexed files
     */
    listFiles() {
        return Array.from(this.fileIndex.entries()).map(([filePath, data]) => ({
            filePath,
            chunks: data.chunks.length,
            indexedAt: data.indexedAt,
            hash: data.hash
        }));
    }

    // Private methods

    _discoverFiles(root, extensions = ['.js', '.ts', '.json', '.md', '.html', '.css', '.py', '.rs', '.go', '.java']) {
        const files = [];
        const walk = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    // Skip node_modules, .git, dist, build
                    if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'data'].includes(entry.name)) {
                        walk(full);
                    }
                } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(full);
                }
            }
        };
        walk(root);
        return files;
    }

    _chunkContent(content, filePath) {
        const chunks = [];
        let start = 0;
        let chunkIndex = 0;

        while (start < content.length) {
            const end = Math.min(start + this.chunkSize, content.length);
            const chunk = content.slice(start, end);
            chunks.push({
                filePath,
                chunkIndex,
                content: chunk,
                startChar: start,
                endChar: end,
                vector: null // Will be filled by _buildVectorIndex
            });
            start += this.chunkSize - this.chunkOverlap;
            chunkIndex++;
        }
        return chunks;
    }

    async _buildVectorIndex() {
        console.log('[RepoContext] Building vector index...');
        const allChunks = [];

        for (const [filePath, data] of this.fileIndex) {
            for (const chunk of data.chunks) {
                // Get embedding (placeholder - real implementation would call embedding model)
                chunk.vector = await this._getEmbedding(chunk.content);
                allChunks.push(chunk);
            }
        }

        this.vectorIndex = allChunks;
        console.log(`[RepoContext] Vector index built with ${allChunks.length} chunks`);
    }

    async _getEmbedding(text) {
        // Placeholder: random vector for now
        // Real implementation: call OmniRoute embeddings or local model
        const dim = 384; // all-MiniLM-L6-v2 dimension
        const vector = new Array(dim).fill(0).map(() => Math.random() - 0.5);

        // Normalize
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        return vector.map(v => v / norm);
    }

    _cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        let sum = 0;
        for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
        return sum;
    }

    _keywordSearch(query, maxFiles, maxTokens) {
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const results = [];

        for (const [filePath, data] of this.fileIndex) {
            let score = 0;
            for (const chunk of data.chunks) {
                const lower = chunk.content.toLowerCase();
                for (const kw of keywords) {
                    score += (lower.match(new RegExp(kw, 'g')) || []).length;
                }
            }
            if (score > 0) {
                results.push({ filePath, score, chunks: data.chunks });
            }
        }

        results.sort((a, b) => b.score - a.score);

        let totalTokens = 0;
        const context = [];

        for (const result of results.slice(0, maxFiles)) {
            const fileContent = result.chunks
                .slice(0, 5)
                .map((c, i) => `=== ${result.filePath} (chunk ${i}) ===\n${c.content}`)
                .join('\n\n');

            const estTokens = Math.ceil(fileContent.length / 4);
            if (totalTokens + estTokens > maxTokens) break;

            context.push({ filePath, content: fileContent, score: result.score, estTokens });
            totalTokens += estTokens;
        }

        return { files: context, totalTokens, query, method: 'keyword' };
    }

    _totalChunks() {
        let count = 0;
        for (const data of this.fileIndex.values()) {
            count += data.chunks.length;
        }
        return count;
    }
}

module.exports = { RepoContext };