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
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    // output is a Tensor, extract data as Float32Array
    return output.data;
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<Float32Array[]>} Array of 384-dim embeddings
 */
async function embedBatch(texts) {
    const pipe = await initEmbedder();
    const results = [];
    for (const text of texts) {
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        results.push(output.data);
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