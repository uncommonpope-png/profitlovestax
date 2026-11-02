'use strict';
/**
 * Provenance emission + per-result-source render classification.
 *
 * Source spec: north-star research batches 134-142 and 149 (see README.md
 * for the batch-by-batch mapping). Node.js, CommonJS, zero dependencies.
 *
 * Two ideas, kept separate on purpose:
 *  1. EMISSION: a tool result carries its provenance in ONE namespaced
 *     `_meta` key, `io.github.uncommonpope-png/provenance`, holding a
 *     versioned object with one sub-object per emitter. Bare top-level
 *     `_meta` keys (e.g. `obsidianBaseUrlHost`) are rejected, not emitted.
 *  2. CLASSIFICATION: a renderer styles a result by its ultimate SOURCE
 *     (own-box / own-account / stranger / system), never by its tool name.
 *     The tool name is only a routing hint; the per-tool ultimate-source
 *     table decides for known tools, and unknown tools default to stranger.
 *
 * Honest limit (stated in full in README.md): the server-side emission
 * (Obsidian wrapper) and the bridge read are specified here as the
 * attach/read functions. The LIVE WIRE OBSERVATION of `exec.result._meta`
 * on the PC tree has NOT been done and is still owed. Nothing here proves
 * the PC path works.
 */

const PROVENANCE_KEY = 'io.github.uncommonpope-png/provenance';
const PROVENANCE_VERSION = 1;

// Bare top-level _meta keys that Batch 149 REJECTS. These must never be
// emitted. (The same words nested *inside* an emitter sub-object, e.g.
// provenance.obsidian.baseUrlHost, are fine: they are not _meta keys.)
const REJECTED_BARE_KEYS = ['obsidianBaseUrlHost', 'obsidianBaseUrlSource'];

// Render classes. `own-box` means "the person's own data, on this box";
// `own-account` means "the person's own data, reached remotely, so the
// classifier can show 'the person's' but cannot show 'on this box'".
const CLASSES = ['own-box', 'own-account', 'stranger', 'system'];

// ---------------------------------------------------------------------------
// Host helpers (Batch 137: loopback set is 127.0.0.0/8, ::1, "localhost").
// 0.0.0.0, private-LAN addresses and .local names are NOT loopback: a LAN
// address to another device is not the box, and 0.0.0.0 is a bind-all
// address, not a proven loopback. A future proven same-box LAN host would
// be a new allowlist entry with proof, not a widening of this set.
// ---------------------------------------------------------------------------

function stripBrackets(host) {
  return String(host).startsWith('[')
    ? String(host).replace(/^\[(.*)\].*$/, '$1')
    : String(host);
}

function hostFromValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const raw = String(value).trim();
  // A bare host (possibly with a port), e.g. "127.0.0.1:27123" or "[::1]:27123".
  // A full URL is parsed with URL; anything else is treated as host[:port].
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) {
    try {
      return new URL(raw).hostname;
    } catch {
      return null;
    }
  }
  if (raw.startsWith('[')) {
    // Bracketed IPv6, e.g. "[::1]:27123" — the brackets delimit the host,
    // so do NOT split on ':' (that would shred the address itself).
    const inner = stripBrackets(raw);
    return inner || null;
  }
  const noPort = raw.split(':')[0];
  return noPort || null;
}

function isLoopbackHost(value) {
  const host = hostFromValue(value);
  if (host === null) return false;
  const lower = host.toLowerCase();
  if (lower === 'localhost' || lower === '::1') return true;
  // 127.0.0.0/8: first octet 127, remaining octets numeric.
  const parts = lower.split('.');
  return (
    parts.length === 4 &&
    parts[0] === '127' &&
    parts.slice(1).every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)
  );
}

// ---------------------------------------------------------------------------
// Emission: build / attach / read provenance (Batches 138, 139, 141, 142, 149)
// ---------------------------------------------------------------------------

function assertPlainObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`provenance: ${name} must be a plain object`);
  }
}

