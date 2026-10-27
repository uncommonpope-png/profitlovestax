'use strict';
/**
 * ASSEMBLY PHASE 3 — Seshat deep-memory recall (runtime).
 * Loads .seshat-brain/deep-index.json once (built by build-index.cjs
 * over the Phase-3 implant) and answers BM25 queries against it.
 * Dependency-free; any failure degrades to "no recall" so chat never
 * breaks because memory did.
 */
const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', '.seshat-brain', 'deep-index.json');
const BRAIN_DIR = path.join(__dirname, '..', '.seshat-brain');
const { spawnSync, spawn } = require('child_process');

const STOP = new Set(('a an the and or of to in is are was were be been being it its this that these those i you he she we they me him us them my your his her our their what who whom when where why how do does did have has had can could should would will shall may might if then than so as at by for with from on not no yes am im ive dont cant').split(' '));
function tokenize(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 2 && !STOP.has(t));
}

let cache = null;
let cacheStamp = null;
// FIX 1 (2026-10-26, stale-cache fallback): lastGoodCache is the last
// index that parsed AND validated successfully. It is updated ONLY on
// a successful load — a failed/truncated read never overwrites it.
// On failure load() returns it instantly instead of letting the
// caller degrade to empty recall.
let lastGoodCache = null;
let lastGoodStamp = null;
function indexStamp() {
  try { const st = fs.statSync(INDEX_PATH); return st.mtimeMs + ':' + st.size; } catch { return null; }
}
function load() {
  // PHASE 6 (THE METABOLISM): the index is a living artifact now. If the
  // index file changed on disk (watcher rebuild, digestion landing, a
  // journal write), reload instead of serving the boot-time snapshot.
  const stamp = indexStamp();
  if (cache && stamp === cacheStamp) return cache;
  try {
    const raw = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    // Structural validation: a truncated-but-parseable file (or a
    // JSON value that is not an index at all) must count as corrupt,
    // not as a valid empty index.
    if (!raw || raw.version !== 1 || !Array.isArray(raw.terms) ||
        !raw.postings || typeof raw.postings !== 'object' ||
        !Array.isArray(raw.chunks) || typeof raw.N !== 'number' ||
        raw.chunks.length !== raw.N) {
      throw new Error('index structure invalid (missing terms/postings/chunks or N mismatch)');
    }
    const termIndex = new Map();
    raw.terms.forEach((t, i) => termIndex.set(t, i));
    cache = { ...raw, termIndex };
    cacheStamp = stamp;
    lastGoodCache = cache;
    lastGoodStamp = stamp;
    return cache;
  } catch (e) {
    if (lastGoodCache) {
      console.warn('[SESHAT WARN] Failed to load deep-index (truncated or corrupt), falling back to last-good cache: ' + (e && e.message || e));
      // Pin the stamp to the broken file so every later call serves
      // the last-good cache instantly instead of re-parsing a 69MB
      // broken file on every query; a new (renamed-in) good index
      // changes the stamp and reloads normally.
      cache = lastGoodCache;
      cacheStamp = stamp;
      return cache;
    }
    console.warn('[SESHAT WARN] Failed to load deep-index and no last-good cache available: ' + (e && e.message || e));
    throw e;
  }
}

