'use strict';
/**
 * plan-executor.cjs — level-wise plan executor rules.
 *
 * Design-form spec ported to code from north-star research batches
 * 169, 171, 173, 175, 177, 179 (see README.md for the mapping).
 * Zero dependencies, CommonJS, runs with plain `node`.
 *
 * What this module does NOT do (honest limits, see README):
 * - No model/tool integration: task functions are caller-supplied.
 * - No live latency measurement: timestamps recorded here are from
 *   the caller-supplied task functions' execution, not from real
 *   tool telemetry. No live timing data has been collected.
 * - Neither GAP (Batch 169) nor ModeX (Batch 169) classifies
 *   uncertainty sources. This module does not claim otherwise.
 */

// ---------------------------------------------------------------- utils

/** Nearest-rank percentile. values: number[]. Returns null for empty input. */
function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank - 1))];
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute DAG execution levels (Batch 169, GAP).
 * levels = longest-path depth: level 0 = no incoming edges;
 * level i = dependencies all in earlier levels (depth = 1 + max dep depth).
 * Tasks in the same level may run in parallel.
 *
 * tasks: [{ id, dependsOn?: string[] }]
 * Returns { levels: string[][], levelOf: { [id]: number } }.
 * Throws on duplicate ids, unknown dependencies, or cycles.
 */
function computeLevels(tasks) {
  if (!Array.isArray(tasks)) throw new Error('computeLevels: tasks must be an array');
  const byId = new Map();
  for (const t of tasks) {
    if (!t || typeof t.id !== 'string') throw new Error('computeLevels: every task needs a string id');
    if (byId.has(t.id)) throw new Error(`computeLevels: duplicate task id "${t.id}"`);
    byId.set(t.id, t);
  }
  const levelOf = new Map();
  const visiting = new Set();
  function depth(id) {
    if (levelOf.has(id)) return levelOf.get(id);
    if (visiting.has(id)) throw new Error(`computeLevels: cycle involving "${id}"`);
    const task = byId.get(id);
    if (!task) throw new Error(`computeLevels: unknown dependency "${id}"`);
    visiting.add(id);
    const deps = task.dependsOn || task.depends || [];
    let d = 0;
    for (const dep of deps) {
      if (!byId.has(dep)) throw new Error(`computeLevels: task "${id}" depends on unknown task "${dep}"`);
      d = Math.max(d, depth(dep) + 1);
    }
    visiting.delete(id);
    levelOf.set(id, d);
    return d;
  }
  for (const id of byId.keys()) depth(id);
  const levels = [];
  for (const [id, d] of levelOf) {
    if (!levels[d]) levels[d] = [];
    levels[d].push(id);
  }
  // Preserve caller task order within each level for determinism.
  const order = new Map(tasks.map((t, i) => [t.id, i]));
  for (const level of levels) level.sort((a, b) => order.get(a) - order.get(b));
  return { levels, levelOf: Object.fromEntries(levelOf) };
}

// ------------------------------------------------- modal selection (169)

/**
 * Mode-collapse guardrail (Batch 169, ModeX §7, verbatim in substance):
 * modal selection NEVER replaces the verifier + provenance checks for
 * committing hops — it selects WHICH equivalent call to execute, and
 * the verify-before-commit rule still governs WHETHER to commit.
 * A gate that executes the modal call unverified because it is modal
 * has mistaken consensus for correctness.
 */
const MODAL_SELECTION_GUARDRAIL =
  'Mode-collapse warning: modal selection NEVER replaces verifier + provenance ' +
  'checks for committing hops. It selects WHICH equivalent call to execute, not ' +
  'WHETHER to commit. A gate that executes the modal call unverified because it ' +
  'is modal has mistaken consensus for correctness. Neither GAP nor ModeX ' +
  'classifies uncertainty sources.';

/**
 * Minimal ModeX-with-normalized-AST modal selection for the disputed-hop tier.
 * candidates: [{ id, ... }] descriptors of equivalent-candidate tool calls.
 * keyFn(candidate): normalized-AST key (caller-supplied normalization:
 * same tool + normalized args => same key; different tools or
 * non-equivalent args => different keys). Default key is a JSON
 * rendering of tool + args (no normalization — callers that need
 * case/date/number normalization MUST supply keyFn).
 *
 * With 0/1 normalized-AST adjacency, the modal cluster is the largest
 * equivalence class (tie -> first encountered with the largest class),
 * and the centroid (max weighted degree) is the first member of that
 * class, since every member of an exact-equivalence class has equal
 * degree. This is the exact-adjacency reduction of ModeX, NOT a full
 * spectral (Fiedler-vector / conductance-tau) implementation — see README.
 * Returns { selected, clusterIds, clusterSize, totalCandidates, warning }.
 */
function modalSelect(candidates, keyFn) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { selected: null, clusterIds: [], clusterSize: 0, totalCandidates: 0, warning: MODAL_SELECTION_GUARDRAIL };
  }
  const key = typeof keyFn === 'function'
    ? keyFn
    : (c) => JSON.stringify({ tool: c.tool, args: c.args });
  const clusters = new Map(); // key -> [candidates]
  for (const c of candidates) {
    const k = key(c);
    if (!clusters.has(k)) clusters.set(k, []);
    clusters.get(k).push(c);
  }
  let best = null;
  for (const group of clusters.values()) {
    if (!best || group.length > best.length) best = group;
  }
  return {
    selected: best[0],
    clusterIds: best.map((c) => c.id),
    clusterSize: best.length,
    totalCandidates: candidates.length,
    warning: MODAL_SELECTION_GUARDRAIL,
  };
}

// --------------------------- prefix pruning for tool calls (Batch 192)
//
// ModeX-Lite transfer correction (Choi & Li, arXiv:2601.02535, read for
// the Lite sections in Batch 192): ModeX-Lite prunes every T=100 tokens
// on trajectories hundreds of tokens long (Algorithm 2: ClusterAndPrune
// when (t+1) mod T == 0, centroid deferred to termination). That interval
// does NOT transfer to schema-guided tool calls. A call that finishes
// before 100 tokens sees ZERO pruning intervals: a no-op that still paid
// N x generation. Batch 192 also records that §5.1 robustness was tested
// only for T in {100..500} on long trajectories (never below 100), that
// O(NL + N^2) with N << L is weaker when L is small (short calls), and
// that Lite-vs-full is MIXED by model/task (Qwen Lite N=16 beats full on
// summarization/code but loses math; Llama Lite loses on all three) —
// so a north-star Lite tier must be measured on the bundled base, never
// assumed. NO tool-call-specific early-pruning paper was found in
// Batch 192; this tier is designed from ModeX's mechanism + tool-JSON
// structure, not copied from a tool-call pruning result.
//
// The interval unit is therefore STRUCTURAL CHECKPOINTS, not tokens,
// in emission order for a schema-guided JSON call (exact field order is
// format-dependent; the checkpoint SET is the proposal):
//   C0 — tool-name closure: tool identity token(s) complete.
//   C1 — parameter-name-set closure: set of parameter names complete
//        (values may still be streaming).
//   C2 — value-prefix / complete call: values complete, or past a
//        first-value boundary for long free-text args.
//
// DIVERSITY-PRESERVING PRUNE RULE — the single largest deviation from
// ModeX-Lite as published (which prunes globally to "the most
// representative subset"): at C0 and C1, prune ONLY WITHIN a cluster,
// NEVER across clusters. Keep at least one representative per (tool)
// cluster at C0 and per (tool, parameter-name set) cluster at C1; within
// a cluster, prune near-duplicates (same normalized prefix) down to
// centroid-side members. A minority tool cluster is NEVER pruned on
// modal grounds at prefix stage: a minority tool is a competing
// hypothesis, not an outlier error. Cross-cluster modal selection happens
// ONLY once, at completion, via Batch 169's full-call modalSelect.
// Pruning is duplicate-reduction, NOT early selection. ModeX §7
// mode-collapse under early pruning is IRREVERSIBLE deletion: a pruned
// path cannot recover even if later tokens would have corrected it.
//
// TWO ENFORCED INVARIANTS:
// (a) ModeX candidates are alternative generations FOR THE SAME HOP.
//     GAP siblings (different sub-tasks in one level) must NEVER be
//     clustered as ModeX candidates: prefixPrune() throws when the
//     candidates carry differing hopId values. Pruning runs per hop,
//     inside a level's batch, independently per hop.
// (b) Pruning does NOT repeal Batch 5's sampling-tax rule. The
//     disputed-hop tier stays gated to disputed/high-stakes hops only.
//     Pruning makes a gated spend cheaper; it does not make an ungated
//     spend free (the spend is still N parallel generations up to the
//     first checkpoint). The falsifier result carries this gate note.
//
// CALIBRATION SPLIT (Batch 192): full-call conductance (Batch 169's
// original question, still open) vs prefix conductance at C0/C1 (new
// question) take SEPARATE thresholds, never merged. A threshold
// calibrated for full-call applied to prefix is a category error.
// Proposed starting point, NOT a constant: calibrate C0/C1 thresholds
// on logged disputed hops and report them separately from full-call tau.
// This module sets no prefix threshold constant.
//
// COST CURVE (documented, not a constant): the earliest checkpoint saves
// the most (pruning at C0 saves nearly the whole remaining call for
// pruned duplicates) but carries the least information (tool name only);
// later checkpoints are safer but save less. The staged rule respects
// it: cheap safe duplicate-pruning early, no irreversible cross-tool
// decision until completion.
//
// PREFIX SIMILARITY IS PARSED, NOT LEXICAL. ModeX's unigram/bigram/
// trigram Jaccard on raw prefix text misleads both ways on tool JSON:
// false merge (same tool + same first param, differing later params)
// and false split (same multi-token tool name, mid-name). Adjacency
// here is computed on the PARSED partial structure — tool name if
// closed, parameter-name set if closed, normalized values where
// present — with unclosed fields treated as UNKNOWN, not zero.
// parsePartialToolCall() is the prerequisite partial-JSON parser: it
// closes open strings/brackets provisionally FOR PARSING ONLY, never
// for execution, and its cost is UNMEASURED (recorded, Batch 192).

/** Sentinel for an unclosed (still-streaming) field value. Never a value. */
const PARTIAL_UNKNOWN = Symbol('partial-unknown');

/** Structural checkpoints, in emission order. */
const PREFIX_CHECKPOINTS = ['C0', 'C1', 'C2'];

const PREFIX_PRUNE_GUARDRAIL =
  'Prefix-pruning guardrail (Batch 192): prune ONLY WITHIN a cluster, ' +
  'NEVER across clusters. A minority tool cluster is never pruned on modal ' +
  'grounds at prefix stage. Cross-cluster modal selection happens only at ' +
  'completion via modalSelect. ModeX §7 mode-collapse under early pruning ' +
  'is IRREVERSIBLE deletion: a pruned path cannot recover. Pruning is ' +
  'duplicate-reduction, not early selection, and does NOT repeal Batch 5\'s ' +
  'sampling-tax gate: the disputed-hop tier stays gated to disputed/' +
  'high-stakes hops only.';

/**
 * Parse a partial schema-guided JSON tool call, FOR PARSING ONLY.
 * Never feed the result to execution: provisionally closed strings and
 * brackets are a parse aid, not a call.
 *
 * Accepts any root field order (format-dependent); looks for "tool" and
 * "args" keys at the root. Returns:
 * { tool, toolClosed, paramNames, paramValues, argsClosed, rootClosed }
 * - tool: string or null (null when absent or its string is unclosed).
 * - toolClosed: true only when the tool string terminated.
 * - paramNames: parameter names observed so far, in emission order.
 * - paramValues: name -> parsed value for closed values, PARTIAL_UNKNOWN
 *   for values still streaming (unclosed string, missing value, or a
 *   container still open). Unclosed fields are UNKNOWN, not zero.
 * - argsClosed / rootClosed: the corresponding object terminated.
 * Throws on input that is not a string.
 */