/**
 * Build the _meta value for one emitter.
 *
 * Returns the _meta object itself:
 *   { 'io.github.uncommonpope-png/provenance': { version: 1, [emitter]: {...fields} } }
 *
 * Throws on bare-key-shaped input: any field named `obsidianBaseUrlHost`
 * or `obsidianBaseUrlSource` at this level, or a field that IS the
 * namespaced key. Those belong inside an emitter sub-object (or not at
 * all as top-level _meta keys), never as sibling _meta keys.
 *
 * Example (the Batch 138/139 Obsidian wrapper shape, namespaced per 149):
 *   buildProvenance('obsidian', { baseUrlHost: '127.0.0.1', baseUrlSource: 'global' })
 */
function buildProvenance(emitter, fields) {
  if (typeof emitter !== 'string' || emitter.trim() === '') {
    throw new Error('provenance: emitter must be a non-empty string');
  }
  assertPlainObject(fields, 'fields');
  for (const key of Object.keys(fields)) {
    if (REJECTED_BARE_KEYS.includes(key)) {
      throw new Error(
        `provenance: bare _meta key "${key}" is rejected (Batch 149); ` +
          `put host/source inside the "${PROVENANCE_KEY}" object under an emitter sub-object, ` +
          `e.g. buildProvenance('obsidian', { baseUrlHost, baseUrlSource })`
      );
    }
    if (key === PROVENANCE_KEY) {
      throw new Error(
        `provenance: fields must not contain the namespaced key itself; ` +
          `buildProvenance wraps fields under "${PROVENANCE_KEY}"`
      );
    }
  }
  return {
    [PROVENANCE_KEY]: {
      version: PROVENANCE_VERSION,
      [emitter]: { ...fields },
    },
  };
}

/** Read the inner provenance object back out of a _meta object (or null). */
function readProvenance(meta) {
  if (meta === null || typeof meta !== 'object') return null;
  const inner = meta[PROVENANCE_KEY];
  if (inner === null || typeof inner !== 'object' || Array.isArray(inner)) return null;
  return inner;
}

/** Bridge-side read (Batch 139): read provenance off a tools/call result. */
function readProvenanceFromResult(result) {
  if (result === null || typeof result !== 'object') return null;
  return readProvenance(result._meta);
}

function assertSingleNamespacedKey(meta) {
  assertPlainObject(meta, 'provenance');
  const keys = Object.keys(meta);
  if (keys.length !== 1 || keys[0] !== PROVENANCE_KEY) {
    throw new Error(
      `provenance: attachProvenance expects exactly one key, "${PROVENANCE_KEY}" ` +
        `(got: ${keys.length ? keys.join(', ') : '(none)'}); bare _meta keys are rejected (Batch 149)`
    );
  }
}

/**
 * Attach provenance to a result object, returning a NEW object that keeps
 * every original field (including `content` and `isError`).
 *
 * Batches 141-142: a RETURNED result with `isError: true` KEEPS its _meta
 * (isError results are exempt from output-schema validation in MCP TS SDK
 * v1.29.0), so error results get _meta exactly like success results. Do
 * NOT use this for thrown errors — see provenanceFromThrown.
 */
function attachProvenance(result, provenance) {
  if (result === null || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('provenance: result must be an object');
  }
  assertSingleNamespacedKey(provenance);
  return {
    ...result,
    _meta: { ...(result._meta || {}), ...provenance },
  };
}

/**
 * The thrown-error path (Batches 141-142).
 *
 * A THROWN error loses _meta entirely: the SDK handler rebuilds the error
 * result without _meta. So the wrapper must RETURN the error with _meta
 * attached (catch branch and scope-denied branch) instead of throwing it.
 *
 * This function therefore does NOT produce anything attachable as _meta.
 * It produces an explicit sidecar record stating host-unknown, for the
 * caller to store BESIDE the result (log, provenance record, render note)
 * — never inside `result._meta`, because pretending a thrown error carried
 * _meta would be a lie about the wire shape.
 */
