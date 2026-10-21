// scrape-utils.js — distillation helper utilities
// Used by web_fetcher.js for HTML cleansing and token truncation

const MAX_TOKENS_DEFAULT = 10000;
const CHARS_PER_TOKEN_ESTIMATE = 4;

function stripHtmlToMarkdown(html) {
  if (!html || typeof html !== "string") return "";

  let text = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "");

  text = text
    .replace(/</tr>/gi, "\n")
    .replace(/<\/?(table|tr|th|td|p|div|li|h[1-6]|section|article|blockquote|pre|hr|br)[^>]*>/gi, "\n")
    .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em\b[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<b\b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<i\b[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "$2")
    .replace(/<img\b[^>]*/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function truncateToTokens(text, maxTokens = MAX_TOKENS_DEFAULT) {
  if (!text) return "";
  const maxChars = maxTokens * CHARS_PER_TOKEN_ESTIMATE;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…[truncated]";
}

function estimateTokens(text) {
  return Math.ceil((text?.length || 0) / CHARS_PER_TOKEN_ESTIMATE);
}

function extractMainContent(html, selector = "body") {
  if (!html || typeof html !== "string") return "";

  if (selector === "body" || !selector) return html;

  if (selector.startsWith("#")) {
    const id = selector.slice(1);
    const regex = new RegExp(`<[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/[^>]*>`, "i");
    const match = html.match(regex);
    return match ? match[1] : html;
  }

  if (selector.startsWith(".")) {
    const cls = selector.slice(1);
    const regex = new RegExp(`<[^>]*class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]*>`, "i");
    const match = html.match(regex);
    return match ? match[1] : html;
  }

  const tag = selector.toLowerCase();
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const match = regex.exec(html);
  return match ? match[1] : html;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractKeywords(text, limit = 15) {
  if (!text) return [];

  const stop = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "has", "have", "this", "that", "with", "from", "were", "they", "will", "what", "when", "where", "which", "their", "there", "about", "would", "could", "should", "been", "were", "having", "into", "than", "them", "these", "those"
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && w.length < 25 && !stop.has(w));

  const freqs = {};
  for (const w of words) {
    freqs[w] = (freqs[w] || 0) + 1;
  }

  return Object.entries(freqs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

module.exports = {
  stripHtmlToMarkdown,
  truncateToTokens,
  estimateTokens,
  extractMainContent,
  extractTitle,
  extractKeywords
};
