'use strict';
/* Tests for provenance.cjs. Only node:assert / node:test. Run: node provenance.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert');
const {
  PROVENANCE_KEY,
  buildProvenance,
  readProvenance,
  readProvenanceFromResult,
  attachProvenance,
  provenanceFromThrown,
  isLoopbackHost,
  classifyResult,
  classifyThenSlice,
  renderClass,
} = require('./provenance.cjs');

const okResult = (overrides) => ({
  content: [{ type: 'text', text: 'hello' }],
  ...(overrides || {}),
});

// --- Emission: single namespaced key only, no bare keys --------------------

test('emission: single namespaced key only, versioned, per-emitter sub-object', () => {
  const meta = buildProvenance('obsidian', { baseUrlHost: '127.0.0.1', baseUrlSource: 'global' });
  assert.deepEqual(Object.keys(meta), [PROVENANCE_KEY]);
  assert.equal(meta[PROVENANCE_KEY].version, 1);
  assert.deepEqual(meta[PROVENANCE_KEY].obsidian, { baseUrlHost: '127.0.0.1', baseUrlSource: 'global' });
  // A second emitter gets its own sub-object under the same key (merge path).
  const merged = { ...meta, [PROVENANCE_KEY]: { ...meta[PROVENANCE_KEY], bridge: { tool: 'obsidian_read_note' } } };
  assert.deepEqual(Object.keys(merged), [PROVENANCE_KEY]);
  assert.equal(merged[PROVENANCE_KEY].bridge.tool, 'obsidian_read_note');
});

test('emission: bare-key-shaped input is rejected, not emitted', () => {
  assert.throws(() => buildProvenance('obsidian', { obsidianBaseUrlHost: '127.0.0.1' }), /bare _meta key/);
  assert.throws(() => buildProvenance('obsidian', { obsidianBaseUrlSource: 'global' }), /bare _meta key/);
  assert.throws(() => buildProvenance('obsidian', { [PROVENANCE_KEY]: {} }), /namespaced key itself/);
  assert.throws(() => buildProvenance('', { baseUrlHost: 'x' }), /emitter/);
});

test('emission: attachProvenance rejects a multi-key / bare-key meta object', () => {
  assert.throws(
    () => attachProvenance(okResult(), { [PROVENANCE_KEY]: { version: 1 }, obsidianBaseUrlHost: 'x' }),
    /exactly one key/
  );
});

// --- isError keeps _meta; thrown errors do not ------------------------------

test('isError result keeps _meta when attached', () => {
  const meta = buildProvenance('obsidian', { baseUrlHost: '127.0.0.1', baseUrlSource: 'global' });
  const attached = attachProvenance(okResult({ isError: true, content: [{ type: 'text', text: 'boom' }] }), meta);
  assert.equal(attached.isError, true);
  assert.deepEqual(attached._meta, meta);
  assert.equal(readProvenanceFromResult(attached).obsidian.baseUrlHost, '127.0.0.1');
  // Original result object is not mutated.
  const original = okResult({ isError: true });
  attachProvenance(original, meta);
  assert.equal(original._meta, undefined);
});

test('thrown-error path yields an explicit host-unknown sidecar, never _meta', () => {
  const record = provenanceFromThrown(new Error('denied'), { toolName: 'obsidian_read_note' });
  assert.equal(record._meta, null);
  assert.equal(record.hostUnknown, true);
  assert.equal(record.host, null);
  assert.equal(record.thrown, true);
  assert.match(record.reason, /lose _meta/);
  assert.equal(record.toolName, 'obsidian_read_note');
  // The sidecar must not be attachable as _meta through the normal path:
  // attachProvenance rejects anything that is not the single namespaced key.
  assert.throws(() => attachProvenance(okResult(), record), /exactly one key/);
});

test('bridge read: readProvenance round-trips the emission', () => {
  const meta = buildProvenance('obsidian', { baseUrlHost: 'example.com', baseUrlSource: 'api_key' });
  assert.equal(readProvenance(meta).obsidian.baseUrlSource, 'api_key');
  assert.equal(readProvenanceFromResult({ content: [], _meta: meta }).obsidian.baseUrlHost, 'example.com');
  assert.equal(readProvenanceFromResult({ content: [] }), null);
});

// --- Per-tool ultimate-source table -----------------------------------------

test('per-tool table: obsidian_* (loopback host) own-box, local_corpus_* own-box, omniroute_memory_search own-box', () => {
  assert.equal(classifyResult({ toolName: 'obsidian_read_note', hostAtCallTime: '127.0.0.1:27123' }).sourceClass, 'own-box');
  assert.equal(classifyResult({ toolName: 'local_corpus_search' }).sourceClass, 'own-box');
  assert.equal(classifyResult({ toolName: 'local_corpus_read' }).sourceClass, 'own-box');
  assert.equal(classifyResult({ toolName: 'omniroute_memory_search' }).sourceClass, 'own-box');
});

test('per-tool table: web_search stranger, oneproxy_fetch system/config', () => {
  assert.equal(classifyResult({ toolName: 'web_search' }).sourceClass, 'stranger');
  assert.equal(classifyResult({ toolName: 'omniroute_web_search' }).sourceClass, 'stranger');
  assert.equal(classifyResult({ toolName: 'oneproxy_fetch' }).sourceClass, 'system');
  assert.equal(classifyResult({ toolName: 'oneproxy_stats' }).sourceClass, 'system');
});

test('per-tool table: notion_* own-account, never silently own-box or stranger', () => {
  const c = classifyResult({ toolName: 'notion_search' });
  assert.equal(c.sourceClass, 'own-account');
  assert.equal(renderClass(c), 'own-account');
});

test('unknown tool defaults to stranger and is flagged', () => {
  const c = classifyResult({ toolName: 'some_future_tool' });
  assert.equal(c.sourceClass, 'stranger');
  assert.equal(c.unknownTool, true);
  const noName = classifyResult({});
  assert.equal(noName.sourceClass, 'stranger');
  assert.equal(noName.unknownTool, true);
});

// --- Obsidian host-at-call-time rule ----------------------------------------

test('Obsidian loopback vs non-loopback vs unknown host', () => {
  const loopback = classifyResult({ toolName: 'obsidian_read_note', hostAtCallTime: '127.0.0.1:27123' });
  assert.equal(loopback.sourceClass, 'own-box');
  assert.equal(loopback.hostUnknown, false);
  assert.equal(renderClass(loopback), 'own-box');

  const remote = classifyResult({ toolName: 'obsidian_read_note', hostAtCallTime: 'https://obsidian.example.com' });
  assert.equal(remote.sourceClass, 'own-account');
  assert.equal(renderClass(remote), 'own-account');

  const unknown = classifyResult({ toolName: 'obsidian_read_note' });
  assert.equal(unknown.sourceClass, 'own-box'); // assumed default
  assert.equal(unknown.hostUnknown, true);
  assert.equal(unknown.assumption, 'host unknown, default loopback assumed');
  assert.equal(renderClass(unknown), 'own-box (assumed, host unknown)');
});

test('Obsidian host from the namespaced emission (bridge read), incl. malformed', () => {
  const meta = buildProvenance('obsidian', { baseUrlHost: 'vault.example.com', baseUrlSource: 'api_key' });
  const c = classifyResult({ toolName: 'obsidian_read_note', result: { content: [], _meta: meta } });
  assert.equal(c.sourceClass, 'own-account');

  const loopMeta = buildProvenance('obsidian', { baseUrlHost: 'localhost', baseUrlSource: 'global' });
  assert.equal(classifyResult({ toolName: 'obsidian_read_note', result: { content: [], _meta: loopMeta } }).sourceClass, 'own-box');

  // Present-but-hostless emission: malformed, treated as unknown, flagged.
  const badMeta = buildProvenance('obsidian', { baseUrlSource: 'global' });
  const bad = classifyResult({ toolName: 'obsidian_read_note', result: { content: [], _meta: badMeta } });
  assert.equal(bad.hostUnknown, true);
  assert.equal(bad.malformedProvenance, true);
  assert.equal(bad.assumption, 'host unknown, default loopback assumed');
});

test('Obsidian sync tools are own-box by construction, no host check', () => {
  assert.equal(classifyResult({ toolName: 'obsidian_sync_status' }).sourceClass, 'own-box');
  assert.equal(classifyResult({ toolName: 'obsidian_sync_trigger' }).sourceClass, 'own-box');
});

test('loopback set: 127/8, ::1, localhost yes; 0.0.0.0, LAN, .local no', () => {
  assert.equal(isLoopbackHost('127.0.0.1'), true);
  assert.equal(isLoopbackHost('127.9.9.9:27123'), true);
  assert.equal(isLoopbackHost('localhost'), true);
  assert.equal(isLoopbackHost('[::1]:27123'), true);
  assert.equal(isLoopbackHost('0.0.0.0'), false);
  assert.equal(isLoopbackHost('192.168.1.10'), false);
  assert.equal(isLoopbackHost('vault.local'), false);
});

// --- Redirect, slicing, system class ----------------------------------------

test('redirect-to-localhost records the FINAL url and does not upgrade to own-box', () => {
  const c = classifyResult({
    toolName: 'web_fetch',
    sourceUrl: 'https://example.com/page',
    finalUrl: 'http://127.0.0.1:27123/page',
  });
  assert.equal(c.recordedUrl, 'http://127.0.0.1:27123/page');
  assert.equal(c.redirectToLocalhost, true);
  assert.equal(c.sourceClass, 'stranger');
});

test('classification happens before slicing: sliced input carries pre-slice classification', () => {
  const longUrl = 'https://example.com/' + 'a'.repeat(500);
  const full = classifyResult({ toolName: 'web_fetch', sourceUrl: longUrl, text: 'x'.repeat(5000) });
  assert.equal(full.sourceClass, 'stranger');
  assert.equal(full.recordedUrl, longUrl);
  const sliced = classifyThenSlice({ toolName: 'web_fetch', sourceUrl: longUrl, text: 'x'.repeat(5000) }, 4000);
  assert.equal(sliced.text.length, 4000);
  assert.equal(sliced.sliced, true);
  assert.deepEqual(sliced.classification, full);
  // The pre-slice record still holds the full, unsliced URL — a renderer
  // re-classifying the 4000-char slice (or a 200-char label) could not
  // recover it, which is why slicing after classification is the rule.
  assert.equal(sliced.classification.recordedUrl.length, longUrl.length);
});

test('system class for DENIED / ERROR / confirmation strings', () => {
  assert.equal(classifyResult({ toolName: 'obsidian_read_note', hostAtCallTime: '127.0.0.1', denied: true }).sourceClass, 'system');
  assert.equal(classifyResult({ toolName: 'web_search', errorText: 'ERROR: upstream failed' }).sourceClass, 'system');
  assert.equal(classifyResult({ toolName: 'web_search', isError: true }).sourceClass, 'system');
  assert.equal(classifyResult({ toolName: 'write_file', confirmation: true }).sourceClass, 'system');
});

test('shell: allowlisted local-loop own-box, arsenal shell stranger, network shell stranger', () => {
  assert.equal(classifyResult({ shellCommand: 'ls notes', shellAllowlisted: true }).sourceClass, 'own-box');
  assert.equal(classifyResult({ shellCommand: 'ls notes' }).sourceClass, 'stranger');
  assert.equal(classifyResult({ shellCommand: 'curl https://example.com', shellAllowlisted: true }).sourceClass, 'stranger');
});

test('renderClass: labels by source, rejects unknown classes', () => {
  assert.equal(renderClass({ sourceClass: 'own-box' }), 'own-box');
  assert.equal(renderClass({ sourceClass: 'own-account' }), 'own-account');
  assert.equal(renderClass({ sourceClass: 'stranger' }), 'stranger');
  assert.equal(renderClass({ sourceClass: 'system' }), 'system');
  assert.throws(() => renderClass({ sourceClass: 'trusted' }), /unknown source class/);
});
