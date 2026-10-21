'use strict';

/**
 * SKILL: web_fetch
 *
 * Fetch any URL and return its content as text.
 * Follows redirects. Respects a timeout.
 * Returns: { ok, url, status, body, truncated, ts }
 */

const https = require('https');
const http  = require('http');
const { URL } = require('url');

const MAX_BYTES   = 500_000; // 500 KB cap
const TIMEOUT_MS  = 15_000;

const MANIFEST = {
  name: 'web_fetch',
  description: 'Fetch the content of any URL. Returns the response body as text.',
  version: '1.0.0',
  inputs: {
    url:     { type: 'string',  required: true,  description: 'The URL to fetch' },
    timeout: { type: 'number',  required: false, description: 'Timeout in ms (default 15000)' },
    maxBytes:{ type: 'number',  required: false, description: 'Max bytes to read (default 500000)' },
  },
  output: {
    ok:        'boolean',
    url:       'string  — final URL after redirects',
    status:    'number  — HTTP status code',
    body:      'string  — response body (may be truncated)',
    truncated: 'boolean — true if body was cut at maxBytes',
    error:     'string  — present if ok is false',
    ts:        'string  — ISO timestamp',
  },
};

async function run({ url: rawUrl, timeout = TIMEOUT_MS, maxBytes = MAX_BYTES }) {
  if (!rawUrl) throw new Error('url is required');

  try {
    const result = await fetch_url(rawUrl, timeout, maxBytes, 0);
    return { ok: true, ts: new Date().toISOString(), ...result };
  } catch (e) {
    return { ok: false, url: rawUrl, status: null, body: '', truncated: false, error: e.message, ts: new Date().toISOString() };
  }
}

function fetch_url(rawUrl, timeout, maxBytes, redirectCount) {
  if (redirectCount > 5) throw new Error('Too many redirects');

  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(rawUrl); }
    catch { reject(new Error(`Invalid URL: ${rawUrl}`)); return; }

    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(rawUrl, {
      headers: { 'User-Agent': 'SCRIBE/1.0' },
      timeout,
    }, res => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, rawUrl).toString();
        res.resume(); // drain
        return resolve(fetch_url(next, timeout, maxBytes, redirectCount + 1));
      }

      let body = '';
      let truncated = false;
      let bytes = 0;

      res.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          truncated = true;
          req.destroy();
          return;
        }
        body += chunk.toString('utf-8');
      });

      res.on('end', () => resolve({
        url: rawUrl,
        status: res.statusCode,
        body,
        truncated,
      }));

      res.on('error', reject);
    });

    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout after ${timeout}ms`)); });
    req.on('error', reject);
  });
}

module.exports = { MANIFEST, run };