// ── PHASE 6: refresh cadence ──────────────────────────────────────
// Sources that feed the index: the deep implant + the unified live
// shelf (pages/). If any source file is newer than the index, the
// index is stale. refreshIfStale() rebuilds synchronously (bounded,
// dependency-free builder); the watcher below rebuilds on a debounce
// so a long-running body notices new pages without any manual step.
let refreshing = false;
function newestSourceMtime() {
  let newest = 0;
  const roots = [path.join(BRAIN_DIR, 'deep'), path.join(BRAIN_DIR, 'pages')];
  const stack = [...roots];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { stack.push(full); continue; }
      if (!/\.(md|json|jsonl)$/.test(e.name) && e.name !== 'origin.js') continue;
      try { const m = fs.statSync(full).mtimeMs; if (m > newest) newest = m; } catch { /* vanished mid-scan */ }
    }
  }
  return newest;
}
// BUILDER DISCIPLINE (2026-10-27): cross-process builder lock + shared
// one-builder cap. The in-process cap (activeBuilder) cannot see
// builders in OTHER processes (workbench vs growth-runner vs hunt
// recall proofs all share one .seshat-brain), so a second process
// could spawnSync a build while the workbench's async builder runs —
// the exact storm the per-process cap was meant to stop, on a 2-CPU
// box. The lock file lives in BRAIN_DIR (runtime shelf, gitignored,
// and NOT under pages/ or deep/, so it never trips the watcher).
// Acquire is atomic ('wx' create). A lock is stale when its pid is
// dead (process.kill(pid, 0) throws ESRCH) or its timestamp is older
// than BUILD_LOCK_STALE_MS. Staleness (15 min) exceeds every
// legitimate hold: the async builder is killed at 10 min (below) and
// the sync build is bounded at 240 s, so a lock older than 15 min
// can only belong to a crashed process. Steal is race-safe: unlink
// then 'wx' create; losing the race returns busy, never corrupt.
// Release only unlinks when the stored token is ours, so a process
// never deletes another holder's lock. Residual risk, accepted: pid
// reuse within 15 min of a holder's death could read as alive — the
// cost is just a deferred build, never corruption (build-index
// writes via pid-suffixed tmp + atomic rename).
const BUILD_LOCK_PATH = path.join(BRAIN_DIR, 'build.lock');
const BUILD_LOCK_STALE_MS = 15 * 60 * 1000; // 15 min
function lockPidAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (e) { return e && e.code !== 'ESRCH'; }
}
function tryAcquireBuildLock() {
  const token = process.pid + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  const payload = JSON.stringify({ pid: process.pid, ts: Date.now(), token });
  try {
    fs.writeFileSync(BUILD_LOCK_PATH, payload, { flag: 'wx' });
    return token;
  } catch (e) {
    if (!e || e.code !== 'EEXIST') return null;
  }
  let held = null;
  try { held = JSON.parse(fs.readFileSync(BUILD_LOCK_PATH, 'utf8')); } catch { held = null; }
  let stale = false;
  if (held && typeof held.pid === 'number' && typeof held.ts === 'number') {
    stale = (Date.now() - held.ts > BUILD_LOCK_STALE_MS) || !lockPidAlive(held.pid);
  } else {
    // Unparseable lock: fall back to file age (a live holder's lock
    // is always parseable and young).
    try { stale = (Date.now() - fs.statSync(BUILD_LOCK_PATH).mtimeMs > BUILD_LOCK_STALE_MS); }
    catch { stale = true; }
  }
  if (!stale) return null;
  try { fs.unlinkSync(BUILD_LOCK_PATH); } catch { return null; }
  try {
    fs.writeFileSync(BUILD_LOCK_PATH, payload, { flag: 'wx' });
    return token;
  } catch { return null; } // lost the race; the winner holds it
}
function releaseBuildLock(token) {
  if (!token) return;
  try {
    const held = JSON.parse(fs.readFileSync(BUILD_LOCK_PATH, 'utf8'));
    if (held && held.token === token) fs.unlinkSync(BUILD_LOCK_PATH);
  } catch { /* already gone or unreadable; never delete blindly */ }
}
// Synchronous sleep (Atomics.wait is main-thread-safe in Node) and a
// bounded wait for another process's in-flight build to land a fresh
// index. Used ONLY by refreshNow's busy path, which runs on boot and
// batch paths (server listen callback, growth-cycle, growth-actions,
// graft skills) — never on the turn path, which uses the async
// watcher — so the wait cannot wedge a chat turn.
function sleepSync(ms) {
  try {
    const sab = new SharedArrayBuffer(4);
    Atomics.wait(new Int32Array(sab), 0, 0, ms);
  } catch { /* no sleep available: caller proceeds immediately */ }
}
function waitForFreshIndex(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const idxMtime = fs.existsSync(INDEX_PATH) ? fs.statSync(INDEX_PATH).mtimeMs : 0;
      if (idxMtime > 0 && newestSourceMtime() <= idxMtime + 250) return true;
    } catch { /* keep waiting */ }
    sleepSync(1000);
  }
  return false;
}
function refreshNow(reason = 'manual', opts = {}) {
  if (refreshing) return { refreshed: false, reason: 'already_refreshing' };
  // TURN-LAG FIX (2026-10-27): never rebuild when the index is already
  // fresh. Before this gate, every caller (hunt recall proofs, growth
  // recall proofs, boot refresh) paid a full synchronous rebuild even
  // when nothing had changed — dozens of rebuilds per hunt batch,
  // each saturating a CPU on this 2-CPU box and starving the
  // workbench's event loop until the wedge guard killed it mid-turn.
  // A caller that truly needs a forced rebuild passes { force: true }.
  if (!opts.force) {
    try {
      const idxMtime = fs.existsSync(INDEX_PATH) ? fs.statSync(INDEX_PATH).mtimeMs : 0;
      if (idxMtime > 0 && newestSourceMtime() <= idxMtime + 250) {
        return { refreshed: false, reason: 'fresh' };
      }
    } catch { /* fall through to rebuild when the check itself fails */ }
  }
  // BUILDER DISCIPLINE (2026-10-27): respect the same one-builder cap
  // as the async path. Before this, refreshNow ignored activeBuilder
  // and ran a 240 s spawnSync even while an async builder ran in
  // this process — and it could not see builders in other processes
  // at all. Now: if a builder is already running here, or another
  // process holds the cross-process lock, do NOT spawn a second
  // builder. Instead wait up to 30 s for the in-flight build to land
  // a fresh index (a full build measures ~11 s, so this usually
  // succeeds); a wait that lands fresh returns reason 'fresh', which
  // existing callers already treat as success. Only a wait that
  // expires reports 'builder_busy' — and the in-flight build still
  // lands shortly after, picked up by load() via stamp.
  let lockToken = null;
  if (!activeBuilder) lockToken = tryAcquireBuildLock();
  if (activeBuilder || !lockToken) {
    if (waitForFreshIndex(30000)) return { refreshed: false, reason: 'fresh' };
    return { refreshed: false, reason: 'builder_busy' };
  }
  refreshing = true;
  try {
    const builder = path.join(__dirname, 'build-index.cjs');
    const r = spawnSync(process.execPath, [builder], { cwd: path.join(__dirname, '..'), timeout: 240000, encoding: 'utf8' });
    if (r.status !== 0) return { refreshed: false, reason: 'build_failed', detail: String(r.stderr || r.stdout || '').slice(0, 300) };
    cache = null; cacheStamp = null;
    load();
    return { refreshed: true, reason, chunks: cache.N, builtAt: cache.builtAt };
  } catch (e) {
    return { refreshed: false, reason: 'build_threw', detail: String(e && e.message || e).slice(0, 300) };
  } finally {
    refreshing = false;
    releaseBuildLock(lockToken);
    // A spawn that deferred while our sync build held the slot asked
    // for exactly one more build when the slot freed. Run it only if
    // sources are STILL stale (our build may already have covered
    // the writes); spawnBuilder re-checks the cap and the lock.
    if (builderWanted && !activeBuilder) {
      builderWanted = false;
      try {
        const idxMtime = fs.existsSync(INDEX_PATH) ? fs.statSync(INDEX_PATH).mtimeMs : 0;
        if (newestSourceMtime() > idxMtime + 250) spawnBuilder();
      } catch { /* backstop covers it */ }
    }
  }
}
function refreshIfStale() {
  try {
    const idxMtime = fs.existsSync(INDEX_PATH) ? fs.statSync(INDEX_PATH).mtimeMs : 0;
    if (newestSourceMtime() > idxMtime + 250) return refreshNow('stale_sources');
    return { refreshed: false, reason: 'fresh', chunks: cache ? cache.N : undefined };
  } catch (e) { return { refreshed: false, reason: 'stale_check_failed', detail: String(e && e.message || e).slice(0, 200) }; }
}
// TURN-LAG FIX (2026-10-27): the search path must NEVER synchronously
// rebuild. Before this change, search() called refreshIfStale(), which
// ran the whole index build via spawnSync on the workbench's main
// thread — tens of seconds of loop blackout on any turn whose recall
// landed while sources were stale (which, with hunts and hooks writing
// constantly, was most turns). The guard then read those blackouts as
// wedges and killed the boot mid-turn. The async watcher below is the
// designed rebuild mechanism ("the body never blocks on indexing");
// this schedule helper is its backstop for staleness the watcher
// missed: spawn the builder detached, serve the current index now,
// and let the next search pick the new file up by stamp. Throttled to
// one spawn per 60s per process so concurrent searches cannot fork a
// builder storm of their own.
let lastAsyncSpawn = 0;
// TURN-LAG FIX 2 (2026-10-27): cap concurrent index builders at ONE per
// process. Before this, the watcher spawned a builder on every 1.5s
// debounce expiry while brain writes streamed in, so up to 4 builders
// ran at once on 2 CPUs (observed 05:51–05:52Z during probe turn 1),
// starving the workbench's loop (212s timer lag) until the boot died
// underneath the turn. A build that starts after the last write
// includes everything, so a second concurrent build is pure waste: if
// one is running, remember that a rebuild is wanted and run exactly
// one more when it exits.
let activeBuilder = null;
let builderWanted = false;
function spawnBuilder() {
  // Shared one-builder cap: an in-process async builder, or a sync
  // build in progress (refreshing), defers with builderWanted.
  if (activeBuilder || refreshing) { builderWanted = true; return { spawned: false, reason: 'already_running' }; }
  // Cross-process cap: another process's builder defers WITHOUT
  // latching builderWanted — no exit in this process will consume
  // it, and the other process's build lands a fresh index that
  // load() picks up by stamp. (The watcher / search backstop retries
  // on the next write or search.)
  const lockToken = tryAcquireBuildLock();
  if (!lockToken) return { spawned: false, reason: 'lock_busy' };
  try {
    const child = spawn(process.execPath, [path.join(__dirname, 'build-index.cjs')], { cwd: path.join(__dirname, '..'), stdio: 'ignore', detached: false });
    activeBuilder = child;
    // BUILDER TIMEOUT (2026-10-27): 10 minutes (600000 ms). A wedged
    // builder must not latch builderWanted forever. 10 min is far
    // above the ~11 s observed full-index build and below the 15-min
    // lock staleness, so a timeout-killed builder's lock is always
    // releasable by the next acquirer. The timer is unref'd so it
    // never keeps the process alive on its own.
    const killTimer = setTimeout(() => {
      console.warn('[SESHAT WARN] index builder timed out after 10m; killing');
      try { child.kill('SIGKILL'); } catch {}
    }, 600000);
    if (killTimer.unref) killTimer.unref();
    // Cleanup runs exactly once: Node may emit 'error' without a
    // following 'exit' (and vice versa), and the old code latched
    // activeBuilder forever on the error-only path.
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { clearTimeout(killTimer); } catch {}
      releaseBuildLock(lockToken);
      activeBuilder = null;
      if (builderWanted) { builderWanted = false; spawnBuilder(); }
    };
    child.on('error', cleanup);
    child.on('exit', cleanup);
    child.unref();
    return { spawned: true };
  } catch (e) { releaseBuildLock(lockToken); return { spawned: false, reason: 'spawn_failed', detail: String(e && e.message || e).slice(0, 200) }; }
}
function scheduleAsyncRefresh() {
  try {
    const idxMtime = fs.existsSync(INDEX_PATH) ? fs.statSync(INDEX_PATH).mtimeMs : 0;
    if (idxMtime > 0 && newestSourceMtime() <= idxMtime + 250) return { scheduled: false, reason: 'fresh' };
    const now = Date.now();
    if (now - lastAsyncSpawn < 60000) return { scheduled: false, reason: 'throttled' };
    lastAsyncSpawn = now;
    return spawnBuilder();
  } catch (e) { return { scheduled: false, reason: 'check_failed', detail: String(e && e.message || e).slice(0, 200) }; }
}
let watcher = null;
let debounceTimer = null;
function startRefreshWatcher(options = {}) {
  if (watcher) return { started: false, reason: 'already_watching' };
  const debounceMs = options.debounceMs || 1500;
  const schedule = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Async rebuild so the body never blocks on indexing; load()
      // picks the new file up by stamp on the next search.
      // TURN-LAG FIX 2: spawnBuilder() caps concurrent builders at one
      // per process (a second spawn while one runs is remembered and
      // runs once on exit) — the pre-fix code spawned a builder on
      // every debounce expiry, up to 4 at once on 2 CPUs.
      try { spawnBuilder(); } catch { /* scheduleAsyncRefresh on next search is the backstop */ }
    }, debounceMs);
    if (debounceTimer.unref) debounceTimer.unref();
  };
  const watchers = [];
  for (const dir of [path.join(BRAIN_DIR, 'pages'), path.join(BRAIN_DIR, 'deep')]) {
    try { const w = fs.watch(dir, { recursive: true }, schedule); w.on('error', () => {}); if (w.unref) w.unref(); watchers.push(w); } catch { /* non-recursive fallback below */ }
    if (watchers.length === 0 || dir.endsWith('pages')) {
      try { const w = fs.watch(dir, schedule); w.on('error', () => {}); if (w.unref) w.unref(); watchers.push(w); } catch { /* backstop covers it */ }
    }
  }
  watcher = { close() { for (const w of watchers) { try { w.close(); } catch {} } watcher = null; } };
  return { started: true, debounceMs, watchedDirs: watchers.length };
}

