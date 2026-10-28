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
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.error('[build-index] WARN: cannot list ' + dir + ' (' + e.message + ') — skipping that directory.');
    skippedFiles++;
    return;
  }
  for (const e of entries) {
    const r = rel ? rel + '/' + e.name : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full, r); continue; }
    if (r === 'deep/HOT-DIGEST.md' || r === 'deep/IMPLANT-MANIFEST.json') continue;
    const shelf = r.split('/')[1] || 'deep';
    const source = r; // relative to .seshat-brain
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch (e) {
      console.error('[build-index] WARN: cannot read ' + full + ' (' + e.message + ') — skipping that file.');
      skippedFiles++;
      continue;
    }
    if (e.name.endsWith('.md')) chunkMarkdown(shelf, source, content);
    else if (e.name === 'memory-core.json') chunkMemoryCore(shelf, source, content);
    else if (e.name.endsWith('.jsonl')) chunkQwen(shelf, source, content);
    else if (r === 'deep/genesis/origin.js') chunkPlain(shelf, source, content);
    // catalog.json intentionally skipped: catalog-cards.md is its index surface.
  }
}
// BUILD-RESILIENCE (2026-10-27, PC blocker): the clone carries no
// .seshat-brain (gitignored), so a PC build with an uncopied brain
// used to die on a bare ENOENT inside walk(). Fail loud and clear
// instead, so the operator knows the brain tree itself is missing.
if (!fs.existsSync(DEEP)) {
  console.error('[build-index] FATAL: deep shelf missing: ' + DEEP);
  console.error('[build-index] The brain tree was not copied to this machine. Copy .seshat-brain/deep/ here first, then re-run.');
  process.exit(2);
}
let skippedFiles = 0;
walk(DEEP, 'deep');

// ── PHASE 6: the unified live shelf joins the index ────────────────
// Journal unification: .seshat-brain/pages/ is THE shelf going
// forward (journal writers, genesis journal, session outcomes and
// digested material all land there); the historical deep shelves stay
// indexed exactly as before. Exact-normalized dedupe below keeps a
// page that also exists as a deep mirror from counting twice.
function walkPages(dir, rel) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.error('[build-index] WARN: cannot list ' + dir + ' (' + e.message + ') — skipping that directory.');
    skippedFiles++;
    return;
  }
  for (const e of entries) {
    const r = rel ? rel + '/' + e.name : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walkPages(full, r); continue; }
    if (!e.name.endsWith('.md')) continue;
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch (e) {
      console.error('[build-index] WARN: cannot read ' + full + ' (' + e.message + ') — skipping that file.');
      skippedFiles++;
      continue;
    }
    chunkMarkdown('pages', r, content);
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
// BUILD-PEAK FIX (2026-10-27): rawChunks still holds every pre-dedupe
// chunk object (including dropped duplicates) while the index is built
// and serialized. The kept objects already live in `chunks`, so release
// the raw array now; the count is captured first for the final log.
const rawBeforeDedupe = rawChunks.length;
rawChunks.length = 0;

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
// FIX 1 (2026-10-26, atomic index writes): NEVER write directly over the
// live index. A hunt/watcher rebuild that dies mid-write used to leave a
// truncated deep-index.json on disk, and every later recall read it as
// empty. Instead: (1) serialize once, (2) write to a temp file in the
// SAME directory as OUT (same filesystem, so rename is atomic),
// (3) fsync the temp file, (4) verify integrity by reading the temp
// file back and JSON-parsing it + checking its structure, (5) only
// then fs.renameSync over the live index. Concurrent readers are safe:
// rename swaps the directory entry atomically — a reader opening
// before the rename sees the complete old inode, a reader opening
// after sees the complete new inode, and no reader ever sees a
// half-written file. On any verification failure the temp file is
// removed and the live index is left untouched (process exits nonzero).
let serialized = JSON.stringify(index);
const tmpOut = OUT + '.tmp-' + process.pid;
try {
  fs.writeFileSync(tmpOut, serialized, 'utf8');
  // BUILD-PEAK FIX (2026-10-27): the serialized string (~78MB) is dead
  // after the write, but verification below re-reads + re-parses the
  // temp file into a second full object. Nulling the string first
  // keeps one whole copy out of the verification-time peak (was:
  // index object + serialized string + temp-file string + verified
  // object alive at once).
  serialized = null;
  // WINDOWS FIX (2026-10-27, PC EPERM): fsync on a read-only handle
  // fails EPERM on Windows (FlushFileBuffers needs write access),
  // which killed every PC build at this line before the rename.
  // Open read-write so fsync succeeds there, and treat fsync as
  // best-effort anyway — the parse-back check below is the real
  // integrity gate, and durability must never kill the build.
  const tmpFd = fs.openSync(tmpOut, 'r+');
  try { fs.fsyncSync(tmpFd); } catch (e) {
    console.error('[build-index] WARN: tmp fsync best-effort failed (' + e.message + ') — continuing; parse-back verification still gates the rename.');
  } finally { fs.closeSync(tmpFd); }
  // Integrity check: parse the temp file back and validate structure
  // before it is allowed to replace the live index.
  let verified;
  try {
    verified = JSON.parse(fs.readFileSync(tmpOut, 'utf8'));
  } catch (e) {
    throw new Error('atomic write verification failed: temp index does not parse: ' + e.message);
  }
  if (!verified || verified.version !== 1 || !Array.isArray(verified.terms) ||
      !verified.postings || typeof verified.postings !== 'object' ||
      !Array.isArray(verified.chunks) || verified.N !== index.N ||
      verified.chunks.length !== index.chunks.length ||
      verified.terms.length !== index.terms.length) {
    throw new Error('atomic write verification failed: temp index structure mismatch');
  }
  fs.renameSync(tmpOut, OUT);
  try {
    const dirFd = fs.openSync(path.dirname(OUT), 'r');
    try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
  } catch { /* directory fsync is best-effort on some filesystems */ }
} catch (e) {
  try { fs.unlinkSync(tmpOut); } catch { /* temp already gone */ }
  throw e;
}
const perShelf = {};
for (const c of index.chunks) perShelf[c.shelf] = (perShelf[c.shelf] || 0) + 1;
console.log(JSON.stringify({
  chunks: index.N, avgLen: Math.round(index.avgLen), terms: terms.length,
  perShelf, indexBytes: fs.statSync(OUT).size, rawBeforeDedupe, skippedFiles,
}, null, 2));
