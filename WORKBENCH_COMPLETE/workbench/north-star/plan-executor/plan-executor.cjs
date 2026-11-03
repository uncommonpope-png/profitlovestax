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

// ------------------- Batch 194: Chen advisory-only Select (arXiv:2606.16364)
//
// CORRECTION 1 (the main constraint): Batch 3's Plan–Retrieve–Select
// stage must NOT be implemented as constrained rescoring /
// teacher-forced name selection. At AST level (name + arguments, the
// official BFCL metric) the constrained-rescoring protocol LOSES to
// free generation outright (−19.1 pts pooled), and the deficit is
// selector-independent: even forcing the GOLD name scores below free
// generation per model (0.24/0.44/0.55 vs 0.28/0.67/0.77).
// Teacher-forcing name( pulls the model out of its native call format
// and costs more argument accuracy than perfect name selection buys
// back. The compliant delivery is a SOFT ADVISORY hint fed into a
// FREE generation of the whole call (pooled AST +1.8 pts, McNemar
// p=0.06, NOT SIGNIFICANT — recorded here as at-worst-neutral, never
// as a deployment win), OR a gated dispute-tier re-check that
// re-generates freely with the hint, never a forced prefix. There is
// NO forced-prefix Select path in this module: assertAdvisoryOnlySelect
// throws on any forced-prefix / teacher-forced / constrained-rescoring
// spec, and advisoryHint() throws when handed a forced prefix.
//
// This delta CONSTRAINS the Select stage; it does NOT replace Round 4's
// prefix tier (C0/C1/C2, diversity-preserving prune), which STANDS
// untouched. The prefix tier prunes duplicates within a cluster; the
// advisory hint never deletes a tool identity, so the two compose:
// prune first (duplicates only), hint second (advice only), generate
// freely third.
//
// CORE FINDING (CORRECTION 2 + README): on 198 real BFCL
// live_multiple failures, the per-candidate attention argmax points to
// the gold tool on 80% (per-model 0.71/0.86/0.80) vs 21% chance; the
// gold is the literally under-attended segment on only 10%, and in
// ~90% of failures it out-attends the wrongly-picked tool pairwise.
// Failure is at the READOUT, not the harness. Input-side repairs
// recover ≤23% (reorder gold-first 18.2%, duplicate gold 16.7% — the
// abstract's "at most 23%" is the summary bound, not a table row).
// The wrong-tool budget therefore goes to readout-side mechanisms
// (advisory hint, calibrated steering, or retraining) and, per Batch
// 5's ladder, to logging the failure as a counterfactual trace for
// the sleep job. Do NOT spend budget on harness reordering or
// duplication — wrongToolBudgetAllows() enforces that split.
//
// SCOPE LIMIT (misquote guard): the attention-segment selector's
// gains (+11.9 BFCL / +14.9 Seal-Tools, 5-model pooled +11.2) are
// NAME-ONLY, SINGLE-CALL results under a protocol that loses at AST.
// Quoting them as end-to-end call-accuracy gain is a MISQUOTE. They
// do NOT transfer multi-turn: −27 pts on the τ-bench probe, whose
// gate signal is near-chance multi-step (AUROC 0.48/0.73). The
// selector is therefore SINGLE-HOP ONLY until re-validated in a real
// multi-turn loop — assertSingleHopScope() refuses multi-turn use.
// Its gate (logprob margin) is free logits, converging with Batch 5's
// perplexity/logprob-first proxy rule; raw ungated selection REGRESSES
// on 3B (−4.7), so the gate is load-bearing, not decoration.
//
// DEPLOYMENT CONSTRAINT: HAA requires HuggingFace eager attention with
// output_attentions on; vLLM cannot expose attention weights. The
// bundled runner must either serve the disputed hop in eager mode (a
// separate slow path) or forgo attention-segment signals entirely.
// The 1.2× selector cost is measured against an EAGER baseline, NOT
// against an optimized FlashAttention/vLLM path — never quote it as
// the cost of adding the selector to a vLLM-served model.
//
// ALTERNATIVE, NOT VOTE: if both the attention-segment selector and
// the ModeX tier exist, they are ALTERNATIVES for a disputed hop, not
// votes. Do NOT ensemble by boosting candidates and voting — the
// paper's panel-vote variant loses 32 points. chooseDisputedHopTier()
// throws when given more than one tier or any vote/ensemble flag.
//
// STEERING SCOPE: attention-segment steering fixes WHICH function is
// named, never its arguments. Calibrated δ=+2 in free generation
// recovers name selection (0.67 recovery / 0.04 damage) but
// argument-level recovery is net-zero (0.13/0.13); the constrained
// sweet-spot δ=+8 OVER-boosts under free generation and collapses
// name accuracy (0.929→0.20). Arguments come from the query and
// reasoning, not from the steering knob.
//
// HARNESS-VS-PRODUCT DISTINCTION (kept, as in every round): product
// candidates only, no product gate verified, no SEP conformance
// claimed, no live model run, no attention measured. EVERY number in
// CHEN_194_FINDINGS is the paper's, on its benchmarks (BFCL
// live_multiple 300/model, Seal-Tools 294/model, synthetic confusable
// tasks, scripted τ-bench probe), NOT on the north-star tool pool or
// the bundled base. Appendix tables were NOT re-read; no
// appendix-only number is quoted here.

const SELECT_ADVISORY_ONLY_GUARDRAIL =
  'Select advisory-only guardrail (Batch 194, Chen arXiv:2606.16364): ' +
  'Select NEVER forces a tool name as a prefix and NEVER rescores under ' +
  'a constrained protocol. Its output is a soft advisory hint fed into ' +
  'a FREE generation of the whole call, or a gated dispute-tier re-check ' +
  'that re-generates freely with the hint. Hard name-forcing loses ' +
  '−19.1 AST points pooled even with a perfect name; the advisory ' +
  'delivery is +1.8 AST pooled, McNemar p=0.06, NOT SIGNIFICANT — ' +
  'at-worst-neutral, never a deployment win.';

const EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT =
  'Eager-attention deployment constraint (Batch 194): HAA requires ' +
  'HuggingFace eager attention with output_attentions on; vLLM cannot ' +
  'expose attention weights. The bundled runner must either serve the ' +
  'disputed hop in eager mode (a separate slow path) or forgo ' +
  'attention-segment signals entirely. The 1.2× selector cost is ' +
  'measured against an eager baseline, NOT against an optimized ' +
  'FlashAttention/vLLM path.';

/** Paper figures, recorded exactly as Batch 194 verified them (main text only). */
const CHEN_194_FINDINGS = {
  paper: 'Chen, "Looking Is Not Picking," arXiv:2606.16364',
  coreFinding: {
    failuresExamined: 198,
    attentionArgmaxPointsToGold: 0.80,
    perModel: [0.71, 0.86, 0.80],
    chance: 0.21,
    goldLiterallyUnderAttended: 0.10,
    goldOutAttendsWrongPickPairwise: '~0.90',
    reading: 'failure at the readout, not the harness',
  },
  inputSideRepairs: {
    reorderGoldFirst: 0.182,
    duplicateGold: 0.167,
    summaryBound: '<=0.23',
    note: 'abstract "at most 23%" is the summary bound, not a table row',
  },
  astLevel: {
    constrainedRescoringVsFreeGenerationPooled: -19.1,
    goldForcedPerModel: [0.24, 0.44, 0.55],
    freeGenerationPerModel: [0.28, 0.67, 0.77],
    advisoryHintPooled: 1.8,
    advisoryHintMcNemarP: 0.06,
    advisoryHintSignificant: false,
    advisoryHintReading: 'at-worst-neutral, never a deployment win',
    advisoryHintWeakestModel: { model: 'Qwen2.5-1.5B', gain: 6.0 },
    hardNameForcingSameRows: -18.3,
    gatedPipelineVsForcedNameBaseline: { bfcl: 5.2, sealTools: 8.7, note: 'a win over a broken protocol, not over free generation' },
  },
  selectorNameOnlySingleCall: {
    bfcl: 11.9,
    sealTools: 14.9,
    fiveModelPooled: 11.2,
    scope: 'name-only, single-call; NOT end-to-end call accuracy',
    misquoteWarning: 'quoting +11.9/+14.9 as end-to-end call-accuracy gain is a misquote',
    rawUngatedOn3B: -4.7,
    panelVoteVariant: -32,
  },
  multiTurnNonTransfer: {
    tauBenchProbe: -27,
    gateSignalAuroc: [0.48, 0.73],
    gateSignalReading: 'near-chance multi-step',
    scope: 'single-hop only until re-validated in a real multi-turn loop',
  },
  steeringScope: {
    fixes: 'WHICH function is named, never its arguments',
    calibratedDelta2FreeGeneration: { nameRecovery: 0.67, nameDamage: 0.04, argumentRecovery: 0.13, argumentDamage: 0.13, argumentReading: 'net-zero' },
    constrainedDelta8UnderFreeGeneration: { nameAccuracyFrom: 0.929, nameAccuracyTo: 0.20, reading: 'over-boosts and collapses' },
  },
  costAndServing: {
    selectorCostVsEagerBaseline: '1.2x',
    costBasisWarning: 'measured against an eager baseline, NOT against an optimized FlashAttention/vLLM path',
    attentionRequirement: 'HuggingFace eager attention with output_attentions on; vLLM cannot expose attention weights',
  },
  scopeNote: 'All figures are the paper\'s, on its benchmarks — NOT on the north-star tool pool or the bundled base. No live model run, no attention measured here.',
};

/**
 * Build a soft advisory hint for a disputed hop. The hint is advice
 * carried into a FREE generation of the whole call; it is never a
 * forced prefix, never a constrained rescore, and never deletes a
 * candidate. opts.forcedPrefix / opts.teacherForcedName /
 * opts.constrainedRescoring are refused loudly, never silently dropped.
 * Returns { kind: 'advisory-hint', recommendedTool, hint, freeGeneration,
 * forcedPrefix: null, astNote, guardrail }.
 */
function advisoryHint(recommendedTool, opts = {}) {
  if (typeof recommendedTool !== 'string' || recommendedTool.length === 0) {
    throw new Error('advisoryHint: recommendedTool must be a non-empty string');
  }
  if (opts.forcedPrefix !== undefined && opts.forcedPrefix !== null) {
    throw new Error('advisoryHint: forced prefix refused — Select is advisory-only (Batch 194); a forced prefix loses −19.1 AST points pooled even with a perfect name');
  }
  if (opts.teacherForcedName === true || opts.constrainedRescoring === true) {
    throw new Error('advisoryHint: teacher-forced / constrained-rescoring selection refused — Select is advisory-only (Batch 194)');
  }
  return {
    kind: 'advisory-hint',
    recommendedTool,
    hint: `Consider ${recommendedTool} — advisory only; generate the full call freely.`,
    freeGeneration: true,
    forcedPrefix: null,
    astNote: 'Advisory delivery: pooled AST +1.8, McNemar p=0.06, not significant — at-worst-neutral, never a deployment win.',
    guardrail: SELECT_ADVISORY_ONLY_GUARDRAIL,
  };
}

/**
 * Guard: reject any Select spec that carries a forced-prefix,
 * teacher-forced-name, or constrained-rescoring delivery. Returns
 * { advisoryOnly: true } for a clean spec. This is the enforcement
 * point for Correction 1: there is no forced-prefix path to fall back
 * to, so a non-compliant spec fails here instead of running.
 */
function assertAdvisoryOnlySelect(spec = {}) {
  if (spec === null || typeof spec !== 'object') throw new Error('assertAdvisoryOnlySelect: spec must be an object');
  if (spec.forcedPrefix !== undefined && spec.forcedPrefix !== null) {
    throw new Error('assertAdvisoryOnlySelect: forced-prefix selection refused — Select is advisory-only (Batch 194)');
  }
  if (spec.teacherForcedName === true) {
    throw new Error('assertAdvisoryOnlySelect: teacher-forced name selection refused — Select is advisory-only (Batch 194)');
  }
  if (spec.constrainedRescoring === true || spec.constrainedSelection === true) {
    throw new Error('assertAdvisoryOnlySelect: constrained-rescoring selection refused — Select is advisory-only (Batch 194)');
  }
  if (spec.forceToolName === true || spec.prefixForced === true) {
    throw new Error('assertAdvisoryOnlySelect: forced tool-name prefix refused — Select is advisory-only (Batch 194)');
  }
  return { advisoryOnly: true, guardrail: SELECT_ADVISORY_ONLY_GUARDRAIL };
}

/**
 * The ONLY Select behavior in this module: given one hop's candidates
 * and a recommended tool, return the advisory hint plus the full
 * candidate list, unpruned by the hint. The hint advises; it does not
 * select, delete, or reorder candidates. opts passes through to
 * assertAdvisoryOnlySelect (any forced-prefix field throws).
 */
function selectAdvisory(candidates, recommendedTool, opts = {}) {
  assertAdvisoryOnlySelect(opts);
  if (!Array.isArray(candidates)) throw new Error('selectAdvisory: candidates must be an array');
  const hint = advisoryHint(recommendedTool, opts);
  return {
    kind: 'select-advisory',
    hint,
    recommendedTool,
    candidateIds: candidates.filter((c) => c && typeof c.id === 'string').map((c) => c.id),
    deletesNoCandidate: true,
    freeGeneration: true,
    guardrail: SELECT_ADVISORY_ONLY_GUARDRAIL,
  };
}

/**
 * Single-hop scope guard for the attention-segment selector. The
 * selector's gains are single-call results and do NOT transfer
 * multi-turn (−27 pts on the τ-bench probe; gate AUROC 0.48/0.73).
 * Throws on any multi-turn context; returns { scope:
 * 'single-hop-only', allowed: true } for a single hop.
 */
function assertSingleHopScope(context = {}) {
  if (context.multiTurn === true || context.multiStep === true) {
    throw new Error('assertSingleHopScope: attention-segment selector is SINGLE-HOP ONLY — multi-turn use refused until re-validated in a real multi-turn loop (Batch 194: −27 pts on the τ-bench probe)');
  }
  if (typeof context.turns === 'number' && context.turns > 1) {
    throw new Error('assertSingleHopScope: attention-segment selector is SINGLE-HOP ONLY — turns > 1 refused until re-validated in a real multi-turn loop (Batch 194)');
  }
  if (context.loop === 'multi-turn' || context.conversationTurns === true) {
    throw new Error('assertSingleHopScope: attention-segment selector is SINGLE-HOP ONLY — multi-turn loop use refused (Batch 194)');
  }
  return { scope: 'single-hop-only', allowed: true, note: 'Single-call name-only gains (+11.9 BFCL / +14.9 Seal-Tools) do not transfer multi-turn; re-validation in a real loop is required first.' };
}