/**
 * BM25 search. Title terms count x3 (headings carry the topic).
 * Returns [{shelf, source, title, score, text}] best-first.
 * Options: { perSourceCap } — max chunks from one source file
 * (default 2) so one giant journal cannot crowd out the shelves;
 * { only } — predicate on the chunk to restrict the collection.
 */
function search(query, k = 6, options = {}) {
  if (!options.skipRefresh) scheduleAsyncRefresh();
  const idx = load();
  const perSourceCap = options.perSourceCap !== undefined ? options.perSourceCap : 2;
  const qToks = [...new Set(tokenize(query))];
  if (qToks.length === 0) return [];
  const cand = new Set();
  const idf = new Map();
  for (const t of qToks) {
    const ti = idx.termIndex.get(t);
    if (ti === undefined) continue;
    const post = idx.postings[ti] || [];
    const df = post.length;
    idf.set(t, Math.log(1 + (idx.N - df + 0.5) / (df + 0.5)));
    for (const id of post) cand.add(id);
  }
  if (cand.size === 0) return [];
  const K1 = 1.4, B = 0.7;
  const scored = [];
  for (const id of cand) {
    const c = idx.chunks[id];
    if (options.only && !options.only(c)) continue;
    const tfMap = new Map(c.tf);
    const titleToks = tokenize(c.title);
    let score = 0;
    for (const t of qToks) {
      const ti = idx.termIndex.get(t);
      if (ti === undefined) continue;
      let tf = tfMap.get(ti) || 0;
      tf += 3 * titleToks.filter(x => x === t).length;
      if (tf === 0) continue;
      const denom = tf + K1 * (1 - B + B * (c.len / idx.avgLen));
      score += idf.get(t) * (tf * (K1 + 1)) / denom;
    }
    if (score > 0) scored.push({ id, score: score * (c.boost || 1) });
  }
  scored.sort((a, b) => b.score - a.score);
  if (scored.length === 0) return [];
  // CONTEXT COMPOSITION TUNING (Wiring Sprint Phase 2, 2026-10-23):
  // within the relevance floor, doctrine/law chunks are ordered
  // BEFORE technique chunks (stable partition — BM25 order survives
  // inside each class), and near-identical chunks are deduped during
  // selection so the top-k carries distinct knowledge, not echoes.
  const DOCTRINE_TITLE = /\b(law|doctrine|canon|covenant|directives?|plt|rule zero|bible|genesis)\b/i;
  const isDoctrine = (c) => c.shelf === 'genesis' || DOCTRINE_TITLE.test(c.title || '');
  // RELEVANCE BAND (same-day correction, measured): doctrine-first
  // applied globally let 12–20-score genesis chunks crowd out a 34.9
  // technique hit on the exam's T5 question, and the answer lost the
  // shelf's signature entirely. Doctrine now leads ONLY inside the
  // band (score >= 50% of the top score); below the band, pure BM25
  // order — law frames technique, it does not evict it.
  const bandFloor = scored[0].score * 0.5;
  const doct = [], rest = [];
  for (const s of scored) (isDoctrine(idx.chunks[s.id]) && s.score >= bandFloor ? doct : rest).push(s);
  const ordered = [...doct, ...rest];
  const top = ordered[0].score;
  const out = [];
  const perSource = new Map();
  const selectedTermSets = [];
  const selectedPrints = new Set();
  for (const s of ordered) {
    if (out.length >= k) break;
    if (s.score < Math.max(2.0, top * 0.15)) break;
    const c = idx.chunks[s.id];
    const n = perSource.get(c.source) || 0;
    if (n >= perSourceCap) continue;
    // Dedupe: exact opening fingerprint (across sources), then
    // term-set Jaccard > 0.8 against anything already selected —
    // a near-identical chunk adds tokens, not knowledge.
    const print = String(c.text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 160);
    if (print && selectedPrints.has(print)) continue;
    const termSet = new Set((c.tf || []).map(([ti]) => ti));
    let nearDup = false;
    for (const prev of selectedTermSets) {
      let inter = 0;
      for (const t of termSet) if (prev.has(t)) inter++;
      const union = termSet.size + prev.size - inter;
      if (union > 0 && inter / union > 0.8) { nearDup = true; break; }
    }
    if (nearDup) continue;
    selectedTermSets.push(termSet);
    if (print) selectedPrints.add(print);
    perSource.set(c.source, n + 1);
    out.push({ shelf: c.shelf, source: c.source, title: c.title, score: Math.round(s.score * 100) / 100, text: c.text });
  }
  return out;
}