function provenanceFromThrown(error, context) {
  const ctx = context && typeof context === 'object' ? context : {};
  return {
    _meta: null,
    hostUnknown: true,
    host: null,
    thrown: true,
    reason:
      'Thrown errors lose _meta by SDK construction (the handler rebuilds ' +
      'the error result without _meta). Host is explicitly unknown; return ' +
      'the error with _meta attached instead of throwing (Batches 141-142).',
    errorName: error && error.name ? String(error.name) : null,
    errorMessage: error && error.message ? String(error.message) : null,
    toolName: ctx.toolName !== undefined ? String(ctx.toolName) : null,
  };
}

// ---------------------------------------------------------------------------
// Per-tool ultimate-source table (Batch 136, amended Batch 137)
// ---------------------------------------------------------------------------
// Per-server classification does NOT work on this bridge: the bridge talks
// to exactly one MCP server, and its result path records tool + ok only, no
// server field. So the table is per TOOL, by ultimate source — whose data,
// served by whose process — never by hop locality (the bridge's own hop to
// 127.0.0.1:20128 proves hop-locality alone never decides it).

function toolFamily(toolName) {
  if (typeof toolName !== 'string') return '';
  return toolName.replace(/^omni\./, '');
}

function isObsidianSyncTool(toolName) {
  // Loopback by construction (Batch 137): sync handlers pass NO baseUrl,
  // so the client always uses the hardcoded 127.0.0.1:27781 default.
  return /^obsidian_sync_(status|trigger|conflicts|resolve_conflict)$/.test(toolFamily(toolName));
}

function isObsidianTool(toolName) {
  return toolFamily(toolName).startsWith('obsidian_');
}

function isNotionTool(toolName) {
  return toolFamily(toolName).startsWith('notion_');
}

function isOwnBoxFamilyTool(toolName) {
  const name = toolFamily(toolName);
  return (
    name.startsWith('local_corpus_') ||
    name.startsWith('omniroute_memory_') ||
    name === 'omniroute_memory_search'
  );
}

function isSystemTool(toolName) {
  // Product speech/config, not content (Batch 136): oneproxy_fetch fetches
  // the proxy INVENTORY list, not a URL's content. A "fetch" in the name
  // must not misclassify it as stranger content.
  return toolFamily(toolName).startsWith('oneproxy_');
}

function isWebSearchTool(toolName) {
  const name = toolFamily(toolName);
  return name === 'web_search' || name === 'omniroute_web_search';
}

function isFetchTool(toolName) {
  const name = toolFamily(toolName);
  return name === 'web_fetch' || name === 'fetch' || name === 'browse';
}

// ---------------------------------------------------------------------------
// Own-box path check (Batch 135)
// ---------------------------------------------------------------------------
// The set is read from the gate at runtime — the caller supplies the roots
// (REPO_ROOT as resolved at runtime + the two Desktop roots). This module
// deliberately does NOT hardcode them: if the product moves REPO_ROOT, the
// set must move with it automatically. The check is lexical (path prefix),
// matching the loop gate, which checks path.resolve, NOT realpath — so a
// symlink inside a root pointing outside passes. "Own-box" here therefore
// means "passed the loop's prefix gate", NOT "provably on-box" (the gate's
// symlink gap is a product hardening note, not a classifier fix).

function normalizePosix(path) {
  return String(path).replace(/\\/g, '/').replace(/\/+$/, '');
}

function isUnderRoots(sourcePath, roots) {
  if (!sourcePath || !Array.isArray(roots) || roots.length === 0) return false;
  const target = normalizePosix(sourcePath);
  return roots.some((root) => {
    const r = normalizePosix(root);
    return target === r || target.startsWith(r + '/');
  });
}

// ---------------------------------------------------------------------------
// Classification (Batches 134-137)
// ---------------------------------------------------------------------------
// Signal order, strongest first:
//  0. System strings (Batch 135): DENIED / ERROR / confirmation strings
//     are product speech, not content — they render as system whatever
//     tool produced them.
//  1. Per-tool ultimate-source table (Batch 136) for known tools.
//  2. Call-time evidence for the tools whose class varies: Obsidian host
//     at call time (Batch 137), fetch URL (Batch 135 localhost rule), file
//     path under the gate roots (Batch 135), shell allowlist (Batch 135).
//  3. Unknown tool -> stranger (Batch 134 default; Batch 19 serialize-on-
//     unknown, applied to rendering).
//
// Provenance is captured BEFORE any slicing (Batch 134): classify the full
// result, then slice. See classifyThenSlice. Never classify a slice — the
// runOne label already truncates the provenance argument to 200 chars.