function parsePartialToolCall(text) {
  if (typeof text !== 'string') throw new Error('parsePartialToolCall: text must be a string');
  let i = 0;
  const n = text.length;
  const skipWs = () => { while (i < n && /\s/.test(text[i])) i++; };
  // Read a JSON string starting at text[i] === '"'. Returns
  // { value, closed, end } where end is past the closing quote (or n).
  function readString() {
    let out = '';
    i++; // opening quote
    while (i < n) {
      const ch = text[i];
      if (ch === '\\' && i + 1 < n) { out += text[i + 1]; i += 2; continue; }
      if (ch === '"') { i++; return { value: out, closed: true, end: i }; }
      out += ch;
      i++;
    }
    return { value: out, closed: false, end: i };
  }
  // Read a JSON literal (number/true/false/null) up to a delimiter or end.
  // A literal cut off by end-of-text is unclosed (its value is UNKNOWN).
  function readLiteral() {
    const start = i;
    while (i < n && !/[\s,\]}]/.test(text[i])) i++;
    const raw = text.slice(start, i);
    const hitEnd = i >= n;
    let value = raw;
    if (raw === 'true') value = true;
    else if (raw === 'false') value = false;
    else if (raw === 'null') value = null;
    else if (raw !== '' && !Number.isNaN(Number(raw))) value = Number(raw);
    return { value, closed: !hitEnd, end: i };
  }
  // Parse any JSON value. Returns { value, closed } where closed is false
  // when the value was cut off by end-of-text (its content is UNKNOWN for
  // clustering: callers must check closed before trusting value).
  function readValue() {
    skipWs();
    if (i >= n) return { value: PARTIAL_UNKNOWN, closed: false };
    const ch = text[i];
    if (ch === '"') {
      const s = readString();
      return s.closed ? { value: s.value, closed: true } : { value: PARTIAL_UNKNOWN, closed: false };
    }
    if (ch === '{') return readObject();
    if (ch === '[') return readArray();
    return readLiteral();
  }
  function readArray() {
    i++; // '['
    const items = [];
    let closed = false;
    for (;;) {
      skipWs();
      if (i >= n) break;
      if (text[i] === ']') { i++; closed = true; break; }
      if (text[i] === ',') { i++; continue; }
      const v = readValue();
      items.push(v.value);
      if (!v.closed) break;
    }
    return { value: items, closed };
  }
  // Parse an object, collecting entries as { key, value, valueClosed,
  // keyClosed }. A dangling key (no colon/value yet) is recorded with
  // value PARTIAL_UNKNOWN so its NAME is observed but its value is not.
  function readObject() {
    i++; // '{'
    const entries = [];
    let closed = false;
    for (;;) {
      skipWs();
      if (i >= n) break;
      if (text[i] === '}') { i++; closed = true; break; }
      if (text[i] === ',') { i++; continue; }
      if (text[i] !== '"') { i++; continue; } // tolerate stray characters
      const key = readString();
      if (!key.closed) { entries.push({ key: key.value, value: PARTIAL_UNKNOWN, valueClosed: false, keyClosed: false }); break; }
      skipWs();
      if (i >= n || text[i] !== ':') {
        entries.push({ key: key.value, value: PARTIAL_UNKNOWN, valueClosed: false, keyClosed: true });
        break;
      }
      i++; // ':'
      const v = readValue();
      entries.push({ key: key.value, value: v.value, valueClosed: v.closed, keyClosed: true });
      if (!v.closed) break;
    }
    return { value: entries, closed };
  }
  skipWs();
  const out = {
    tool: null, toolClosed: false, paramNames: [], paramValues: {},
    argsClosed: false, rootClosed: false,
  };
  if (i >= n || text[i] !== '{') return out;
  const root = readObject();
  out.rootClosed = root.closed;
  for (const e of root.value) {
    if (e.key === 'tool' && typeof e.value === 'string') { out.tool = e.value; out.toolClosed = e.valueClosed; }
    if (e.key === 'args' && Array.isArray(e.value)) {
      // valueClosed on the args entry IS the args object's own closed
      // flag (readObject returns { value: entries, closed }).
      out.argsClosed = e.valueClosed;
      out.paramNames = e.value.filter((a) => a.keyClosed).map((a) => a.key);
      for (const a of e.value) {
        if (a.keyClosed) out.paramValues[a.key] = a.valueClosed ? a.value : PARTIAL_UNKNOWN;
      }
    }
  }
  return out;
}

/**
 * Default value normalization for prefix keys: casefold strings
 * (Batch 10's cheapest rule). Full Batch 10 per-argument rules (number
 * tolerance, date parse, enum alias, documented defaults, ignored args)
 * are caller-supplied via opts.normalizeFn — the default does NOT claim
 * them. Keys are sorted so argument order never splits a cluster.
 */
function defaultNormalizeArgs(args) {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) return args;
  const norm = {};
  for (const k of Object.keys(args).sort()) {
    const v = args[k];
    norm[k] = typeof v === 'string' ? v.toLowerCase() : v;
  }
  return norm;
}

function normalizeValueForKey(value, normalizeFn) {
  if (value === PARTIAL_UNKNOWN) return null; // handled by caller, never keyed as a value
  if (typeof normalizeFn === 'function') return normalizeFn(value);
  return typeof value === 'string' ? value.toLowerCase() : value;
}

/**
 * Cluster key for one parsed prefix at a checkpoint.
 * - C0: tool name only. Unclosed tool => null (UNKNOWN singleton: the
 *   candidate cannot join any tool cluster yet — this is what prevents
 *   the lexical false split on a mid-name tool).
 * - C1: (tool, parameter-name multiset, Batch 10-normalized names as
 *   observed). Requires a closed tool; the caller supplies a C1 prefix,
 *   i.e. asserts the observed name set is complete.
 * - C2: (tool, normalized args prefix): closed values normalized, unclosed
 *   fields contribute their NAME only (value UNKNOWN, never zero). Two
 *   candidates sharing closed values and unclosed field names merge at
 *   C2 — the falsifier's prune-regret metric is what prices that merge.
 * Returns null when the checkpoint's required field is unclosed/absent.
 */
function prefixClusterKey(parsed, checkpoint, opts = {}) {
  if (!parsed || !PREFIX_CHECKPOINTS.includes(checkpoint)) return null;
  if (!parsed.toolClosed || !parsed.tool) return null;
  const normalizeFn = opts.normalizeFn;
  if (checkpoint === 'C0') return `tool:${parsed.tool}`;
  const names = [...parsed.paramNames].sort();
  if (checkpoint === 'C1') return `tool:${parsed.tool}|params:${names.join(',')}`;
  // C2
  const parts = [];
  for (const name of names) {
    const v = parsed.paramValues[name];
    if (v === PARTIAL_UNKNOWN) parts.push(`${name}:UNKNOWN`);
    else parts.push(`${name}:${JSON.stringify(normalizeValueForKey(v, normalizeFn))}`);
  }
  return `tool:${parsed.tool}|args:${parts.join(';')}`;
}

/**
 * Canonical serialization of a completed tool call, for replay prefixes.
 * Fixed field order (tool, then args with sorted keys) so checkpoint
 * offsets are deterministic. Format-dependent: a product format with a
 * different field order needs its own serializer, not this one.
 */
function canonicalToolCallJson(call) {
  const args = call.args && typeof call.args === 'object' && !Array.isArray(call.args)
    ? Object.fromEntries(Object.keys(call.args).sort().map((k) => [k, call.args[k]]))
    : call.args;
  return JSON.stringify({ tool: call.tool, args });
}

/**
 * Prefix text of a completed call at a checkpoint, for falsifier replay.
 * - C0: through the end of the tool-name string.
 * - C1: through the colon after the LAST parameter name (all names
 *   emitted; values may still stream). Empty args: through the args
 *   object's opening brace (the name set is trivially complete).
 * - C2: the complete call.
 * Returns the full text for C2, and for C0/C1 the sliced prefix.
 */
function checkpointPrefix(canonicalJson, checkpoint) {
  if (checkpoint === 'C2') return canonicalJson;
  if (checkpoint === 'C0') {
    const m = /"tool"\s*:\s*"/.exec(canonicalJson);
    if (!m) return canonicalJson;
    let j = m.index + m[0].length;
    while (j < canonicalJson.length) {
      if (canonicalJson[j] === '\\') { j += 2; continue; }
      if (canonicalJson[j] === '"') return canonicalJson.slice(0, j + 1);
      j++;
    }
    return canonicalJson;
  }
  if (checkpoint === 'C1') {
    const argsAt = canonicalJson.indexOf('"args":');
    if (argsAt === -1) return canonicalJson;
    const open = canonicalJson.indexOf('{', argsAt);
    if (open === -1) return canonicalJson;
    // Scan args-object keys; the last key's closing quote + colon ends C1.
    let j = open + 1;
    let lastColonEnd = open + 1; // empty-args fallback: through '{'
    let inStr = false;
    let esc = false;
    let strStart = -1;
    let depth = 1;
    let sawKey = false;
    while (j < canonicalJson.length && depth > 0) {
      const ch = canonicalJson[j];
      if (inStr) {
        if (esc) { esc = false; j++; continue; }
        if (ch === '\\') { esc = true; j++; continue; }
        if (ch === '"') {
          inStr = false;
          // A string at args-object depth 1 followed by ':' is a key.
          let k = j + 1;
          while (k < canonicalJson.length && /\s/.test(canonicalJson[k])) k++;
          if (depth === 1 && canonicalJson[k] === ':') { lastColonEnd = k + 1; sawKey = true; }
          j++;
          continue;
        }
        j++;
        continue;
      }
      if (ch === '"') { inStr = true; strStart = j; j++; continue; }
      if (ch === '{' || ch === '[') depth++;
      if (ch === '}' || ch === ']') depth--;
      j++;
    }
    void strStart;
    void sawKey;
    return canonicalJson.slice(0, lastColonEnd);
  }
  return canonicalJson;
}

/**
 * Diversity-preserving prefix prune for ONE hop's candidates.
 * candidates: [{ id, hopId?, prefixText }] where prefixText is the
 * partial call text at `checkpoint` (see candidatesAtCheckpoint, or
 * caller-supplied streaming prefixes). opts: { normalizeFn }.
 *
 * Rules, enforced: (1) cluster by prefixClusterKey; null-keyed
 * candidates are UNKNOWN singletons, never merged, never pruned.
 * (2) Within a cluster, prune ONLY near-duplicates: candidates sharing
 * the same normalized prefix key keep their first member (the
 * centroid-side member under exact adjacency, as in modalSelect) and
 * prune the rest. (3) At least one representative per cluster ALWAYS
 * survives — a minority tool cluster is never pruned on modal grounds.
 *
 * AMBIGUITY RECORDED (Batch 192's wording, read literally): at C0 the
 * observed prefix is the tool name only, so same-tool candidates are
 * observed-identical and collapse to one survivor per tool cluster —
 * even though their unemitted argument sets may differ. That collapse
 * is a bet on unemitted values, not a proven duplicate removal, and it
 * is EXACTLY what the falsifier's prune-regret metric prices: if a
 * collapsed candidate would have been the final centroid or the
 * person-accepted call, regret > 0 and C0 is not adoptable. Do not
 * "fix" this by silently keeping all same-tool candidates at C0 — that
 * would make C0 prune nothing and hide the question the falsifier
 * exists to answer. The safer reading (keep all same-tool candidates
 * until C1 splits them by parameter set) is the fallback if regret
 * condemns C0, and it is named here so a later round can adopt it
 * without re-deriving the choice.
 * (4) GAP-sibling guard: if candidates carry hopId values and they
 * differ, throw — siblings are different sub-tasks, not candidates.
 * Returns { checkpoint, kept, pruned, clusters, guardrail } with ids.
 */
