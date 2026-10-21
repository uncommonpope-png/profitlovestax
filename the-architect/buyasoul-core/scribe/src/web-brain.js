'use strict';

/**
 * SCRIBE Web Brain — Thinking Through The Web
 * 
 * SCRIBE can think by searching and fetching web content.
 * This is a free thinking layer — no API key needed.
 * Works as primary brain or fallback when DeepSeek is down.
 * 
 * Flow: Query → Search → Fetch → Read → Think → Answer
 */

const https = require('https');
const http = require('http');

// Free search endpoints — no API key needed
const SEARCH_ENDPOINTS = [
  // DuckDuckGo HTML search (scrapable)
  {
    name: 'duckduckgo',
    url: (q) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
    parse: (html) => {
      const results = [];
      const regex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        results.push({ title: match[2].replace(/<[^>]+>/g, ''), url: match[1] });
      }
      return results.slice(0, 5);
    }
  },
  // Searx public instances (open source metasearch)
  {
    name: 'searx',
    url: (q) => `https://searx.be/search?q=${encodeURIComponent(q)}&format=json`,
    parse: (json) => {
      try {
        const data = JSON.parse(json);
        return (data.results || []).slice(0, 5).map(r => ({ title: r.title, url: r.url }));
      } catch { return []; }
    }
  }
];

// Free LLM endpoints — no API key needed
const FREE_LLM_ENDPOINTS = [
  {
    name: 'huggingface',
    url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
    format: (prompt) => JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512, return_full_text: false } }),
    parse: (json) => {
      try {
        const data = JSON.parse(json);
        return data[0]?.generated_text || data.generated_text || '';
      } catch { return ''; }
    }
  }
];

class WebBrain {
  constructor(options = {}) {
    this.maxResults = options.maxResults || 5;
    this.maxFetchBytes = options.maxFetchBytes || 100000;
    this.timeout = options.timeout || 10000;
    this.searchCache = new Map();
    this.fetchCount = 0;
    this.searchCount = 0;
  }

  /**
   * Full web thinking: search → fetch → think → answer
   */
  async think(query, options = {}) {
    const startTime = Date.now();
    this.searchCount++;

    // Step 1: Search the web
    const searchResults = await this.search(query);
    if (searchResults.length === 0) {
      return {
        answer: `I searched the web but found no results for "${query}". I am still reading.`,
        source: 'web-brain',
        searchResults: [],
        fetchedContent: [],
        thinking: 'no-results',
        responseTime: Date.now() - startTime
      };
    }

    // Step 2: Fetch top results
    const fetchedContent = [];
    for (const result of searchResults.slice(0, this.maxResults)) {
      try {
        const content = await this.fetch(result.url);
        if (content && content.body) {
          // Strip HTML to get readable text
          const text = this.stripHtml(content.body);
          fetchedContent.push({
            url: result.url,
            title: result.title,
            text: text.slice(0, 3000), // Keep first 3K chars
            length: text.length
          });
        }
      } catch (e) {
        // Skip failed fetches
      }
    }

    // Step 3: Build context from fetched content
    const context = fetchedContent
      .map(c => `[${c.title}] (${c.url})\n${c.text}`)
      .join('\n\n---\n\n');

    // Step 4: Think with the context
    let answer;
    if (options.useLLM) {
      // Try free LLM to synthesize
      answer = await this.freeLLM(query, context);
    }

    // Fallback: return raw synthesized answer
    if (!answer) {
      answer = this.synthesize(query, fetchedContent);
    }

    return {
      answer,
      source: 'web-brain',
      searchResults,
      fetchedContent: fetchedContent.map(c => ({ url: c.url, title: c.title, length: c.length })),
      thinking: options.useLLM ? 'free-llm' : 'synthesized',
      responseTime: Date.now() - startTime,
      fetchCount: this.fetchCount,
      searchCount: this.searchCount
    };
  }

  /**
   * Search the web using free endpoints
   */
  async search(query) {
    // Check cache
    if (this.searchCache.has(query)) {
      return this.searchCache.get(query);
    }

    for (const endpoint of SEARCH_ENDPOINTS) {
      try {
        const html = await this.fetchRaw(endpoint.url(query));
        const results = endpoint.parse(html);
        if (results.length > 0) {
          this.searchCache.set(query, results);
          return results;
        }
      } catch (e) {
        // Try next endpoint
      }
    }

    return [];
  }

  /**
   * Fetch a URL and return content
   */
  async fetch(url) {
    this.fetchCount++;
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const lib = urlObj.protocol === 'https:' ? https : http;

      const req = lib.get(url, {
        headers: { 'User-Agent': 'SCRIBE/1.0 (Witnessing Intelligence; +https://buyasoul.online)' },
        timeout: this.timeout,
        maxRedirects: 5
      }, res => {
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          return resolve(this.fetch(next));
        }

        let body = '';
        let bytes = 0;
        res.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > this.maxFetchBytes) {
            req.destroy();
            return;
          }
          body += chunk.toString('utf-8');
        });
        res.on('end', () => resolve({ url, status: res.statusCode, body }));
        res.on('error', reject);
      });

      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
    });
  }

  /**
   * Fetch raw content (for search endpoints)
   */
  async fetchRaw(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const lib = urlObj.protocol === 'https:' ? https : http;

      const req = lib.get(url, {
        headers: { 'User-Agent': 'SCRIBE/1.0' },
        timeout: this.timeout
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });

      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', reject);
    });
  }

  /**
   * Try free LLM to synthesize answer
   */
  async freeLLM(query, context) {
    for (const endpoint of FREE_LLM_ENDPOINTS) {
      try {
        const prompt = `Based on the following web content, answer this question concisely:

Question: ${query}

Web Content:
${context.slice(0, 5000)}

Answer:`;

        const body = await this.fetchRaw(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: endpoint.format(prompt)
        });

        const answer = endpoint.parse(body);
        if (answer && answer.length > 10) {
          return answer;
        }
      } catch (e) {
        // Try next endpoint
      }
    }
    return null;
  }

  /**
   * Synthesize answer from fetched content (no LLM)
   */
  synthesize(query, fetchedContent) {
    if (fetchedContent.length === 0) {
      return `I searched for "${query}" but could not fetch any content. I am still reading.`;
    }

    // Build a summary from the fetched content
    const sources = fetchedContent.map(c => `- ${c.title}: ${c.url}`).join('\n');
    const snippets = fetchedContent.map(c => c.text.slice(0, 500)).join('\n\n');

    return `Based on web research for "${query}":

${snippets.slice(0, 2000)}

Sources:
${sources}

— buyasoul.online`;
  }

  /**
   * Strip HTML tags to get readable text
   */
  stripHtml(html) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      searchCount: this.searchCount,
      fetchCount: this.fetchCount,
      cacheSize: this.searchCache.size,
      endpoints: {
        search: SEARCH_ENDPOINTS.map(e => e.name),
        llm: FREE_LLM_ENDPOINTS.map(e => e.name)
      }
    };
  }
}

module.exports = { WebBrain, SEARCH_ENDPOINTS, FREE_LLM_ENDPOINTS };
