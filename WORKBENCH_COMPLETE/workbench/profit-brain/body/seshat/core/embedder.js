'use strict';

/**
 * SESHAT CORE — Embedder Module
 * Local embeddings via Transformers.js (ONNX, CPU)
 * Model: all-MiniLM-L6-v2 (22M params, 384 dim, fast)
 */

const { env, pipeline } = require('@xenova/transformers');
const path = require('path');

// Allow remote download on first run, then cache locally
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.cacheDir = path.join(__dirname, '..', '..', '..', '..', '.transformers-cache');

let embedder = null;

/**
 * Initialize the embedding pipeline (loads ONNX model)
 */
async function initEmbedder() {
    if (embedder) return embedder;

    console.log('[SESHA] Loading embedding model (all-MiniLM-L6-v2)...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
        device: 'cpu'
    });
    console.log('[SESHA] Embedder ready');
    return embedder;
}

/**
 * Generate embeddings for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<Float32Array>} 384-dim embedding
 */
async function embedText(text) {
    const pipe = await initEmbedder();
    const output = await pipe(String(text || '').slice(0, 2400), { pooling: 'mean', normalize: true, truncation: true });
    // output is a Tensor, extract data as Float32Array
    return output.data;
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<Float32Array[]>} Array of 384-dim embeddings
 */
async function embedBatch(texts, batchSize = 16) {
    if (!texts || texts.length === 0) return [];
    const pipe = await initEmbedder();
    // Sort indices by bounded text length to minimize padding waste and cap peak RAM
    const bounded = texts.map(t => String(t || '').slice(0, 2400));
    const order = bounded.map((t, idx) => ({ idx, len: t.length })).sort((a, b) => a.len - b.len);
    const results = new Array(texts.length);
    for (let i = 0; i < order.length; i += batchSize) {
        const slice = order.slice(i, i + batchSize);
        const batchTexts = slice.map(o => bounded[o.idx]);
        const output = await pipe(batchTexts, { pooling: 'mean', normalize: true, truncation: true });
        const dim = output.dims[output.dims.length - 1];
        for (let j = 0; j < slice.length; j++) {
            results[slice[j].idx] = output.data.slice(j * dim, (j + 1) * dim);
        }
        if ((i + slice.length) % 1024 < batchSize || i + slice.length === order.length) {
            console.log(`[SESHA] Embedded ${i + slice.length}/${order.length} chunks`);
        }
    }
    return results;
}

/**
 * Chunk text into ~512 token windows with overlap
 * @param {string} text - Full text to chunk
 * @param {number} chunkSize - Target tokens per chunk (approx)
 * @param {number} overlap - Overlap tokens between chunks
 * @returns {string[]} Text chunks
 */
function chunkText(text, chunkSize = 512, overlap = 50) {
    // Simple word-based chunking (approximate tokens)
    const words = text.split(/\s+/);
    const chunks = [];
    let i = 0;
    while (i < words.length) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim().length > 20) { // skip tiny chunks
            chunks.push(chunk);
        }
        i += chunkSize - overlap;
    }
    return chunks;
}

module.exports = {
    initEmbedder,
    embedText,
    embedBatch,
    chunkText
};