function prefixPrune(candidates, checkpoint, opts = {}) {
  if (!PREFIX_CHECKPOINTS.includes(checkpoint)) throw new Error(`prefixPrune: unknown checkpoint "${checkpoint}"`);
  if (!Array.isArray(candidates)) throw new Error('prefixPrune: candidates must be an array');
  const hopIds = new Set(candidates.filter((c) => c && c.hopId !== undefined).map((c) => c.hopId));
  if (hopIds.size > 1) {
    throw new Error('prefixPrune: GAP siblings must never be clustered as ModeX candidates — ' +
      'candidates carry differing hopId values; prune per hop, independently per hop');
  }
  const clusters = new Map(); // cluster key -> [{ candidate, parsed, prefixKey }]
  const singletons = [];
  for (const c of candidates) {
    if (!c || typeof c.id !== 'string' || typeof c.prefixText !== 'string') {
      throw new Error('prefixPrune: every candidate needs a string id and prefixText');
    }
    const parsed = parsePartialToolCall(c.prefixText);
    const key = prefixClusterKey(parsed, checkpoint, opts);
    if (key === null) { singletons.push(c); continue; }
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push({ candidate: c, parsed, prefixKey: key });
  }
  const kept = [];
  const pruned = [];
  const clusterOut = [];
  for (const [key, members] of clusters) {
    // Within-cluster duplicate reduction: one kept member per distinct
    // normalized prefix key. At C0/C1 the cluster key IS the prefix key
    // (tool / tool+paramset), so a cluster keeps exactly one member only
    // when members share that key — which they do by construction. The
    // finer split below uses the C2-style key so that members differing
    // in closed values are NOT treated as duplicates.
    const byPrefix = new Map();
    for (const m of members) {
      const fine = prefixClusterKey(m.parsed, 'C2', opts);
      const fk = fine === null ? `singleton:${m.candidate.id}` : fine;
      if (!byPrefix.has(fk)) byPrefix.set(fk, []);
      byPrefix.get(fk).push(m.candidate.id);
    }
    const keptIds = [];
    const prunedIds = [];
    for (const ids of byPrefix.values()) {
      keptIds.push(ids[0]); // centroid-side member under exact adjacency
      prunedIds.push(...ids.slice(1));
    }
    kept.push(...keptIds);
    pruned.push(...prunedIds);
    clusterOut.push({ key, keptIds, prunedIds });
  }
  for (const c of singletons) kept.push(c.id);
  return { checkpoint, kept, pruned, clusters: clusterOut, guardrail: PREFIX_PRUNE_GUARDRAIL };
}

/**
 * Candidates at a checkpoint, from completed calls.
 * completed: [{ id, hopId?, tool, args }]. Returns candidates with
 * prefixText computed by checkpointPrefix over the canonical JSON.
 */
function candidatesAtCheckpoint(completed, checkpoint) {
  if (!PREFIX_CHECKPOINTS.includes(checkpoint)) throw new Error(`candidatesAtCheckpoint: unknown checkpoint "${checkpoint}"`);
  return (completed || []).map((c) => ({
    id: c.id, hopId: c.hopId, tool: c.tool, args: c.args,
    prefixText: checkpointPrefix(canonicalToolCallJson(c), checkpoint),
    fullText: canonicalToolCallJson(c),
  }));
}

/** Token proxy: word/punctuation token count. NOT a model tokenizer —
 *  falsifier token counts are proxy counts, labelled as such. */
