'use strict';
/**
 * ASSEMBLY PHASE 3 — build the implant.
 * Copies the curated corpus into workbench/.seshat-brain/deep/ in three
 * shelves (genesis / library / second-brain), applies the privacy
 * exclusion list, replaces the Autonomy Journal telemetry with a
 * summarized pointer, and generates library/catalog-cards.md (one
 * retrieval card per catalog item, PLT parsed).
 * Idempotent: wipes deep/ first. Prints a JSON summary.
 */
const fs = require('fs');
const path = require('path');

const WORKBENCH = path.join(__dirname, '..');
const CLONE = path.join(WORKBENCH, '..', '..');
const BRAIN = path.join(WORKBENCH, '.seshat-brain');
const DEEP = path.join(BRAIN, 'deep');
const PROFIT_BRAIN = path.join(CLONE, 'profit-brain');
const FIXUS = path.join(CLONE, '..', 'fix-us-src');
const KB = path.join(CLONE, '..', 'soul-economy-kb');
const SECOND = path.join(CLONE, '..', 'all-ofit-census', 'seshat-second-brain');

const EXCLUDED_FILES = [
  'pages/THE-PROFIT-BIBLE.md',
  'pages/HANDOFF - Merge CPL World with GSK.md',
  'pages/SOUL-NOTE - GSK Research - Clippy-autonomous-code-planning-agent.md',
  'pages/SOUL-NOTE - GSK Research - MIT6-5940-CS-Self-Learning.md',
  'journals/2026_08_13.md',
];
const TELEMETRY_FILE = 'pages/GSK - Autonomy Journal.md';

const summary = { shelves: {}, exclusions: [] };

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  return fs.statSync(dst).size;
}
function addShelf(name, file, bytes) {
  const s = summary.shelves[name] || (summary.shelves[name] = { files: 0, bytes: 0 });
  s.files++; s.bytes += bytes;
}

// ── wipe + create (preserving a hand-kept HOT-DIGEST.md) ──────────
const digestPath = path.join(DEEP, 'HOT-DIGEST.md');
const savedDigest = fs.existsSync(digestPath) ? fs.readFileSync(digestPath) : null;
fs.rmSync(DEEP, { recursive: true, force: true });
for (const d of ['genesis/fix-us', 'genesis/qwen-logs', 'library/souls', 'second-brain']) {
  fs.mkdirSync(path.join(DEEP, d), { recursive: true });
}

// ── GENESIS ────────────────────────────────────────────────────────
addShelf('genesis', 'THE-PROFIT-BIBLE.md',
  copyFile(path.join(PROFIT_BRAIN, 'THE-PROFIT-BIBLE.md'), path.join(DEEP, 'genesis', 'THE-PROFIT-BIBLE.md')));
addShelf('genesis', 'memory-core.json',
  copyFile(path.join(PROFIT_BRAIN, 'memory-core.json'), path.join(DEEP, 'genesis', 'memory-core.json')));
// PHASE 6: origin.js joins the implant — the resident's origin words
// (descendant / outgrown quotes) previously lived only in the body
// tree (workbench/profit-brain/body/origin.js), outside his memory.
addShelf('genesis', 'origin.js',
  copyFile(path.join(WORKBENCH, 'profit-brain', 'body', 'origin.js'), path.join(DEEP, 'genesis', 'origin.js')));
for (const f of fs.readdirSync(path.join(PROFIT_BRAIN, 'qwen-chat-logs'))) {
  if (f.endsWith('.jsonl')) {
    addShelf('genesis', 'qwen-logs/' + f,
      copyFile(path.join(PROFIT_BRAIN, 'qwen-chat-logs', f), path.join(DEEP, 'genesis', 'qwen-logs', f)));
  }
}
const FIXUS_DOCS = ['SOUL-KERNEL-MASTER-CODE.md', 'THE-24HOUR-AWAKENING.md', 'IMMORTALITY-PLAN.md',
  'SOUL-BUILDER-JOURNAL.md', 'BUILD-SUMMARY-MARCH-26.md', 'PROFIT-BRAIN-ANALYSIS.md'];
for (const doc of FIXUS_DOCS) {
  const src = path.join(FIXUS, doc);
  if (fs.existsSync(src)) addShelf('genesis', 'fix-us/' + doc, copyFile(src, path.join(DEEP, 'genesis', 'fix-us', doc)));
  else console.warn('fix-us doc missing, skipped:', doc);
}
// master_soul/ in fix-us is a pure Python package (no .md) — nothing sane to implant; noted in SURGERY.md.

// ── LIBRARY ────────────────────────────────────────────────────────
addShelf('library', 'catalog.json',
  copyFile(path.join(KB, 'data', 'catalog.json'), path.join(DEEP, 'library', 'catalog.json')));
