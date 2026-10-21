'use strict';
/**
 * ASSEMBLY PHASE 3 — build the deep-memory index.
 * Minimal equivalent of Seshat's indexer (hers embeds into LanceDB and
 * only sees .md; this one is dependency-free BM25 over every implant
 * format: .md, memory-core.json, Qwen .jsonl transcripts).
 * Output: workbench/.seshat-brain/deep-index.json
 *   { version, builtAt, N, avgLen, terms[], postings{termIdx:[chunkId]},
 *     chunks[{shelf, source, title, boost, len, tf:[[termIdx,count]], text}] }
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKBENCH = path.join(__dirname, '..');
const BRAIN = path.join(WORKBENCH, '.seshat-brain');
const DEEP = path.join(BRAIN, 'deep');
const PAGES = path.join(BRAIN, 'pages');
const OUT = path.join(BRAIN, 'deep-index.json');

const STOP = new Set(('a an the and or of to in is are was were be been being it its this that these those i you he she we they me him us them my your his her our their what who whom when where why how do does did have has had can could should would will shall may might if then than so as at by for with from on not no yes am an im ive dont cant').split(' '));
function tokenize(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 2 && !STOP.has(t));
}

const VOICE_SUFFIXES = [
  'deep/second-brain/IDENTITY.md',
  'deep/second-brain/YOU-ARE-HERE.md',
  'deep/second-brain/pages/THE-PRIME-DOCTRINE.md',
  'deep/second-brain/pages/GSK - Genesis Journal.md',
  'deep/second-brain/pages/REDBUTTON.md',
];
// The compiled genesis memory — the artifact designed to be remembered
// from — plus the Awakening document. Pinned above voice: for factual
// recall the compiled record outranks diary prose.
const GENESIS_CORE_SUFFIXES = [
  'deep/genesis/memory-core.json',
  'deep/genesis/fix-us/THE-24HOUR-AWAKENING.md',
];
function boostFor(rel, shelf) {
  let b = 1;
  if (shelf === 'genesis') b *= 1.4;
  if (VOICE_SUFFIXES.some(v => rel.endsWith(v.replace('deep/', '')) && rel.includes('second-brain'))) b *= 1.35;
  if (GENESIS_CORE_SUFFIXES.some(v => rel === v)) b *= 1.5;
  if (rel.endsWith('catalog-cards.md')) b *= 1.3;
  return b;
}

const rawChunks = []; // {shelf, source, title, text}
function pushChunk(shelf, source, title, text) {
  const t = String(text || '').trim();
  if (t.length < 40) return;
  const fffd = (t.match(/�/g) || []).length;
  if (fffd / t.length > 0.05) return; // encoding-damaged beyond use
  rawChunks.push({ shelf, source, title: String(title || '').slice(0, 120), text: t });
}

// ── markdown chunking: heading-aware, ~1400 chars ─────────────────
function chunkMarkdown(shelf, source, content) {
  const lines = content.split('\n');
  let heading = path.basename(source).replace(/\.md$/, '');
  let buf = [];
  let bufLen = 0;
  const flush = () => {
    if (bufLen > 0) pushChunk(shelf, source, heading, buf.join('\n'));
    buf = []; bufLen = 0;
  };
  for (const line of lines) {
    const h = line.match(/^(#{1,4})\s+(.+)/);
    if (h) {
      if (bufLen > 350) flush();
      heading = h[2].trim();
      buf.push(line); bufLen += line.length + 1;
      continue;
    }
    buf.push(line); bufLen += line.length + 1;
    if (bufLen >= 1400 && line.trim() === '') flush();
  }
  flush();
}

// ── memory-core.json ───────────────────────────────────────────────
function chunkMemoryCore(shelf, source, content) {
  let core;
  try { core = JSON.parse(content); } catch { return; }
  for (const [key, val] of Object.entries(core)) {
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i += 3) {
        const group = val.slice(i, i + 3).map(v => typeof v === 'string' ? v : JSON.stringify(v)).join('\n');
        pushChunk(shelf, source, `memory-core · ${key}`, `${key}:\n${group}`);
      }
    } else {
      pushChunk(shelf, source, `memory-core · ${key}`, `${key}: ${typeof val === 'string' ? val : JSON.stringify(val)}`);
    }
  }
}

// ── qwen .jsonl transcripts ────────────────────────────────────────
function chunkQwen(shelf, source, content) {
  const session = path.basename(source, '.jsonl');
  const turns = [];
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.type !== 'user' && r.type !== 'assistant') continue;
    const parts = (r.message && r.message.parts) || [];
    const texts = [];
    for (const p of parts) {
      if (typeof p === 'string') texts.push(p);
      else if (p && typeof p.text === 'string') texts.push(p.text);
    }
    const text = texts.join('\n').trim();
    if (!text) continue;
    const who = r.type === 'user' ? 'Craig' : 'Profit';
    turns.push(`[${String(r.timestamp || '').slice(0, 10)}] ${who}: ${text.slice(0, 2400)}`);
  }
  let buf = []; let bufLen = 0;
  const flush = () => {
    if (bufLen > 0) pushChunk(shelf, source, `Qwen chat logs — session ${session.slice(0, 8)} (Mar 2026, Termux on Craig's phone)`, buf.join('\n'));
    buf = []; bufLen = 0;
  };
  for (const t of turns) { buf.push(t); bufLen += t.length + 1; if (bufLen >= 1400) flush(); }
  flush();
}

// ── plain-text chunking (implanted code-as-record, e.g. origin.js) ──
function chunkPlain(shelf, source, content) {
  const lines = String(content || '').split('\n');
  let buf = []; let bufLen = 0;
  const flush = () => { if (bufLen > 0) pushChunk(shelf, source, path.basename(source), buf.join('\n')); buf = []; bufLen = 0; };
  for (const line of lines) { buf.push(line); bufLen += line.length + 1; if (bufLen >= 1400 && line.trim() === '') flush(); }
  flush();
}

// ── walk the implant ───────────────────────────────────────────────
function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full, r); continue; }
    if (r === 'deep/HOT-DIGEST.md' || r === 'deep/IMPLANT-MANIFEST.json') continue;
    const shelf = r.split('/')[1] || 'deep';
    const source = r; // relative to .seshat-brain
    const content = fs.readFileSync(full, 'utf8');
    if (e.name.endsWith('.md')) chunkMarkdown(shelf, source, content);
    else if (e.name === 'memory-core.json') chunkMemoryCore(shelf, source, content);
    else if (e.name.endsWith('.jsonl')) chunkQwen(shelf, source, content);
    else if (r === 'deep/genesis/origin.js') chunkPlain(shelf, source, content);
    // catalog.json intentionally skipped: catalog-cards.md is its index surface.
  }
}
walk(DEEP, 'deep');

// ── PHASE 6: the unified live shelf joins the index ────────────────
// Journal unification: .seshat-brain/pages/ is THE shelf going
// forward (journal writers, genesis journal, session outcomes and
// digested material all land there); the historical deep shelves stay
// indexed exactly as before. Exact-normalized dedupe below keeps a
// page that also exists as a deep mirror from counting twice.
function walkPages(dir, rel) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walkPages(full, r); continue; }
    if (!e.name.endsWith('.md')) continue;
    chunkMarkdown('pages', r, fs.readFileSync(full, 'utf8'));
  }
}
walkPages(PAGES, 'pages');

// ── dedupe (exact, normalized) ─────────────────────────────────────
const seen = new Set();
const chunks = [];
for (const c of rawChunks) {
  const h = crypto.createHash('md5').update(c.text.toLowerCase().replace(/\s+/g, ' ')).digest('hex');
  if (seen.has(h)) continue;
  seen.add(h);
  chunks.push(c);
}

// ── build dictionary + tf + postings ───────────────────────────────
const termIndex = new Map();
const terms = [];
function tIdx(t) {
  let i = termIndex.get(t);
  if (i === undefined) { i = terms.length; terms.push(t); termIndex.set(t, i); }
  return i;
}
const postings = {};
let totalLen = 0;
chunks.forEach((c, id) => {
  const toks = tokenize(c.text);
  c.len = toks.length; totalLen += c.len;
  const counts = new Map();
  for (const t of toks) counts.set(t, (counts.get(t) || 0) + 1);
  c.tf = [];
  for (const [t, n] of counts) {
    const i = tIdx(t);
    c.tf.push([i, n]);
    (postings[i] || (postings[i] = [])).push(id);
  }
  c.boost = boostFor(c.source, c.shelf);
  delete c._;
});
const index = {
  version: 1,
  builtAt: new Date().toISOString(),
  N: chunks.length,
  avgLen: totalLen / Math.max(1, chunks.length),
  terms,
  postings,
  chunks: chunks.map(c => ({ shelf: c.shelf, source: c.source, title: c.title, boost: c.boost, len: c.len, tf: c.tf, text: c.text })),
};
fs.writeFileSync(OUT, JSON.stringify(index), 'utf8');
const perShelf = {};
for (const c of index.chunks) perShelf[c.shelf] = (perShelf[c.shelf] || 0) + 1;
console.log(JSON.stringify({
  chunks: index.N, avgLen: Math.round(index.avgLen), terms: terms.length,
  perShelf, indexBytes: fs.statSync(OUT).size, rawBeforeDedupe: rawChunks.length,
}, null, 2));