function proxyTokens(text) {
  if (typeof text !== 'string') return 0;
  const m = text.match(/[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g);
  return m ? m.length : 0;
}

function distributionSummary(lengths) {
  if (!lengths.length) return { n: 0, min: null, p50: null, max: null, fracUnder100: null };
  const sorted = [...lengths].sort((a, b) => a - b);
  const p50 = sorted[Math.floor((sorted.length - 1) / 2)];
  return {
    n: lengths.length,
    min: sorted[0],
    p50,
    max: sorted[sorted.length - 1],
    fracUnder100: sorted.filter((x) => x < 100).length / sorted.length,
  };
}

const PREFIX_GATE_NOTE =
  'Batch 5 sampling-tax gate (Batch 192 interaction b): the disputed-hop ' +
  'tier stays gated to disputed/high-stakes hops only. Pruning makes a ' +
  'gated spend cheaper; it does not make an ungated spend free. This ' +
  'offline replay does not authorize live ungated sampling.';

/**
 * Falsifier harness for prefix pruning (Batch 192, fully specified there).
 * hops: [{ hopId, disputed?, candidates: [{ id, tool, args,
 * accepted? }] }] — completed candidates per hop, k each.
 * opts: { keyFn (full-call normalized-AST key, default JSON tool+args),
 * normalizeFn (prefix value normalization) }.
 *
 * Per hop and checkpoint it reports:
 * (a) agreement: prefix modal cluster's checkpoint-granularity key equals
 *     the final centroid's key at that granularity (C0: tool; C1:
 *     tool+paramset; C2: full normalized args — 1 by construction at
 *     completion, reported as such, not as evidence).
 * (b) prune regret: among candidates the rule would have pruned, the
 *     fraction that were the final centroid or person-accepted.
 * (c) tokens saved per hop at each checkpoint: proxy-token length of
 *     (full call minus checkpoint prefix), summed over pruned candidates.
 * Also: the tool-call token-length distribution (proxy tokens) over all
 * completed candidates — the distribution, not an assumed length, is
 * what proves a T=100 token interval would have been a no-op.
 *
 * PASS for adopting a checkpoint requires prune regret ≈ 0 (here:
 * regretCount === 0) AND agreement rising monotonically C0→C1→C2.
 * On synthetic fixtures the harness proves the HARNESS (mechanics,
 * monotone check, regret≈0 gate) — NOT the design. Tests state this
 * plainly; no agreement/regret number here is a finding about real
 * disputed hops, because NO real logged disputed hops exist yet.
 */
function falsifierReplay(hops, opts = {}) {
  if (!Array.isArray(hops)) throw new Error('falsifierReplay: hops must be an array');
  const keyFn = typeof opts.keyFn === 'function'
    ? opts.keyFn
    : (c) => JSON.stringify({ tool: c.tool, args: defaultNormalizeArgs(c.args) });
  const perCheckpoint = {};
  const allFullLengths = [];
  let totalPruned = 0;
  let totalRegret = 0;
  const hopResults = [];
  for (const hop of hops) {
    const completed = hop.candidates || [];
    for (const c of completed) allFullLengths.push(proxyTokens(canonicalToolCallJson(c)));
    const final = modalSelect(completed, keyFn);
    const finalCentroidId = final.selected ? final.selected.id : null;
    const acceptedIds = new Set(completed.filter((c) => c.accepted === true).map((c) => c.id));
    const hopEntry = { hopId: hop.hopId, disputed: hop.disputed === true, finalCentroidId, checkpoints: {} };
    for (const cp of PREFIX_CHECKPOINTS) {
      const atCp = candidatesAtCheckpoint(completed, cp);
      const prune = prefixPrune(atCp, cp, opts);
      // Prefix modal cluster: largest cluster by kept+pruned members;
      // tie -> first encountered (same rule as modalSelect).
      let modalKey = null;
      let modalSize = 0;
      for (const cl of prune.clusters) {
        const size = cl.keptIds.length + cl.prunedIds.length;
        if (size > modalSize) { modalSize = size; modalKey = cl.key; }
      }
      // Final centroid's key at this checkpoint's granularity.
      const centroidCand = completed.find((c) => c.id === finalCentroidId);
      let centroidKey = null;
      if (centroidCand) {
        const cpCand = atCp.find((c) => c.id === finalCentroidId);
        centroidKey = prefixClusterKey(parsePartialToolCall(cpCand.prefixText), cp, opts);
      }
      const agreement = modalKey !== null && centroidKey !== null && modalKey === centroidKey;
      const regretIds = prune.pruned.filter((id) => id === finalCentroidId || acceptedIds.has(id));
      const saved = prune.pruned.reduce((sum, id) => {
        const cand = atCp.find((c) => c.id === id);
        return sum + (proxyTokens(cand.fullText) - proxyTokens(cand.prefixText));
      }, 0);
      hopEntry.checkpoints[cp] = {
        agreement, pruned: prune.pruned, regretIds, tokensSavedProxy: saved,
      };
      if (!perCheckpoint[cp]) perCheckpoint[cp] = { hops: 0, agreements: 0, pruned: 0, regret: 0, tokensSavedProxy: 0 };
      const acc = perCheckpoint[cp];
      acc.hops++;
      if (agreement) acc.agreements++;
      acc.pruned += prune.pruned.length;
      acc.regret += regretIds.length;
      acc.tokensSavedProxy += saved;
      totalPruned += prune.pruned.length;
      totalRegret += regretIds.length;
    }
    hopResults.push(hopEntry);
  }
  const summary = {};
  for (const cp of PREFIX_CHECKPOINTS) {
    const acc = perCheckpoint[cp] || { hops: 0, agreements: 0, pruned: 0, regret: 0, tokensSavedProxy: 0 };
    summary[cp] = {
      hops: acc.hops,
      agreementRate: acc.hops ? acc.agreements / acc.hops : null,
      pruned: acc.pruned,
      regretCount: acc.regret,
      regretRate: acc.pruned ? acc.regret / acc.pruned : 0,
      tokensSavedPerHopProxy: acc.hops ? acc.tokensSavedProxy / acc.hops : 0,
    };
  }
  const monotone = summary.C0.agreementRate !== null && summary.C1.agreementRate !== null && summary.C2.agreementRate !== null
    && summary.C0.agreementRate <= summary.C1.agreementRate && summary.C1.agreementRate <= summary.C2.agreementRate;
  const adoptable = {};
  for (const cp of PREFIX_CHECKPOINTS) {
    // Per-checkpoint adoption requires regret ≈ 0 on THIS checkpoint and
    // the monotone chain holding overall; C2 agreement is 1 by
    // construction at completion and is never cited as evidence alone.
    adoptable[cp] = summary[cp].regretCount === 0 && monotone;
  }
  return {
    hops: hopResults,
    summary,
    monotoneAgreement: monotone,
    adoptable,
    tokenLengthDistributionProxy: distributionSummary(allFullLengths),
    totalPruned,
    totalRegret,
    gateNote: PREFIX_GATE_NOTE,
    guardrail: PREFIX_PRUNE_GUARDRAIL,
    provenanceNote: 'Synthetic fixtures prove the harness mechanics only. ' +
      'No real logged disputed hops exist yet; no agreement/regret number ' +
      'from a fixture run is a finding about the design. Token counts are ' +
      'proxy counts, not model-tokenizer counts.',
  };
}

// ------------------------------------------- per-tool latency / hedging

/**
 * Per-tool latency tracker: frozen baseline, hedge gates, stuck-call
 * rescue, breaker, and drift-gated recalibration.
 * Batches 173 (hedged reads, never-hedge-commits, 10% breaker),
 * 175 (100/400 tiers, frozen baseline, multi-path only),
 * 177 (abort-and-restart rescue, recalibration).
 */
class ToolLatencyTracker {
  constructor(tool, opts = {}) {
    this.tool = tool;
    // Batch 179: true when the tool's modes are NOT dispatch-observable,
    // so it keeps one pooled baseline (see pooledStuckThresholdFor-
    // UnobservableModes and recordRescue's investigation response).
    this.unobservableModes = opts.unobservableModes === true;
    // Batch 179 per-mode state: label -> mode record (see observeMode).
    this.modes = new Map();
    this.modeShareDriftLog = []; // retained across re-freezes
    this.modeSplitInvestigationLogged = false;
    this.observations = []; // every latency sample, in order
    this.frozenObservations = null;
    this.frozenP95 = null;
    this.frozenP99 = null;
    this.frozenVersion = 0;
    // Breaker window: calls observed since the current freeze.
    this.breakerWindowCalls = 0;
    this.breakerWindowExceedances = 0;
    this.breakerTripped = false;
    // Rescue window: same call stream, separate rescue counter.
    this.rescueCount = 0;
    this.rescueWindowCalls = 0;
    this.stuckMultiplier = 2; // 2x frozen p95; trips to 3x (Batch 177)
    this.hedgesIssued = 0;
    this.degradingLog = []; // retained across re-freezes
    this.consecutiveDriftWindows = 0;
  }

  get n() { return this.observations.length; }
  get frozenN() { return this.frozenObservations ? this.frozenObservations.length : 0; }
  /** Hedging eligibility tier (Batch 175): enabled at >= 100. */
  get hedgingEnabled() { return this.n >= 100; }
  /** Provisional tier: 100 <= n < 400. */
  get provisional() { return this.n >= 100 && this.n < 400; }
  /** Stable tier: n >= 400 (sample p95 rests on ~20 tail points). */
  get stable() { return this.n >= 400; }
  get hedgeRateVsFrozen() {
    return this.breakerWindowCalls > 0
      ? this.breakerWindowExceedances / this.breakerWindowCalls : 0;
  }
  get rescueRate() {
    return this.rescueWindowCalls > 0 ? this.rescueCount / this.rescueWindowCalls : 0;
  }
  /** Live breaker state: >10% over >=100 calls vs the FROZEN baseline. */
  get breakerActive() {
    return this.breakerWindowCalls >= 100 && this.hedgeRateVsFrozen > 0.10;
  }

  /** Record one latency sample (ms). Auto-freezes the first baseline at 100. */
  observe(ms) {
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) {
      throw new Error('observe: latency must be a finite non-negative number');
    }
    this.observations.push(ms);
    if (this.frozenP95 === null) {
      if (this.n >= 100) this.freezeBaseline();
    } else {
      this.breakerWindowCalls += 1;
      this.rescueWindowCalls += 1;
      if (ms > this.frozenP95) this.breakerWindowExceedances += 1;
      const was = this.breakerTripped;
      this.breakerTripped = this.breakerActive;
      if (this.breakerTripped && !was) {
        this.degradingLog.push({ kind: 'breaker-tripped', tool: this.tool, at: new Date().toISOString() });
      }
    }
    return this;
  }

  /**
   * Freeze the current observations as the baseline (sleep-job /
   * calibration event). Resets the breaker and rescue windows; the
   * degrading log is retained. T_stuck recomputes from the new baseline.
   */
  freezeBaseline() {
    this.frozenObservations = [...this.observations];
    this.frozenP95 = percentile(this.frozenObservations, 95);
    this.frozenP99 = percentile(this.frozenObservations, 99);
    this.frozenVersion += 1;
    this.breakerWindowCalls = 0;
    this.breakerWindowExceedances = 0;
    this.breakerTripped = false;
    this.rescueCount = 0;
    this.rescueWindowCalls = 0;
    this.stuckMultiplier = 2;
    this.consecutiveDriftWindows = 0;
    return { version: this.frozenVersion, frozenP95: this.frozenP95, frozenP99: this.frozenP99, frozenN: this.frozenN };
  }

  /**
   * Hedge decision (Batches 173 + 175). Three gates: eligibility
   * (multi-path read + n >= 100), trigger (frozen p95), breaker
   * (10% vs frozen baseline over >=100 calls). Never hedge commits
   * or writes. A tripped breaker disables only the duplicate hedge;
   * first attempts are unaffected (this decision says nothing about
   * whether the tool's first attempt runs).
   * opts: { kind: 'read'|'commit'|'write', paths: number, readOnly?: boolean }
   */
  shouldHedge(opts = {}) {
    const { kind, paths, readOnly } = opts;
    if (kind === 'commit' || kind === 'write') {
      return { hedge: false, reason: 'never-hedge-commits: committing hops are never hedged' };
    }
    if (kind !== 'read') {
      return { hedge: false, reason: 'hedging applies to reads only' };
    }
    if (readOnly === false) {
      return { hedge: false, reason: 'not read-only: hedging applies to idempotent reads only' };
    }
    if (typeof paths !== 'number' || paths < 2) {
      return { hedge: false, reason: 'single-path read: use the singleton stuck-call rule, not hedging (no independent second path)' };
    }
    if (!this.hedgingEnabled) {
      return { hedge: false, reason: `below 100-observation floor (${this.n} observations); p95 unknown, hedging disabled` };
    }
    if (this.breakerActive) {
      return { hedge: false, reason: 'breaker tripped: hedge rate vs frozen baseline exceeds 10% over >=100 calls; tool logged degrading' };
    }
    return { hedge: true, provisional: this.provisional, stable: this.stable, triggerMs: this.frozenP95, reason: 'multi-path read, frozen-baseline trigger' };
  }

  recordHedgeIssued() { this.hedgesIssued += 1; return this.hedgesIssued; }

  /**
   * Singleton stuck-call threshold (Batch 177):
   * T_stuck = max(multiplier x frozen p95, frozen p99) when the frozen
   * set has n >= 1000 (p99 rests on >=10 tail points); otherwise
   * multiplier x frozen p95. Multiplier is 2, tripped to 3 on rescue
   * rate > 2%. Null when no frozen baseline exists.
   */
  stuckThresholdMs() {
    if (this.frozenP95 === null) return null;
    const base = this.stuckMultiplier * this.frozenP95;
    if (this.frozenN >= 1000 && this.frozenP99 !== null) return Math.max(base, this.frozenP99);
    return base;
  }

  /**
   * Singleton stuck-call rescue evaluation (Batch 177). Rescue is
   * ABORT-AND-RESTART only — never a parallel duplicate. A parallel
   * duplicate on one resource is the retry-storm shape, not a hedge.
   * All gates required, in order; any failed gate = no rescue.
   * opts: { readOnly, idempotent, progressMade, abortAvailable,
   *         abortProven, attemptsUsed?, remainingBudgetMs? }
   * remainingBudgetMs omitted = treated as unbounded (documented).
   */
  /**
   * Shared rescue gates (Batch 177 gates 1, 2, 4, 5 + Batch 179 gate 3).
   * Gate 3 restated (Batch 179): "abortable = PROVEN in the audit, with
   * a class-appropriate proof." When opts.abortAudit is supplied it is
   * canonical and overrides the abortAvailable/abortProven booleans;
   * otherwise the booleans keep their Batch 177 meaning. thresholdMs
   * null means the caller has no T_stuck to compare against.
   */
  _rescueGates(thresholdMs, p95ForBudget, opts = {}) {
    if (thresholdMs === null) {
      return { rescue: false, mode: null, reason: 'no frozen baseline: stuck threshold cannot be computed' };
    }
    if (!(opts.readOnly && opts.idempotent)) {
      return { rescue: false, mode: null, reason: 'gate 1 failed: rescue requires a read-only, idempotent call (never-hedge-commits guard)' };
    }
    if (opts.progressMade) {
      return { rescue: false, mode: null, reason: 'gate 2 failed: progress already made — the call is slow, not stuck; never re-issue a call with partial output flowing' };
    }
    if (opts.abortAudit !== undefined && opts.abortAudit !== null) {
      const gate3 = abortAuditRescueAvailable(opts.abortAudit, opts.readOnly);
      if (!gate3.available) {
        return { rescue: false, mode: null, reason: `gate 3 failed: ${gate3.reason}` };
      }
    } else if (!(opts.abortAvailable && opts.abortProven)) {
      return { rescue: false, mode: null, reason: 'gate 3 failed: no true, proven abort for the first attempt — wait for the level timeout; an unproven abort counts as unavailable' };
    }
    if ((opts.attemptsUsed || 0) >= 1) {
      return { rescue: false, mode: null, reason: 'gate 4 failed: single re-issue only — max 2 attempts per logical call; a second rescue is a retry loop wearing a rescue label' };
    }
    const budget = opts.remainingBudgetMs === undefined ? Infinity : opts.remainingBudgetMs;
    if (budget < 2 * p95ForBudget) {
      return { rescue: false, mode: null, reason: 'gate 5 failed: budget fit — remaining level budget is below 2x frozen p95, a fresh attempt cannot fit' };
    }
    return { rescue: true, mode: 'abort-and-restart', thresholdMs, reason: 'all rescue gates pass; abort the first attempt, then restart once — never in parallel' };
  }

  evaluateStuckRescue(opts = {}) {
    return this._rescueGates(this.stuckThresholdMs(), this.frozenP95, opts);
  }

  /**
   * Record a rescue attempt. If the rescue rate exceeds 2% over
   * >=100 calls, trip the stuck threshold to 3x frozen p95 and log
   * the tool as degrading (Batch 177, gate 6).
   */
  recordRescue() {
    this.rescueCount += 1;
    // Batch 179, unobservable-mode tools: a rescue-rate trip does NOT
    // raise the pooled threshold to 3x (that just moves the misfire
    // from one mode to the other). It opens a mode-split investigation
    // instead, and the pooled multiplier stays at 2.
    if (this.unobservableModes) {
      if (this.rescueWindowCalls >= 100 && this.rescueRate > 0.02 && !this.modeSplitInvestigationLogged) {
        this.modeSplitInvestigationLogged = true;
        this.degradingLog.push({ kind: 'mode-split-investigation', tool: this.tool, rescueRate: this.rescueRate, at: new Date().toISOString() });
      }
      return { rescueRate: this.rescueRate, stuckMultiplier: this.stuckMultiplier, tripped: false, action: 'mode-split-investigation', reason: 'unobservable-mode tool: rescue-rate trip opens a mode-split investigation (find a dispatch-observable input predicting the slow calls), not a blind threshold raise' };
    }
    let tripped = false;
    if (this.rescueWindowCalls >= 100 && this.rescueRate > 0.02 && this.stuckMultiplier !== 3) {
      this.stuckMultiplier = 3;
      tripped = true;
      this.degradingLog.push({ kind: 'rescue-rate-trip', tool: this.tool, rescueRate: this.rescueRate, at: new Date().toISOString() });
    }
    return { rescueRate: this.rescueRate, stuckMultiplier: this.stuckMultiplier, tripped };
  }

  /**
   * Sleep-job response to a rescue-rate trip on an unobservable-mode
   * tool (Batch 179). Pure directive — it logs nothing and changes no
   * threshold; recordRescue() is the logging path. Never returns a
   * threshold raise for such a tool.
   */
  unobservableRescueRateResponse() {
    return { action: 'mode-split-investigation', rescueRate: this.rescueRate, reason: 'unobservable-mode tool: find a dispatch-observable input that predicts the slow calls; do not raise the pooled threshold blindly' };
  }

  /**
   * Weekly sleep-job recalibration check (Batch 177). newLatencies is
   * the new window's observations (the caller observes calls via
   * observe() as they happen; this check takes the window array for
   * its p95 computation and does not double-count it).
   * Re-freeze ONLY when: >=100 new calls AND (20% drift holding 2
   * consecutive windows OR a caller-supplied CUSUM alarm). The CUSUM
   * statistic itself is not computed here — the sleep job supplies
   * cusumAlarm (see README limits). Downward re-freeze is automatic
   * on a passed test; upward re-freeze is refused while the breaker
   * is tripped. A re-freeze resets the breaker window (the old trip
   * does not carry over) but the degrading log entry is retained.
   */
  weeklyRecalibrationCheck(newLatencies, opts = {}) {
    const { cusumAlarm = false } = opts;
    if (this.frozenP95 === null) {
      return { refrozen: false, reason: 'no frozen baseline to recalibrate from' };
    }
    if (!Array.isArray(newLatencies) || newLatencies.length < 100) {
      return { refrozen: false, reason: `fewer than 100 new calls (${Array.isArray(newLatencies) ? newLatencies.length : 0}); baseline stands` };
    }
    const newP95 = percentile(newLatencies, 95);
    const drift = Math.abs(newP95 - this.frozenP95) / this.frozenP95;
    if (drift <= 0.20) {
      this.consecutiveDriftWindows = 0;
      return { refrozen: false, reason: `drift ${(drift * 100).toFixed(1)}% within the 20% magnitude threshold; baseline stands` };
    }
    let persistence = false;
    if (cusumAlarm) {
      persistence = true;
    } else {
      this.consecutiveDriftWindows += 1;
      if (this.consecutiveDriftWindows < 2) {
        return { refrozen: false, reason: `drift ${(drift * 100).toFixed(1)}% holding ${this.consecutiveDriftWindows} of 2 consecutive windows; baseline stands` };
      }
      persistence = true;
    }
    if (!persistence) return { refrozen: false, reason: 'drift magnitude met but persistence not proven' };
    const direction = newP95 < this.frozenP95 ? 'downward' : 'upward';
    if (direction === 'upward' && this.breakerActive) {
      return { refrozen: false, reason: 'upward re-freeze refused while the breaker is tripped (hedge rate vs frozen baseline >10% over >=100 calls); upward re-freeze is a recorded sleep-job decision, never automatic during a trip' };
    }
    const oldP95 = this.frozenP95;
    this.frozenObservations = [...newLatencies];
    this.frozenP95 = newP95;
    this.frozenP99 = percentile(newLatencies, 99);
    this.frozenVersion += 1;
    this.breakerWindowCalls = 0;
    this.breakerWindowExceedances = 0;
    this.breakerTripped = false;
    this.rescueCount = 0;
    this.rescueWindowCalls = 0;
    this.stuckMultiplier = 2;
    this.consecutiveDriftWindows = 0;
    return { refrozen: true, direction, oldP95, newP95, version: this.frozenVersion, reason: `${direction} drift passed magnitude + persistence; baseline re-frozen` };
  }

  // ------------------------------------------- Batch 179: per-mode baselines

  _modeRecord(label) {
    if (!this.modes.has(label)) {
      this.modes.set(label, {
        observations: [], frozenObservations: null, frozenP95: null,
        frozenP99: null, frozenVersion: 0, frozenShare: null,
        stuckMultiplier: 2, rescueCount: 0, rescueWindowCalls: 0,
      });
    }
    return this.modes.get(label);
  }

  _totalModeObservations() {
    let total = 0;
    for (const m of this.modes.values()) total += m.observations.length;
    return total;
  }

  /**
   * Record one latency sample for a dispatch-observable mode (Batch 179).
   * label must come from the call's inputs AT DISPATCH (cache key
   * present/absent, index present/absent, argument class, endpoint
   * selected). CIRCULAR-LABEL BAN: opts.afterCompletion === true or
   * opts.dispatchObservable === false throws — a label assigned after
   * the call completes (e.g. "calls over 1s were slow mode") classifies
   * slow calls as slow mode and then never rescues them, which is the
   * pooled threshold's failure wearing a per-mode label. It is refused,
   * never silently accepted. Mode samples are kept apart from the
   * pooled `observations` stream (no double counting in the breaker).
   * Auto-freezes the mode's first baseline at 100 mode samples.
   */
  observeMode(label, ms, opts = {}) {
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error('observeMode: mode label must be a non-empty string');
    }
    if (opts.afterCompletion === true || opts.classifiedAfterCompletion === true) {
      throw new Error('observeMode: circular-label ban — mode labels must be assigned at dispatch from the call inputs, never after the call completes');
    }
    if (opts.dispatchObservable === false) {
      throw new Error('observeMode: circular-label ban — mode is not dispatch-observable; keep the pooled baseline and open a mode-split investigation instead of labelling post-hoc');
    }
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) {
      throw new Error('observeMode: latency must be a finite non-negative number');
    }
    const mode = this._modeRecord(label);
    mode.observations.push(ms);
    if (mode.frozenP95 === null) {
      if (mode.observations.length >= 100) this.freezeModeBaseline(label);
    } else {
      mode.rescueWindowCalls += 1;
    }
    return this;
  }

  /** Freeze one mode's current samples as its baseline (sleep job). */
  freezeModeBaseline(label) {
    const mode = this._modeRecord(label);
    mode.frozenObservations = [...mode.observations];
    mode.frozenP95 = percentile(mode.frozenObservations, 95);
    mode.frozenP99 = percentile(mode.frozenObservations, 99);
    mode.frozenVersion += 1;
    mode.rescueCount = 0;
    mode.rescueWindowCalls = 0;
    mode.stuckMultiplier = 2;
    const total = this._totalModeObservations();
    mode.frozenShare = total > 0 ? mode.frozenObservations.length / total : null;
    return this.modeBaselineTuple(label);
  }

  /** Freeze every known mode and recompute shares on one denominator. */
  freezeAllModeBaselines() {
    const tuples = [];
    for (const label of this.modes.keys()) tuples.push(this.freezeModeBaseline(label));
    const totalFrozen = tuples.reduce((sum, t) => sum + t.frozenN, 0);
    for (const t of tuples) {
      t.frozenShare = totalFrozen > 0 ? t.frozenN / totalFrozen : null;
      this.modes.get(t.label).frozenShare = t.frozenShare;
    }
    return tuples;
  }

  /** Frozen baseline tuple for one mode: label + share included. */
  modeBaselineTuple(label) {
    const mode = this.modes.get(label);
    if (!mode) return null;
    return {
      tool: this.tool, label, version: mode.frozenVersion,
      frozenP95: mode.frozenP95, frozenP99: mode.frozenP99,
      frozenN: mode.frozenObservations ? mode.frozenObservations.length : 0,
      frozenShare: mode.frozenShare,
    };
  }

  /** Frozen baseline tuple for the tool: pooled + every mode. */
  frozenBaselineTuple() {
    return {
      tool: this.tool, version: this.frozenVersion,
      frozenP95: this.frozenP95, frozenP99: this.frozenP99, frozenN: this.frozenN,
      modes: [...this.modes.keys()].map((label) => this.modeBaselineTuple(label)),
    };
  }

  /**
   * Per-mode stuck threshold (Batch 179). Formula inside each mode is
   * Batch 177's unchanged: max(2 x frozen p95(mode), frozen p99(mode)
   * if n_mode >= 1000); 100 <= n_mode < 1000 uses 2 x p95 only.
   * n floors apply PER MODE: n_mode < 100 (or no frozen baseline)
   * returns null — no T_stuck, no rescue for that mode until it earns
   * one. A tool with one mode at n = 800 and another at n = 40
   * rescues in the first and waits in the second; that asymmetry is
   * correct, not a gap.
   */
  stuckThresholdMsForMode(label) {
    const mode = this.modes.get(label);
    if (!mode || mode.frozenP95 === null) return null;
    const nMode = mode.frozenObservations ? mode.frozenObservations.length : 0;
    if (nMode < 100) return null;
    const base = mode.stuckMultiplier * mode.frozenP95;
    if (nMode >= 1000 && mode.frozenP99 !== null) return Math.max(base, mode.frozenP99);
    return base;
  }

  /**
   * Pooled stuck threshold for an UNOBSERVABLE-mode tool (Batch 179):
   * max(2 x pooled p95, pooled p99), biasing toward fewer rescues
   * (the safe direction). Distinct from stuckThresholdMs(), which
   * admits the pooled p99 only at frozen n >= 1000. The zero-progress
   * gate (gate 2) already narrows spurious rescues to silent
   * slow-mode calls.
   */
  pooledStuckThresholdForUnobservableModes() {
    if (this.frozenP95 === null) return null;
    if (this.frozenP99 === null) return 2 * this.frozenP95;
    return Math.max(2 * this.frozenP95, this.frozenP99);
  }

  /** Rescue evaluation for one mode: mode threshold + mode p95 budget. */
  evaluateStuckRescueForMode(label, opts = {}) {
    const mode = this.modes.get(label);
    const thresholdMs = this.stuckThresholdMsForMode(label);
    if (thresholdMs === null) {
      return { rescue: false, mode: null, label, reason: `no per-mode T_stuck for mode "${label}": mode has no frozen baseline or n_mode < 100; no rescue for that mode until it earns one` };
    }
    const result = this._rescueGates(thresholdMs, mode.frozenP95, opts);
    return { ...result, label };
  }

  /** Record a rescue in one mode; per-mode rate trip to 3x (Batch 177 shape). */
  recordModeRescue(label) {
    const mode = this._modeRecord(label);
    mode.rescueCount += 1;
    const rate = mode.rescueWindowCalls > 0 ? mode.rescueCount / mode.rescueWindowCalls : 0;
    let tripped = false;
    if (mode.rescueWindowCalls >= 100 && rate > 0.02 && mode.stuckMultiplier !== 3) {
      mode.stuckMultiplier = 3;
      tripped = true;
      this.degradingLog.push({ kind: 'mode-rescue-rate-trip', tool: this.tool, label, rescueRate: rate, at: new Date().toISOString() });
    }
    return { label, rescueRate: rate, stuckMultiplier: mode.stuckMultiplier, tripped };
  }

  /**
   * Mode-share drift (Batch 179, new rule). windowShares: { label: share }
   * with shares in [0, 1] for the new window. A shift > 20% between the
   * frozen share and the window share is a drift signal ON ITS OWN,
   * even if neither mode's p95 moved — a share shift moves the pooled
   * p95 and can flip which mode misfires. The sleep-job path LOGS the
   * shift; it must NOT re-freeze the pooled baseline to absorb it
   * (absorbing the mix change hides cache warming, corpus growth, or
   * input-mix change, for the same reason Batch 177 forbids re-freezing
   * during a breaker trip). This function never touches any frozen
   * baseline. Returns { driftSignals, refrozen: false }.
   */
  checkModeShareDrift(windowShares) {
    const driftSignals = [];
    if (windowShares && typeof windowShares === 'object') {
      for (const [label, windowShare] of Object.entries(windowShares)) {
        const mode = this.modes.get(label);
        if (!mode || mode.frozenShare === null) continue;
        if (typeof windowShare !== 'number' || windowShare < 0 || windowShare > 1) continue;
        const shift = Math.abs(windowShare - mode.frozenShare);
        if (shift > MODE_SHARE_DRIFT_THRESHOLD) {
          const entry = { kind: 'mode-share-drift', tool: this.tool, label, frozenShare: mode.frozenShare, windowShare, shift, at: new Date().toISOString() };
          driftSignals.push(entry);
          this.modeShareDriftLog.push(entry);
        }
      }
    }
    return { driftSignals, refrozen: false, reason: driftSignals.length > 0 ? 'mode-share shift >20% logged as a drift signal; pooled baseline NOT re-frozen to absorb it' : 'no mode-share shift above 20%' };
  }
}