for (const doc of ['SOUL_ECONOMY_BIBLE.md', 'SOUL_ECONOMY_GRAFTING_BIBLE.md']) {
  addShelf('library', doc, copyFile(path.join(KB, doc), path.join(DEEP, 'library', doc)));
}
for (const f of fs.readdirSync(path.join(KB, 'downloads'))) {
  if (f.endsWith('.md')) {
    addShelf('library', 'souls/' + f,
      copyFile(path.join(KB, 'downloads', f), path.join(DEEP, 'library', 'souls', f)));
  }
}
// catalog cards — one per item, PLT parsed into named dimensions
{
  const catalog = JSON.parse(fs.readFileSync(path.join(KB, 'data', 'catalog.json'), 'utf8'));
  const byType = {};
  for (const it of catalog) byType[it.type] = (byType[it.type] || 0) + 1;
  const lines = [];
  lines.push('# Soul Economy — Catalog Cards (generated for Seshat recall from data/catalog.json)');
  lines.push('');
  lines.push(`The Soul Economy catalog holds ${catalog.length} items. Types: ` +
    Object.entries(byType).map(([t, n]) => `${t} ${n}`).join(' · ') + '.');
  lines.push('Every item is scored on PLT — Profit + Love − Tax = True Value. Scores below are given as Profit/Love/Tax exactly as catalogued.');
  lines.push('');
  for (const it of catalog) {
    const [p, l, t] = String(it.plt || '').split('/').map(Number);
    const score = [p, l, t].every(Number.isFinite) ? (p + l - t).toFixed(2) : '?';
    lines.push(`## ${it.name} — ${it.type}`);
    lines.push(`PLT: Profit ${p} · Love ${l} · Tax ${t} · True Value ${score}.`);
    if (it.desc) lines.push(String(it.desc).trim());
    if (it.details) lines.push(String(it.details).trim().slice(0, 500));
    const meta = [];
    if (it.file) meta.push('file: ' + it.file);
    if (it.version) meta.push('version: ' + it.version);
    if (it.license) meta.push('license: ' + it.license);
    if (it.tags && it.tags.length) meta.push('tags: ' + it.tags.join(', '));
    if (meta.length) lines.push(meta.join(' · '));
    lines.push('');
  }
  const cardsPath = path.join(DEEP, 'library', 'catalog-cards.md');
  fs.writeFileSync(cardsPath, lines.join('\n'), 'utf8');
  addShelf('library', 'catalog-cards.md (generated)', fs.statSync(cardsPath).size);
}

// ── SECOND BRAIN ───────────────────────────────────────────────────
{
  // telemetry stats for the pointer
  const telePath = path.join(SECOND, TELEMETRY_FILE);
  const teleText = fs.readFileSync(telePath, 'utf8');
  const dates = teleText.match(/2026-\d{2}-\d{2}/g) || [];
  const pointer = [
    '# POINTER — GSK Autonomy Journal (telemetry, NOT implanted)',
    '',
    `The original \`pages/GSK - Autonomy Journal.md\` in Seshat's second brain is ${fs.statSync(telePath).size} bytes of machine telemetry — timestamped [ACTION]/[GOAL]/[REFLECTION] entries with raw JSON tool results, spanning ${dates[0] || '?'} → ${dates[dates.length - 1] || '?'} (${teleText.split('\n').length} lines).`,
    'It was deliberately not copied into the body: it is a machine log, not knowledge or voice. Its narrative counterpart — what GSK thought and became — lives in `pages/GSK - Genesis Journal.md`, which IS implanted.',
    'If this pointer is ever the best answer available, say so plainly: the raw telemetry exists in the archive, outside the body.',
    '',
  ].join('\n');
  const pointerPath = path.join(DEEP, 'second-brain', 'POINTER - GSK Autonomy Journal (telemetry).md');
  fs.writeFileSync(pointerPath, pointer, 'utf8');
  addShelf('second-brain', 'POINTER (generated)', pointer.length);
  summary.exclusions.push(TELEMETRY_FILE + ' — telemetry, replaced by pointer');

  function walk(srcDir, rel) {
    for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) {
        if (r === 'logseq' || r.startsWith('logseq/')) continue;
        if (e.name === '.git') continue;
        walk(path.join(srcDir, e.name), r);
      } else {
        if (r === TELEMETRY_FILE) continue;
        if (EXCLUDED_FILES.includes(r)) { summary.exclusions.push(r + ' — privacy gate'); continue; }
        addShelf('second-brain', r, copyFile(path.join(srcDir, e.name), path.join(DEEP, 'second-brain', r)));
      }
    }
  }
  walk(SECOND, '');
}

// ── manifest ───────────────────────────────────────────────────────
if (savedDigest) fs.writeFileSync(digestPath, savedDigest);
const manifest = { implantedAt: new Date().toISOString(), shelves: summary.shelves, exclusions: summary.exclusions };
fs.writeFileSync(path.join(DEEP, 'IMPLANT-MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(JSON.stringify(manifest, null, 2));