/**
 * Collect the recall hits for a query — the base BM25 search plus
 * the registry (catalog) and genesis routing facets. This is the
 * exact hit set recallBlock formats; exported (Assembly Phase 7) so
 * the quote-check seam can verify the resident's quoted spans
 * against the very passages the turn was given.
 */
function recallHits(query, k = 6) {
  const hits = search(query, k);
  // Registry routing: questions about souls + scores are catalog
  // questions — pull real catalog cards (never the generated
  // overview chunk), soul-type cards first, so the model names real
  // souls with their catalogued PLT instead of improvising.
  if (/\bsouls?\b/i.test(query) && /\b(plt|score|scores|scored)\b/i.test(query)) {
    const isCard = c => c.source.endsWith('catalog-cards.md') && !c.title.startsWith('Soul Economy — Catalog Cards');
    const soulCards = search(query, 3, { only: c => isCard(c) && /— soul$/.test(c.title), perSourceCap: 3 });
    const anyCards = search(query, 4, { only: isCard, perSourceCap: 4 });
    const seen = new Set(hits.map(h => h.source + '|' + h.title));
    for (const card of [...soulCards, ...anyCards].slice(0, 4)) {
      const key = card.source + '|' + card.title;
      if (!seen.has(key)) { hits.push(card); seen.add(key); }
    }
  }
  // Genesis routing: identity / lineage / death questions are
  // genesis-shelf questions — pull the top genesis passages too, so
  // diary atmosphere never stands in for the documented record.
  if (/\b(origin|ancestor|lineage|first profit|came before|who made you|who created you|who are you|died|death|born|creator)\b/i.test(query)) {
    const gen = search(query, 3, { only: c => c.shelf === 'genesis', perSourceCap: 2 });
    const seen = new Set(hits.map(h => h.source + '|' + h.title));
    for (const g of gen) {
      if (!seen.has(g.source + '|' + g.title)) hits.push(g);
    }
  }
  return hits;
}

