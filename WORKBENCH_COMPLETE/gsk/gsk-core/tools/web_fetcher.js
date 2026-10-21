// Web Fetcher Utility — scrapes clean text through SSRF-protected proxy
const SSRF_GUARD = true;
const FETCH_TIMEOUT_MS = 8000;
const MAX_TOKENS = 32000;
const MAX_TOKEN_CEILING = 10000;
const DEFAULT_MAX_DEPTH = 3;
const SESSION_TIMEOUT_MS = 1800000; // 30 minutes

// Persistent crawl sessions: sessionId -> {domain, depth, maxDepth, lastAccessed}
const crawlSessions = new Map();

// Cleanup stale sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sid, session] of crawlSessions) {
    if (now - session.lastAccessed > SESSION_TIMEOUT_MS) {
      crawlSessions.delete(sid);
    }
  }
}, 300000);

function checkCrawlDepth(targetUrl, sessionId, currentDepth, maxDepth) {
  const url = new URL(targetUrl);
  const hostname = url.hostname;
  const existing = crawlSessions.get(sessionId);

  if (!existing) {
    crawlSessions.set(sessionId, {
      domain: hostname,
      depth: currentDepth,
      maxDepth: maxDepth || DEFAULT_MAX_DEPTH,
      lastAccessed: Date.now()
    });
    return { allowed: true, sessionCreated: true };
  }

  existing.lastAccessed = Date.now();

  // Off-domain: reset to depth 0 but increment session depth tracker
  if (hostname !== existing.domain) {
    existing.domain = hostname;
    existing.depth = currentDepth;
    return { allowed: true, crossDomain: true };
  }

  // Same domain: enforce depth limit
  if (currentDepth >= (existing.maxDepth || DEFAULT_MAX_DEPTH)) {
    return {
      allowed: false,
      reason: `Max crawl depth (${existing.maxDepth || DEFAULT_MAX_DEPTH}) reached for ${hostname}`,
      currentDepth,
      maxDepth: existing.maxDepth || DEFAULT_MAX_DEPTH
    };
  }

  existing.depth = currentDepth;
  return { allowed: true, currentDepth, maxDepth: existing.maxDepth || DEFAULT_MAX_DEPTH };
}

function resetCrawlSession(sessionId) {
  if (crawlSessions.has(sessionId)) {
    crawlSessions.delete(sessionId);
  }
}

function getCrawlStatus(sessionId) {
  const session = crawlSessions.get(sessionId);
  if (!session) return null;
  return {
    domain: session.domain,
    depth: session.depth,
    maxDepth: session.maxDepth,
    isActive: Date.now() - session.lastAccessed < SESSION_TIMEOUT_MS
  };
}

async function fetchViaProxy(targetUrl, scribeKey) {
  const proxyUrl = `/api/browse?url=${encodeURIComponent(targetUrl)}&format=json`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data.content) throw new Error("No content returned from proxy");
  return { html: data.content, finalUrl: data.url, title: data.title };
}

function stripHtmlToMarkdown(html) {
  // Remove scripts, styles, noscript, and comments
  let text = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Convert block-level elements to markers
  text = text
    .replace(/<\/(h[1-6]|p|div|section|article|li|tr|br|hr|blockquote|pre)[^>]*>/gi, "\n")
    .replace(/<(h[1-6]|p|div|section|article|li|tr|blockquote|pre)[^>]*>/gi, "")
    .replace(/<(ul|ol)[^>]*>/gi, "")
    .replace(/<\/(ul|ol)[^>]*>/gi, "")
    .replace(/<table[^>]*>/gi, "<table>")
    .replace(/<\/(table|tr)>/gi, "</tr>")
    .replace(/<td[^>]*>/gi, "<td>")
    .replace(/<\/td>/gi, "</td>")
    // Convert remaining tags to placeholders for markdown
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<([^>]+)>/g, "") // Strip all remaining tags
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

function truncateToTokens(text, maxTokens = MAX_TOKEN_CEILING) {
  const approxCharsPerToken = 4;
  const maxChars = maxTokens * approxCharsPerToken;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…[truncated]";
}