// ------------------------------------------- Batch 179: mode-split detectors

const MODE_SHARE_DRIFT_THRESHOLD = 0.20;
const BIMODALITY_MEDIAN_RATIO = 10;
const BIMODALITY_P95_P50_RATIO = 10;

/**
 * Assign a mode label from the call's inputs AT DISPATCH.
 * keyFn(dispatchInputs) must return a non-empty label; callers that
 * classify after completion must use postHocModeLabel(), which throws.
 */
function modeLabelAtDispatch(dispatchInputs, keyFn) {
  if (typeof keyFn !== 'function') throw new Error('modeLabelAtDispatch: keyFn(dispatchInputs) is required');
  const label = keyFn(dispatchInputs);
  if (typeof label !== 'string' || label.length === 0) {
    throw new Error('modeLabelAtDispatch: keyFn must return a non-empty mode label from the dispatch inputs');
  }
  return label;
}

/**
 * CIRCULAR-LABEL BAN (Batch 179): a mode label assigned AFTER the call
 * completes is forbidden. This function always throws — it exists so
 * post-hoc classification is a loud refusal, never a silent accept.
 */
function postHocModeLabel() {
  throw new Error('circular-label ban: mode labels assigned after the call completes are forbidden — a label such as "calls over 1s were slow mode" classifies slow calls as slow mode and then never rescues them');
}

