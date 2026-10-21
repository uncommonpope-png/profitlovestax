// web_scraper_bridge.js — thin bridge registering the web_fetcher as a tool for GSK's MCP runtime
// Allows agents/goal runners to invoke web scraping via the universal tool bridge

const { webFetch } = require('./web_fetcher.js');
const path = require('path');
const fs = require('fs');

// SSRF guard configuration
const ALLOWED_PROTOCOLS = ['https:', 'http:'];
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const BLOCKED_PREFIXES = ['10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.2[0-9].', '172.3[0-1].', '192.168.', '169.254.'];

const isBlocked = (urlString) => {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return true;
    if (BLOCKED_HOSTS.includes(host)) return true;
    if (BLOCKED_PREFIXES.some((p) => host.startsWith(p))) return true;
    if (host.endsWith('.local') || host.endsWith('.internal')) return true;
    return false;
  } catch {
    return true;
  }
};

async function scrapeTool(args = {}) {
  const { url, selector, timeout = 8000, maxTokens = 10000 } = args;

  if (!url) throw new Error('scrapeTool requires a "url" parameter');
  if (isBlocked(url)) throw new Error('SSRF guard: private/local URLs are blocked');

  const result = await webFetch(url, { timeout, selector, maxTokens });

  // Immutable artifact for Memory Gate
  return {
    success: true,
    content: result.content.slice(0, 1000),
    url: result.url,
    title: result.title,
    keywords: result.keywords,
    tokenCount: Math.ceil(result.content.length / 4),
    artifact: result.memoryArtifact
  };
}

module.exports = {
  scraper: {
    name: 'web_scraper',
    description: 'Fetches and distills clean text content from a public web page through SSRF-guarded proxy. Returns stripped text suitable for memory storage.',
    handler: scrapeTool,
    schema: {
      url: { type: 'string', description: 'Full URL to scrape (must be a public https:// URL)', required: true },
      selector: { type: 'string', description: 'Optional CSS selector like "#main-content" or ".docs-body"', required: false, default: 'body' },
      timeout: { type: 'integer', description: 'Timeout in ms (default 8000)', required: false, default: 8000 },
      maxTokens: { type: 'integer', description: 'Max output tokens (default 10000)', required: false, default: 10000 }
    }
  },
  webFetch,
  scrapeTool
};