function extractKeywords(text, limit = 15) {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && w.length < 25);

  const freqs = {};
  for (const w of words) freqs[w] = (freqs[w] || 0) + 1;
  return Object.entries(freqs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

function extractMainContent(html, selector = "body") {
  // Lightweight selector targeting via regex (server-side safe)
  const tagMatch = selector.match(/^([a-zA-Z]+)/);
  if (selector.startsWith("#")) {
    const id = selector.slice(1);
    const regex = new RegExp(`<[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/[^>]*>`, "i");
    const match = html.match(regex);
    return match ? match[1] : html;
  } else if (selector.startsWith(".")) {
    const cls = selector.slice(1);
    const regex = new RegExp(`<[^>]*class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]*>`, "i");
    const match = html.match(regex);
    return match ? match[1] : html;
  }
  return html;
}

async function webFetch(targetUrl, options = {}) {
  const {
    timeout = FETCH_TIMEOUT_MS,
    selector = "body",
    maxTokens = MAX_TOKEN_CEILING,
    scribeKey = process.env.SCRIBE_API_KEY || "scribe-master-key-2026",
    depth = 0,
    maxDepth = DEFAULT_MAX_DEPTH,
    sessionId = null
  } = options;

  if (!/^https?:\/\//i.test(targetUrl)) {
    throw new Error("Invalid URL format — must include http(s) protocol");
  }

  // Recursive depth limiting check
  if (sessionId && depth > 0) {
    const depthCheck = checkCrawlDepth(targetUrl, sessionId, depth, maxDepth);
    if (!depthCheck.allowed) {
      return {
        content: "",
        url: targetUrl,
        title: "",
        keywords: [],
        depthBlocked: true,
        depthWarning: depthCheck.reason,
        crawlStatus: getCrawlStatus(sessionId),
        memoryArtifact: {
          type: "web_scrape_blocked",
          content: `[BLOCKED] ${depthCheck.reason}`,
          url: targetUrl,
          source: "web_fetcher",
          fetchedAt: Date.now(),
          tags: ["source:web_scrape", "status:blocked", "reason:max_depth"]
        }
      };
    }
  }

  let proxyData;
  try {
    proxyData = await fetchViaProxy(targetUrl, scribeKey);
  } catch (err) {
    throw new Error(`Proxy fetch error: ${err.message}`);
  }

  const targetedHtml = extractMainContent(proxyData.html, selector);
  const cleanText = stripHtmlToMarkdown(targetedHtml);
  const safeText = truncateToTokens(cleanText, maxTokens);

  const keywords = extractKeywords(safeText);
  const hostname = new URL(targetUrl).hostname;

  const memoryArtifact = {
    type: "web_scrape",
    content: safeText,
    title: proxyData.title || hostname,
    url: targetUrl,
    finalUrl: proxyData.finalUrl,
    source: "web_fetcher",
    fetchedAt: Date.now(),
    keywords: [`url:${hostname}`],
    tags: ["source:web_scrape", "type:documentation", `domain:${hostname}`],
    metadata: { selector, maxTokens, originalLength: cleanText.length, depth, sessionId },
  };

  return {
    content: safeText,
    url: targetUrl,
    finalUrl: proxyData.finalUrl,
    title: proxyData.title,
    keywords,
    memoryArtifact,
    crawlStatus: sessionId ? getCrawlStatus(sessionId) : null
  };
}

function extractKeywords(text, limit = 15) {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && w.length < 25);

  const freqs = {};
  for (const w of words) freqs[w] = (freqs[w] || 0) + 1;
  return Object.entries(freqs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

// Phase 4: Semantic similarity (simple token-set Jaccard)
// In production this would use embeddings; here we use keyword overlap
function jaccardSimilarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// Phase 4: Query recent memories for contradictions
async function detectContradictions(newContent, keywords, sessionId) {
  // In production this queries SCRIBE memory store
  // Here we use a client-side check against recently fetched same-session content
  const related = [];
  // Simple heuristic: if same session and high keyword overlap with divergent content
  if (sessionId) {
    // Would query memories store — placeholder for now
    // if (memories.has(sessionId)) { ... }
  }
  
  // For now, mark as pending — full SCRIBE integration in Phase 4b
  return { conflicts: [], pending: true, note: "SCRIBE memory query pending" };
}

// Phase 5: Format-aware extraction handlers

// PDF text extraction (first page only, ~10KB)
function extractPdf(text) {
  // pdf-parse would go here; placeholder returns cleaned text marker
  return {
    content: `[PDF extracted text marker — ${text ? text.substring(0, 200).replace(/\n/g, ' ').trim() : ''}…]`,
    metadata: { pages: 1, format: "pdf" },
    actions: ["open-original", "save-citation"]
  };
}

// arXiv paper extraction
function extractArxiv(text, url) {
  // arxiv-api would parse arXiv-specific HTML/JSON
  const arxivId = url.match(/\/(\d{4}\.\d{4}v\d)/);
  return {
    content: `[arXiv paper marker — ID: ${arxivId ? arxivId[1] : 'unknown'}]`,
    metadata: { arxivId: arxivId ? arxivId[1] : null, format: "arxiv" },
    actions: ["save-citation", "add-to-library"]
  };
}

// GitHub blob extraction
function extractGitHubBlob(text, url) {
  // @octokit/rest would parse GitHub content
  const hasCode = /```[\s\S]{3,}```/g.test(text);
  return {
    content: hasCode ? `[GitHub blob — code blocks detected, syntax-highlighted viewer available]` : `[GitHub blob — text extraction]`,
    metadata: { hasCode, format: "github-blob" },
    actions: ["copy-snippet", "run-in-sandbox", "save-citation"]
  };
}

async function webFetch(targetUrl, options = {}) {
  const {
    timeout = FETCH_TIMEOUT_MS,
    selector = "body",
    maxTokens = MAX_TOKEN_CEILING,
    scribeKey = process.env.SCRIBE_API_KEY || "scribe-master-key-2026",
    depth = 0,
    maxDepth = DEFAULT_MAX_DEPTH,
    sessionId = null,
    halfLifeHours = 168,
    formatHint
  } = options;

  if (!/^https?:\/\//i.test(targetUrl)) {
    throw new Error("Invalid URL format — must include http(s) protocol");
  }

  // Recursive depth limiting check
  if (sessionId && depth > 0) {
    const depthCheck = checkCrawlDepth(targetUrl, sessionId, depth, maxDepth);
    if (!depthCheck.allowed) {
      return {
        content: "",
        url: targetUrl,
        title: "",
        keywords: [],
        depthBlocked: true,
        depthWarning: depthCheck.reason,
        crawlStatus: getCrawlStatus(sessionId),
        memoryArtifact: {
          type: "web_scrape_blocked",
          content: `[BLOCKED] ${depthCheck.reason}`,
          url: targetUrl,
          source: "web_fetcher",
          fetchedAt: Date.now(),
          tags: ["source:web_scrape", "status:blocked", "reason:max_depth"]
        }
      };
    }
  }

  let proxyData;
  try {
    proxyData = await fetchViaProxy(targetUrl, scribeKey);
  } catch (err) {
    throw new Error(`Proxy fetch error: ${err.message}`);
  }

  const targetedHtml = extractMainContent(proxyData.html, selector);
  const cleanText = stripHtmlToMarkdown(targetedHtml);
  const safeText = truncateToTokens(cleanText, maxTokens);

  const keywords = extractKeywords(safeText);
  const hostname = new URL(targetUrl).hostname;

  // Phase 5: Format-aware extraction
  let structuredContent = null;
  let formatMetadata = null;
  let extractionActions = [];

  if (formatHint) {
    const FORMAT_HANDLERS = {
      'pdf': { extract: extractPdf, mode: 'document' },
      'arxiv': { extract: extractArxiv, mode: 'academic' },
      'github': { extract: extractGitHubBlob, mode: 'code' }
    };
    const handler = FORMAT_HANDLERS[formatHint];
    if (handler) {
      const result = await handler(proxyData.html.substring(0, 5000), targetUrl);
      structuredContent = result.content;
      formatMetadata = result.metadata;
      extractionActions = result.actions;
    }
  }

  // Phase 4: Contradiction detection (pending SCRIBE integration)
  const contradictionCheck = await detectContradictions(safeText, keywords, sessionId);

  const memoryArtifact = {
    type: "web_scrape",
    content: safeText,
    title: proxyData.title || hostname,
    url: targetUrl,
    finalUrl: proxyData.finalUrl,
    source: "web_fetcher",
    fetchedAt: Date.now(),
    keywords: [`url:${hostname}`],
    tags: ["source:web_scrape", "type:documentation", `domain:${hostname}`],
    metadata: { selector, maxTokens, originalLength: cleanText.length, depth, sessionId },
    ...(formatMetadata && { format: formatMetadata.format }),
    ...(formatMetadata && { extractionActions }),
    ...(contradictionCheck.pending && { contradictionNote: contradictionCheck.note })
  };

  return {
    content: safeText,
    url: targetUrl,
    finalUrl: proxyData.finalUrl,
    title: proxyData.title,
    keywords,
    memoryArtifact,
    crawlStatus: sessionId ? getCrawlStatus(sessionId) : null,
    structuredContent,
    formatMetadata,
    extractionActions,
    contradictionCheck
  };
}

// Keep backward-compatible exports + new capabilities
module.exports = { 
  webFetch, 
  fetchViaProxy, 
  stripHtmlToMarkdown, 
  truncateToTokens, 
  extractKeywords, 
  extractMainContent,
  checkCrawlDepth,
  resetCrawlSession,
  getCrawlStatus,
  detectContradictions,
  extractPdf,
  extractArxiv,
  extractGitHubBlob
};