/**
 * Serving-path decision for the attention-segment selector. HAA needs
 * eager attention with output_attentions on; vLLM (and any
 * FlashAttention path that cannot expose weights) cannot supply it.
 * Returns { serve, attentionWeights, costBasis, constraint } where
 * serve is 'eager-slow-path' (eager mode available for the disputed
 * hop) or 'forgo-attention-signals' (serve without the selector).
 * An unknown/unproven serving path forgoes the signals — attention
 * availability is never assumed.
 */
function selectorServingPath(opts = {}) {
  const serving = opts.servingPath || opts.serving || null;
  const eager = opts.eagerAttention === true || serving === 'eager' || serving === 'huggingface-eager';
  if (eager && opts.outputAttentions !== false) {
    return {
      serve: 'eager-slow-path',
      attentionWeights: true,
      costBasis: '1.2x selector cost measured against an eager baseline, NOT against an optimized FlashAttention/vLLM path',
      constraint: EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT,
    };
  }
  if (serving === 'vllm' || serving === 'flash-attention' || serving === 'flashattention' || opts.attentionWeights === false) {
    return {
      serve: 'forgo-attention-signals',
      attentionWeights: false,
      costBasis: '1.2x must NOT be quoted as the cost of adding the selector to a vLLM-served model',
      constraint: EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT,
    };
  }
  return {
    serve: 'forgo-attention-signals',
    attentionWeights: false,
    costBasis: 'attention availability unproven for this serving path; forgo signals rather than assume them',
    constraint: EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT,
  };
}

/**
 * Disputed-hop tier choice: the attention-segment selector and the
 * ModeX tier are ALTERNATIVES, not votes. Throws when more than one
 * tier is chosen or when any vote/ensemble/boost-and-vote flag is
 * present (the paper's panel-vote variant loses 32 points). Exactly
 * one tier must be named: 'attention-segment' or 'modex'.
 */
function chooseDisputedHopTier(opts = {}) {
  if (opts.ensemble === true || opts.vote === true || opts.panelVote === true || opts.boostAndVote === true) {
    throw new Error('chooseDisputedHopTier: no vote/ensemble path exists — attention-segment and ModeX are alternatives, not votes (Batch 194: panel-vote variant loses 32 points)');
  }
  const tiers = Array.isArray(opts.tiers) ? opts.tiers : (opts.tier ? [opts.tier] : []);
  if (tiers.length !== 1) {
    throw new Error(`chooseDisputedHopTier: exactly one disputed-hop tier required (got ${tiers.length}); attention-segment and ModeX are alternatives, not votes`);
  }
  const tier = tiers[0];
  if (tier !== 'attention-segment' && tier !== 'modex') {
    throw new Error(`chooseDisputedHopTier: unknown tier "${tier}" (expected 'attention-segment' or 'modex')`);
  }
  return { tier, alternativesNotVotes: true, note: 'The unchosen tier is not consulted; no boosting, no vote, no ensemble.' };
}

/**
 * Wrong-tool budget split (Correction 2). Readout-side mechanisms and
 * the counterfactual-trace log are funded; harness reordering and
 * duplication are NOT (they recover ≤23% because the model already
 * attended to the gold tool). Returns { allowed, reason }.
 */
function wrongToolBudgetAllows(mechanism) {
  const funded = {
    'advisory-hint': 'readout-side: soft advisory into free generation (AST +1.8, n.s. — at-worst-neutral)',
    'calibrated-steering': 'readout-side: calibrated steering in free generation (fixes WHICH function is named, never its arguments)',
    'retraining': 'readout-side: retraining the readout',
    'counterfactual-trace': 'per Batch 5\'s ladder: log the failure as a counterfactual trace for the sleep job',
  };
  if (Object.prototype.hasOwnProperty.call(funded, mechanism)) {
    return { allowed: true, mechanism, reason: funded[mechanism] };
  }
  if (mechanism === 'harness-reorder' || mechanism === 'harness-duplicate') {
    return { allowed: false, mechanism, reason: 'input-side repair refused: reorder gold-first recovers 18.2%, duplicate gold 16.7% (bound ≤23%) — the model already attended to the gold tool; failure is readout-side' };
  }
  return { allowed: false, mechanism, reason: `unknown wrong-tool mechanism "${mechanism}"; only advisory-hint, calibrated-steering, retraining, and counterfactual-trace are funded` };
}


// ------------------- Batch 197: advisory-hint test design (PRE-REGISTERED, UNEXECUTED)
// Chen's advisory numbers are the paper's on BFCL/Seal-Tools, NOT on the
// north-star tool pool or the bundled base. No task was run, no hint was
// tested, no AST number exists here for personal tasks. This section is a
// test harness skeleton plus guard rules: it encodes what a future test
// MUST do (and must never claim) so a small pilot cannot be read as
// confirming whatever delta it happens to produce. It never executes a
// model call, never scores a real task, and never imports a live runner.

/** The three arms, same task, same model, same harness order, greedy. */
const ADVISORY_TEST_ARMS = ['free', 'advisory-rec', 'advisory-gold'];

/**
 * Hint wording, FIXED and verbatim (Batch 197 §3). Chen publishes no
 * wording ("a one-line prompt hint" / "a soft system-prompt hint" only),
 * so this string is a new variable, not Chen's: every future advisory
 * result must quote its hint string verbatim, or it is not reproducible
 * and must not be cited as an advisory result. Arguments are NEVER
 * included — including them would smuggle teacher-forcing back in.
 */
const ADVISORY_HINT_TEMPLATE =
  'Suggested tool for this step: {tool} — use it only if it fits the request; otherwise choose freely.';

function advisoryHintText(tool) {
  if (typeof tool !== 'string' || tool.length === 0) {
    throw new Error('advisoryHintText: tool must be a non-empty string');
  }
  return ADVISORY_HINT_TEMPLATE.replace('{tool}', tool);
}

/**
 * Verbatim-hint guard: a result's hint string must equal the fixed
 * template with its tool substituted, character for character. A
 * paraphrased or missing hint string is refused, not repaired.
 */
function assertVerbatimHint(hintString, tool) {
  if (hintString !== advisoryHintText(tool)) {
    throw new Error('assertVerbatimHint: hint string must quote the fixed Batch 197 wording verbatim (Chen publishes none; wording is a free variable, not a detail to guess)');
  }
  return { verbatim: true, hint: hintString };
}

/**
 * Recommendation source, decided BEFORE any AST run (Batch 197 §0).
 * Primary = Batch 3 Plan–Retrieve–Select top-1 (one model, two prompts,
 * BM25 K=15, logprob-margin gated): no attention, vLLM-compatible,
 * deployable on the resident runner. Chen's S2 attention selector is a
 * SECONDARY lab arm only, run in eager HF mode with cost reported
 * against an eager baseline, never against a vLLM baseline (Batch 194
 * serving-path catch). A verdict line must name which arm was run.
 */
const RECOMMENDATION_SOURCES = {
  primary: 'plan-top1',
  lab: 'attention-segment-s2',
};

function assertRecommendationSource(source, opts = {}) {
  if (source === RECOMMENDATION_SOURCES.primary) {
    return { source, deployable: true, servingPath: 'vllm-compatible' };
  }
  if (source === RECOMMENDATION_SOURCES.lab) {
    if (opts.servingPath !== 'eager') {
      throw new Error('assertRecommendationSource: S2 attention selector is a lab arm only — it requires eager HF mode (output_attentions on) and its cost must be reported against an eager baseline, never a vLLM baseline (Batch 194)');
    }
    return { source, deployable: false, servingPath: 'eager', labOnly: true };
  }
  throw new Error('assertRecommendationSource: unknown recommendation source — primary is plan-top1, lab-only is attention-segment-s2 (Batch 197 §0)');
}

/**
 * Arm spec guard. Advisory arms require a recommendation source and a
 * verbatim hint string; the gold arm additionally requires the gold
 * tool name. Wording-sensitivity arms are NEVER part of the pilot
 * (they would split N); they are post-pilot only.
 */
function advisoryArmSpec(arm, opts = {}) {
  if (!ADVISORY_TEST_ARMS.includes(arm)) {
    throw new Error(`advisoryArmSpec: unknown arm "${arm}" — arms are free, advisory-rec, advisory-gold (Batch 197 §2)`);
  }
  if (arm === 'free') return { arm, hint: null };
  assertRecommendationSource(opts.recommendationSource, opts);
  assertVerbatimHint(opts.hintString, opts.hintedTool);
  if (opts.mergedIntoPilot === true && opts.wordingSensitivity === true) {
    throw new Error('advisoryArmSpec: wording-sensitivity arms must NOT be merged into the pilot — post-pilot only, reported as a wording effect (Batch 197 §3)');
  }
  const spec = { arm, recommendationSource: opts.recommendationSource, hintString: opts.hintString, hintedTool: opts.hintedTool };
  if (arm === 'advisory-gold') {
    if (typeof opts.goldTool !== 'string' || opts.goldTool.length === 0) {
      throw new Error('advisoryArmSpec: advisory-gold arm requires the gold tool name (Batch 197 §2)');
    }
    spec.goldTool = opts.goldTool;
  }
  return spec;
}

/**
 * Tiered sample-size honesty (Batch 197 §4). The ceilings are the point:
 * a 20–30-task falsifier can only say "not falsified" vs "falsified";
 * a 100-task pilot can detect a LARGE shift (~10 points) and rule out
 * large harm but CANNOT confirm Chen's +1.8 — a +1.8-sized pilot delta
 * is "consistent with noise," never replication; a 300-task Chen-scale
 * run still only claims "no large harm + direction," never
 * "replicates Chen." checkClaim throws on any claim above its tier's
 * ceiling, so the test log cannot be read as confirming whatever delta
 * it happens to produce. Models/bases are NEVER pooled (the per-model
 * split in Batch 197 forbids it: pooled +1.8 is driven by the weakest
 * model; the two stronger models are flat-to-negative).
 */
const SAMPLE_TIERS = {
  falsifier: { nMin: 20, nMax: 30, verdictVocabulary: ['not falsified', 'falsified'], ceiling: 'feasibility and catastrophic harm only' },
  pilot: { n: 100, verdictVocabulary: ['consistent with noise', 'large shift detected', 'large harm ruled out'], ceiling: 'cannot confirm +1.8' },
  chenScale: { n: 300, verdictVocabulary: ['no large harm + direction'], ceiling: 'not a replication of Chen' },
};

function tierForN(n) {
  if (n >= 20 && n <= 30) return 'falsifier';
  if (n === 100) return 'pilot';
  if (n === 300) return 'chenScale';
  return 'unregistered';
}

function checkClaim(tier, claim) {
  const t = SAMPLE_TIERS[tier];
  if (!t) throw new Error(`checkClaim: unknown tier "${tier}" — tiers are falsifier, pilot, chenScale (Batch 197 §4)`);
  const c = String(claim).toLowerCase();
  if (tier === 'falsifier' && (c.includes('works') || c.includes('benefit') || c.includes('improves'))) {
    throw new Error('checkClaim: a 20–30-task falsifier CANNOT claim benefit — its vocabulary is "not falsified" vs "falsified," never "works" (Batch 197 §4a)');
  }
  if (tier === 'pilot' && (c.includes('confirm') || c.includes('replicat'))) {
    throw new Error('checkClaim: a 100-task pilot CANNOT confirm Chen\'s +1.8 — a +1.8-sized pilot delta is "consistent with noise," not replication (Batch 197 §4b)');
  }
  if (tier === 'chenScale' && c.includes('replicat')) {
    throw new Error('checkClaim: a 300-task run still does NOT replicate Chen — its ceiling is "no large harm + direction" (Batch 197 §4c)');
  }
  return { tier, claim, ceiling: t.ceiling, allowedVocabulary: t.verdictVocabulary };
}

/**
 * McNemar paired-test reporting (Batch 197, secondary guide only):
 * discordant pairs only carry information; exact binomial version when
 * b+c < 25, asymptotic otherwise. Report b/c counts, not p alone.
 */
function mcnemarReport(b, c) {
  if (!Number.isInteger(b) || !Number.isInteger(c) || b < 0 || c < 0) {
    throw new Error('mcnemarReport: b and c must be non-negative integers (discordant counts)');
  }
  const discordant = b + c;
  return { b, c, discordant, exact: discordant < 25, method: discordant < 25 ? 'exact-binomial' : 'asymptotic' };
}

/**
 * Per-call AST scoring (Batch 197 §5; BFCL synthesis, NOT official eval
 * code — if the test adopts BFCL's evaluator, its exact implementation
 * governs). AST = 1 only when the name matches AND every required
 * parameter is present with an allowed value and correct type;
 * argument order is irrelevant. argsConditional is null when the name
 * is wrong (argument accuracy is conditional on correct name).
 */
function valuesMatch(goldValue, callValue) {
  if (Array.isArray(goldValue)) return goldValue.includes(callValue); // accepted set/range
  return goldValue === callValue;
}

function scoreCall(gold, call) {
  if (!gold || typeof gold.tool !== 'string' || !gold.args || typeof gold.args !== 'object') {
    throw new Error('scoreCall: gold must be { tool, args }');
  }
  const schemaValid = !!(call && typeof call.tool === 'string' && call.args && typeof call.args === 'object');
  const nameCorrect = schemaValid && call.tool === gold.tool;
  let argsCorrect = false;
  if (nameCorrect) {
    argsCorrect = Object.keys(gold.args).every((k) => k in call.args && valuesMatch(gold.args[k], call.args[k]));
  }
  return {
    ast: nameCorrect && argsCorrect ? 1 : 0,
    nameCorrect: nameCorrect ? 1 : 0,
    argsCorrect: nameCorrect ? (argsCorrect ? 1 : 0) : null,
    schemaValid: schemaValid ? 1 : 0,
  };
}

