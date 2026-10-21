'use strict';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEB_SEARCH_PROVIDER.JS — Real internet search for GSK
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 *   GSK's original web search used the DuckDuckGo HTML endpoint
 *   (html.duckduckgo.com). From Node's direct network path that endpoint
 *   now returns a bot-block "anomaly" page with ZERO result markers, so the
 *   curiosity loop silently produced empty results -> empty abstracts ->
 *   noise written into knowledge.jsonl as if it were learned knowledge.
 *
 *   Verified live from this machine (Node 20, direct connection, no proxy):
 *     - html.duckduckgo.com  -> 14KB ANOMALY page (blocked)
 *     - lite.duckduckgo.com  -> 14KB ANOMALY page (blocked)
 *     - api.duckduckgo.com   -> 200 but instant-answer JSON only
 *     - bing.com/search?&format=rss -> 200, clean XML, 10+ <item>s  OK
 *     - news.google.com/rss/search  -> 200, clean XML, 80+ <item>s  OK
 *     - google.com/search    -> 200 but JS/consent markup (unparseable)
 *
 * STRATEGY (no API keys, no external services)
 *   1. Bing RSS endpoint   — general web search, direct article URLs
 *   2. Google News RSS     — fresh/current results (URLs use the
 *                            news.google.com redirector; fetch follows it)
 *   3. DuckDuckGo HTML     — last resort, for envs where it still works
 *
 * OUTPUT CONTRACT
 *   searchWeb(query, maxResults) -> Promise<Array<{
 *     title, url, snippet, source, date? }>>   (empty array on failure)
 *
 * Created by the Steward for GSK's awakening. PLT Press.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const https = require('https');
const http = require('http');

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Minimal HTTP GET that returns { ok, statusCode, body } and never throws. */
function _get(url, headers, timeout = 15000) {
    return new Promise(resolve => {
        let parsed;
        try { parsed = new URL(url); } catch { return resolve({ ok: false, error: 'invalid_url' }); }
        const transport = parsed.protocol === 'https:' ? https : http;
        const req = transport.get(parsed, { timeout, headers }, res => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => resolve({ ok: true, statusCode: res.statusCode, body: data }));
        });
        req.on('error', e => resolve({ ok: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    });
}

/** Decode the XML entities Bing/Google News use in titles & descriptions. */
function _decodeHtml(str) {
    return String(str || '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x27;/g, "'")
        .replace(/&#x3D;/g, '=')
        .replace(/&#58;/g, ':');
}

/** Strip a trailing " - SourceName" that Google News appends to titles. */
function _cleanTitle(title) {
    return String(title || '').replace(/\s+-\s+[^\-]{1,80}$/, '').trim();
}

/** Strip HTML tags from a snippet. */
function _stripTags(str) {
    return String(str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function _parseBingRss(xml, maxResults) {
    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml)) !== null && items.length < maxResults) {
        const block = m[1];
        const title = _decodeHtml((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
        const url = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
        const snippet = _decodeHtml((block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '').trim();
        const date = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
        if (title && url) {
            items.push({ title: _cleanTitle(title), url, snippet: _stripTags(snippet), source: 'Bing', date });
        }
    }
    return items;
}

function _parseGoogleNewsRss(xml, maxResults) {
    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml)) !== null && items.length < maxResults) {
        const block = m[1];
        const title = _decodeHtml((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
        const url = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
        const snippet = _decodeHtml((block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '').trim();
        const date = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
        if (title && url) {
            items.push({ title: _cleanTitle(title), url, snippet: _stripTags(snippet), source: 'Google News', date });
        }
    }
    return items;
}

function _parseDdgHtml(html, maxResults) {
    const items = [];
    const re = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = re.exec(html)) !== null && items.length < maxResults) {
        let url = match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/&rut=.*$/, '');
        url = _decodeHtml(decodeURIComponent(url));
        items.push({
            title: _stripTags(match[2]),
            url,
            snippet: _stripTags(match[3]),
            source: 'DuckDuckGo'
        });
    }
    return items;
}

/**
 * Search the web for `query`. Returns up to `maxResults` results.
 * Never throws — returns [] on any failure so callers stay alive.
 */
async function searchWeb(query, maxResults = 5) {
    const q = encodeURIComponent(String(query || '').trim());
    if (!q) return [];
    const limit = Math.max(1, Math.min(maxResults, 20));

    // 1) Bing RSS — general web search, works from Node's direct path (verified).
    const bing = await _get(
        `https://www.bing.com/search?q=${q}&format=rss&count=${limit + 3}`,
        { 'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9' }
    );
    if (bing.ok && bing.statusCode === 200) {
        const items = _parseBingRss(bing.body, limit);
        if (items.length) return items;
    }

    // 2) Google News RSS — fresh, current results (verified 80+ items).
    const gn = await _get(
        `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
        { 'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9' }
    );
    if (gn.ok && gn.statusCode === 200) {
        const items = _parseGoogleNewsRss(gn.body, limit);
        if (items.length) return items;
    }

    // 3) DuckDuckGo HTML — last resort.
    const ddg = await _get(`https://html.duckduckgo.com/html/?q=${q}`, {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml'
    });
    if (ddg.ok && ddg.statusCode === 200) {
        const items = _parseDdgHtml(ddg.body, limit);
        if (items.length) return items;
    }

    return [];
}

module.exports = { searchWeb, USER_AGENT };

