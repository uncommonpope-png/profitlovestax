'use strict';

/**
 * SESHAT CORE — Main Entry Point (ALLM + Vector Search + Broker + Witness Bridge)
 * Integration: Seshat (Memory/Synthesis) + Scribe (Witness)
 */

const { initEmbedder, embedText, embedBatch, chunkText } = require('./embedder');
const { initVectorDB, upsertVectors, searchVectors, hybridSearch, getStats, clearTable } = require('./vectorDB');
const { hybridSearch: coreHybridSearch, bm25Score, searchByCategory } = require('./hybridSearch');
const { indexBrain, updateIndex, categorizeFile, parseMarkdownMeta } = require('./indexer');
const { initLLM, generate, think, synthesize, summarize, getStatus: getLLMStatus, LLM_AVAILABLE } = require('./llm');
const broker = require('./broker');
const { checkOmniRoute, omniStatus } = require('./omniClient');
const { record, recall, init: initScribe } = require('../../scribe-module');

let scribeInitialized = false;

async function initScribeBridge() {
    if (scribeInitialized) return;
    try {
        await initScribe({ observe: true });
        scribeInitialized = true;
        console.log('[SESHAT] Witness bridge established');
    } catch (e) {
        console.log('[SESHAT] Scribe bridge offline:', e.message);
    }
}

module.exports = {
    // Embedder (embeddings + chunking)
    initEmbedder,
    embedText,
    embedBatch,
    chunkText,
    
    // Vector DB (lancedb storage)
    initVectorDB,
    upsertVectors,
    searchVectors,
    hybridSearch: coreHybridSearch,
    getStats,
    clearTable,
    
    // Hybrid Search (keyword + vector)
    bm25Score,
    searchByCategory,
    
    // Indexer (brain scan)
    indexBrain,
    updateIndex,
    categorizeFile,
    parseMarkdownMeta,
    
    // ALLM — Autonomous Local Language Model
    initLLM,
    generate,
    think,
    synthesize,
    summarize,
    getStatus: () => ({ semantic: getLLMStatus(), llm: getLLMStatus() }),
    LLM_AVAILABLE,
    
    // BROKER — Intelligent routing between Seshat and Omniroute
    query: broker.query,
    search: broker.search,
    synthesize: broker.synthesize,
    toolCall: broker.toolCall,
    decide: broker.decide,
    route: broker.route,
    
    // OMNIROUTE STATUS (for health checks)
    checkOmniRoute,
    omniStatus: omniStatus,
    OMNIROUTE_URL: broker.OMNIROUTE_URL,
    
    // WITNESS BRIDGE (Scribe integration)
    initWitness: initScribeBridge,
    recordObservation: record,
    recallObservations: recall,
};