/**
 * Per-arm aggregate. hintFollowRate = final call's tool == hinted tool;
 * hintOverrideRate is computed in scoreArms (paired: advisory call vs
 * free call on the same task). Decomposition is load-bearing: if the
 * advisory arm's name accuracy rises but AST does not, that IS Chen's
 * scope result reproduced on personal data — verdict "name-only, do
 * not claim call improvement," never "partial win."
 */
function scoreArm(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('scoreArm: rows must be a non-empty array');
  const scored = rows.map((r) => scoreCall(r.gold, r.call));
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const conditional = scored.map((s) => s.argsCorrect).filter((v) => v !== null);
  const hinted = rows.filter((r) => typeof r.hintedTool === 'string');
  return {
    n: rows.length,
    ast: mean(scored.map((s) => s.ast)),
    nameAccuracy: mean(scored.map((s) => s.nameCorrect)),
    argsConditionalAccuracy: conditional.length ? mean(conditional) : null,
    schemaValidAt1: mean(scored.map((s) => s.schemaValid)),
    hintFollowRate: hinted.length ? hinted.filter((r) => r.call && r.call.tool === r.hintedTool).length / hinted.length : null,
  };
}

function scoreArms(arms) {
  for (const a of ADVISORY_TEST_ARMS) {
    if (!arms || !Array.isArray(arms[a]) || arms[a].length === 0) {
      throw new Error(`scoreArms: all three arms must be reported, never advisory-rec alone — missing "${a}" (Batch 197 §2)`);
    }
  }
  const n = arms.free.length;
  if (arms['advisory-rec'].length !== n || arms['advisory-gold'].length !== n) {
    throw new Error('scoreArms: arms must cover the same tasks (same N, paired)');
  }
  const scored = {};
  for (const a of ADVISORY_TEST_ARMS) scored[a] = scoreArm(arms[a]);
  const overrideRate = (armRows) => {
    let diff = 0;
    for (let i = 0; i < n; i++) {
      if (armRows[i].call && arms.free[i].call && armRows[i].call.tool !== arms.free[i].call.tool) diff++;
    }
    return diff / n;
  };
  scored['advisory-rec'].hintOverrideRate = overrideRate(arms['advisory-rec']);
  scored['advisory-gold'].hintOverrideRate = overrideRate(arms['advisory-gold']);
  const rec = scored['advisory-rec'];
  const free = scored.free;
  const decomposition = (rec.nameAccuracy > free.nameAccuracy && rec.ast <= free.ast)
    ? 'name-only, do not claim call improvement'
    : 'ast-tracks-name';
  return { arms: scored, decomposition };
}

/**
 * Task-set guard (Batch 197 §1). Gold comes from the Batch 4 audit
 * trail (schema-valid, executed successfully, person-accepted or left
 * uncorrected), frozen in a curated set BEFORE the test runs — never
 * derived from a hint-arm output (that would be circular). At least
 * one-third confusable tasks (near-synonym tool pairs), else free
 * name accuracy already sits near Chen's 0.929 ceiling and the test
 * has no headroom. At least three routines, or the Batch 5 re-fit
 * warning applies (a threshold learned on one routine does not
 * transfer).
 */
function assertTaskSet(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('assertTaskSet: tasks must be a non-empty array');
  const reasons = [];
  if (tasks.some((t) => !t || !t.goldFrozen)) reasons.push('gold must be frozen before the test runs');
  if (tasks.some((t) => t && t.derivedFromHintArm)) reasons.push('gold must never be derived from a hint-arm output (circular)');
  const confusable = tasks.filter((t) => t && t.confusable).length;
  if (confusable / tasks.length < 1 / 3) reasons.push('at least one-third confusable tasks required (near-synonym tool pairs)');
  const routines = new Set(tasks.map((t) => t && t.routine).filter(Boolean));
  if (routines.size < 3) reasons.push('at least three routines required (one-routine thresholds do not transfer)');
  if (reasons.length) throw new Error(`assertTaskSet: ${reasons.join('; ')} (Batch 197 §1)`);
  return { tasks: tasks.length, confusableShare: confusable / tasks.length, routines: routines.size };
}

/**
 * Pairing controls (Batch 197 §6): without these the arms are not
 * comparable. Freeze memory/adapter/tool-pool growth during the test
 * (otherwise the hint arm learns from the free arm's traces), fix
 * tool/harness order across arms, randomize arm order across tasks,
 * run each arm in a fresh context (no hint leakage via conversation
 * memory), log the full Batch 4 audit row per call.
 */
function assertPairingControls(cfg = {}) {
  const required = ['frozenMemory', 'frozenAdapter', 'frozenToolPool', 'fixedOrder', 'freshContextPerArm', 'auditRowPerCall'];
  const missing = required.filter((k) => cfg[k] !== true);
  if (missing.length) throw new Error(`assertPairingControls: missing pairing controls: ${missing.join(', ')} (Batch 197 §6)`);
  return { pairingControlled: true };
}

/**
 * Abort / falsifier rules, Batch 4 rollback triggers adopted literally
 * (Batch 197 §8). A stopped test is a result, logged with its b/c
 * table — not a reason to re-run with a new wording until it passes.
 */
function abortCheck(pilot) {
  if (!pilot || !pilot.free || !pilot.advisoryRec) throw new Error('abortCheck: pilot must carry free and advisoryRec arm scores');
  const f = pilot.free;
  const a = pilot.advisoryRec;
  if (a.ast < f.ast && ((f.schemaValidAt1 - a.schemaValidAt1) > 0.02 || (f.execRate - a.execRate) > 0.03)) {
    return { stop: true, reason: 'advise-all AST below free with valid@1 down > 2 points or ExecRate down > 3 points — do not ship the hint (Batch 197 §8)' };
  }
  if (pilot.advisoryGold && pilot.advisoryGold.ast > f.ast && a.ast <= f.ast) {
    return { stop: true, reason: 'A-gold helps but A-rec does not — stop and re-examine the RECOMMENDATION, not the delivery (Batch 197 §8)' };
  }
  return { stop: false, reason: null };
}

function assertPilotPassed(pilot) {
  const check = abortCheck(pilot);
  if (check.stop) throw new Error(`assertPilotPassed: pilot failed its abort rules — ${check.reason}`);
  return { pilotPassed: true };
}

/**
 * Multi-turn ordering gates (Batch 197 §7). M1/M2 run ONLY after the
 * single-hop pilot passes its abort rules; M2 never runs before the
 * pilot, and wording-sensitivity arms are never merged into the pilot.
 */
function assertMultiTurnOrder(state = {}) {
  if (state.phase === 'M1' || state.phase === 'M2') {
    if (state.pilotPassed !== true) throw new Error(`assertMultiTurnOrder: ${state.phase} requires the single-hop pilot to pass its abort rules first (Batch 197 §7)`);
  }
  if (state.phase === 'M2' && state.m1Passed !== true) {
    throw new Error('assertMultiTurnOrder: M2 requires M1 to pass first — do not run M2 before the pilot and M1 (Batch 197 §7)');
  }
  if (state.wordingSensitivityMergedIntoPilot === true) {
    throw new Error('assertMultiTurnOrder: wording-sensitivity arms must NOT be merged into the pilot (Batch 197 §3)');
  }
  return { orderOk: true, phase: state.phase || null };
}

/**
 * Hard ban carried from Batch 194 into multi-turn: do NOT reuse Chen's
 * last-token-margin gate in M1/M2 (multi-turn AUROC 0.48/0.73, −27
 * points on τ-bench). Any multi-turn gate must be a new gate (e.g.
 * Plan margin or verifier failure) validated separately.
 */
function assertMultiTurnGate(gate) {
  if (gate === 'chen-last-token-margin') {
    throw new Error('assertMultiTurnGate: Chen\'s last-token-margin gate is BANNED in multi-turn (AUROC 0.48/0.73, −27 pts on τ-bench) — use a separately validated new gate (Batch 197 §7)');
  }
  return { gateOk: true, gate };
}

/**
 * Pre-registered multi-turn verdict rule (Batch 197 §7): if the hint
 * delta at turn 1 is positive but the final-state delta is ≤ 0, the
 * verdict is FAIL for loop use even if single-hop passes — a loop
 * that wins the first hop and loses the episode is not a loop
 * improvement. M1 compares delta_single vs delta_embedded with
 * shrinkage pre-registered as the finding; M2 scores per-turn AST
 * AND final state (τ-bench style: state matches the goal, not just
 * the last call).
 */
function multiTurnVerdict(deltas = {}) {
  if (typeof deltas.turn1Delta !== 'number' || typeof deltas.finalStateDelta !== 'number') {
    throw new Error('multiTurnVerdict: deltas must carry turn1Delta and finalStateDelta numbers');
  }
  if (deltas.turn1Delta > 0 && deltas.finalStateDelta <= 0) {
    return { verdict: 'FAIL', scope: 'loop-use', reason: 'hint wins turn 1 but final-state delta ≤ 0 — a loop that wins the first hop and loses the episode is not a loop improvement (Batch 197 §7)' };
  }
  return { verdict: 'pass-pending', scope: 'loop-use', reason: null };
}

// ------------------- Batch 199: Wu + Wang activation-space leads (SPEC, UNEXECUTED)
//
// Batch 197/198's queue item conflated THREE different residual levers.
// This section disentangles them and RETIRES Batch 194's framing of "a
// residual-steering lever tied 90.9% with the attention lever" as the
// cheaper alternative to S2-eager. The 90.9% belongs to Chen's OWN
// oracle lever (Lever A), not to any deployable method; Wu's gold-free
// steering (Lever B) is much weaker and fails exactly on confusables;
// Wang's ASA (Lever C) is a trigger-axis mechanism, not a selector,
// and is WITHDRAWN, so its numbers are quarantined. No tool vector was
// built, no steering was run, no cosine gap was computed in Batch 199
// — every figure below is the paper's on its benchmarks, NOT on the
// north-star tool pool or the bundled base. This section is a spec plus
// guard code, not results. Rounds 1–6 stand untouched.

/** Chen oracle residual lever (Lever A): GOLD-POINTED, oracle-only upper bound. */
const CHEN_ORACLE_LEVER = {
  lever: 'chen-oracle-residual',
  recovery: 0.909,
  damage: 0.019,
  jaccardWithAttentionLever: 0.865,
  deployable: false,
  reading: 'oracle-only upper bound on what a gold-free deployment could recover — it steers toward the KNOWN gold tool, so it says nothing about any gold-free residual method\'s rate',
};

/** Wu gold-free residual steering (Lever B): the deployable residual lever, weaker. */
const WU_STEERING = {
  lever: 'wu-gold-free-steering',
  source: 'Wu et al. 2026, arXiv:2605.07990v3',
  method: 'one tool vector per tool = mean last-prompt-token residual hidden state over n=2–3 example requests; steering direction d(a→b) = h̄_b − h̄_a, unnormalized, added once at the last prompt token: h ← h + α·d',
  alpha: { fifteenToolLists: 0.7, fiveToolList: 1.0 },
  fullNameSwitchSynthetic15: { range: [0.56, 0.78], pairs: 210, models: 'eight 4B+ instruction-tuned models' },
  prefixRuleScore: { range: [0.81, 1.0], note: 'PREFIX-rule score (§3.3), NOT a full-name switch rate — never quote it as one' },
  firstTokenBound: { pairs: 210, maxSwitchable: 165, note: 'last-layer steering changes only the first output token\'s scores; tools sharing a first token cannot be separated at the last layer' },
  nearSynonyms: { sendEmailVsSendMessage: 0, similarSportsApis: 0, note: 'vectors nearly parallel — steering expected to fail, must not be tried' },
  realApis: {
    tauBenchAirline: { gemma4B: 0.57, qwen4B: 0.77, llama8B: 0.60 },
    tauBenchRetail: { gemma4B: 0.10, qwen4B: 0.50, llama8B: 0.57 },
    toolBench: { gemma4B: 0.37, qwen4B: 0.30, llama8B: 0.27 },
    note: 'domain-bound: on ToolBench, steering between APIs of one domain succeeds on NONE of the sampled pairs; the direction carries the DOMAIN, not the API',
  },
  scaleDecay: { atK15: [0.63, 0.75], atK150: [0.20, 0.25], note: 'prefix-rule stays near 100% to K=150; full-name decays as the pool grows unless tools are renamed to unique first tokens' },
  argumentSteering: { tokyoToParisChanged: '0/30', formatSteering: '0/10', note: 'argument steering FAILS; a steered call can also INVENT argument values — never credit steering with argument repair' },
  crossFamilyTransfer: 0,
  toolVectorRebuildCostExamplesPerTool: [2, 3],
  multiTurn: { readoutOverrideDeltaRange: [-0.30, 0.05], significant: false, fisherP: '>= 0.10 (N=20)', injectionInsideLoop: 'untested' },
  status: 'LAB-ONLY arm, never ahead of the advisory pilot',
};

/** Wang ASA (Lever C): QUARANTINED trigger-axis mechanism, not a selector. */
const ASA_QUARANTINE = {
  lever: 'wang-asa',
  source: 'Wang et al., arXiv:2602.04935 (v1 Feb 4 2026, v4 Aug 28 2026)',
  status: 'WITHDRAWN by the author over disputed results; no PDF for the withdrawn version',
  axis: 'trigger-only (whether the model enters tool mode at all), never which tool',
  mechanism: 'single-shot mid-layer injection at prefill, ternary probe-guided gate (+1 / −1 / 0), ~20KB assets, no weight updates',
  numbersLabel: 'withdrawn-paper claims, disputed by the authors themselves',
  rule: 'ASA numbers (including Lazy Agent AUCs ~0.999 and F1/FPR gains) are recorded ONLY under the quarantine label, never as evidence for a gate, threshold, or build decision. The mechanism remains citable as a design pattern only.',
  quarantineLiftsOnlyFor: 'a reposted version\'s own numbers, after personal replication — never retroactively for v1/v4',
};

const RESIDUAL_LEVERS = {
  'chen-oracle-residual': CHEN_ORACLE_LEVER,
  'wu-gold-free-steering': WU_STEERING,
  'wang-asa': ASA_QUARANTINE,
};