/**
 * Bimodality detector (a) — dispatch-input split trigger (Batch 179).
 * samples: [{ latencyMs, dispatchValue }]. If any two dispatch-value
 * clusters have medians differing by an order of magnitude (>= 10x),
 * that opens a mode-split investigation. A trigger, not a gate: it
 * never by itself changes a threshold or blocks a rescue.
 */
function bimodalityByDispatchInput(samples) {
  const groups = new Map();
  for (const s of (Array.isArray(samples) ? samples : [])) {
    if (!s || typeof s.latencyMs !== 'number') continue;
    const key = String(s.dispatchValue);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s.latencyMs);
  }
  const groupSummaries = [...groups.entries()].map(([value, latencies]) => ({ value, n: latencies.length, median: median(latencies) }));
  let medianRatio = null;
  if (groupSummaries.length >= 2) {
    const medians = groupSummaries.map((g) => g.median).filter((m) => m !== null && m > 0);
    if (medians.length >= 2) medianRatio = Math.max(...medians) / Math.min(...medians);
  }
  const trigger = medianRatio !== null && medianRatio >= BIMODALITY_MEDIAN_RATIO;
  return {
    trigger, groups: groupSummaries, medianRatio,
    reason: trigger
      ? `dispatch input separates latencies into clusters whose medians differ by ${medianRatio.toFixed(1)}x (>= 10x): open a mode-split investigation`
      : 'no dispatch-input cluster pair with medians differing by an order of magnitude',
  };
}

/**
 * Bimodality detector (b) — pooled-ratio + visible-gap trigger (Batch 179).
 * Trigger when pooled p95/p50 exceeds ~10x AND the sorted histogram
 * shows a visible gap (largest consecutive-value ratio >= 2x, a design
 * judgment, not a paper constant). A formal mixture test (Hartigan dip)
 * is a later refinement, NOT required — and not implemented here.
 * A trigger, not a gate.
 */
