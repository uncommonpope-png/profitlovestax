'use strict';

/**
 * SESHAT CORE — Indexer
 * Scans Seshat Second Brain markdown, chunks, embeds, stores in LanceDB
 */

const fs = require('fs');
const path = require('path');
const { chunkText, embedBatch } = require('./embedder');
const { upsertVectors, clearTable, getStats } = require('./vectorDB');

// SURGERY 2026-10-20: default brain dir is the workbench-local .seshat-brain
// (was the author's Desktop path). SESHAT_DIR env still overrides.
// (core/ -> seshat/ -> body/ -> profit-brain/ -> workbench/)
const SESHAT_DIR = process.env.SESHAT_DIR || path.join(__dirname, '..', '..', '..', '..', '.seshat-brain');

/**
 * Categorize file by path
 */
function categorizeFile(filePath) {
    const name = path.basename(filePath).toLowerCase();
    const dir = path.dirname(filePath).toLowerCase();
    if (dir.includes('journals') || name.startsWith('202')) return 'journals';
    if (dir.includes('pages')) {
        if (name.includes('soul-gun') || name.includes('soulgun')) return 'soulGuns';
        if (name.includes('soul-note') || name.includes('soulnote')) return 'soulNotes';
        if (name.includes('pattern')) return 'patterns';
        if (name.includes('decision')) return 'decisions';
        return 'pages';
    }
    return 'others';
}

/**
 * Parse markdown frontmatter/meta
 */
function parseMarkdownMeta(content) {
    const meta = {};
    const propRegex = /^([\w\-]+)::\s*(.+)$/gm;
    let match;
    while ((match = propRegex.exec(content)) !== null) {
        meta[match[1]] = match[2].trim();
    }
    return meta;
}

/**
 * Full brain scan → chunk → embed → store
 */
async function indexBrain(options = {}) {
    const { forceReindex = false, batchSize = 16 } = options;

    if (forceReindex) {
        await clearTable();
    }

    console.log('[SESHA] Starting brain index...');
    const start = Date.now();

    if (!fs.existsSync(SESHAT_DIR)) {
        throw new Error(`Seshat directory not found: ${SESHAT_DIR}`);
    }

    // Collect all markdown files (excluding session traces and HOT-DIGEST)
    const mdFiles = [];
    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === 'traces') continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.name.endsWith('.md') && entry.name !== 'HOT-DIGEST.md') {
                mdFiles.push(full);
            }
        }
    }
    walk(SESHAT_DIR);

    console.log(`[SESHA] Found ${mdFiles.length} markdown files`);

    const pendingItems = [];
    let processed = 0;

    for (const filePath of mdFiles) {
        try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            const category = categorizeFile(filePath);
            const relPath = path.relative(SESHAT_DIR, filePath).replace(/\\/g, '/');
            const meta = JSON.stringify({ ...parseMarkdownMeta(content) });

            const chunks = chunkText(content, 512, 50);
            if (chunks.length === 0) continue;

            const mtime = stats.mtime.toISOString();
            for (let i = 0; i < chunks.length; i++) {
                pendingItems.push({
                    text: chunks[i],
                    file: relPath,
                    category,
                    chunkIndex: i,
                    totalChunks: chunks.length,
                    fileSize: stats.size,
                    fileModified: mtime,
                    metadata: meta
                });
            }
            processed++;
        } catch (e) {
            console.error(`[SESHA] Failed to index ${filePath}:`, e.message);
        }
    }

    const totalChunks = pendingItems.length;
    console.log(`[SESHA] Embedding ${totalChunks} chunks from ${processed} files (batchSize=${batchSize})...`);
    const embeddings = await embedBatch(pendingItems.map(p => p.text), batchSize);

    const writeBatchSize = 1000;
    for (let i = 0; i < pendingItems.length; i += writeBatchSize) {
        const records = pendingItems.slice(i, i + writeBatchSize).map((item, j) => ({
            vector: embeddings[i + j],
            ...item
        }));
        await upsertVectors(records);
    }

    const elapsed = Date.now() - start;
    console.log(`[SESHA] Index complete: ${processed} files, ${totalChunks} chunks in ${elapsed}ms`);

    const stats = await getStats();
    console.log('[SESHA] Vector DB stats:', stats);

    return { files: processed, chunks: totalChunks, timeMs: elapsed };
}

/**
 * Incremental update: re-index changed files
 */
async function updateIndex(changedFiles) {
    console.log(`[SESHA] Incremental update for ${changedFiles.length} files`);
    // TODO: implement incremental update
    // For now, just re-index all
    return indexBrain({ forceReindex: true });
}

module.exports = {
    indexBrain,
    updateIndex,
    categorizeFile,
    parseMarkdownMeta
};