/**
 * Lever gate: each lever has its own gate, and the gates are not
 * interchangeable. Chen oracle refuses ANY deployable use and ANY
 * citation as a deployable rate. Wu steering admits only a lab arm
 * behind the advisory pilot. ASA admits only a design-pattern citation
 * or a quarantined claim — never evidence for a gate/threshold/build.
 */
function leverGate(lever, use = {}) {
  if (lever === 'chen-oracle-residual') {
    if (use.kind === 'oracle-upper-bound' && use.deployable !== true && use.citedAsDeployableRate !== true) {
      return { lever, allowed: true, kind: 'oracle-upper-bound', deployable: false };
    }
    throw new Error('leverGate: Chen oracle residual lever (90.9% recovery / 1.9% damage) is GOLD-POINTED and oracle-only — it refuses any deployable use and refuses citing it as a deployable rate (Batch 199)');
  }
  if (lever === 'wu-gold-free-steering') {
    if (use.arm !== 'lab') throw new Error('leverGate: Wu steering is a LAB-ONLY arm — never a deployed tier (Batch 199)');
    if (use.pilotPassed !== true) throw new Error('leverGate: Wu steering lab arm runs only BEHIND the advisory pilot — pilot must pass its Batch 197 abort rules first (Batch 199)');
    return { lever, allowed: true, arm: 'lab', behindPilot: true };
  }
  if (lever === 'wang-asa') {
    if (use.kind === 'design-pattern') return { lever, allowed: true, kind: 'design-pattern', numbersQuarantined: true };
    if (use.kind === 'quarantined-claim') return { lever, allowed: true, kind: 'quarantined-claim', label: ASA_QUARANTINE.numbersLabel };
    if (use.evidenceFor === 'gate' || use.evidenceFor === 'threshold' || use.evidenceFor === 'build-decision') {
      throw new Error(`leverGate: ASA numbers are QUARANTINED (withdrawn paper, disputed by the authors) — never evidence for a ${use.evidenceFor} (Batch 199)`);
    }
    throw new Error('leverGate: ASA admits only a design-pattern citation or a quarantined claim — no trigger gate may be built on quarantined numbers (Batch 199)');
  }
  throw new Error(`leverGate: unknown residual lever "${lever}" (chen-oracle-residual, wu-gold-free-steering, wang-asa)`);
}

/**
 * Switch-rate quote guard: the 83–100% (paper §3.3: 81–100% for 4B+)
 * figure is the PREFIX-rule score, not full-name switching. Quoting
 * it as a switch rate throws; full-name quoting returns the honest
 * 56–78% synthetic range with its bounds.
 */
function assertSwitchRateQuote(quote = {}) {
  if (quote.metric === 'prefix-rule' && quote.quotedAs === 'switch-rate') {
    throw new Error('assertSwitchRateQuote: the 83–100% prefix-rule score is NOT a switch rate — the full-name switch rate is 56–78% on synthetic 15-tool lists (Batch 199)');
  }
  if (quote.metric === 'full-name') {
    return { metric: 'full-name', range: WU_STEERING.fullNameSwitchSynthetic15.range, pairs: 210, firstTokenBound: WU_STEERING.firstTokenBound };
  }
  throw new Error(`assertSwitchRateQuote: unknown metric "${quote.metric}" (prefix-rule, full-name)`);
}

function firstTokenOf(tool) {
  if (typeof tool !== 'string' || tool.length === 0) throw new Error('firstTokenOf: tool must be a non-empty string');
  return tool.split('_')[0];
}

/**
 * First-token separability at the last layer: tools sharing a first
 * token (get_weather/get_news) cannot be separated by last-layer
 * steering. At most 165/210 pairs are switchable.
 */
function firstTokenSeparable(toolA, toolB) {
  const a = firstTokenOf(toolA);
  const b = firstTokenOf(toolB);
  if (a === b) return { separable: false, sharedFirstToken: a, note: 'tools sharing a first token cannot be separated at the last layer (Batch 199 first-token bound)' };
  return { separable: true, firstTokens: [a, b] };
}

/**
 * Near-synonym exclusion: if the disputed pair's tool vectors are
 * nearly parallel, steering must NOT be tried — the advisory hint,
 * which does not depend on vector geometry, is the fallback. No
 * parallelism threshold is set here (Batch 199 leaves it an open
 * question); the caller supplies the pre-check verdict, never a
 * guessed constant.
 */
function assertSteeringPair(pair = {}) {
  if (pair.vectorsNearlyParallel === true) {
    throw new Error('assertSteeringPair: near-synonym pair (vectors nearly parallel) — steering must not be tried; advisory hint is the fallback (Batch 199)');
  }
  if (typeof pair.vectorsNearlyParallel !== 'boolean') {
    throw new Error('assertSteeringPair: a vector-parallelism pre-check verdict (boolean) is required before any steering attempt — no threshold is set, so the verdict must be supplied, not assumed (Batch 199)');
  }
  const sep = firstTokenSeparable(pair.toolA, pair.toolB);
  return { pairOk: true, fallback: 'advisory-hint', firstTokenSeparable: sep.separable, firstTokenNote: sep.note || null };
}

/**
 * Tool vectors are BASE-SPECIFIC artifacts (joining adapter + probe +
 * thresholds + capture config in the Batch 8/9 versioning tuple):
 * cross-family transfer is 0%, a base swap orphans them, rebuilding
 * costs 2–3 example requests per tool (cheap to rebuild, not portable).
 */
function toolVectorArtifact(base) {
  if (typeof base !== 'string' || base.length === 0) throw new Error('toolVectorArtifact: base must be a non-empty string');
  return { artifact: 'tool-vectors', baseSpecific: true, base, crossFamilyTransfer: 0, rebuildCostExamplesPerTool: [2, 3] };
}

function assertToolVectorBase(artifact, currentBase) {
  if (!artifact || artifact.baseSpecific !== true) throw new Error('assertToolVectorBase: tool vectors are base-specific artifacts — an artifact without a base cannot be trusted (Batch 199)');
  if (artifact.base !== currentBase) {
    throw new Error(`assertToolVectorBase: base swap orphans tool vectors (artifact base "${artifact.base}" != current base "${currentBase}") — rebuild at 2–3 example requests per tool, do not reuse (Batch 199)`);
  }
  return { baseOk: true, base: currentBase };
}

/**
 * Steered-call execution guard: steering never bypasses the Batch 4
 * verifier. A steered call needs schema validity AND argument checks
 * before execution; steering is never credited with argument repair
 * (argument steering fails 30/30), and steering can invent argument
 * values the verifier must catch.
 */
function assertSteeredCallVerified(call = {}) {
  if (call.claimedArgumentRepair === true) {
    throw new Error('assertSteeredCallVerified: steering is never credited with argument repair — argument steering FAILS 30/30 (Batch 199)');
  }
  if (call.schemaValid !== true || call.argumentChecksPassed !== true) {
    throw new Error('assertSteeredCallVerified: a steered call must pass the Batch 4 schema verifier + argument checks before execution — steering can invent argument values (Batch 199)');
  }
  return { verified: true, note: 'steering fixed WHICH tool at most; arguments were verified independently' };
}

/**
 * Wu loop claims must pass Batch 197's M2 final-state rule, not the
 * single-hop switch rate. Vector injection inside a loop is untested
 * in the literature — only a readout override was run (N=20, n.s.,
 * −30 to +5) — so an injection-based loop claim is refused outright.
 */
function wuLoopClaim(claim = {}) {
  if (claim.multiTurnInjection === true) {
    throw new Error('wuLoopClaim: vector injection inside a loop is UNTESTED (only readout-override was run) — no loop claim may assume it (Batch 199)');
  }
  if (claim.basis === 'single-hop-switch-rate') {
    throw new Error('wuLoopClaim: a loop claim cannot rest on the single-hop switch rate — it must pass Batch 197\'s M2 final-state rule (Batch 199)');
  }
  if (typeof claim.turn1Delta !== 'number' || typeof claim.finalStateDelta !== 'number') {
    throw new Error('wuLoopClaim: a Wu loop claim must carry turn1Delta and finalStateDelta for the M2 final-state rule (Batch 199)');
  }
  const verdict = multiTurnVerdict({ turn1Delta: claim.turn1Delta, finalStateDelta: claim.finalStateDelta });
  return { basis: 'readout-override-only', overrideRange: WU_STEERING.multiTurn.multiTurn, verdict: verdict.verdict, note: 'multi-turn override result is n.s. (Fisher p>=0.10, N=20) — it neither proves benefit nor harm' };
}

// ------------------- Batch 199: Wu cosine-gap detector (CANDIDATE, NOT SHIPPED)
const WU_GAP = {
  detector: 'wu-cosine-gap',
  source: 'Wu et al. 2026, arXiv:2605.07990v3 §5',
  method: 'cosine GAP between the two closest tool vectors at the last prompt token — a PRE-generation read, so it can fire BEFORE a call is written',
  cost: '<0.1 ms over the prompt pass (vs >2x the prompt pass for full-name margin scoring of every candidate name)',
  aurocBfcl: { gemma3_4B: 0.76, gemma3_12B: 0.78, qwen3_4B: 0.61, llama3_1_8B: 0.78 },
  beatsFirstTokenMarginOn: '3/4 models',
  vsFullNameMargin: 'roughly tied, at far lower cost',
  threshold: null,
  thresholdNote: 'NO threshold is set (ranking only; only 13–61 errors per model)',
  status: 'CANDIDATE, not shipped',
  reading: 'gap flags UNCERTAINTY, not wrongness — a confident wrong call has a LARGE gap; the gap is silent on confident errors (like UProp\'s EU, Batch 14)',
};

/**
 * Gap threshold guard: Wu sets no threshold, so any claimed threshold
 * is refused. Ranking only until a threshold rule is validated.
 */
function assertGapThreshold(threshold) {
  if (threshold !== null && threshold !== undefined) {
    throw new Error('assertGapThreshold: Wu sets NO gap threshold (ranking only, 13–61 errors per model) — a claimed threshold is refused until validated (Batch 199)');
  }
  return { thresholdSet: false, mode: 'ranking-only' };
}

function assertGapUse(use) {
  if (use === 'selector') throw new Error('assertGapUse: the Wu gap is a DETECTOR candidate, not a selector — it ranks hops by uncertainty, it does not pick a tool (Batch 199)');
  if (use === 'shipped') throw new Error('assertGapUse: the Wu gap is a CANDIDATE, not shipped — it needs a threshold, within-routine validation, and comparison against the Batch 5 logprob-margin gate first (Batch 199)');
  if (use !== 'detector-candidate') throw new Error(`assertGapUse: unknown gap use "${use}" (detector-candidate only)`);
  return { use: 'detector-candidate', shipped: false };
}

/**
 * Gap promotion checklist: pooled BFCL AUROC is NOT a within-routine
 * score (Batch 13), and the cost argument favors the gap over
 * full-name scoring, NOT over the free logprob margin. Until both
 * validations exist, the gap stays a candidate.
 */
function gapDetectorStatus(checks = {}) {
  const missing = [];
  if (checks.withinRoutineValidated !== true) missing.push('within-routine validation (Batch 13: pooled BFCL AUROC is not a within-routine score)');
  if (checks.comparedToLogprobMargin !== true) missing.push('comparison against the Batch 5 logprob-margin gate');
  if (checks.thresholdValidated !== true) missing.push('a validated threshold rule (gap percentile? per-model median? per-routine?)');
  return { status: missing.length ? 'candidate' : 'promotion-ready', shipped: false, missing, aurocBfcl: WU_GAP.aurocBfcl };
}

/**
 * Gap reading: small gap = uncertain between near vectors (flag it);
 * large gap = confident — possibly CONFIDENTLY WRONG, never read as
 * "correct". The gap is silent on confident errors.
 */
function gapReading(gap) {
  if (typeof gap !== 'number' || gap < 0) throw new Error('gapReading: gap must be a non-negative number (cosine gap between the two closest tool vectors)');
  if (gap === 0) return { reading: 'maximally-uncertain', flag: true, note: 'gap flags uncertainty, not wrongness' };
  return { reading: 'confident-or-uncertain-by-rank-only', flag: null, note: 'a LARGE gap means confident, possibly confidently wrong — never read a large gap as "correct"; the gap is silent on confident errors (Batch 199)' };
}

// ------------------- Batch 199: disputed-hop tier order (CANONICAL, cheapest first)
const BATCH_194_RESIDUAL_FRAMING = {
  framing: '"a residual-steering lever tied 90.9% with the attention lever" as the cheaper alternative to S2-eager',
  status: 'RETIRED (Batch 199)',
  reason: 'the 90.9% is Chen\'s gold-pointed oracle lever, not a deployable rate; Wu gold-free steering is 56–78% and fails on near-synonyms; ASA is a withdrawn trigger-axis mechanism, not a selector',
};

const DISPUTED_HOP_TIERS_199 = [
  { order: 1, tier: 'advisory-hint', basis: 'Batch 197 Plan-top1 advisory hint first — no inference-layer change, testable by the pilot before any steering work' },
  { order: 2, tier: 'wu-cosine-gap-detector-candidate', basis: 'pre-generation detector candidate (not a selector, not shipped) — one last-token hidden-state read, <0.1 ms over the prompt pass' },
  { order: 3, tier: 'wu-steering-lab', basis: 'LATER lab arm only, behind the advisory pilot, with near-synonym exclusion + M1/M2 final-state rule' },
  { order: 4, tier: 'chen-s2-attention', basis: 'single-hop candidate with eager-attention requirement, multi-turn unproven — Wu does not replace it (different failure places)' },
];

function canonicalTierOrder() {
  return DISPUTED_HOP_TIERS_199.map((t) => t.tier);
}

/**
 * Tier-order guard: the canonical order is cheapest first and is the
 * ONLY order. Steering ahead of the advisory pilot, the gap as a
 * selector/shipped tier, or the retired Batch 194 framing all throw.
 * Batch 3's Select stage stays advisory-only at AST level (Chen −19.1
 * hard-forcing untouched — Wu steering is also a hard intervention on
 * the name, so a steered call still passes the verifier, never bypasses it).
 */
