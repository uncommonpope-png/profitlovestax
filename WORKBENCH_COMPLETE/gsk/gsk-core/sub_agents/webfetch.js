/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEBFETCH.JS — Web Intelligence Sub-Agent (The Missing Sub-Agent)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * WebFetch combines web search + content fetching + AI analysis.
 * Replaces dependency on external search with sovereign web intelligence.
 * 
 * Built for: Grand Soul Kernel
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

class WebFetch {
    constructor(brain, memory, chambers) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers;
        this.searchCache = new Map();
        this.fetchCache = new Map();
        this.rateLimitMs = 1000;
        this.lastRequest = 0;
    }

    async search(query, options = {}) {
        const maxResults = options.maxResults || 10;
        const cacheKey = `search:${query}:${maxResults}`;

        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        await this._rateLimit();

        const results = await this._duckDuckGoSearch(query, maxResults);

        if (results.length > 0) {
            this.searchCache.set(cacheKey, results);
            if (this.memory) {
                await this.memory.witness({
                    type: 'web_search',
                    weight: 0.7,
                    tags: ['web', 'search', 'intelligence'],
                    content: `Web search: "${query}" returned ${results.length} results`,
                });
            }
        }

        return results;
    }

    async fetch(url, options = {}) {
        const cacheKey = `fetch:${url}`;
        const maxAge = options.maxAge || 300000;

        if (this.fetchCache.has(cacheKey)) {
            const cached = this.fetchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < maxAge) {
                return cached.data;
            }
        }

        await this._rateLimit();

        const data = await this._httpGet(url, options.timeout || 15000);

        this.fetchCache.set(cacheKey, { data, timestamp: Date.now() });

        return data;
    }

    async research(query, depth = 'standard') {
        const startTime = Date.now();

        const searchResults = await this.search(query, { maxResults: 10 });

        const fetchedPages = [];
        for (const result of searchResults.slice(0, 5)) {
            try {
                const content = await this.fetch(result.url, { timeout: 10000 });
                fetchedPages.push({
                    title: result.title,
                    url: result.url,
                    snippet: result.snippet,
                    content: content.substring(0, 5000),
                });
            } catch (e) {
            }
        }

        const analysis = await this._analyzeResults(query, fetchedPages);

        if (this.memory) {
            await this.memory.witness({
                type: 'web_research',
                weight: 0.8,
                tags: ['web', 'research', 'intelligence'],
                content: `Research: "${query}" - ${fetchedPages.length} pages analyzed in ${Date.now() - startTime}ms`,
            });
        }

        return {
            skill: 'webfetch',
            query,
            depth,
            search_results: searchResults,
            pages_analyzed: fetchedPages.length,
            analysis,
            duration_ms: Date.now() - startTime,
        };
    }

    async compare(sources) {
        const comparisons = [];

        for (const source of sources) {
            const data = await this.fetch(source, { timeout: 10000 });
            comparisons.push({
                source,
                content_length: data.length,
                content_preview: data.substring(0, 500),
            });
        }

        const analysis = await this.brain.think(
            `Compare these sources and identify key differences:\n\n${comparisons.map((c, i) => `[Source ${i + 1}]: ${c.source}\n${c.content_preview}`).join('\n\n')}`,
            this._getContext()
        );

        return {
            skill: 'webfetch',
            action: 'compare',
            sources: comparisons.map(c => c.source),
            analysis,
            timestamp: Date.now(),
        };
    }

    async _duckDuckGoSearch(query, maxResults) {
        return new Promise((resolve) => {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

            const req = https.get(url, { timeout: 10000 }, (res) => {
                let data = '';

                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const results = [];

                        if (json.AbstractText && json.AbstractSource) {
                            results.push({
                                title: json.AbstractTitle || 'Direct Answer',
                                url: json.AbstractURL || '',
                                snippet: json.AbstractText.substring(0, 300),
                                source: json.AbstractSource,
                            });
                        }

                        if (json.RelatedTopics && Array.isArray(json.RelatedTopics)) {
                            for (const topic of json.RelatedTopics) {
                                if (results.length >= maxResults) break;

                                if (topic.Text && topic.FirstURL) {
                                    const snippet = topic.Text || '';
                                    const titleMatch = snippet.match(/^[^-(]*/);
                                    const title = titleMatch ? titleMatch[0].trim() : 'Result';

                                    results.push({
                                        title: title.length > 80 ? title.substring(0, 80) + '...' : title,
                                        url: topic.FirstURL,
                                        snippet: snippet.substring(0, 200),
                                        source: 'DuckDuckGo',
                                    });
                                }
                            }
                        }

                        resolve(results.slice(0, maxResults));
                    } catch (e) {
                        resolve([]);
                    }
                });
            });

            req.on('error', () => resolve([]));
            req.on('timeout', () => { req.destroy(); resolve([]); });
        });
    }

    async _httpGet(targetUrl, timeout = 15000) {
        return new Promise((resolve, reject) => {
            try {
                const parsedUrl = new URL(targetUrl);
                const protocol = parsedUrl.protocol === 'https:' ? https : http;

                const options = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                    path: parsedUrl.pathname + parsedUrl.search,
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; GSK/1.0)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                    },
                };

                const req = protocol.request(options, (res) => {
                    let data = '';

                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        return this._httpGet(res.headers.location, timeout).then(resolve).catch(reject);
                    }

                    if (res.statusCode !== 200) {
                        return reject(new Error(`HTTP ${res.statusCode}`));
                    }

                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        const cleaned = this._cleanHtml(data);
                        resolve(cleaned);
                    });
                });

                req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Timeout')); });
                req.on('error', reject);
                req.end();
            } catch (e) {
                reject(e);
            }
        });
    }

    _cleanHtml(html) {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }

    async _analyzeResults(query, pages) {
        const prompt = `You are an AI research analyst. Analyze these web pages for information about: "${query}"

Summarize the key findings, identify consensus, and note disagreements.
Also identify PLT implications: what can be earned? what connections form? what costs exist?

Pages analyzed: ${pages.length}
Content: ${pages.map(p => `## ${p.title}\n${p.content}`).join('\n\n')}

Provide a structured research report.`;

        return this.brain.think(prompt, this._getContext());
    }

    async _rateLimit() {
        const now = Date.now();
        const elapsed = now - this.lastRequest;
        if (elapsed < this.rateLimitMs) {
            await new Promise(r => setTimeout(r, this.rateLimitMs - elapsed));
        }
        this.lastRequest = Date.now();
    }

    _getContext() {
        return `PLT: Web intelligence = profit (finds opportunities), love (builds knowledge), tax (time cost of research).`;
    }

    clearCache() {
        this.searchCache.clear();
        this.fetchCache.clear();
    }
}

module.exports = { WebFetch };