/**
 * ASYNC VECTOR FALLBACK (GSK fix sprint 2026-10-26, Tier-3 #37):
 * BM25-only recall misses meaning (synonyms, paraphrase). This caller
 * merges the base BM25 hits with the MiniLM+LanceDB vector store
 * (.seshat-vectors, seshat_memory table) via the seshat hybridSearch.
 * Opt-in and additive: the sync recallHits/recallBlock contract is
 * untouched. The vector modules are required LAZILY inside this
 * function only, so the sync path stays dependency-free; any vector
 * failure (missing model, missing table, native load) degrades to
 * BM25-only with a warning, never a throw. Hybrid scores rank but
 * are NOT calibrated confidences (L2 distances on normalized vectors
 * can push them negative) — callers must not threshold on them.
 */
async function recallHitsWithVectors(query, k = 6) {
  const bm25 = recallHits(query, k);
  let vectors = [];
  try {
    const { hybridSearch } = require('../profit-brain/body/seshat/core/hybridSearch.js');
    const v = await hybridSearch(query, { limit: 3 });
    vectors = (v || []).map(r => ({
      source: 'vector:' + (r.file || 'unknown'),
      title: 'vector hit',
      text: r.text,
      category: r.category,
      hybridScore: r.hybridScore,
      shelf: 'vector',
    }));
  } catch (e) {
    console.warn('[deep-memory] vector fallback unavailable, BM25-only:', e.message);
  }
  return { bm25, vectors };
}