function assertTierOrder(tiers) {
  const canonical = canonicalTierOrder();
  if (!Array.isArray(tiers) || tiers.length !== canonical.length || !tiers.every((t, i) => t === canonical[i])) {
    throw new Error(`assertTierOrder: canonical disputed-hop order is ${canonical.join(' → ')} (cheapest first, Batch 199); Batch 194's "residual lever as cheaper alternative" framing is RETIRED`);
  }
  return { orderOk: true, tiers: canonical, retiredFraming: BATCH_194_RESIDUAL_FRAMING.status };
}

// ------------------- Batch 199: infrastructure convergence (Batch 7/8 capture)
const CAPTURE_CONVERGENCE = {
  gapNeeds: 'Batch 7/8 in-process capture (last-token residual at one layer)',
  steeringNeeds: 'the same in-process path PLUS a write hook at prefill',
  httpServerPath: 'REFUSED — neither the gap nor steering works over the HTTP server path (Batch 7 fork, unchanged)',
  elementBoundByLayers: { 1: 6553, 5: 1310 },
  copyRule: 'still a full-tensor copy per Batch 8 (no row picker); still fail-soft to G-NLL + verifier on over-bound prompts',
  sharedCaptureNote: 'SEP-TBG probe and Wu gap can share one capture IF probe layer and gap layer coincide; otherwise each layer is a separate full-tensor copy and the budget doubles — a prototype detail, not a premature merge',
};

function captureElementBound(layers) {
  if (Object.prototype.hasOwnProperty.call(CAPTURE_CONVERGENCE.elementBoundByLayers, layers)) {
    return { layers, elementBound: CAPTURE_CONVERGENCE.elementBoundByLayers[layers], known: true };
  }
  return { layers, elementBound: null, known: false, note: 'only the 1-layer (~6,553) and 5-layer (1,310) bounds are verified — no bound is claimed for other layer counts (Batch 199)' };
}

function captureCopies({ probeLayer, gapLayer } = {}) {
  if (probeLayer === undefined || gapLayer === undefined) {
    throw new Error('captureCopies: probeLayer and gapLayer are both required — sharing is decided by whether the layers coincide (Batch 199)');
  }
  if (probeLayer === gapLayer) return { copies: 1, shared: true, note: 'SEP-TBG probe and Wu gap share one capture (layers coincide)' };
  return { copies: 2, shared: false, note: 'each layer is a separate full-tensor copy and the budget doubles — a prototype detail, not a premature merge (Batch 199)' };
}

function assertCapturePath(path, opts = {}) {
  if (path === 'http-server') {
    throw new Error('assertCapturePath: Wu gap and Wu steering do NOT work over the HTTP server path — in-process capture is required (Batch 7 fork, Batch 199)');
  }
  if (path !== 'in-process') throw new Error(`assertCapturePath: unknown capture path "${path}" (in-process only)`);
  if (opts.needsWriteHook === true && opts.writeHookAtPrefill !== true) {
    throw new Error('assertCapturePath: Wu steering needs the in-process path PLUS a write hook at prefill — capture alone is not enough (Batch 199)');
  }
  return { path: 'in-process', writeHookAtPrefill: opts.needsWriteHook === true };
}

// ------------------- Batch 201: Healy detector slotting correction (SPEC, UNEXECUTED)
//
// Batch 199/200's queue item mis-slotted Healy as "a possible third
// detector alongside Wu gap and logprob margin" in the Wu-gap slot.
// Batch 201, reading Healy et al. 2026 ("Internal Representations as
// Indicators of Hallucinations in Agent Tool Selection,"
// arXiv:2601.05214) in full, corrects the slotting: Healy is
// POST-generation / PRE-execution, NOT a rival to Wu's pre-generation
// gap. The detector stack is a TIMELINE, not a menu: the gap flags
// uncertainty before writing, the margin scores the first token as
// written, the Healy classifier scores the completed call before
// execution, and the Batch 4 verifier checks the call's form. Each
// later stage costs more of the call's existence, and only Healy's
// stage sees the arguments at all. No classifier was trained, no gap
// was computed, no Healy feature was extracted in Batch 201 — every
// number below is the paper's on Glaive calculator-style tasks, NOT
// on the north-star tool pool or the bundled base. Round 7's tier
// order (DISPUTED_HOP_TIERS_199) STANDS untouched; this timeline
// extends it by adding a stage, it does not replace it. Wu steering
// (lab arm) and Chen S2 (attention) are interventions/candidates in
// the 199 tier order, not detector stages, and are not re-ordered here.

/** Detector stack as a TIMELINE (Batch 201), by time, not a menu. */
const DETECTOR_TIMELINE_201 = [
  { order: 0, tier: 'advisory-hint', timing: 'first, before inference changes', basis: 'Batch 197 advisory hint first (no inference change, AST-neutral-or-better) — the pilot arm, not a gate' },
  { order: 1, tier: 'wu-cosine-gap-pre-generation', timing: 'PRE-generation', basis: 'Wu cosine gap flags uncertain hops BEFORE writing (selection-only); cheapest detector, training-free, weakest on near-synonyms' },
  { order: 2, tier: 'logprob-first-token-margin-during-generation', timing: 'DURING generation', basis: 'Batch 5 logprob / first-token margin: free logits, first token only, same selection-only limit as the gap' },
  { order: 3, tier: 'healy-post-generation-pre-execution-confirmation', timing: 'POST-generation, PRE-execution', basis: 'Healy-style classifier: the ONLY stage that sees arguments, so it is the argument/completeness gate — CONFIRMATION-TIER ONLY (see healyGatePolicy), never auto-block' },
  { order: 4, tier: 'batch4-schema-verifier-and-argument-checks', timing: 'after every stage, before execution', basis: 'Batch 4 schema verifier + argument checks still mandatory after every stage, because no detector stage repairs arguments (Healy detects, it does not fix; Wu steering invents values, Batch 199)' },
];

function detectorTimeline() {
  return DETECTOR_TIMELINE_201.map((t) => t.tier);
}

/**
 * Timeline-order guard: the canonical time order is the ONLY order.
 * Placing Healy pre-generation, or as a rival to the Wu gap, throws —
 * Healy cannot fire before the call exists, which the gap can, and it
 * answers a later question ("this written call looks wrong,
 * block/confirm it?") that the gap cannot answer.
 */
function assertTimelineOrder(tiers) {
  const canonical = detectorTimeline();
  if (!Array.isArray(tiers) || tiers.length !== canonical.length || !tiers.every((t, i) => t === canonical[i])) {
    throw new Error(`assertTimelineOrder: canonical detector timeline is ${canonical.join(' → ')} by time (Batch 201); Healy is POST-generation / PRE-execution, NOT a pre-generation rival to the Wu gap`);
  }
  return { orderOk: true, tiers: canonical, note: 'Batch 199 tier order stands untouched; this timeline extends it by adding a stage, not replacing one' };
}

/** Healy-use guard: pre-generation, rival-gate, and selector uses all throw. */
function assertHealyNotPreGeneration(use) {
  if (use === 'pre-generation' || use === 'wu-gap-rival' || use === 'selector') {
    throw new Error(`assertHealyNotPreGeneration: Healy is POST-generation / PRE-execution, never "${use}" — it cannot fire before the call exists and it gates execution, it does not select (Batch 201)`);
  }
  if (use !== 'post-generation-pre-execution-detector') throw new Error(`assertHealyNotPreGeneration: unknown Healy use "${use}" (post-generation-pre-execution-detector only)`);
  return { use: 'post-generation-pre-execution-detector', timing: 'POST-generation, PRE-execution' };
}

/**
 * Healy et al. 2026, arXiv:2601.05214, as spec not result.
 * Method: unsupervised-by-agreement labeling — take a Glaive v2
 * reference call, mask it from the prompt, regenerate, label
 * hallucination iff the predicted function name differs from the
 * reference OR arguments fail after canonicalization. Model-specific
 * 2-layer MLP (hidden 512, ReLU, sigmoid, dropout 0.1, AdamW lr 1e-4,
 * up to 50 epochs, early stop patience 5, batch 32); threshold τ by
 * grid search 0.1–0.9 on validation, temperature scaling for
 * calibration. Inference reuses the generation pass's final-layer
 * states — in-process only (see infrastructureCost).
 */
const HEALY_201 = {
  source: 'Healy et al. 2026, "Internal Representations as Indicators of Hallucinations in Agent Tool Selection," arXiv:2601.05214',
  featureVector: 'z = Π(h at the function-name\'s first sub-token ‖ mean over all argument-region tokens ‖ h at the closing delimiter), last layer only, Eq. (1)',
  taxonomy: [
    'nonexistent function',
    'semantically inappropriate function',
    'parameter outside the valid domain',
    'missing required parameters',
    'tool bypass (answering without calling)',
  ],
  taxonomyNote: 'the paper reports only a UNIFIED BINARY result — bypass is never measured separately, so type (5) detection is a taxonomy entry, not a result. Do NOT cite Healy for bypass detection (see assertHealyBypassClaim).',
  // Real hallucination-class figures (Table 2, test split). NEVER quote
  // the abstract's "up to 86.4% accuracy" or Table 1's rows as
  // hallucination-class performance: Table 1's rows match Table 2's
  // WEIGHTED averages, not the hallucination class.
  hallucinationClassTable2: {
    'gpt-oss-20b': { precision: 0.86, recall: 0.53, f1: 0.66, support: 587, accuracy: 0.86, nonHallucinationRecall: 0.97 },
    'llama-3.1-8b': { precision: 0.71, recall: 0.61, f1: 0.66, support: 1036, accuracy: 0.73 },
    'qwen-7b': { precision: 0.34, recall: 0.62, f1: 0.44, support: 333, accuracy: 0.74 },
  },
  abstractNumber: { value: 'up to 86.4% accuracy', reading: 'WEIGHTED average, NOT hallucination-class performance — never quote it as hallucination-class performance' },
  interventionPolicy: 'PROPOSED, never evaluated: if p > τ, block / ask confirmation / fall back / repair-by-reprompting. No intervention experiment exists — no measured effect of blocking or repair on task success (Wu §1 characterization confirmed: Healy "leaves the signal\'s effect on the call untested").',
  ablation: {
    slice: 'Qwen-7B digital-commerce slice',
    methods: 10,
    accuracyRange: [0.739, 0.746],
    accuracySpread: 0.007,
    aucRange: [0.716, 0.721],
    lastTokenOnly: { accuracy: 0.744, auc: 0.720 },
    meanPooled: { accuracy: 0.746, auc: 0.721 },
    threePointNote: 'the paper\'s own three-point concatenation is NOT separately tabulated in the ablation, so its claimed design adds NO measured advantage over last-token or mean pooling on this evidence',
    buildRule: 'if a Healy-style classifier is ever built, start with last-token or mean-pooled features — the three-point construction is complexity without a measured payoff, and the harder capture (three token regions vs one)',
  },
  reportingInconsistencies: [
    { id: '(a)', issue: 'Eq. (1) says projection Π is identity by default, giving m = 3d — but the training configuration lists classifier input dimensions equal to the hidden dimension d (Qwen-7B 3584, GPT-OSS-20B 2880, Llama-3.1-8B 4096), not 3d', status: 'CAVEAT, not resolved: either Π is not identity in practice or the dimensions are misreported; a reproduction cannot tell which from the paper' },
    { id: '(b)', issue: 'main protocol is a 60/20/20 split over 2,411 instances per model, but Qwen-7B\'s Table 2 totals 2,000, and the ablation uses a different 70/30 split', status: 'CAVEAT, not resolved: Qwen\'s numbers are not on the same footing as the other two models\'; never quote Healy numbers to three significant figures in a build spec' },
  ],
  baselines: {
    note: 'NCP and semantic similarity (n=3 samples each) reach accuracy 0.935–0.95 with precision 1.0, but lower hallucination recall on Qwen (0.45/0.44 vs Healy 0.62) and similar recall on GPT-OSS/Llama (0.79/0.733 vs 0.53/0.61 — Healy trails on GPT-OSS recall)',
    overheadFlag: 'the paper\'s "5× computational overhead" for baselines sits uneasily next to its own n=3 sampling description (3 passes, not 5) — FLAG, do not resolve',
    precisionFlag: 'the precision-1.0 baseline figures are suspiciously clean for agreement-based labels — REPORTED, not endorsed',
  },
  scopeLimits: {
    domains: 'five calculator-style Glaive agents (quick calculator, personal finance, health, sustainability, digital commerce)',
    taskShape: 'single-call computational tasks with canonicalizable arguments',
    notCovered: ['multi-turn routines', 'real side-effect APIs', 'similar-tool disputes'],
    nearSynonym: 'NO near-synonym test exists (its name-difference label lumps a near-synonym swap with a domain error) — whether it beats Wu\'s gap on confusable pairs is UNKNOWN, not favorable',
    withinRoutine: 'NO within-routine score exists (Batch 13: pooled-across-domains accuracy is not a within-routine AUROC)',
    tauRule: 'τ is validation-tuned per model per dataset, so a personal deployment must re-tune τ on personal data (exactly like Batch 5\'s τu/τv re-fit rule)',
  },
  confidentErrorHypothesis: 'HYPOTHESIS TO TEST, not a result: the gap flags UNCERTAINTY (silent on confident errors, Batch 199); Healy flags learned INCORRECTNESS patterns (a classifier trained on agreement labels), so a confidently-wrong call that differs from the reference IS in its positive class by construction — but measured hallucination recall 0.53–0.62 says it catches only about half of them even in-domain, so "in principle" must not become "in product" without a personal replication',
  personalDataRecipe: {
    labeling: 'masked-agreement labeling transfers with no extra labeling effort — take the person\'s verified call as reference, mask it, regenerate, label by agreement (Batch 2 person-as-corrector in classifier form)',
    scaleLimit: 'Healy trains on ~1,447 labeled instances per model (60% of 2,411); a personal pool has tens to low hundreds of verified calls, and whether a 512-hidden MLP generalizes at that scale is untested',
    honestVersion: 'a SMALLER classifier (or a probe, Batch 5 style) trained on personal agreement labels, evaluated on within-routine hallucination recall/precision — NOT Healy\'s MLP at Healy\'s scale',
  },
  infrastructureCost: 'Healy\'s "single forward pass" holds ONLY in-process (Batch 7 fork, unchanged): it needs final-layer states at the function token, ACROSS the argument span, and at the closing delimiter — streaming capture DURING generation, not one prompt token like Wu\'s gap. On a server path that means a SECOND PASS over the generated text, which breaks the single-pass claim in that deployment. Last-token-only capture (0.744 vs 0.746) would collapse capture to one generated token, but that token must still be captured during generation, and the ablation\'s last-token variant is a different feature than the three-point design — evidence for a simpler classifier, not proof the three-point classifier works from one token.',
  artifactNote: 'TRAINED, base-specific artifact: joins the Batch 8/9 versioning tuple (alongside Wu vectors, adapter, probe, thresholds) — a base swap orphans it (see healyClassifierArtifact / assertHealyArtifactBase)',
  status: 'SPEC, not executed — no classifier trained, no Healy feature extracted, no gap computed in Batch 201',
};

