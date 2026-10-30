// HYBRID RECALL — Build 2 of the GSK north-star program (2026-10-28).
//
// The problem it fixes: the baseline answering path used sync BM25-only
// recall (6 hits). BM25 misses meaning — synonyms, paraphrase, a
// question worded differently from the stored passage. Build 2 widens
// the net (BM25 + dense vector search, fused by Reciprocal Rank
// Fusion) and then re-orders the fused candidates with a fast,
// deterministic scorer, so the 6 passages that reach the prompt are
// the best of a wider field, not just the best of the keyword field.
//
// What this module owns (Node builtins only for its own code; the two
// tree modules it lazy-requires already live in the workbench):
//   tokenize()          — lowercase alnum tokens + stopword filter
//   fuseRRF()           — Reciprocal Rank Fusion (k=60) over ranked lists
//   deterministicScore()— DETERMINISTIC passage scorer (NOT neural)
//   rerank()            — RRF + deterministic score, best-first
//   formatRecallBlock() — the SAME delimited block recallBlock builds
//   retrieve()          — BM25 + dense → fuse → rerank → top 6 block
//
// HONEST NAMING (do not rename these without changing the docs too):
// The reranker here is DETERMINISTIC — term coverage, phrase matches,
// title priors, length normalization. It is NOT a cross-encoder, NOT
// neural, NOT MiniLM. A neural cross-encoder may replace the scorer
// later WITHOUT changing callers: rerank() takes a `scorer` argument
// with the signature (query, passage) => number. Swap that one
// function; fuse/format/retrieve stay untouched.
//
// DENSE-LEG SAFETY (privacy gate, 2026-10-28): the vector store
// records bare basenames, so a dense hit from a file named
// profit_bible.md cannot be proven to be form A rather than form B
// (form B is excluded from the prompt path by the privacy gate, and
// the VM store's profit_bible.md hits come from a file that is NOT
// in the current .seshat-brain tree — stale snapshot, unverifiable
// provenance). Such hits are EXCLUDED from candidates, counted in
// denseExcluded, and never logged with their text. BM25 form-A
// passages (deep/genesis/THE-PROFIT-BIBLE.md) are unaffected — they
// carry full source paths and flow through the BM25 leg.
//
// FAILURE CONTRACT: the dense leg NEVER throws. A missing module, a
// missing store, a timed-out embedder, or an empty dense list all
// degrade to BM25-only with vectorAvailable=false. retrieve() throws
// ONLY if the BM25 leg itself fails — and the server wiring catches
// even that and falls back to the legacy 6-hit recall. A chat turn
// never breaks because retrieval did.
"use strict";

const path = require("path");

// Basenames that must never reach the prompt via the dense leg, for
// the provenance reason in the header. Compared case-insensitively
// against the basename of the dense hit's file field.
const EXCLUDED_DENSE_BASENAMES = new Set(["profit_bible.md"]);

// Small stopword set for query terms. Passage matching uses the same
// tokenization; stopwords are dropped from the QUERY side only, so a
// passage still matches on its content words.
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "is", "are", "was",
  "were", "be", "been", "being", "for", "on", "with", "by", "at",
  "from", "as", "it", "its", "this", "that", "these", "those", "you",
  "your", "he", "she", "they", "we", "i", "me", "my", "his", "her",
  "their", "our", "not", "no", "do", "does", "did", "done", "what",
  "who", "whom", "when", "where", "why", "how", "which", "isnt",
  "isn", "t", "s", "d", "ll", "ve", "re", "am", "an",
]);

function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 2);
}

