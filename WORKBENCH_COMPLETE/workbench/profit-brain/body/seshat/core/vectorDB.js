'use strict';

/**
 * SESHAT CORE — Vector DB Module
 * Embedded LanceDB (no server, pure JS)
 */

const lancedb = require('@lancedb/lancedb');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', '..', '..', '.seshat-vectors');
const TABLE_NAME = 'seshat_memory';

let db = null;
let table = null;

/**
 * Initialize LanceDB connection and table
 */
async function initVectorDB() {
    if (db && table) return table;
    
    console.log('[SESHA] Opening LanceDB at', DB_PATH);
    db = await lancedb.connect(DB_PATH);
    
    // Check if table exists
    const tableNames = await db.tableNames();
    if (tableNames.includes(TABLE_NAME)) {
        table = await db.openTable(TABLE_NAME);
        console.log('[SESHA] Opened existing table:', TABLE_NAME);
    } else {
        // Table will be created on first upsert (schema inferred from fixed fields)
        console.log('[SESHA] Table will be created on first insert:', TABLE_NAME);
    }
    
    return table;
}

/**
 * Insert or update embeddings with metadata
 * @param {Array} records - Array of { vector: Float32Array, text: string, file, category, chunkIndex, totalChunks, fileSize, fileModified, metadata: JSON string }
 */
async function upsertVectors(records) {
    let t = await initVectorDB();
    if (!t) {
        // Create table on first insert with inferred schema
        const data = records.map(r => ({
            vector: Array.from(r.vector),
            text: r.text,
            file: r.file,
            category: r.category,
            chunkIndex: r.chunkIndex,
            totalChunks: r.totalChunks,
            fileSize: r.fileSize,
            fileModified: r.fileModified,
            metadata: r.metadata
        }));
        table = await db.createTable(TABLE_NAME, data);
        t = table;
        console.log('[SESHA] Created table on first insert:', TABLE_NAME);
    } else {
        const data = records.map(r => ({
            vector: Array.from(r.vector),
            text: r.text,
            file: r.file,
            category: r.category,
            chunkIndex: r.chunkIndex,
            totalChunks: r.totalChunks,
            fileSize: r.fileSize,
            fileModified: r.fileModified,
            metadata: r.metadata
        }));
        await t.add(data);
    }
    console.log(`[SESHA] Upserted ${records.length} vectors`);
}

/**
 * Vector similarity search
 * @param {Float32Array} queryVector - Query embedding
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Results with score, text, metadata
 */
async function searchVectors(queryVector, limit = 10) {
    const t = await initVectorDB();
    const results = await t.search(queryVector).limit(limit).toArray();
    return results.map(r => ({
        score: r._distance || r._score,
        text: r.text,
        file: r.file,
        category: r.category,
        metadata: r.metadata ? JSON.parse(r.metadata) : {}
    }));
}

/**
 * Hybrid search: combine vector + keyword (BM25-style via filter)
 * @param {Float32Array} queryVector - Query embedding
 * @param {string} keyword - Keyword to filter/boost
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Results
 */
async function hybridSearch(queryVector, keyword, limit = 10) {
    const t = await initVectorDB();
    
    // First do vector search with wider net
    const vectorResults = await t.search(queryVector).limit(limit * 3).toArray();
    
    // Simple keyword boost: re-rank results containing keyword
    const scored = vectorResults.map(r => {
        let score = 1 - (r._distance || 0); // convert distance to similarity
        if (keyword && r.text && r.text.toLowerCase().includes(keyword.toLowerCase())) {
            score *= 1.5; // boost keyword matches
        }
        return { ...r, hybridScore: score };
    });
    
    // Sort by hybrid score, take top K
    scored.sort((a, b) => b.hybridScore - a.hybridScore);
    return scored.slice(0, limit).map(r => ({
        score: r.hybridScore,
        text: r.text,
        file: r.file,
        category: r.category,
        metadata: r.metadata ? JSON.parse(r.metadata) : {}
    }));
}

/**
 * Get table stats
 */
async function getStats() {
    const t = await initVectorDB();
    const count = await t.countRows();
    return { table: TABLE_NAME, vectorCount: count, path: DB_PATH };
}

/**
 * Delete all vectors (for re-indexing)
 */
async function clearTable() {
    if (db) {
        await db.dropTable(TABLE_NAME);
        console.log('[SESHA] Cleared vector table');
    }
}

module.exports = {
    initVectorDB,
    upsertVectors,
    searchVectors,
    hybridSearch,
    getStats,
    clearTable
};