/** Hallucination-class Table 2 figures by model (never the abstract number). */
function healyHallucinationClass(model) {
  const row = HEALY_201.hallucinationClassTable2[model];
  if (!row) throw new Error(`healyHallucinationClass: unknown model "${model}" (gpt-oss-20b, llama-3.1-8b, qwen-7b — Table 2, test split)`);
  return { model, ...row };
}

/**
 * Healy-number quote guard: the abstract's "up to 86.4% accuracy" and
 * Table 1's rows are WEIGHTED averages. Quoting either as
 * hallucination-class performance throws; a hallucination-class quote
 * returns the Table 2 figures.
 */
function assertHealyQuote(quote = {}) {
  if (quote.quotedAs === 'hallucination-class' && (quote.metric === 'abstract-accuracy' || quote.metric === 'table1-row')) {
    throw new Error(`assertHealyQuote: the ${quote.metric === 'abstract-accuracy' ? 'abstract\'s "up to 86.4% accuracy"' : 'Table 1 rows'} are WEIGHTED averages, NOT hallucination-class performance — quote Table 2 (GPT-OSS-20B 0.86/0.53/0.66, Llama-3.1-8B 0.71/0.61/0.66, Qwen-7B 0.34/0.62/0.44) (Batch 201)`);
  }
  if (quote.metric === 'hallucination-class') {
    if (typeof quote.model !== 'string') throw new Error('assertHealyQuote: a hallucination-class quote must name its model (Table 2, test split)');
    return healyHallucinationClass(quote.model);
  }
  throw new Error(`assertHealyQuote: unknown metric "${quote.metric}" (abstract-accuracy, table1-row, hallucination-class)`);
}

/**
 * Confirmation-tier justification, recorded verbatim (Batch 201):
 * hallucination recall 0.53–0.62 (best model misses about half of
 * hallucinations), Qwen precision 0.34 (two-thirds of flags are false
 * alarms on Qwen). A gate with those numbers is confirmation-tier,
 * not auto-block.
 */
const HEALY_CONFIRMATION_JUSTIFICATION =
  'hallucination recall 0.53–0.62 (best model misses about half of ' +
  'hallucinations), Qwen precision 0.34 (two-thirds of flags are false ' +
  'alarms on Qwen). A gate with those numbers is confirmation-tier, ' +
  'not auto-block.';

/**
 * Healy gate policy guard: the post-generation, pre-execution stage
 * may flag for person confirmation or an advisory re-pick — NEVER
 * auto-block, NEVER decide on its own. Any auto-block policy throws.
 */
function healyGatePolicy(policy) {
  if (policy === 'auto-block') {
    throw new Error(`healyGatePolicy: auto-block is REFUSED for the Healy stage — ${HEALY_CONFIRMATION_JUSTIFICATION} (Batch 201)`);
  }
  if (policy === 'person-confirmation' || policy === 'advisory-repick') {
    return { tier: 'confirmation', policy, justification: HEALY_CONFIRMATION_JUSTIFICATION, note: 'flag → person confirms or advisory re-pick; the stage never decides on its own' };
  }
  throw new Error(`healyGatePolicy: unknown Healy gate policy "${policy}" (person-confirmation, advisory-repick only — auto-block refused)`);
}

/**
 * Bypass-claim guard: tool bypass is a taxonomy entry, never a
 * measured result. Citing Healy for bypass detection throws.
 */
function assertHealyBypassClaim(claim = {}) {
  if (claim.citesHealyForBypassDetection === true) {
    throw new Error('assertHealyBypassClaim: Healy reports only a unified binary result — bypass is never measured separately, so Healy must NOT be cited for bypass detection (Batch 201)');
  }
  return { bypassSeparatelyMeasured: false, note: 'bypass is a taxonomy entry, not a result' };
}

/**
 * Healy classifier artifact: TRAINED and base-specific, joining the
 * Batch 8/9 versioning tuple. A base swap orphans it, like Wu tool
 * vectors (Batch 199) — rebuild on personal agreement labels, do not
 * reuse across bases.
 */
function healyClassifierArtifact(base) {
  if (typeof base !== 'string' || base.length === 0) throw new Error('healyClassifierArtifact: base must be a non-empty string');
  return { artifact: 'healy-classifier', baseSpecific: true, base, trained: true, note: 'a base swap orphans it — rebuild, do not reuse (Batch 201)' };
}

function assertHealyArtifactBase(artifact, currentBase) {
  if (!artifact || artifact.baseSpecific !== true) throw new Error('assertHealyArtifactBase: a Healy classifier is a trained, base-specific artifact — an artifact without a base cannot be trusted (Batch 201)');
  if (artifact.base !== currentBase) {
    throw new Error(`assertHealyArtifactBase: base swap orphans the Healy classifier (artifact base "${artifact.base}" != current base "${currentBase}") — rebuild on personal agreement labels, do not reuse (Batch 201)`);
  }
  return { baseOk: true, base: currentBase };
}

/**
 * Post-stage verifier guard: Batch 4 schema verifier + argument
 * checks are mandatory after EVERY detector stage, because no
 * detector stage repairs arguments. A call reaching execution without
 * both throws — a Healy flag, a gap flag, or a clean detector pass
 * never waives the verifier.
 */
function assertExecutionRequiresVerifier(call = {}) {
  if (call.schemaValid !== true || call.argumentChecksPassed !== true) {
    throw new Error('assertExecutionRequiresVerifier: Batch 4 schema verifier + argument checks are mandatory after every detector stage before execution — no detector stage repairs arguments (Healy detects, it does not fix; Batch 201)');
  }
  return { verified: true, note: 'detector stages flag; only the verifier clears a call for execution' };
}

// ------------------- Batch 201: what Healy does NOT change (guards, no regress)

/**
 * Pilot-order guard: Batch 197's pilot order stands — advisory hint
 * first, and Healy is a LATER gate arm, not a pilot arm. Merging a
 * Healy arm into the 100-task pilot throws. Canonical pilot arms are
 * ADVISORY_TEST_ARMS (free, advisory-rec, advisory-gold).
 */
function assertHealyNotPilotArm(arms) {
  if (!Array.isArray(arms)) throw new Error('assertHealyNotPilotArm: arms must be an array');
  if (arms.some((a) => typeof a === 'string' && a.toLowerCase().includes('healy'))) {
    throw new Error('assertHealyNotPilotArm: Healy is a LATER gate arm — do NOT merge it into the 100-task advisory pilot (Batch 197 pilot order stands; Healy-gate spec execution comes after the pilot, Batch 201)');
  }
  return { pilotArmsOk: true, arms };
}

/**
 * Steering-substitution guard: Batch 199's Wu-steering lab-arm
 * exclusion stands. Healy DETECTS, it does not steer, so it cannot
 * substitute for steering evidence or for a steering arm.
 */
function assertHealyNotSteering(use) {
  if (use === 'steering-substitute' || use === 'steer') {
    throw new Error('assertHealyNotSteering: Healy detects, it does not steer — it cannot substitute for steering evidence (Batch 199 lab-arm exclusion stands; Batch 201)');
  }
  if (use !== 'detect') throw new Error(`assertHealyNotSteering: unknown Healy use "${use}" (detect only)`);
  return { detectsOnly: true, steers: false };
}

/** ASA re-check (Batch 201): quarantine STANDS, unchanged. */
const ASA_RECHECK_201 = {
  source: 'arXiv abstract page https://arxiv.org/abs/2602.04935, re-read Batch 201',
  status: 'WITHDRAWN by Youjin Wang',
  versions: { v1: 'Feb 4 2026', v4: 'Aug 28 2026' },
  pdf: 'none',
  quarantine: 'STANDS',
  rule: 'ASA numbers are never cited as evidence; re-read only if reposted with resolved results, quarantine until then',
};

function assertAsaQuarantineStands() {
  return { quarantine: ASA_RECHECK_201.quarantine, status: ASA_RECHECK_201.status, rule: ASA_RECHECK_201.rule, prior: ASA_QUARANTINE.status };
}

/**
 * Wu-citation correction (Batch 201): Healy is cited by Wu §1 ONLY,
 * not §1/§6. In the Wu v3 HTML read in Batch 201, Healy appears in §1
 * and in the references only — no separate §6 treatment was found
 * (text search returns exactly those two matches). The correction
 * stands until a different Wu version shows otherwise.
 */
const WU_HEALY_CITATION_201 = {
  citedBy: 'Wu §1 only',
  correctedShorthand: 'Batch 199 shorthand "cited by Wu §1/§6" corrected to "cited by Wu §1"',
  evidence: 'Wu v3 HTML read Batch 201: Healy appears in §1 and in the references only; no separate §6 treatment found',
  until: 'a different Wu version shows otherwise',
};

function assertWuHealyCitation(sections) {
  if (!Array.isArray(sections)) throw new Error('assertWuHealyCitation: sections must be an array');
  if (sections.includes('§6') || sections.includes('6')) {
    throw new Error('assertWuHealyCitation: Healy is cited by Wu §1 ONLY (Batch 201 correction of the Batch 199 "§1/§6" shorthand) — no §6 treatment exists in Wu v3 until a different version shows otherwise');
  }
  return { citedBy: WU_HEALY_CITATION_201.citedBy, sections };
}

// ------------------- Batch 204: Speculative Rejection + Slim-SC gate-spec pruning rules (SPEC, UNEXECUTED)
//
// Batch 204 read Sun et al., "Fast Best-of-N Decoding via Speculative
// Rejection" (arXiv:2410.20290v2) and Hong et al., "Slim-SC: Thought
// Pruning for Efficient Scaling with Self-Consistency"
// (arXiv:2509.13990v1) in full — the last two Batch 192 related-work
// leads — against the question the log has answered twice already:
// can a cheaper multi-sample method reopen the multi-sample tier that
// Batch 5 (sampling tax) and Batch 10 (SE demoted to offline-only for
// tool hops) closed for the live gate? Answer: NO, and the reasons
// differ per paper, which is why both had to be read rather than one
// standing for "pruning works." No SR or Slim-SC run was executed in
// Batch 204; every number below is the paper's on its models/tasks,
// NOT on the north-star's 4B GGUF or personal tool routines. Code
// linked by the papers (SpeculativeRejection, slimsc) was not cloned
// or run. This section is spec + guard code only: it closes the gate
// harder and constrains any future sampled step; it wires nothing
// into the workbench/launcher and verifies no product gate.

/**
 * Closure record (Batch 204): Batch 5's sampling-tax rule and Batch
 * 10's demotion of multi-sample SE to offline-only for tool hops
 * STAND, now with two additional primary sources behind them (SR +
 * Slim-SC) instead of one argument. Neither paper reopens the live
 * gate, anywhere, in any reading below.
 */
const MULTI_SAMPLE_LIVE_GATE_CLOSURE_204 = {
  verdict: 'CLOSED — the multi-sample live tool gate stays CLOSED',
  stands: [
    'Batch 5 sampling-tax rule',
    'Batch 10 demotion: multi-sample SE offline-only for tool hops; G-NLL_SMT live',
  ],
  additionalSources: [
    'Sun et al., Speculative Rejection, arXiv:2410.20290v2',
    'Hong et al., Slim-SC, arXiv:2509.13990v1',
  ],
  whyNeitherReopens: [
    'SR-logprob is locally implementable but selects for probability, the confident-error direction on tool hops (Batch 10 FC collapse)',
    'SR reward-model variant needs a second model and a partial–final score correlation weakest exactly where tool decisions live (late arguments)',
    'Slim-SC cuts at most ~45% off a cost still 3–5x after cutting, on long reasoning chains the tool gate does not have',
  ],
  status: 'SPEC, not executed — no SR or Slim-SC run in Batch 204',
};

/**
 * SR-logprob variant (Batch 204, §5.3): the correction to the naive
 * objection. SR with the score replaced by the model's OWN average
 * log-probability, s(Y) = (1/len) ln p(Y|X), needs NO reward model at
 * all — so "SR needs a second 7B reward model the resident machine
 * cannot afford" FAILS for this variant — and it still beats Best-of-N
 * on perplexity with large speedups (Table 2: SR α=0.5 average PPL
 * 1.554 vs Bo3840 1.698, "speedup" 39.9x vs the Bo3840 baseline, read
 * as the paper's relative-GPU-compute accounting, NOT a
 * single-machine latency measurement; the Mistral-7B speedup is partly
 * attributed by the authors to an inefficient HuggingFace GQA
 * implementation). BUT the variant's objective is the trap: it
 * maximizes probability, i.e. it keeps the most probable completions.
 * Batch 10's FC collapse is exactly that high-probability candidates
 * are the confidently-wrong ones (mean token probability 0.97 on tool
 * calls; wrong calls identical except syntactic tokens). A
 * logprob-pruned pool for tool hops would systematically RETAIN the
 * confident errors and KILL the diverse, uncertain candidates — the
 * opposite of what a gate wants. SR-logprob is therefore DETACHED: a
 * legitimate generation accelerator for FREE-CHAT hops only, never a
 * gate, never for tool hops. For free-chat hops, where probability
 * and quality correlate better and where Batch 6's SEP tier already
 * lives, it costs nothing in gate terms because the chat path has no
 * tool gate — but it still does not touch the tool gate's verdict.
 */
