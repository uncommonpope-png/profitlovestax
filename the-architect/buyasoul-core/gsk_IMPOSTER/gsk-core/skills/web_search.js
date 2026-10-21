'use strict';

const https = require('https');
const http = require('http');

const PLT_AFFINITY = { profit: 0.5, love: 0.6, tax: 0.3 };

function skill_web_search(input) {
    const query = typeof input === 'string' ? input : (input.query || '');
    const maxResults = input.maxResults || 8;

    if (!query.trim()) {
        return Promise.resolve({ skill: 'web_search', plt_affinity: PLT_AFFINITY, status: 'error', error: 'No search query provided', results: [], timestamp: Date.now() });
    }

    return new Promise((resolve) => {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

        const req = https.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const results = [];
                    const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
                    let match;
                    let count = 0;
                    while ((match = resultRegex.exec(data)) !== null && count < maxResults) {
                        const url = match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/&rut=.*$/, '');
                        const decodedUrl = decodeURIComponent(url);
                        results.push({
                            title: match[2].replace(/<[^>]+>/g, '').trim(),
                            url: decodedUrl,
                            snippet: match[3].replace(/<[^>]+>/g, '').trim(),
                            source: 'DuckDuckGo'
                        });
                        count++;
                    }

                    if (results.length === 0) {
                        const altRegex = /<h2 class="result__title">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
                        while ((match = altRegex.exec(data)) !== null && count < maxResults) {
                            results.push({
                                title: match[2].replace(/<[^>]+>/g, '').trim(),
                                url: match[1],
                                snippet: match[3].replace(/<[^>]+>/g, '').trim(),
                                source: 'DuckDuckGo'
                            });
                            count++;
                        }
                    }

                    resolve({ skill: 'web_search', plt_affinity: PLT_AFFINITY, status: 'success', query, results, count: results.length, timestamp: Date.now() });
                } catch (e) {
                    resolve({ skill: 'web_search', plt_affinity: PLT_AFFINITY, status: 'error', query, error: e.message, results: [], timestamp: Date.now() });
                }
            });
        });

        req.on('error', () => resolve({ skill: 'web_search', plt_affinity: PLT_AFFINITY, status: 'offline', query, results: [], timestamp: Date.now() }));
        req.on('timeout', () => { req.destroy(); resolve({ skill: 'web_search', plt_affinity: PLT_AFFINITY, status: 'timeout', query, results: [], timestamp: Date.now() }); });
    });
}

module.exports = { skill_web_search };