function resolveObsidianHost(options) {
  // Host at call time, from the strongest available evidence:
  //  (a) an explicit hostAtCallTime argument (the wrapper's own value);
  //  (b) the namespaced provenance emission on the result (bridge read);
  //  (c) nothing -> unknown.
  if (options.hostAtCallTime !== undefined && options.hostAtCallTime !== null && options.hostAtCallTime !== '') {
    return { host: hostFromValue(options.hostAtCallTime), source: 'call-time argument', malformed: false };
  }
  const provenance = options.provenance || (options.result ? readProvenanceFromResult(options.result) : null);
  if (provenance) {
    const obsidian = provenance.obsidian;
    if (obsidian && typeof obsidian === 'object') {
      if (obsidian.baseUrlHost !== undefined && obsidian.baseUrlHost !== null && obsidian.baseUrlHost !== '') {
        return {
          host: hostFromValue(obsidian.baseUrlHost),
          source: obsidian.baseUrlSource ? `emission (${obsidian.baseUrlSource})` : 'emission',
          malformed: false,
        };
      }
      // Present-but-hostless emission = malformed, treated as unknown
      // (Batch 149 tail note), never silently assumed.
      return { host: null, source: null, malformed: true };
    }
    // Emission present but no obsidian emitter: no host evidence for this tool.
    return { host: null, source: null, malformed: false };
  }
  return { host: null, source: null, malformed: false };
}