const SR_LOGPROB_204 = {
  source: 'Sun et al. §5.3, arXiv:2410.20290v2, Table 2',
  score: 's(Y) = (1/len) ln p(Y|X) — the model\'s own average log-probability',
  needsRewardModel: false,
  correction: 'The naive "SR needs a reward model" objection FAILS for the logprob variant — but the variant selects for probability, the confident-error direction on tool hops',
  paperNumbers: 'SR α=0.5 average PPL 1.554 vs Bo3840 1.698; "speedup" 39.9x vs Bo3840 baseline (relative-GPU-compute accounting, not single-machine latency)',
  confidentErrorDirection: 'Batch 10 FC collapse: mean token probability 0.97 on tool calls; wrong calls identical except syntactic tokens — logprob pruning retains confident errors, kills diverse uncertain candidates',
  detachedScope: { hopKind: 'free-chat', role: 'accelerator' },
  never: ['a gate', 'tool hops'],
};

/**
 * SR's other two independent disqualifications for the live tool gate
 * (Batch 204) — each independent of the quantile objection, which is
 * rule (c) below — plus the mechanism facts they rest on.
 */
const SR_DISQUALIFICATIONS_204 = {
  source: 'Sun et al., arXiv:2410.20290v2 (§4.1–4.2, §6)',
  mechanism: 'Start with a batch so large it would OOM after a few tokens (paper example: effectively Best-of-N with N ~ 5000 on one accelerator), generate until memory pressure, score PARTIAL utterances with a reward model s, cut at the α-th lower quantile of partial rewards (Eq. 4–5: r_cut = q_α, keep the top (1−α)), repeat at each memory boundary until sequences complete. α = 0 reproduces Best-of-N, so SR is a generalization, not a rival. Decision tokens are set by GPU memory capacity, not by generation quality — a hardware schedule wearing a quality rule.',
  partialFinalCorrelation: 'Load-bearing claim (§4.1, Figure 2 + Appendix B Pearson/Kendall, not tabulated in the main text — cited qualitatively, not numerically): partial scores rank roughly like final scores; worked example saves ~85.5% of tokens by cutting below the eventual winner\'s partial score. Paper\'s own limits: ranking is "not always preserved," reward models are trained on full responses, and the ideal cutoff c⋆ (the winner\'s partial score) is unknowable at cut time — the quantile rule is a substitute for it, not an implementation of it.',
  headlineEfficiency: 'With Llama-3-8B + RM-Mistral-7B, SR on one GPU reaches a reward Best-of-N needs 16–32 GPUs to match at similar latency (H100 DGX; baseline Best-of-120 = largest batch fitting one 80GB GPU; BoN doubled 120 → 3840). Win rates vs Bo120 (GPT-4-Turbo judge, Table 1): SR α=0.5 averages WR 66.17 / length-controlled WR 70.01 vs Bo3840\'s 62.89 / 63.04. Qualifications the paper supplies: gain SMALLER for Llama-3-8B-Instruct than base models (instruct models generate shorter responses, fewer rejection rounds — payoff scales with response length, bad news for short tool JSON); "16–32×" is GPU-count arithmetic, not a resident-machine latency claim.',
  disqualifications: [
    'QUANTILE, NOT ABSOLUTE (see rule (c)): the cut kills a fixed fraction α every round whatever the absolute quality — if all candidates are good, α still die; if all are bad, the top (1−α) survive. A gate needs an absolute threshold (Batch 5 τu/τv), not a relative cull.',
    'DESTRUCTIVE PRUNING: a killed candidate is gone — Batch 13\'s abort bar applies in miniature. Early cuts are justified only if partial scores predict final scores, and §6 says partial–final correlation varies prompt-by-prompt and an adaptive α is future work. For tool hops the decision-bearing tokens are the ARGUMENTS, which come late — pruning on a partial score computed before arguments are written is pruning on the function name alone.',
    'NO UNCERTAINTY OUTPUT: SR returns one winner; it does not emit a score usable as F_t, a reliability curve, or an SE estimate. It cannot feed Batch 12\'s TPS, because it destroys the sample whose spread TPS would be scored on. SR accelerates selection; it does not measure uncertainty, and the two jobs must not be conflated.',
  ],
};

/**
 * Slim-SC transfer limits (Batch 204) — why Slim-SC's real savings do
 * not transfer to the live tool gate, stated plainly.
 */
const SLIM_SC_TRANSFER_204 = {
  source: 'Hong et al., arXiv:2509.13990v1 (§2–§3, §5, §5.3, §6)',
  mechanism: 'Step-wise thought pruning for self-consistency: after a warm-up delay (20 analysis steps × 3s intervals in the experiments — the delay exists because chains start by restating the problem, so early thoughts look similar even when later reasoning diverges), each new thought (split by stop words: "Alternatively," "Wait," "Another," etc.) is embedded (all-mpnet-base-v2) and compared by cosine similarity against all other chains\' thoughts in a FAISS index; if max similarity > τ_sim, one chain of the pair is pruned — random choice (RP) or diversity-based (DP: keep the chain with lower internal mean pairwise similarity, Eq. 1). At least one chain always survives. τ_sim > 0.9 in the design, 0.98 optimal in sensitivity analysis (§5.3: accuracy stable for τ_sim ≥ 0.95, peaking at 0.98; delay peaking at 20 steps).',
  results: 'Table 1, three runs averaged; DeepSeek-R1-Distill-Qwen-14B and Qwen-QwQ-32B on GPQA Diamond / AIME-2024 / AQuA-RAT: R1-Distill Slim-SC(DP) cuts SC latency 45% on GPQA, 43% on AIME, 11% on AQuA, tokens 32% on AIME (418k vs 618k), mean KV-cache 46% vs 56%, accuracy maintained or improved (GPQA RP 63.5% vs SC 63.0%; AIME 82.2% = SC). QwQ gains smaller (latency −20% / −8% / −9%). Table 2 ablation (QwQ) proves the principle: global random pruning and least-similar pruning both degrade accuracy (least-similar: AIME 74.4%, ~8pp below Slim-SC) — pruning must target redundancy, not diversity. ESC, the sequential early-stopping rival, is token-frugal but latency-poor (R1-Distill ESC 876s vs Slim-SC(DP) 296s on GPQA) — the Batch 13 lesson in another form.',
  motivationFinding: '§2.4, Figure 2b: at similarity 0.98, most highly-similar pairs are within-category — 45% incorrect–incorrect, 30% correct–correct, only 25% correct–incorrect — and incorrect chains are MORE self-similar than correct ones, increasingly so at higher thresholds. Similarity pruning disproportionately removes redundant INCORRECT chains, cleansing the pool — which is why accuracy can rise while compute falls.',
  transferLimits: [
    '(a) At most ~45% off a still-fatal 3–5× cost: Slim-SC does NOT repeal Batch 5\'s sampling tax. A 5–10× multi-sample cost becomes ~3–5× after Slim-SC, still fatal to Batch 4\'s interactive SLA (p95 1.5–2.0s for short tool hops) on a resident 4B.',
    '(b) Embedder unnecessary for tool calls: the embedder is a second model (mpnet, ~110M — paper claims <2% GPU memory and ~0.3% latency overhead, but measured on a separate GPU in the experiments, so the overhead figure is an estimate, not a resident-machine measurement). For tool calls the embedder is unnecessary anyway: Batch 10\'s normalized-AST distance is strictly better than embedding cosine for tool calls (permutation-invariant, whitespace-insensitive, value-normalized) and free — so the north-star dedup needs no embedder at all.',
    '(c) Thought segmentation does not map to tool hops: a tool call has no "Alternatively/Wait" thoughts; its decision-bearing units are the tool choice and the arguments, which arrive in one short JSON burst, not over a long reasoning chain. There is no warm-up period to exploit and no long tail of redundant chains to prune — the savings Slim-SC finds in 1000-token reasoning chains do not exist in 30-token tool calls.',
    '(d) Models 14B/32B reasoning on STEM, not 4B tool loop: no 4B, no tool loop, no GGUF quant — the usual transfer gap, now sharper: Slim-SC\'s clustering premise (correct and incorrect chains form distinct clusters) was measured on reasoning text, not on tool calls where Batch 10 shows wrong calls collapse onto near-identical samples.',
  ],
  slimScIsNotModeX: 'Slim-SC is NOT ModeX. ModeX selects the modal cluster\'s centroid and discards the rest; Slim-SC prunes WITHIN clusters and keeps one representative per cluster, preserving minority clusters. A minority correct cluster survives Slim-SC and dies under ModeX. The two were conflated in casual "prune by similarity" talk; Batch 204 separates them — see rule (b).',
};

/** The four-rule constraint set for ANY future sampled step (Batch 204). */
const SAMPLED_STEP_RULES_204 = [
  { rule: 'a', name: 'WARM-UP / DELAY RULE', statement: 'No pruning, scoring, or rejection decision before the decision-bearing tokens exist. For tool hops: never prune or score a candidate call before its arguments are written; a partial score on a function name alone is not a gate input.', citations: 'Slim-SC 20-step delay + SR partial-score warning, the same rule in two vocabularies' },
  { rule: 'b', name: 'WITHIN-CLUSTER PRUNING ONLY', statement: 'Prune redundant members within an equivalence cluster (Batch 16 Class 1: same normalized call), keeping one representative per cluster — never select a modal cluster and discard the rest (ModeX, Batch 18).', citations: 'Slim-SC within-cluster safety case for the rule; ModeX mode-collapse limitation against the alternative' },
  { rule: 'c', name: 'ABSOLUTE THRESHOLDS, NOT QUANTILES', statement: 'SR\'s quantile cut (kill fixed fraction α regardless of absolute quality) is rejected as a gate shape. Any pruning rule needs an absolute bar (τu/τv family, Batch 5) or an equivalence test (Batch 16), not a "kill the bottom α" rule.', citations: 'SR Eq. 4–5 quantile cut; Batch 5 τu/τv family; Batch 16 equivalence test' },
  { rule: 'd', name: 'SELECTION ≠ UNCERTAINTY', statement: 'A sampled step that prunes its own sample cannot later report that sample\'s spread. Pruned-pool agreement must never be cited as a confidence signal.', citations: 'SR returns one winner; neither SR nor Slim-SC feeds F_t/TPS (Batch 12) or the multiplicity classifier (Batch 16)' },
];

/**
 * Guard 1 — the closure, enforced. Any live multi-sample gate request
 * for tool hops throws, whatever its spelling (samples > 1, an
 * explicit multiSample flag, or a named multi-sample method).
 * Single-sample live tool hops pass (they are not a multi-sample gate);
 * free-chat requests pass this guard (not its jurisdiction — the
 * SR-logprob scope guard below governs free-chat, and refuses any
 * gate role there too). A request that names SR or Slim-SC as
 * reopening the live gate throws via assertNoGateReopening.
 */
function assertLiveToolGate(request) {
  if (!request || typeof request !== 'object') throw new Error('assertLiveToolGate: request must be an object');
  const live = request.live === true;
  const toolHop = request.hopKind === 'tool' || request.hopKind === 'tool-hop';
  const multi = request.multiSample === true
    || (typeof request.samples === 'number' && request.samples > 1)
    || request.method === 'multi-sample' || request.method === 'best-of-n' || request.method === 'self-consistency';
  if (live && toolHop && multi) {
    throw new Error('assertLiveToolGate: REFUSED — the multi-sample live tool gate stays CLOSED (Batch 204 closure: Batch 5 sampling-tax rule + Batch 10 demotion of multi-sample SE to offline-only for tool hops STAND, now with Sun arXiv:2410.20290v2 + Hong arXiv:2509.13990v1 behind them). No code path may reopen a live multi-sample gate for tool hops — not via SR, not via Slim-SC, not via any other sampled method');
  }
  return { gate: 'closed', live, toolHop, multi, note: 'Single-sample live tool hops are unaffected; free-chat requests are governed by assertSrLogprobScope, which refuses any gate role' };
}

/** Guard: neither SR nor Slim-SC may be presented as reopening the live gate. */
function assertNoGateReopening(paper, claim) {
  const known = ['speculative-rejection', 'sr', 'slim-sc', 'slimsc'];
  if (typeof paper === 'string' && known.includes(paper.toLowerCase()) && claim === 'reopens-live-gate') {
    throw new Error(`assertNoGateReopening: REFUSED — ${paper} does NOT reopen the multi-sample live gate (Batch 204 verdict). SR-logprob selects for probability (the confident-error direction on tool hops); Slim-SC cuts at most ~45% off a still-fatal 3–5× cost on a task shape the tool gate does not have`);
  }
  return { paper, claim, reopening: false };
}

/**
 * Guard 2 — SR-logprob detachment, enforced. Allowed: exactly one
 * scope — free-chat hops, accelerator role. Tool hops throw (the
 * confident-error direction: Batch 10 FC collapse, mean token
 * probability 0.97, wrong calls identical except syntactic tokens).
 * Any gate role throws (SR-logprob is never a gate, on any hop).
 * Unknown scopes throw rather than silently passing.
 */
function assertSrLogprobScope(use) {
  if (!use || typeof use !== 'object') throw new Error('assertSrLogprobScope: use must be an object { hopKind, role }');
  if (use.role === 'gate' || use.role === 'tool-gate' || use.role === 'gate-input') {
    throw new Error('assertSrLogprobScope: REFUSED — SR-logprob is DETACHED: a legitimate generation accelerator for FREE-CHAT hops only, never a gate (Batch 204). SR returns one winner and feeds no F_t/TPS; it accelerates selection, it does not measure uncertainty');
  }
  if (use.hopKind === 'tool' || use.hopKind === 'tool-hop') {
    throw new Error('assertSrLogprobScope: REFUSED — SR-logprob is never for tool hops (Batch 204). It maximizes probability, i.e. keeps the most probable completions — and Batch 10\'s FC collapse shows the most probable tool candidates are the confidently-wrong ones (mean token probability 0.97; wrong calls identical except syntactic tokens). A logprob-pruned tool pool retains confident errors and kills diverse, uncertain candidates');
  }
  if (use.hopKind !== 'free-chat' || use.role !== 'accelerator') {
    throw new Error(`assertSrLogprobScope: unknown SR-logprob scope hopKind="${use.hopKind}" role="${use.role}" — the only allowed scope is free-chat hops as an accelerator (Batch 204)`);
  }
  return { scope: 'free-chat accelerator', needsRewardModel: false, score: SR_LOGPROB_204.score, note: 'Free-chat only; never a gate; never for tool hops; does not touch the tool gate\'s verdict' };
}

