'use strict';

/**
 * web_search skill — real internet search for GSK.
 * Provider: Bing RSS -> Google News RSS -> DuckDuckGo HTML.
 * See gsk-core/brain/web_search_provider.js for the why.
 */
const { searchWeb } = require('../brain/web_search_provider.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.6, tax: 0.3 };

function skill_web_search(input) {
    const query = typeof input === 'string' ? input : (input.query || '');
    const maxResults = Math.max(1, Math.min(Number(input.maxResults || input.max_results || 8), 20));

    if (!String(query || '').trim()) {
        return Promise.resolve({
            skill: 'web_search',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No search query provided',
            results: [],
            timestamp: Date.now()
        });
    }

    return searchWeb(query, maxResults)
        .then(results => ({
            skill: 'web_search',
            plt_affinity: PLT_AFFINITY,
            status: 'success',
            query,
            results,
            count: results.length,
            timestamp: Date.now()
        }))
        .catch(err => ({
            skill: 'web_search',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            query,
            error: err.message,
            results: [],
            timestamp: Date.now()
        }));
}

const MANIFEST = {
    name: 'web_search',
    description: 'Skill: web_search (Bing RSS + Google News RSS provider)',
    version: '1.1.0',
    inputs: {
        query: { type: 'string', required: true },
        maxResults: { type: 'number', default: 8 }
    },
    output: { schema: 'ok/error' }
};

module.exports = { skill_web_search };
module.exports.MANIFEST = MANIFEST;