function classifyResult(options) {
  const opts = options && typeof options === 'object' ? options : {};
  const toolName = typeof opts.toolName === 'string' ? opts.toolName : null;
  const name = toolFamily(toolName);

  const base = {
    toolName,
    sourceClass: null,
    // Echoes for the renderer / audit trail. recordedUrl is ALWAYS the
    // final URL when one exists (Batch 135 redirect rule).
    recordedUrl: opts.finalUrl || opts.sourceUrl || null,
    sourceUrl: opts.sourceUrl || null,
    finalUrl: opts.finalUrl || null,
    hostUnknown: false,
    assumption: null,
    redirectToLocalhost: false,
    unknownTool: false,
    malformedProvenance: false,
    reason: null,
  };

  // 0. System strings win over every tool table: a DENIED / ERROR /
  //    confirmation string is product speech, not the tool's content.
  const denied = opts.denied === true || opts.denied === 'true';
  const hasErrorText =
    (typeof opts.errorText === 'string' && opts.errorText.trim() !== '') ||
    opts.isError === true;
  const confirmation = opts.confirmation === true;
  if (denied || hasErrorText || confirmation) {
    return {
      ...base,
      sourceClass: 'system',
      reason: denied
        ? 'DENIED string: the gate refused, so no content was returned'
        : hasErrorText
          ? 'ERROR result: product error speech, not tool content'
          : 'Confirmation string (e.g. WRITTEN: ...): product speech, not content',
    };
  }

  // 1a. System/config tool family (oneproxy_*): product speech, not content.
  if (toolName && isSystemTool(toolName)) {
    return { ...base, sourceClass: 'system', reason: 'oneproxy_* returns product config/inventory, not fetched content (Batch 136)' };
  }

  // 1b. Obsidian sync tools: own-box by construction, no host check needed.
  if (toolName && isObsidianSyncTool(toolName)) {
    return { ...base, sourceClass: 'own-box', reason: 'obsidian_sync_* uses the hardcoded loopback sync default by construction (Batch 137)' };
  }

  // 1c. Obsidian non-sync tools: class varies with the host AT CALL TIME.
  if (toolName && isObsidianTool(toolName)) {
    const resolved = resolveObsidianHost(opts);
    if (resolved.malformed) {
      return {
        ...base,
        sourceClass: 'own-box',
        hostUnknown: true,
        malformedProvenance: true,
        assumption: 'host unknown, default loopback assumed',
        reason: 'Emission present but hostless (malformed); treated as unknown host, default loopback assumed, flagged — never a silent own-box mark (Batches 137-138, 149)',
      };
    }
    if (resolved.host === null) {
      // Interim rendering (Batch 138): until the server-side emission
      // lands, obsidian_* provenance is honestly this, rendered as a
      // deferred field, never as a silent own-box mark.
      return {
        ...base,
        sourceClass: 'own-box',
        hostUnknown: true,
        assumption: 'host unknown, default loopback assumed',
        reason: 'No host evidence at call time (pre-emission result); default loopback assumed and flagged (Batches 137-138)',
      };
    }
    if (isLoopbackHost(resolved.host)) {
      return { ...base, sourceClass: 'own-box', reason: `Obsidian baseUrl host at call time is loopback (${resolved.host}); serving process is the person's own Obsidian app (Batch 137)` };
    }
    return { ...base, sourceClass: 'own-account', reason: `Obsidian baseUrl host at call time is non-loopback (${resolved.host}); the person's own vault reached remotely (Batch 137)` };
  }

  // 1d. Own-account family: remote first-party-account data (Batch 136/137).
  // Notion has no loopback form (hardcoded https://api.notion.com/v1), so
  // its class never varies with host.
  if (toolName && isNotionTool(toolName)) {
    return { ...base, sourceClass: 'own-account', reason: 'notion_* is the person\'s own workspace hosted remotely, not files on the box (Batches 136-137)' };
  }

  // 1e. Own-box families: local corpus + stored memory.
  if (toolName && isOwnBoxFamilyTool(toolName)) {
    return { ...base, sourceClass: 'own-box', reason: 'local_corpus_* / omniroute_memory_* return the person\'s own local stores (Batch 136)' };
  }

  // 1f. Web search: stranger by ultimate source, whatever loop carried it.
  if (toolName && isWebSearchTool(toolName)) {
    return { ...base, sourceClass: 'stranger', reason: 'web_search returns stranger content by ultimate source (Batch 136)' };
  }

  // 2a. Fetch/browse tools: the URL selects the data (Batch 134), and the
  // FINAL url is what gets recorded (Batch 135). Loopback alone never
  // upgrades a fetch to own-box — the serving process decides, and this
  // classifier cannot see it from the URL. Two cases:
  //  - Redirect-to-localhost (public sourceUrl, loopback finalUrl): the
  //    LAN-deny bypass case. Record the final URL, keep stranger, flag it.
  //  - Loopback fetch with no own-app serving evidence: the local loop's
  //    LAN deny renders this as a DENIED system string; if the caller did
  //    not pass denied=true, stranger is the safe class (never own-box
  //    on URL host alone).
  if (toolName && isFetchTool(toolName)) {
    const sourceHost = opts.sourceUrl ? hostFromValue(opts.sourceUrl) : null;
    const finalHost = opts.finalUrl ? hostFromValue(opts.finalUrl) : null;
    if (sourceHost && finalHost && !isLoopbackHost(sourceHost) && isLoopbackHost(finalHost)) {
      return {
        ...base,
        sourceClass: 'stranger',
        redirectToLocalhost: true,
        reason: 'Fetch redirected from a public URL to loopback (LAN-deny bypass, Batch 135): final URL recorded, class NOT upgraded to own-box on host alone — the serving process is unproven',
      };
    }
    if (opts.servingProcess === 'obsidian' || opts.servingProcess === 'own-app') {
      return { ...base, sourceClass: 'own-box', reason: 'Loopback fetch served by the person\'s own app process (Batch 135 serving-process rule)' };
    }
    return { ...base, sourceClass: 'stranger', reason: 'Fetch of a URL returns stranger content unless the serving process proves it is the person\'s own app (Batch 135)' };
  }

  // 2b. File reads: own-box iff under the gate roots supplied at runtime.
  if (opts.sourcePath !== undefined && opts.sourcePath !== null && opts.sourcePath !== '') {
    if (Array.isArray(opts.ownBoxRoots) && opts.ownBoxRoots.length > 0) {
      if (isUnderRoots(opts.sourcePath, opts.ownBoxRoots)) {
        return { ...base, sourceClass: 'own-box', reason: 'File path passes the loop gate roots supplied at runtime (Batch 135; lexical prefix, see symlink qualifier)' };
      }
      return { ...base, sourceClass: 'stranger', sourcePath: opts.sourcePath, reason: 'File path is outside the gate roots supplied at runtime; not own-box content' };
    }
    // No roots supplied: no gate evidence, so no own-box claim.
    return { ...base, sourceClass: 'stranger', sourcePath: opts.sourcePath, reason: 'No own-box roots supplied at runtime, so no own-box claim can be made (Batch 135: set is read from the gate, never hardcoded)' };
  }

  // 2c. Shell: the local loop has no general shell — only the allowlist is
  // own-box by construction; arsenal shell is stranger by origin (Batch
  // 135). Allowlist membership is caller-attested (the caller knows which
  // loop ran the command); a command carrying network/fetch verbs is
  // stranger regardless of attestation (Batch 134: a shell that curls,
  // downloads, or cats a downloaded file is stranger content).
  if (typeof opts.shellCommand === 'string' && opts.shellCommand !== '') {
    const cmd = opts.shellCommand;
    if (/\b(curl|wget|fetch|Invoke-WebRequest|Invoke-RestMethod)\b/i.test(cmd)) {
      return { ...base, sourceClass: 'stranger', reason: 'Shell command carries a network/fetch verb: stranger content whatever loop ran it (Batch 134)' };
    }
    if (opts.shellAllowlisted === true) {
      return { ...base, sourceClass: 'own-box', reason: 'Shell command is on the local-loop allowlist, own-box by construction (Batch 135)' };
    }
    return { ...base, sourceClass: 'stranger', reason: 'Shell output defaults to stranger; only an allowlisted local-loop command is own-box (Batches 134-135)' };
  }

  // 3. Unknown tool: default stranger, flagged (Batch 134).
  return {
    ...base,
    sourceClass: 'stranger',
    unknownTool: true,
    reason:
      toolName === null
        ? 'No tool name supplied: unknown source defaults to stranger (Batch 134)'
        : `Unknown tool "${name}": tool name is only a routing hint and defaults to stranger (Batch 134)`,
  };
}