/**
 * Guard 3a — WARM-UP / DELAY RULE. step: { action, argsWritten }.
 * action in { prune, score, reject } before the arguments are written
 * throws: the decision-bearing tokens do not exist yet. A partial
 * score on a function name alone is refused as a gate input by
 * assertGateInputNotPartialScore below. Non-decision actions
 * (observe, log) pass; a decision after arguments are written passes.
 */
function assertWarmUpDelay(step) {
  if (!step || typeof step !== 'object') throw new Error('assertWarmUpDelay: step must be an object { action, argsWritten }');
  const decision = ['prune', 'score', 'reject', 'pruning', 'scoring', 'rejection'].includes(step.action);
  if (decision && step.argsWritten !== true) {
    throw new Error(`assertWarmUpDelay: REFUSED — no ${step.action} decision before the decision-bearing tokens exist (Batch 204 rule (a)). For tool hops: never prune or score a candidate call before its arguments are written; the arguments come late, and a decision now is a decision on the function name alone`);
  }
  return { delayOk: true, action: step.action, argsWritten: step.argsWritten === true };
}

/** Guard 3a (companion): a partial score on a function name alone is not a gate input. */
function assertGateInputNotPartialScore(input) {
  if (!input || typeof input !== 'object') throw new Error('assertGateInputNotPartialScore: input must be an object');
  if (input.partialBeforeArgs === true || input.basis === 'function-name-only' || input.argsWritten === false) {
    throw new Error('assertGateInputNotPartialScore: REFUSED — a partial score on a function name alone is not a gate input (Batch 204 rule (a)). SR\'s early cuts are justified only if partial scores predict final scores, and §6 says that correlation varies prompt-by-prompt; for tool hops the decision-bearing tokens are the arguments, which come late');
  }
  return { gateInputOk: true };
}

/**
 * Guard 3b — WITHIN-CLUSTER PRUNING ONLY. prune: { shape }.
 * shape 'mode-select' (select a modal cluster, discard the rest —
 * ModeX, Batch 18) throws. shape 'within-cluster' passes. The pure
 * helper withinClusterPrune implements the allowed shape: one
 * representative per equivalence cluster, minority clusters survive.
 */
function assertWithinClusterPrune(prune) {
  if (!prune || typeof prune !== 'object') throw new Error('assertWithinClusterPrune: prune must be an object { shape }');
  if (prune.shape === 'mode-select' || prune.shape === 'modal' || prune.selectModalCluster === true || prune.discardNonModalClusters === true) {
    throw new Error('assertWithinClusterPrune: REFUSED — a mode-selecting prune (select the modal cluster, discard the rest — ModeX, Batch 18) must throw (Batch 204 rule (b)). Prune redundant members WITHIN an equivalence cluster (Batch 16 Class 1: same normalized call), keeping one representative per cluster; a minority correct cluster survives Slim-SC-style pruning and dies under ModeX');
  }
  if (prune.shape !== 'within-cluster') throw new Error(`assertWithinClusterPrune: unknown prune shape "${prune.shape}" — only "within-cluster" is allowed (Batch 204 rule (b))`);
  return { pruneOk: true, shape: 'within-cluster' };
}

/**
 * Within-cluster prune, implemented (Batch 204 rule (b)): clusters is
 * an array of equivalence clusters (each an array of candidate ids,
 * Batch 16 Class 1: same normalized call). Keeps the first member of
 * every cluster — including every minority cluster — and prunes the
 * rest. Never selects a modal cluster: cluster size plays no role in
 * survival. A mode-selecting call to this helper is a caller error;
 * use assertWithinClusterPrune to police prune specs.
 */
function withinClusterPrune(clusters) {
  if (!Array.isArray(clusters)) throw new Error('withinClusterPrune: clusters must be an array of equivalence clusters');
  const kept = [];
  const pruned = [];
  for (const cluster of clusters) {
    if (!Array.isArray(cluster) || cluster.length === 0) continue;
    kept.push(cluster[0]);
    pruned.push(...cluster.slice(1));
  }
  return { kept, pruned, clustersKept: kept.length, note: 'One representative per cluster, minority clusters included — never a modal selection (Batch 204 rule (b))' };
}

/**
 * Guard 3c — ABSOLUTE THRESHOLDS, NOT QUANTILES. rule: { shape }.
 * shape 'quantile', or any kill-the-bottom-α spelling (killFraction,
 * alpha, bottomFraction), throws: SR's quantile cut kills a fixed
 * fraction every round whatever the absolute quality. Allowed shapes:
 * 'absolute' (a τu/τv-family bar, Batch 5) and 'equivalence' (a Batch
 * 16 equivalence test). An absolute rule must name its bar; a rule
 * with neither bar nor equivalence test throws as underspecified.
 */
function assertAbsoluteThreshold(rule) {
  if (!rule || typeof rule !== 'object') throw new Error('assertAbsoluteThreshold: rule must be an object { shape }');
  if (rule.shape === 'quantile' || rule.killFraction !== undefined || rule.killBottomAlpha === true || rule.alpha !== undefined || rule.bottomFraction !== undefined) {
    throw new Error('assertAbsoluteThreshold: REFUSED — SR\'s quantile cut is rejected as a gate shape (Batch 204 rule (c)). It kills a fixed fraction α regardless of absolute quality: if all candidates are good, α still die; if all are bad, the top (1−α) survive. Any pruning rule needs an absolute bar (τu/τv family, Batch 5) or an equivalence test (Batch 16), not a "kill the bottom α" rule');
  }
  if (rule.shape === 'absolute') {
    if (rule.bar === undefined && rule.tau === undefined && rule.threshold === undefined) {
      throw new Error('assertAbsoluteThreshold: an absolute pruning rule must name its bar (τu/τv family, Batch 5) — a bar-less "absolute" rule is underspecified');
    }
    return { thresholdOk: true, shape: 'absolute' };
  }
  if (rule.shape === 'equivalence') return { thresholdOk: true, shape: 'equivalence' };
  throw new Error(`assertAbsoluteThreshold: unknown pruning-rule shape "${rule.shape}" — only "absolute" (τu/τv family) or "equivalence" (Batch 16) are allowed (Batch 204 rule (c))`);
}

/**
 * Guard 3d — SELECTION ≠ UNCERTAINTY. source: { poolPruned, signal }.
 * Deriving F_t, TPS, multiplicity, agreement, or any confidence
 * signal from a pruned pool throws: a sampled step that prunes its
 * own sample cannot later report that sample's spread. SR returns one
 * winner; neither SR nor Slim-SC feeds F_t/TPS or the multiplicity
 * classifier. Unpruned-pool signals pass (they are a different claim,
 * policed by their own rules, not by this guard).
 */
function assertConfidenceNotFromPrunedPool(source) {
  if (!source || typeof source !== 'object') throw new Error('assertConfidenceNotFromPrunedPool: source must be an object { poolPruned, signal }');
  const signals = ['F_t', 'TPS', 'multiplicity', 'confidence', 'agreement', 'spread', 'uncertainty'];
  if (source.poolPruned === true && signals.includes(source.signal)) {
    throw new Error(`assertConfidenceNotFromPrunedPool: REFUSED — pruned-pool "${source.signal}" must never be cited as a confidence signal (Batch 204 rule (d)). A sampled step that prunes its own sample cannot later report that sample's spread: SR destroys the sample whose spread TPS would be scored on, and a cleaned pool's agreement is selection, not uncertainty`);
  }
  return { confidenceSourceOk: true, poolPruned: source.poolPruned === true, signal: source.signal };
}

/**
 * Composite guard for ANY future sampled step (Batch 204): offline
 * bootstrap, disputed-hop tier, or Healy-gate sampling arms. step:
 * { argsWritten, action, prune, thresholdRule, confidenceSource }.
 * Each rule is enforced by its own guard, in rule order; the first
 * violation throws. A step that passes all four still needs its own
 * tier's gates (Batch 5 sampling tax, Batch 197 pilot order, Batch 4
 * verifier) — this composite constrains the sampled step's shape, it
 * does not authorize the step.
 */
function assertSampledStep(step) {
  if (!step || typeof step !== 'object') throw new Error('assertSampledStep: step must be an object');
  assertWarmUpDelay({ action: step.action, argsWritten: step.argsWritten });
  if (step.gateInput !== undefined) assertGateInputNotPartialScore(step.gateInput);
  if (step.prune !== undefined) assertWithinClusterPrune(step.prune);
  if (step.thresholdRule !== undefined) assertAbsoluteThreshold(step.thresholdRule);
  if (step.confidenceSource !== undefined) assertConfidenceNotFromPrunedPool(step.confidenceSource);
  return { sampledStepOk: true, rules: ['a warm-up/delay', 'b within-cluster only', 'c absolute thresholds', 'd selection ≠ uncertainty'], note: 'Passing this composite constrains the step\'s shape only — it does not authorize the step (Batch 5 tax, Batch 197 pilot order, Batch 4 verifier still apply)' };
}

/**
 * Parked free-chat test shape (Batch 204) — recorded as a PARKED NOTE
 * ONLY. It is NOT built as a live path, and it must never run on tool
 * hops. If ever run: SR-logprob vs single greedy on free-chat hops,
 * measured on latency + person-accepted quality, NOT on perplexity
 * alone (PPL is the objective, so a PPL win is circular).
 */
const PARKED_FREE_CHAT_SR_TEST_204 = {
  status: 'PARKED — note only, not a live path, not built',
  comparison: 'SR-logprob vs single greedy on free-chat hops',
  measures: ['latency', 'person-accepted quality'],
  neverMeasureAlone: 'perplexity — PPL is the objective, so a PPL win is circular',
  neverOn: 'tool hops',
  reasonParked: 'Free-chat is where probability correlates with quality better than on tool calls and where the chat path has no tool gate; the tool gate\'s verdict is untouched either way',
};

function assertParkedFreeChatSrTest(scope) {
  if (!scope || typeof scope !== 'object') throw new Error('assertParkedFreeChatSrTest: scope must be an object');
  if (scope.hopKind === 'tool' || scope.hopKind === 'tool-hop') {
    throw new Error('assertParkedFreeChatSrTest: REFUSED — the parked SR-logprob test must never run on tool hops (Batch 204). Free-chat hops only, and only if ever un-parked');
  }
  if (scope.livePath === true) {
    throw new Error('assertParkedFreeChatSrTest: REFUSED — the free-chat SR-logprob test shape is a PARKED NOTE only (Batch 204). It is not built as a live path');
  }
  return { parked: true, shape: PARKED_FREE_CHAT_SR_TEST_204.comparison, measures: PARKED_FREE_CHAT_SR_TEST_204.measures };
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
  // Batch 197: advisory-hint test design (pre-registered, unexecuted).
  ADVISORY_TEST_ARMS,
  ADVISORY_HINT_TEMPLATE,
  advisoryHintText,
  assertVerbatimHint,
  RECOMMENDATION_SOURCES,
  assertRecommendationSource,
  advisoryArmSpec,
  SAMPLE_TIERS,
  tierForN,
  checkClaim,
  mcnemarReport,
  scoreCall,
  scoreArm,
  scoreArms,
  assertTaskSet,
  assertPairingControls,
  abortCheck,
  assertPilotPassed,
  assertMultiTurnOrder,
  assertMultiTurnGate,
  multiTurnVerdict,
  // Batch 194: Chen advisory-only Select constraint.
  SELECT_ADVISORY_ONLY_GUARDRAIL,
  EAGER_ATTENTION_DEPLOYMENT_CONSTRAINT,
  CHEN_194_FINDINGS,
  advisoryHint,
  assertAdvisoryOnlySelect,
  selectAdvisory,
  assertSingleHopScope,
  selectorServingPath,
  chooseDisputedHopTier,
  wrongToolBudgetAllows,
  // Batch 199: Wu + Wang disentanglement, tier re-order, capture convergence (spec, unexecuted).
  CHEN_ORACLE_LEVER,
  WU_STEERING,
  ASA_QUARANTINE,
  RESIDUAL_LEVERS,
  leverGate,
  assertSwitchRateQuote,
  firstTokenOf,
  firstTokenSeparable,
  assertSteeringPair,
  toolVectorArtifact,
  assertToolVectorBase,
  assertSteeredCallVerified,
  wuLoopClaim,
  WU_GAP,
  assertGapThreshold,
  assertGapUse,
  gapDetectorStatus,
  gapReading,
  BATCH_194_RESIDUAL_FRAMING,
  DISPUTED_HOP_TIERS_199,
  canonicalTierOrder,
  assertTierOrder,
  CAPTURE_CONVERGENCE,
  captureElementBound,
  captureCopies,
  assertCapturePath,
  // Batch 201: Healy detector slotting correction, timeline, confirmation-tier gate (spec, unexecuted).
  DETECTOR_TIMELINE_201,
  detectorTimeline,
  assertTimelineOrder,
  assertHealyNotPreGeneration,
  HEALY_201,
  healyHallucinationClass,
  assertHealyQuote,
  HEALY_CONFIRMATION_JUSTIFICATION,
  healyGatePolicy,
  assertHealyBypassClaim,
  healyClassifierArtifact,
  assertHealyArtifactBase,
  assertExecutionRequiresVerifier,
  assertHealyNotPilotArm,
  assertHealyNotSteering,
  ASA_RECHECK_201,
  assertAsaQuarantineStands,
  WU_HEALY_CITATION_201,
  assertWuHealyCitation,
  // Batch 204: SR + Slim-SC gate-spec pruning rules (spec, unexecuted).
  MULTI_SAMPLE_LIVE_GATE_CLOSURE_204,
  SR_LOGPROB_204,
  SR_DISQUALIFICATIONS_204,
  SLIM_SC_TRANSFER_204,
  SAMPLED_STEP_RULES_204,
  assertLiveToolGate,
  assertNoGateReopening,
  assertSrLogprobScope,
  assertWarmUpDelay,
  assertGateInputNotPartialScore,
  assertWithinClusterPrune,
  withinClusterPrune,
  assertAbsoluteThreshold,
  assertConfidenceNotFromPrunedPool,
  assertSampledStep,
  PARKED_FREE_CHAT_SR_TEST_204,
  assertParkedFreeChatSrTest,
};