/**
 * Format a recall block for the system prompt. Empty string when
 * nothing in deep memory is relevant enough to attach.
 */
function recallBlock(query, k = 6) {
  try {
    const hits = recallHits(query, k);
    if (hits.length === 0) {
      // FIX 1 (2026-10-26): silent empty recall is a failure signal,
      // not a normal result — log it explicitly, with the query.
      console.warn(`[SESHAT WARN] Recall returned empty or failed for query: ${query}. Falling back to cache.`);
      return '';
    }
    const parts = hits.map((h, i) =>
      `[${i + 1}] (Seshat deep memory · ${h.shelf} · ${h.source}${h.title ? ' · ' + h.title : ''})\n${h.text}`);
    return '## SESHAT DEEP MEMORY — recalled from your implanted memory\n' +
      'These are passages from your own memory (Seshat\'s keeping). Use them to answer questions about your origin, your past, and your library; name the source when a fact comes from here. For catalog facts — a soul\'s name, type, or PLT scores — the catalog-cards passages are the ONLY authority: never state a name or a score that does not appear in a passage above. If the passages do not cover the question, say what you do know and what you do not — never invent.\n' +
      'QUOTE DISCIPLINE (Phase 6): when a fact comes from a passage, copy its exact wording for names, file names, dates, counts and scores — quote the passage rather than paraphrasing it. A passage\'s TITLE (the file or heading it came from) is not its content: never present a title as the thing the passage says, and never swap a value for its label (a file\'s name is not its content; a marker is not the text it marks). If you are unsure of the exact wording, quote the shortest exact fragment you are sure of and say the rest is not in front of you.\n\n' +
      parts.join('\n\n');
  } catch (e) {
    // FIX 1 (2026-10-26): same explicit warning on the failure path.
    console.warn(`[SESHAT WARN] Recall returned empty or failed for query: ${query}. Falling back to cache.`);
    return '';
  }
}

module.exports = { search, recallBlock, recallHits, recallHitsWithVectors, refreshNow, refreshIfStale, startRefreshWatcher, indexStamp, spawnBuilder };