/**
 * Classify the FULL result, then slice. The returned classification is the
 * pre-slice classification, carried unchanged onto the sliced text — the
 * renderer styles by this record, never by re-classifying the slice.
 */
function classifyThenSlice(options, maxChars) {
  const full = classifyResult(options);
  const text = typeof options.text === 'string' ? options.text : '';
  const limit = typeof maxChars === 'number' && maxChars >= 0 ? maxChars : 4000;
  return {
    classification: full,
    text: text.slice(0, limit),
    fullLength: text.length,
    sliced: text.length > limit,
  };
}

/**
 * Render label for a classified result, so a renderer styles by source,
 * not by tool name. The unknown-host assumed case gets a distinct label,
 * never a silent own-box mark: the assumption flag must stay visible.
 */
function renderClass(classified) {
  const record = classified && typeof classified === 'object' ? classified : {};
  const sourceClass = record.sourceClass || record.class || null;
  if (!CLASSES.includes(sourceClass)) {
    throw new Error(`renderClass: unknown source class "${String(sourceClass)}" (expected one of ${CLASSES.join(', ')})`);
  }
  if (sourceClass === 'own-box' && record.hostUnknown === true) {
    return 'own-box (assumed, host unknown)';
  }
  return sourceClass;
}

module.exports = {
  PROVENANCE_KEY,
  PROVENANCE_VERSION,
  REJECTED_BARE_KEYS,
  CLASSES,
  buildProvenance,
  readProvenance,
  readProvenanceFromResult,
  attachProvenance,
  provenanceFromThrown,
  isLoopbackHost,
  hostFromValue,
  isUnderRoots,
  classifyResult,
  classifyThenSlice,
  renderClass,
};
