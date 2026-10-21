'use strict';

/**
 * SESHAT CORE — Hybrid Search
 * Combines BM25 (keyword) + Vector (semantic) + Rerank
 */

const { embedText } = require('./embedder');
const { searchVectors, hybridSearch: vectorHybridSearch } = require('./vectorDB');

/**
 * Simple BM25-style keyword scoring
 * @param {string} query - Search query
 * @param {string} text - Document text
 * @returns {number} BM25-like score (0-1)
 */
function bm25Score(query, text) {
    const qTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (qTerms.length === 0) return 0;
    
    const tLower = text.toLowerCase();
    let matches = 0;
    for (const term of qTerms) {
        if (tLower.includes(term)) matches++;
    }
    return matches / qTerms.length;
}

/**
 * Full hybrid search: keyword + vector + rerank
 * @param {string} query - Natural language query
 * @param {Object} options - { limit: 10, keywordBoost: 1.5 }
 * @returns {Promise<Array>} Ranked results
 */
async function hybridSearch(query, options = {}) {
    const { limit = 10, keywordBoost = 1.5 } = options;
    
    // 1. Get query embedding
    const queryVector = await embedText(query);
    
    // 2. Vector search (wider net for reranking)
    const vectorResults = await searchVectors(queryVector, limit * 5);
    
    // 3. Combine with BM25 keyword scoring
    const scored = vectorResults.map(r => {
        const bm25 = bm25Score(query, r.text || '');
        const vectorScore = r.score || 0;
        
        // Weighted combination: 60% vector, 40% keyword
        const combined = (0.6 * vectorScore) + (0.4 * bm25);
        
        return {
            ...r,
            vectorScore,
            bm25Score: bm25,
            hybridScore: combined
        };
    });
    
    // 4. Sort by hybrid score
    scored.sort((a, b) => b.hybridScore - a.hybridScore);
    
    // 5. Return top K
    return scored.slice(0, limit);
}

/**
 * Search by category/type filter + query
 * @param {string} query - Search query
 * @param {string} category - Filter by category (journals, pages, patterns, etc.)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Filtered results
 */
async function searchByCategory(query, category, limit = 10) {
    const { searchVectors } = require('./vectorDB');
    const queryVector = await embedText(query);
    const results = await searchVectors(queryVector, limit * 3);
    
    // Filter by category in metadata
    const filtered = results.filter(r => r.category === category);
    return filtered.slice(0, limit);
}

module.exports = {
    bm25Score,
    hybridSearch,
    searchByCategory
};