function queryTerms(query) {
  const seen = new Set();
  const out = [];
  for (const t of tokenize(query)) {
    if (STOPWORDS.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function normWs(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

// Identity fingerprint for merging: the same 160-char opening print
// deep-memory uses for dedup. Two hits with the same fingerprint are
// treated as the same passage even when the BM25 source path and the
// dense file field spell its origin differently.
function fingerprint(text) {
  return String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 160);
}

function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

// Reciprocal Rank Fusion. `lists` is an array of ranked arrays; each
// item must carry a `key` (identity across lists). Score =
// sum over lists containing the item of 1 / (k + rank), rank 1-based.
// Ties break toward the earlier list (BM25 first) and then toward the
// earlier position, so the fusion is stable and deterministic.
function fuseRRF(lists, k = 60, limit = 50) {
  const byKey = new Map();
  const order = [];
  lists.forEach((list, listIdx) => {
    (list || []).forEach((item, idx) => {
      const rank = idx + 1;
      let c = byKey.get(item.key);
      if (!c) {
        c = { item, rrf: 0, ranks: {}, firstList: listIdx, firstPos: idx };
        byKey.set(item.key, c);
        order.push(c);
      }
      c.rrf += 1 / (k + rank);
      c.ranks[listIdx] = rank;
    });
  });
  const fused = order
    .map((c) => ({ ...c.item, rrf: c.rrf, ranks: c.ranks }))
    .sort((a, b) => {
      if (b.rrf !== a.rrf) return b.rrf - a.rrf;
      const aFirst = Math.min(...Object.values(a.ranks));
      const bFirst = Math.min(...Object.values(b.ranks));
      return aFirst - bFirst;
    });
  return fused.slice(0, limit);
}

// DETERMINISTIC passage scorer. NOT neural, NOT a cross-encoder, NOT
// MiniLM — pure term/phrase/title/length arithmetic, same input
// always gives the same score, no model, no network, milliseconds.
//   coverage  — fraction of query terms present in the passage
//   phrase    — full-query phrase (+0.25) and query bigrams (+0.05
//               each, capped +0.25) present in the passage
//   title     — fraction of query terms present in the title (×0.15)
//   length    — mild penalty for very short (<20 words) or very long
//               (>600 words) passages; 1.0 otherwise
//   recency   — reserved: passages carry no timestamps, so this
//               component is 0 by design. If timestamped stores
//               arrive, add it here, never silently elsewhere.
// Returns a number in [0, 1].
function deterministicScore(query, passage) {
  const terms = queryTerms(query);
  if (terms.length === 0) return 0;
  const textNorm = normWs(passage.text);
  const textToks = new Set(tokenize(passage.text));
  const titleToks = new Set(tokenize(passage.title));

  let matched = 0;
  for (const t of terms) if (textToks.has(t)) matched++;
  const coverage = matched / terms.length;

  let phrase = 0;
  const qNorm = normWs(query);
  if (qNorm && textNorm.includes(qNorm)) phrase += 0.25;
  let bigramHits = 0;
  for (let i = 0; i + 1 < terms.length; i++) {
    if (textNorm.includes(terms[i] + " " + terms[i + 1])) bigramHits++;
  }
  phrase += Math.min(0.25, bigramHits * 0.05);

  let titleMatched = 0;
  for (const t of terms) if (titleToks.has(t)) titleMatched++;
  const title = (titleMatched / terms.length) * 0.15;

  const words = textNorm ? textNorm.split(" ").length : 0;
  const lengthFactor = words < 20 ? 0.85 : words > 600 ? 0.9 : 1.0;

  const raw = Math.min(1, coverage + phrase + title);
  return Math.round(raw * lengthFactor * 10000) / 10000;
}

// Re-order fused candidates best-first. final = 0.4 * normalized RRF
// + 0.6 * deterministic score, so the reranker leads but the fusion
// signal still breaks near-ties. `scorer` defaults to
// deterministicScore and is the ONLY seam a future neural
// cross-encoder replaces: it must keep the (query, passage) => number
// signature and return values in [0, 1].
function rerank(query, candidates, scorer = deterministicScore) {
  const list = (candidates || []).slice();
  if (list.length === 0) return [];
  const maxRrf = Math.max(...list.map((c) => c.rrf || 0));
  const scored = list.map((c, idx) => {
    const det = scorer(query, c);
    const rrfNorm = maxRrf > 0 ? (c.rrf || 0) / maxRrf : 0;
    return { ...c, detScore: det, rrfNorm, finalScore: Math.round((0.4 * rrfNorm + 0.6 * det) * 10000) / 10000, _orig: idx };
  });
  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if ((b.rrf || 0) !== (a.rrf || 0)) return (b.rrf || 0) - (a.rrf || 0);
    return a._orig - b._orig;
  });
  return scored.map(({ _orig, ...rest }) => rest);
}

// The SAME delimited block deep-memory recallBlock builds, so the
// cite-or-abstain prompt and the deterministic eval keep working
// unchanged: literal passage text preserved, [n] (shelf · source ·
// title) headers, same header + instruction text.
function formatRecallBlock(passages) {
  const list = (passages || []).filter((p) => p && p.text);
  if (list.length === 0) return "";
  const parts = list.map((h, i) =>
    `[${i + 1}] (Seshat deep memory · ${h.shelf} · ${h.source}${h.title ? " · " + h.title : ""})\n${h.text}`);
  return "## SESHAT DEEP MEMORY — recalled from your implanted memory\n" +
    "These are passages from your own memory (Seshat's keeping). Use them to answer questions about your origin, your past, and your library; name the source when a fact comes from here. For catalog facts — a soul's name, type, or PLT scores — the catalog-cards passages are the ONLY authority: never state a name or a score that does not appear in a passage above. If the passages do not cover the question, say what you do know and what you do not — never invent.\n" +
    "QUOTE DISCIPLINE (Phase 6): when a fact comes from a passage, copy its exact wording for names, file names, dates, counts and scores — quote the passage rather than paraphrasing it. A passage's TITLE (the file or heading it came from) is not its content: never present a title as the thing the passage says, and never swap a value for its label (a file's name is not its content; a marker is not the text it marks). If you are unsure of the exact wording, quote the shortest exact fragment you are sure of and say the rest is not in front of you.\n\n" +
    parts.join("\n\n");
}

function denseExcludedFile(file) {
  const base = String(file ?? "").split(/[\\/]/).pop().toLowerCase();
  if (EXCLUDED_DENSE_BASENAMES.has(base)) return true;
  const norm = String(file ?? "").toLowerCase().replace(/\\/g, "/");
  return norm.includes("gsk/profit_bible");
}

// Full hybrid retrieval for one query. Options (all optional):
//   bm25Limit (default 50) — BM25 list size incl. routing facets
//   denseLimit (default 50) — dense list size
//   denseEnabled (default true) — false forces BM25-only (tests, or a
//     caller that already knows the store is absent)
//   denseTimeoutMs (default 30000, env GSK_HYBRID_VECTOR_TIMEOUT_MS)
//     — a stalled embedder degrades to BM25-only, never hangs a turn
//   topN (default 6) — passages formatted into the prompt block
//   dm — injected deep-memory module { recallHits } (tests only)
//   denseFn — injected dense search (query, limit) => Promise<array>
//     (tests only)
// Throws ONLY if the BM25 leg fails; the caller falls back to legacy
// recall on any throw. The dense leg never throws.
async function retrieve(query, opts = {}) {
  const bm25Limit = opts.bm25Limit !== undefined ? opts.bm25Limit : 50;
  const denseLimit = opts.denseLimit !== undefined ? opts.denseLimit : 50;
  const denseEnabled = opts.denseEnabled !== undefined ? opts.denseEnabled : true;
  const denseTimeoutMs = opts.denseTimeoutMs !== undefined
    ? opts.denseTimeoutMs
    : numEnv("GSK_HYBRID_VECTOR_TIMEOUT_MS", 30000);
  const topN = opts.topN !== undefined ? opts.topN : 6;

  const dm = opts.dm || require("./deep-memory/deep-memory.cjs");
  // BM25 leg: recallHits preserves the soul-card + genesis routing
  // facets — a question that today pulls catalog cards or genesis
  // passages still pulls them, now as fusion candidates.
  const bm25 = dm.recallHits(query, bm25Limit);
  const bm25List = (bm25 || []).map((h) => ({
    ...h,
    key: "bm25:" + h.source + "|" + h.title,
    fp: fingerprint(h.text),
  }));

  let denseRaw = [];
  let vectorAvailable = false;
  let denseExcluded = 0;
  if (denseEnabled) {
    try {
      const denseFn = opts.denseFn || (async (q, limit) => {
        const { hybridSearch } = require("./profit-brain/body/seshat/core/hybridSearch.js");
        return hybridSearch(q, { limit });
      });
      const timed = Promise.race([
        Promise.resolve().then(() => denseFn(query, denseLimit)),
        new Promise((_, reject) => setTimeout(() => reject(new Error("dense-timeout")), denseTimeoutMs)),
      ]);
      const got = await timed;
      denseRaw = Array.isArray(got) ? got : [];
      vectorAvailable = denseRaw.length > 0;
    } catch (e) {
      console.warn("[HYBRID RECALL] Dense leg unavailable, BM25-only:", e && e.message ? e.message : e);
      vectorAvailable = false;
      denseRaw = [];
    }
  }
  const denseList = [];
  for (const r of denseRaw) {
    if (!r || !r.text) continue;
    if (denseExcludedFile(r.file)) { denseExcluded++; continue; }
    denseList.push({
      shelf: "vector",
      source: "vector:" + (r.file || "unknown"),
      title: "vector hit",
      text: r.text,
      category: r.category,
      key: "dense:" + fingerprint(r.text),
      fp: fingerprint(r.text),
    });
  }
  if (denseExcluded > 0) {
    console.warn(`[HYBRID RECALL] Excluded ${denseExcluded} dense hit(s) by privacy-gate basename rule (count only, text never logged)`);
  }

  // Merge by fingerprint through fuseRRF: a dense hit whose text
  // matches a BM25 hit is the same passage — one candidate carrying
  // both ranks (BM25 list first, so BM25 source/title survive).
  const fused = fuseRRF([
    bm25List.map((c) => ({ ...c, key: "fp:" + c.fp })),
    denseList.map((c) => ({ ...c, key: "fp:" + c.fp })),
  ], 60, 50);

  const reranked = rerank(query, fused);
  const top = reranked.slice(0, topN).map((h) => ({
    shelf: h.shelf,
    source: h.source,
    title: h.title,
    score: h.finalScore,
    text: h.text,
  }));
  // ranked: the top 10 of the reranked order in hit shape, exposed
  // so eval harnesses can measure recall@10 without re-running the
  // fusion. The prompt block still uses only `top` (topN passages).
  const ranked = reranked.slice(0, 10).map((h) => ({
    shelf: h.shelf,
    source: h.source,
    title: h.title,
    score: h.finalScore,
    text: h.text,
  }));
  const block = formatRecallBlock(top);
  return {
    block,
    top,
    ranked,
    candidates: bm25List.length + denseList.length,
    fused: fused.length,
    reranked: reranked.length,
    topN: top.length,
    vectorAvailable,
    denseHits: denseList.length,
    denseExcluded,
    usedHybrid: true,
  };
}

module.exports = {
  EXCLUDED_DENSE_BASENAMES,
  tokenize,
  queryTerms,
  fingerprint,
  fuseRRF,
  deterministicScore,
  rerank,
  formatRecallBlock,
  denseExcludedFile,
  retrieve,
};