function bimodalityByPooledRatio(latencies) {
  const values = (Array.isArray(latencies) ? latencies : []).filter((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  if (values.length === 0) return { trigger: false, p95: null, p50: null, ratio: null, maxGapRatio: null, reason: 'no latencies supplied' };
  const p95 = percentile(values, 95);
  const p50 = percentile(values, 50);
  const ratio = (p50 !== null && p50 > 0) ? p95 / p50 : null;
  const sorted = [...values].sort((a, b) => a - b);
  let maxGapRatio = null;
  for (let i = 0; i + 1 < sorted.length; i++) {
    if (sorted[i] > 0) maxGapRatio = Math.max(maxGapRatio === null ? 0 : maxGapRatio, sorted[i + 1] / sorted[i]);
  }
  const trigger = ratio !== null && ratio > BIMODALITY_P95_P50_RATIO && maxGapRatio !== null && maxGapRatio >= 2;
  return {
    trigger, p95, p50, ratio, maxGapRatio,
    reason: trigger
      ? `pooled p95/p50 ratio ${ratio.toFixed(1)}x exceeds ~10x with a visible gap (${maxGapRatio.toFixed(1)}x): open a mode-split investigation`
      : 'pooled p95/p50 ratio does not exceed ~10x with a visible gap',
  };
}

// ------------------------------------------- Batch 179: abort-provability audit

const ABORT_STATES = ['UNKNOWN', 'DECLARED', 'PROVEN', 'DISPROVEN'];
const PROVABILITY_CLASSES = ['HARD', 'COOPERATIVE', 'PROTOCOL'];
const ABORT_PROOF_SOURCES = ['real-stuck-rescue', 'real-user-cancel', 'sacrificial-probe'];

/**
 * Abort-provability audit (Batch 179). Three-state field per tool,
 * recorded in the same audit-trail spirit as everything else:
 *   UNKNOWN (no declaration, no observation — rescue unavailable)
 *   -> DECLARED (mechanism claimed — rescue STILL unavailable)
 *   -> PROVEN (at least one abort issued and its effect observed —
 *      rescue available) or DISPROVEN (abort issued and work
 *      observably continued — rescue disabled).
 * Disproof is STICKY: re-declaration alone never restores rescue;
 * restoration requires re-declare AND re-prove.
 *
 * Provability classes:
 * - HARD (process kill, thread cancel, handle close, connection close
 *   where the implementation dies with it): one observed kill suffices
 *   and stays proven across versions unless the mechanism changes.
 * - COOPERATIVE (cancellation token / AbortSignal / context.Context):
 *   proof is an observed early exit ATTRIBUTABLE to the signal (not
 *   just "the call ended early"); version-sensitive, re-proven per
 *   version (noteVersion on a proven cooperative tool re-opens it).
 * - PROTOCOL (MCP notifications/cancelled, Streamable HTTP stream
 *   close): proof is NEGATIVE ONLY — "proven-negatively, window W, n
 *   observations" (no late response in W, no side effect observed).
 *   Sufficient for read-only tools alone; for non-read-only tools a
 *   protocol abort is NEVER sufficient for rescue (consistent with
 *   never-hedge-commits).
 *
 * Proof accrues from real stuck-call rescues and real user cancels,
 * not from declarations: recordPositiveProof / recordNegativeProof
 * require a source in ABORT_PROOF_SOURCES and refuse a bare claim.
 * A sacrificial probe is legitimate ONLY for a HARD mechanism
 * (bounded cost, definitive result); never for a cooperative
 * mechanism on a stateful tool — and, per Batch 179's "only" wording,
 * never as a proof source for COOPERATIVE or PROTOCOL at all here.
 */
class AbortAudit {
  constructor(tool, opts = {}) {
    this.tool = tool;
    this.state = 'UNKNOWN';
    this.mechanism = opts.mechanism || null;
    this.provabilityClass = opts.provabilityClass || null;
    this.version = opts.version !== undefined ? opts.version : null;
    this.proof = null; // { kind: 'positive'|'negative', source, ... }
    this.provenVersion = null;
    this.disproven = false;
    this.reDeclared = false;
    this.history = [];
  }

  _log(event, detail) {
    this.history.push({ event, state: this.state, at: new Date().toISOString(), ...(detail || {}) });
  }

  /** Claim a mechanism. From DISPROVEN this records re-declaration only — state stays DISPROVEN. */
  declare(mechanism, provabilityClass) {
    if (provabilityClass !== undefined && provabilityClass !== null && !PROVABILITY_CLASSES.includes(provabilityClass)) {
      throw new Error(`AbortAudit.declare: unknown provability class "${provabilityClass}"`);
    }
    if (provabilityClass) this.provabilityClass = provabilityClass;
    if (mechanism) this.mechanism = mechanism;
    if (this.state === 'DISPROVEN') {
      this.reDeclared = true;
      this._log('re-declared-after-disproof', { mechanism: this.mechanism, provabilityClass: this.provabilityClass });
      return { ok: true, state: 'DISPROVEN', reDeclared: true, reason: 'disproof is sticky: re-declaration alone does not restore rescue; re-proof is still required' };
    }
    if (this.state === 'PROVEN') {
      this._log('re-declared-while-proven', {});
      return { ok: true, state: 'PROVEN', reason: 'already proven; declaration changes nothing' };
    }
    this.state = 'DECLARED';
    this._log('declared', { mechanism: this.mechanism, provabilityClass: this.provabilityClass });
    return { ok: true, state: 'DECLARED', reason: 'mechanism claimed; rescue still unavailable until an abort effect is observed' };
  }

  _proofPreconditions(source) {
    if (!ABORT_PROOF_SOURCES.includes(source)) {
      return { ok: false, reason: 'proof accrues only from real stuck-call rescues, real user cancels, or a legitimate sacrificial probe — a source is required' };
    }
    if (source === 'sacrificial-probe' && this.provabilityClass !== 'HARD') {
      return { ok: false, reason: 'sacrificial probe legitimate only for a HARD mechanism; never for a cooperative mechanism on a stateful tool' };
    }
    if (this.state === 'UNKNOWN') {
      return { ok: false, reason: 'declared first, observed second: declare the mechanism before recording proof' };
    }
    if (this.state === 'DISPROVEN' && !this.reDeclared) {
      return { ok: false, reason: 'disproof is sticky: re-declare before re-proving; proof without re-declaration does not restore rescue' };
    }
    return { ok: true };
  }

  /** Positive proof: an abort issued and its effect observed. */
  recordPositiveProof(opts = {}) {
    const { source, attributableToSignal, stateful } = opts;
    if (this.provabilityClass === 'PROTOCOL') {
      return { ok: false, state: this.state, reason: 'protocol abort proof is negative only: no late response in window W and no side effect observed; a positive proof cannot be recorded for PROTOCOL' };
    }
    if (this.provabilityClass === 'COOPERATIVE' && attributableToSignal !== true) {
      return { ok: false, state: this.state, reason: 'cooperative proof must be an early exit attributable to the signal, not just an early end' };
    }
    if (source === 'sacrificial-probe' && this.provabilityClass === 'COOPERATIVE' && stateful === true) {
      return { ok: false, state: this.state, reason: 'sacrificial probe never legitimate for a cooperative mechanism on a stateful tool (an ignored probe abort may leave unknown state)' };
    }
    const pre = this._proofPreconditions(source);
    if (!pre.ok) return { ...pre, state: this.state };
    this.state = 'PROVEN';
    this.disproven = false;
    this.reDeclared = false;
    this.proof = { kind: 'positive', source, attributableToSignal: this.provabilityClass === 'HARD' ? true : attributableToSignal };
    this.provenVersion = this.version;
    this._log('proven-positive', { ...this.proof });
    return { ok: true, state: 'PROVEN', reason: 'abort effect observed; rescue available (subject to the other gates)' };
  }

  /** Negative proof (PROTOCOL only): no late response in window W, n observations, no side effect. */
  recordNegativeProof(opts = {}) {
    const { source, windowMs, nObservations } = opts;
    if (this.provabilityClass !== 'PROTOCOL') {
      return { ok: false, state: this.state, reason: 'negative proof applies to PROTOCOL abort only; HARD and COOPERATIVE proofs are positive' };
    }
    if (typeof windowMs !== 'number' || windowMs <= 0 || typeof nObservations !== 'number' || nObservations < 1) {
      return { ok: false, state: this.state, reason: 'negative proof requires a positive window W (ms) and n >= 1 observations' };
    }
    const pre = this._proofPreconditions(source);
    if (!pre.ok) return { ...pre, state: this.state };
    this.state = 'PROVEN';
    this.disproven = false;
    this.reDeclared = false;
    this.proof = { kind: 'negative', source, windowMs, nObservations };
    this.provenVersion = this.version;
    this._log('proven-negatively', { ...this.proof });
    return { ok: true, state: 'PROVEN', reason: `proven-negatively, window ${windowMs}ms, ${nObservations} observations; sufficient for read-only tools alone` };
  }

  /** An abort was issued and the work observably continued: DISPROVEN, sticky. */
  recordDisproof(opts = {}) {
    this.state = 'DISPROVEN';
    this.disproven = true;
    this.reDeclared = false;
    this.proof = null;
    this.provenVersion = null;
    this._log('disproven', { observation: opts.observation || 'abort issued and work observably continued' });
    return { ok: true, state: 'DISPROVEN', reason: 'rescue disabled until re-declared AND re-proven' };
  }

  /** New tool version: cooperative proof re-opens (code-path property); hard proof stands unless the mechanism changes. */
  noteVersion(version) {
    if (version === this.version) return { state: this.state, changed: false };
    this.version = version;
    if (this.state === 'PROVEN' && this.provabilityClass === 'COOPERATIVE') {
      this.state = 'DECLARED';
      this.proof = null;
      this.provenVersion = null;
      this._log('version-change-reopened', { version });
      return { state: 'DECLARED', changed: true, reason: 'cooperative proof is version-sensitive: re-prove on the new version' };
    }
    return { state: this.state, changed: false, reason: this.provabilityClass === 'HARD' ? 'hard proof stays proven across versions unless the mechanism changes' : 'no proven cooperative proof to re-open' };
  }

  /** Mechanism change re-opens any proven state: the proof was about the old mechanism. */
  noteMechanismChange(mechanism) {
    this.mechanism = mechanism || this.mechanism;
    if (this.state === 'PROVEN') {
      this.state = 'DECLARED';
      this.proof = null;
      this.provenVersion = null;
      this._log('mechanism-change-reopened', { mechanism: this.mechanism });
      return { state: 'DECLARED', changed: true, reason: 'mechanism changed: re-prove under the new mechanism' };
    }
    return { state: this.state, changed: false };
  }

  /** Sacrificial probe legitimacy: HARD only (bounded cost, definitive result). */
  sacrificialProbeLegitimate() {
    if (this.provabilityClass === 'HARD') {
      return { legitimate: true, reason: 'HARD mechanism: killing a throwaway process and watching it die is bounded and definitive' };
    }
    return { legitimate: false, reason: 'sacrificial probe legitimate only for a HARD mechanism; never for a cooperative mechanism on a stateful tool' };
  }

  /**
   * Rescue gate 3 (Batch 179 restated): abortable = PROVEN in the audit,
   * with a class-appropriate proof. A negatively-proven PROTOCOL abort
   * is sufficient for read-only tools alone; for non-read-only tools
   * protocol abort is NEVER sufficient for rescue.
   */
  rescueAvailable(opts = {}) {
    if (this.state !== 'PROVEN') {
      return { available: false, reason: `gate 3: abortable is ${this.state} in the audit, not PROVEN — rescue unavailable` };
    }
    if (this.provabilityClass === 'PROTOCOL' && this.proof && this.proof.kind === 'negative' && !opts.readOnly) {
      return { available: false, reason: 'gate 3: negatively-proven protocol abort is sufficient for read-only tools alone; never sufficient for a non-read-only tool' };
    }
    return { available: true, reason: `gate 3: abortable PROVEN in the audit (${this.provabilityClass}, ${this.proof ? this.proof.kind : 'positive'} proof)` };
  }

  /** Audit-trail snapshot for one tool. */
  toRecord() {
    return {
      tool: this.tool, state: this.state, mechanism: this.mechanism,
      provabilityClass: this.provabilityClass, version: this.version,
      proof: this.proof, disproven: this.disproven, reDeclared: this.reDeclared,
    };
  }
}

/** Gate-3 evaluation for an AbortAudit instance or a plain audit snapshot. */
function abortAuditRescueAvailable(audit, readOnly) {
  if (audit && typeof audit.rescueAvailable === 'function') return audit.rescueAvailable({ readOnly });
  if (audit && typeof audit === 'object') {
    if (audit.state !== 'PROVEN') {
      return { available: false, reason: `gate 3: abortable is ${audit.state || 'UNKNOWN'} in the audit, not PROVEN — rescue unavailable` };
    }
    if (audit.provabilityClass === 'PROTOCOL' && audit.proof && audit.proof.kind === 'negative' && !readOnly) {
      return { available: false, reason: 'gate 3: negatively-proven protocol abort is sufficient for read-only tools alone; never sufficient for a non-read-only tool' };
    }
    return { available: true, reason: 'gate 3: abortable PROVEN in the audit' };
  }
  return { available: false, reason: 'gate 3: no abort audit supplied' };
}

// ------------------------------------------- replan-boundary audit (173)

/**
 * Batch 173 win statistic: early-exit wins only if the slowest-sibling
 * wait exceeds (planner-call duration + re-issue cost of discarded
 * siblings) on eligible levels. Otherwise waiting wins and Rule 2 stands.
 * Per-level form; the median form applies the same comparison to
 * median W across eligible levels (see PlanExecutor.audit).
 */
function earlyExitWins(waitMs, plannerCallMs, reissueCostMs) {
  return waitMs > (plannerCallMs + reissueCostMs);
}

// ---------------------------------------------------------- plan executor

/**
 * Level-wise plan executor (Batches 169, 171, 173).
 *
 * Task shape:
 *   { id: string,
 *     dependsOn?: string[],
 *     kind?: 'read' | 'commit' | 'write',   // default 'read'
 *     readOnly?: boolean,                    // default true for reads
 *     run: async (ctx) => value }
 *   ctx = { taskId, levelIndex, prefix } where prefix is the list of
 *   COMPLETED levels only: [{ level, taskIds, observations }] with
 *   observations = { [taskId]: { status: 'ok'|'error', value?, error? } }.
 *
 * Signal convention on a returned value object: if the returned value
 * is an object with boolean field `planInvalidating`, the task is the
 * level's invalidator (Batch 171 Rule 3 / Batch 173 audit field b).
 * If it has boolean field `earlyExit`, the task requests RULE 6
 * read-only early-exit. The whole value is kept as the observation.
 *
 * Rules enforced:
 * - Rule 1 (171): replan only at level boundaries, on a completed
 *   level's joint observation. The boundary hook is the replan point.
 * - Rule 2 (171): no mid-level replan, ever. requestReplan() during a
 *   running level returns an explicit refusal and changes nothing.
 * - Rule 3 (171): recoverable/fixable handling stays inside the level
 *   (task functions handle their own retries); plan-invalidating
 *   observations are decided at the boundary.
 * - Rule 4 (171): committed state is a precondition for replan. If any
 *   completed task committed, a boundary replan without
 *   `committedState` is refused.
 * - Rule 5 (171): abort is a separate path. abort() halts without
 *   replanning, produces NO prefix update for the incomplete level,
 *   and the next action would be a fresh plan from the last completed
 *   level's state (that fresh plan is the caller's, not this run's).
 * - Rule 6 (173): read-only early-exit is a THIRD path, distinct from
 *   boundary replan and abort. Gates: no committing hop in the level,
 *   every sibling a read, exiting task read-only; the level is marked
 *   INCOMPLETE with NO emitter prefix update, while the invalidator's
 *   observation remains usable as planner input. Logged as its own
 *   trace kind ('early-exit'). If any gate fails, the level runs to
 *   completion and Rule 2 applies — early-exit never degrades into
 *   mid-level replan by exception.
 *
 * Cancellation modelling limit: this executor runs caller-supplied
 * async functions to completion (Promise.allSettled per level). A
 * RULE 6 exit therefore records the notified-sibling intent and marks
 * the level incomplete; it does not kill in-flight JavaScript promises
 * (which cannot be killed). Real cancel tokens / checkpoints /
 * finalize-in-DAG-order are caller-side, per Charguéraud (Batch 173).
 */
class PlanExecutor {
  constructor(tasks, options = {}) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('PlanExecutor: tasks must be a non-empty array');
    }
    computeLevels(tasks); // validates ids, deps, cycles up front
    this.tasks = new Map(tasks.map((t) => [t.id, t]));
    this.onLevelBoundary = typeof options.onLevelBoundary === 'function' ? options.onLevelBoundary : null;
    this.phase = 'idle'; // idle | running-level | between-levels | completed | aborted
    this.completedIds = new Set();
    this.exitedIds = new Set(); // early-exited (incomplete) task ids: consumed, not completed
    this.droppedIds = new Set(); // dependents of exited tasks, dropped without replan
    this.prefix = []; // completed levels only
    this.audit = []; // Batch 173 four fields + win inputs, per level
    this.traces = []; // completed-level replan | early-exit | abort | dropped
    this.refusals = []; // mid-level replan, precondition, early-exit-gate refusals
    this.committedEffects = []; // ids of completed commit/write tasks
    this.aborted = false;
    this.abortReason = null;
    this.currentLevelIds = null;
    this.pendingEarlyExit = false;
    this.levelOrdinal = 0;
  }

  get isMidLevel() { return this.phase === 'running-level'; }

  /** Task read-only test: kind 'read' and readOnly not explicitly false. */
  static isReadOnly(task) {
    if (task.kind === 'commit' || task.kind === 'write') return false;
    return task.readOnly !== false;
  }

  /**
   * Replan probe / decision gate. During a running level this returns
   * an explicit refusal and records it; it never replans silently.
   * Actual remainder replacement happens via the boundary hook during
   * run(), which is the only replan point.
   */
  requestReplan() {
    if (this.phase === 'running-level') {
      const refusal = { allowed: false, reason: 'mid-level replan refused: level still in flight; replan only at level boundaries on completed joint observation' };
      this.refusals.push({ kind: 'mid-level-replan', ...refusal });
      return refusal;
    }
    if (this.phase === 'between-levels' || (this.phase === 'idle' && this.prefix.length > 0)) {
      return { allowed: true, reason: 'at a level boundary on a completed joint observation' };
    }
    if (this.phase === 'completed' || this.phase === 'aborted') {
      return { allowed: false, reason: `no replan from phase "${this.phase}"` };
    }
    return { allowed: false, reason: 'no completed joint observation yet; replan only at level boundaries' };
  }

  /** Emergency abort (Rule 5): separate path, halts without replanning. */
  abort(reason = 'emergency abort') {
    if (this.phase === 'completed' || this.phase === 'aborted') {
      return { aborted: this.aborted, replanned: false, reason: `already ${this.phase}` };
    }
    const wasMidLevel = this.phase === 'running-level';
    this.aborted = true;
    this.abortReason = reason;
    this.phase = 'aborted';
    this.traces.push({ kind: 'abort', reason, midLevel: wasMidLevel, levelIds: this.currentLevelIds ? [...this.currentLevelIds] : [] });
    return { aborted: true, replanned: false, reason };
  }

  /**
   * RULE 6 early-exit request, callable mid-level. Checks the level
   * gates against the CURRENT level; a failed gate returns a refusal
   * and the level runs to completion (never a mid-level replan).
   * Task-signal early-exit (returned `earlyExit` flag) is checked
   * against the same gates at level end.
   */
  requestEarlyExit() {
    if (this.phase !== 'running-level' || !this.currentLevelIds) {
      return { allowed: false, reason: 'early-exit requested outside a running level' };
    }
    const levelTasks = this.currentLevelIds.map((id) => this.tasks.get(id));
    if (levelTasks.some((t) => !PlanExecutor.isReadOnly(t))) {
      const refusal = { allowed: false, reason: 'RULE 6 gate failed: level contains a committing or non-read-only hop; level runs to completion' };
      this.refusals.push({ kind: 'early-exit-gate', ...refusal });
      return refusal;
    }
    this.pendingEarlyExit = true;
    return { allowed: true, reason: 'read-only level: early-exit armed; level will be marked incomplete with no prefix update' };
  }

  _remainingTasks() {
    return [...this.tasks.values()].filter(
      (t) => !this.completedIds.has(t.id) && !this.exitedIds.has(t.id) && !this.droppedIds.has(t.id));
  }

  /**
   * Apply a boundary replan: the new plan's unexecuted remainder
   * REPLACES the old DAG's unexecuted remainder only. Completed work
   * is untouched. Returns { applied, reason }.
   */
  _applyReplan(newTasks, committedState) {
    if (this.committedEffects.length > 0 && (committedState === undefined || committedState === null)) {
      const refusal = { applied: false, reason: 'committed-state precondition failed: a completed hop already committed; the replanned DAG must take the committed effect as given state (pass committedState)' };
      this.refusals.push({ kind: 'replan-precondition', ...refusal });
      return refusal;
    }
    if (!Array.isArray(newTasks)) {
      const refusal = { applied: false, reason: 'replan rejected: newTasks must be an array' };
      this.refusals.push({ kind: 'replan-invalid', ...refusal });
      return refusal;
    }
    const newIds = new Set();
    for (const t of newTasks) {
      if (!t || typeof t.id !== 'string' || newIds.has(t.id)) {
        const refusal = { applied: false, reason: `replan rejected: bad or duplicate new task id "${t && t.id}"` };
        this.refusals.push({ kind: 'replan-invalid', ...refusal });
        return refusal;
      }
      if (this.completedIds.has(t.id)) {
        const refusal = { applied: false, reason: `replan rejected: new task "${t.id}" collides with a completed task` };
        this.refusals.push({ kind: 'replan-invalid', ...refusal });
        return refusal;
      }
      newIds.add(t.id);
    }
    for (const t of newTasks) {
      for (const dep of (t.dependsOn || t.depends || [])) {
        if (!this.completedIds.has(dep) && !newIds.has(dep)) {
          const refusal = { applied: false, reason: `replan rejected: new task "${t.id}" depends on "${dep}", which is neither completed nor in the new plan` };
          this.refusals.push({ kind: 'replan-invalid', ...refusal });
          return refusal;
        }
      }
    }
    try {
      const effective = newTasks.map((t) => ({
        ...t,
        dependsOn: (t.dependsOn || t.depends || []).filter((d) => !this.completedIds.has(d)),
      }));
      computeLevels(effective);
    } catch (e) {
      const refusal = { applied: false, reason: `replan rejected: ${e.message}` };
      this.refusals.push({ kind: 'replan-invalid', ...refusal });
      return refusal;
    }
    for (const t of this._remainingTasks()) this.tasks.delete(t.id);
    for (const t of newTasks) this.tasks.set(t.id, t);
    this.traces.push({ kind: 'replan', newTaskIds: newTasks.map((t) => t.id), committedStateAcknowledged: committedState !== undefined && committedState !== null });
    return { applied: true, reason: 'unexecuted remainder replaced at a level boundary on completed joint observation' };
  }

  async run() {
    while (true) {
      if (this.aborted) break;
      const remaining = this._remainingTasks();
      if (remaining.length === 0) break;
      // First level of the remaining DAG (deps on completed tasks satisfied).
      const effective = remaining.map((t) => ({
        ...t,
        dependsOn: (t.dependsOn || t.depends || []).filter((d) => !this.completedIds.has(d)),
      }));
      let firstLevelIds;
      try {
        firstLevelIds = computeLevels(effective).levels[0];
      } catch (e) {
        // Remaining deps reference exited/dropped tasks: drop those tasks.
        const blocked = remaining.filter((t) =>
          (t.dependsOn || t.depends || []).some((d) => this.exitedIds.has(d) || this.droppedIds.has(d)));
        if (blocked.length === 0) throw e;
        for (const t of blocked) {
          this.droppedIds.add(t.id);
          this.traces.push({ kind: 'dropped-after-early-exit', taskId: t.id, reason: 'predecessor exited incomplete with no prefix update and no replan kept it' });
        }
        continue;
      }
      const levelTasks = firstLevelIds.map((id) => this.tasks.get(id));
      this.currentLevelIds = [...firstLevelIds];
      this.phase = 'running-level';
      this.pendingEarlyExit = false;
      const levelStart = Date.now();
      const siblingStarts = {};
      const siblingFinishes = {};
      for (const t of levelTasks) siblingStarts[t.id] = levelStart;
      const prefixSnapshot = this.prefix.map((lv) => ({ ...lv, observations: { ...lv.observations } }));
      const results = await Promise.all(levelTasks.map(async (t) => {
        const ctx = { taskId: t.id, levelIndex: this.levelOrdinal, prefix: prefixSnapshot, executor: this };
        try {
          const value = await t.run(ctx);
          siblingFinishes[t.id] = Date.now();
          return { id: t.id, status: 'ok', value };
        } catch (err) {
          siblingFinishes[t.id] = Date.now();
          return { id: t.id, status: 'error', error: String((err && err.message) || err) };
        }
      }));
      const levelCompletion = Date.now();
      const observations = {};
      for (const r of results) {
        observations[r.id] = r.status === 'ok' ? { status: 'ok', value: r.value } : { status: 'error', error: r.error };
      }
      const invalidator = results.find((r) =>
        r.status === 'ok' && r.value && typeof r.value === 'object' && r.value.planInvalidating === true);
      const invalidatorId = invalidator ? invalidator.id : null;
      const tInv = invalidatorId ? siblingFinishes[invalidatorId] : null;
      const waitMs = tInv !== null ? levelCompletion - tInv : 0;
      const levelDuration = Math.max(0, levelCompletion - levelStart);
      const waitFraction = levelDuration > 0 ? waitMs / levelDuration : 0;
      const earlyExitResult = results.find((r) =>
        r.status === 'ok' && r.value && typeof r.value === 'object' && r.value.earlyExit === true);
      const earlyExitSignalled = Boolean(earlyExitResult) || this.pendingEarlyExit;
      const exitingTask = earlyExitResult ? this.tasks.get(earlyExitResult.id) : null;
      const earlyExitGatesPass = earlyExitSignalled
        && levelTasks.every((t) => PlanExecutor.isReadOnly(t))
        && (!exitingTask || PlanExecutor.isReadOnly(exitingTask));
      const ordinal = this.levelOrdinal;
      this.levelOrdinal += 1;
      this.currentLevelIds = null;

      // Abort during this level: NO prefix update, level incomplete.
      if (this.aborted) {
        this.audit.push({
          level: ordinal, taskIds: firstLevelIds, traceKind: 'abort',
          siblingStarts, siblingFinishes, invalidatorId, tInvMs: tInv,
          levelCompletionMs: levelCompletion, waitMs, waitFraction,
          plannerCallMs: null, discardedWork: null,
        });
        break;
      }

      let jointObservation = null;
      if (earlyExitSignalled && earlyExitGatesPass) {
        // RULE 6: level INCOMPLETE, no prefix update. Invalidator
        // observation remains usable as planner input (not a prefix term).
        for (const t of levelTasks) this.exitedIds.add(t.id);
        const notifiedSiblingIds = firstLevelIds.filter((id) => !(earlyExitResult && id === earlyExitResult.id));
        this.audit.push({
          level: ordinal, taskIds: firstLevelIds, traceKind: 'early-exit',
          siblingStarts, siblingFinishes, invalidatorId, tInvMs: tInv,
          levelCompletionMs: levelCompletion, waitMs, waitFraction,
          plannerCallMs: null,
          discardedWork: { notifiedSiblingIds, alreadyCompletedCount: notifiedSiblingIds.length },
        });
        this.traces.push({
          kind: 'early-exit', level: ordinal, taskIds: firstLevelIds,
          invalidatorId, reason: 'read-only level exited early; no prefix update; invalidator observation kept as planner input only',
        });
        jointObservation = {
          level: ordinal, taskIds: firstLevelIds, observations,
          invalidatorId, earlyExit: true, traceKind: 'early-exit',
        };
      } else {
        if (earlyExitSignalled && !earlyExitGatesPass) {
          this.refusals.push({
            kind: 'early-exit-gate',
            allowed: false,
            reason: 'RULE 6 gate failed: level contains a committing or non-read-only hop; level ran to completion under Rule 2',
          });
        }
        // Completed level: prefix accumulates the JOINT observation only.
        for (const t of levelTasks) {
          this.completedIds.add(t.id);
          const obs = observations[t.id];
          if (obs.status === 'ok' && (t.kind === 'commit' || t.kind === 'write')) this.committedEffects.push(t.id);
        }
        const levelRecord = { level: ordinal, taskIds: [...firstLevelIds], observations };
        this.prefix.push(levelRecord);
        this.audit.push({
          level: ordinal, taskIds: firstLevelIds, traceKind: 'completed',
          siblingStarts, siblingFinishes, invalidatorId, tInvMs: tInv,
          levelCompletionMs: levelCompletion, waitMs, waitFraction,
          plannerCallMs: null, discardedWork: null,
        });
        jointObservation = {
          level: ordinal, taskIds: firstLevelIds, observations,
          invalidatorId, earlyExit: false, traceKind: 'completed',
        };
      }

      // Level boundary: the ONLY replan point.
      this.phase = 'between-levels';
      if (this.onLevelBoundary) {
        const plannerStart = Date.now();
        let hookResult = null;
        try {
          hookResult = await this.onLevelBoundary({
            levelIndex: ordinal, jointObservation,
            prefix: this.prefix.map((lv) => ({ ...lv, observations: { ...lv.observations } })),
            committedEffects: [...this.committedEffects], executor: this,
          });
        } catch (err) {
          hookResult = null;
          this.refusals.push({ kind: 'boundary-hook-error', reason: String((err && err.message) || err) });
        }
        const plannerCallMs = Date.now() - plannerStart;
        this.audit[this.audit.length - 1].plannerCallMs = plannerCallMs;
        if (hookResult && hookResult.replan) {
          this._applyReplan(hookResult.replan, hookResult.committedState);
        }
        if (this.aborted) break;
      }
    }
    if (!this.aborted) this.phase = 'completed';
    return {
      status: this.aborted ? 'aborted' : 'completed',
      abortReason: this.abortReason,
      prefix: this.prefix,
      audit: this.audit,
      traces: this.traces,
      refusals: this.refusals,
      completedTaskIds: [...this.completedIds],
      committedEffects: [...this.committedEffects],
      exitedTaskIds: [...this.exitedIds],
      droppedTaskIds: [...this.droppedIds],
    };
  }
}

module.exports = {
  percentile,
  median,
  computeLevels,
  MODAL_SELECTION_GUARDRAIL,
  modalSelect,
  ToolLatencyTracker,
  earlyExitWins,
  PlanExecutor,
  // Batch 179: per-mode thresholds, mode-split detectors, abort audit.
  MODE_SHARE_DRIFT_THRESHOLD,
  BIMODALITY_MEDIAN_RATIO,
  BIMODALITY_P95_P50_RATIO,
  modeLabelAtDispatch,
  postHocModeLabel,
  bimodalityByDispatchInput,
  bimodalityByPooledRatio,
  ABORT_STATES,
  PROVABILITY_CLASSES,
  AbortAudit,
  abortAuditRescueAvailable,
  // Batch 192: ModeX-Lite transfer correction, disputed-hop prefix tier.
  PARTIAL_UNKNOWN,
  PREFIX_CHECKPOINTS,
  PREFIX_PRUNE_GUARDRAIL,
  parsePartialToolCall,
  prefixClusterKey,
  canonicalToolCallJson,
  checkpointPrefix,
  candidatesAtCheckpoint,
  prefixPrune,
  proxyTokens,
  falsifierReplay,
};
