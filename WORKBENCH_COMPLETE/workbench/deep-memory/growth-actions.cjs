'use strict';
/**
 * GROWTH ACTIONS — Seshat's growth cycle, headless, for GitHub Actions
 * (Seshat-on-Actions build, 2026-10-21).
 *
 * The nightly VM cron (growth-runner.cjs + hand-authored specs) grows
 * her on the workshop machine. THIS entry grows her in the public
 * repo: a scheduled workflow checks out profitlovestax, materializes
 * the owner's provider key as a workspace-only .env (never committed),
 * runs this file, secret-scans the change set, and commits the growth
 * record back as "Seshat — GSK growth". She learns in public, on the
 * repo's own clock, ~4x/day.
 *
 *   node growth-actions.cjs [--summary-out <path>]
 *
 * Exit codes mirror the runner's, and the workflow treats them
 * accordingly: 0 = clean cycle (or honest no-op diary), 2 = cycle
 * completed with failures ON RECORD (the report carries them; the
 * workflow still commits the report), 1 = this entry itself failed
 * (a failure diary is written best-effort). Only the workflow's
 * secret-scan / change-set assertion can fail the job outright.
 *
 * FRESH SPEC, AUTO-BUILT each run from public-safe sources only:
 *   A. Repo docs (.md/.txt) changed since the last "growth cycle"
 *      commit (bootstrap: the HEAD commit's docs). Capped at 3.
 *   B. The curated in-repo list, deep-memory/growth-sources.json
 *      (Teacher-queue picks + standing study items). Capped at 2.
 *   C. Implant pages (deep/second-brain/pages + journals) absent
 *      from the growth ledger, in sorted path order. Capped at 1.
 *   Total cap: 5 sources per cycle.
 *
 * Every candidate passes the same gates before it can become food:
 *   - Phase 3 privacy exclusions, by name (below) — the five files
 *     gated out of the public implant, enforced here as defense in
 *     depth so no future commit can quietly reintroduce them as food.
 *   - A credential-shaped content scan (pattern NAMES recorded,
 *     values never logged). A tripping candidate is refused, never
 *     digested.
 *   - Size cap (256 KB) and the growth ledger's content-hash dedupe
 *     (growth-cycle.cjs refuses duplicates again at ingest — the
 *     ledger is the authority; this file pre-filters so an all-
 *     duplicate run is an honest no-op, not a fake cycle).
 *
 * The cycle itself is growth-cycle.cjs runCycle({judge:true}) — the
 * same digestion, PLT law, judge, evidence write-back and ledger the
 * VM cycles use. No build task and no draft are auto-scheduled here:
 * in the public repo she READS and REMEMBERS; building herself in
 * public is a later, owner-approved step.
 *
 * Persistence on ephemeral runners: the committed memory of an
 * Actions cycle is the growth ledger + growth-cycles/cycle-NNN.json
 * + growth-reports/cycle-NNN.md (this file's report). The unified
 * pages/ shelf and the BM25 index are runtime-local under the
 * specimen's .gitignore by design; the index is rebuilt from the
 * committed implant at the start of each run (BM25 only — no native
 * dependencies, no LanceDB on the runner).
 *
 * HONEST NO-OP: if no fresh food survives the gates, this file still
 * writes the cycle report (her diary entry — repo activity with a
 * true reason on record) and changes NOTHING else: no ledger writes,
 * no digestion, no write-back.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;                                    // workbench/deep-memory
const WB = path.resolve(HERE, '..');                       // workbench
const REPO = path.resolve(HERE, '..', '..', '..');         // repo root
const BRAIN = path.join(WB, '.seshat-brain');
const DEEP = path.join(BRAIN, 'deep');
const LEDGER_PATH = path.join(BRAIN, 'growth-ledger.jsonl');
const CYCLES_DIR = path.join(BRAIN, 'growth-cycles');
const REPORTS_DIR = path.join(REPO, 'growth-reports');
const SOURCES_LIST = path.join(HERE, 'growth-sources.json');
const INDEX_PATH = path.join(BRAIN, 'deep-index.json');

const MAX_TOTAL = 5;
const CAP_A = 3, CAP_B = 2, CAP_C = 1;
const MAX_BYTES = 256 * 1024;

// ── Phase 3 privacy exclusions (SURGERY.md Phase 3 §1) ────────────
// Basenames gated out of the public implant by content scan. The
// Form A Bible at deep/genesis/THE-PROFIT-BIBLE.md is CLEAN and
// shipped on purpose — the exclusion is only the second-brain copy,
// so that rule also requires the second-brain path segment.
const EXCLUDED_BASENAMES = new Set([
    'HANDOFF - Merge CPL World with GSK.md',
    'SOUL-NOTE - GSK Research - Clippy-autonomous-code-planning-agent.md',
    'SOUL-NOTE - GSK Research - MIT6-5940-CS-Self-Learning.md',
    '2026_08_13.md',
]);
function isExcluded(absPath) {
    const rel = path.relative(REPO, absPath).split(path.sep).join('/');
    const base = path.basename(absPath);
    if (EXCLUDED_BASENAMES.has(base)) return 'phase-3 exclusion (by name)';
    if (base === 'THE-PROFIT-BIBLE.md' && rel.includes('second-brain/')) return 'phase-3 exclusion (second-brain Form B copy)';
    return null;
}

// ── Credential-shaped content scan (names only, never values) ─────
const SECRET_PATTERNS = [
    ['openai-style key (sk-)', /sk-[A-Za-z0-9]{20,}/],
    ['anthropic-style key (sk-ant-)', /sk-ant-[A-Za-z0-9\-_]{16,}/],
    ['google-style key (AIza)', /AIza[0-9A-Za-z\-_]{20,}/],
    ['aws access key (AKIA)', /AKIA[0-9A-Z]{16}/],
    ['github token (ghp_/gho_)', /gh[po]_[A-Za-z0-9]{20,}/],
    ['github fine-grained PAT', /github_pat_[A-Za-z0-9_]{20,}/],
    ['slack token (xox)', /xox[bpas]-[A-Za-z0-9-]{10,}/],
    ['huggingface token (hf_)', /hf_[A-Za-z0-9]{20,}/],
    ['nvidia key (nvapi-)', /nvapi-[A-Za-z0-9\-_]{20,}/],
    ['private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ['long bearer token', /Bearer\s+[A-Za-z0-9\-_.]{30,}/],
    ['jwt-shaped token', /eyJ[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{10,}\./],
];
function scanSecrets(text) {
    for (const [name, re] of SECRET_PATTERNS) if (re.test(text)) return name;
    return null;
}

// ── Ledger (read-only here; growth-cycle.cjs is the writer) ───────
const { _contentKey } = require('./growth-cycle.cjs');
function readLedger() {
    try {
        return fs.readFileSync(LEDGER_PATH, 'utf8').split('\n').filter(Boolean)
            .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch { return []; }
}
function digestedKeys(ledger) {
    const s = new Map();
    for (const e of ledger) if (e.kind === 'digest' && e.key && (e.status === 'landed' || e.status === 'quarantined')) s.set(e.key, e);
    return s;
}
function nextCycleNumber(ledger) {
    let max = 0;
    for (const e of ledger) if (typeof e.cycle === 'number') max = Math.max(max, e.cycle);
    try {
        for (const f of fs.readdirSync(CYCLES_DIR)) {
            const m = f.match(/^cycle-(\d+)\.json$/);
            if (m) max = Math.max(max, Number(m[1]));
        }
    } catch { /* none yet */ }
    return max + 1;
}
const pad = n => String(n).padStart(3, '0');

function git(args) {
    try {
        return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', timeout: 60000 });
    } catch { return null; }
}

// A candidate must survive every gate; refusals are recorded, never silent.
function vetCandidate(absPath, title, refusals, seenKeys) {
    const rel = path.relative(REPO, absPath).split(path.sep).join('/');
    const ex = isExcluded(absPath);
    if (ex) { refusals.push({ item: title || rel, reason: ex }); return null; }
    let st;
    try { st = fs.statSync(absPath); } catch { refusals.push({ item: title || rel, reason: 'unreadable / missing' }); return null; }
    if (!st.isFile()) { refusals.push({ item: title || rel, reason: 'not a file' }); return null; }
    if (st.size > MAX_BYTES) { refusals.push({ item: title || rel, reason: `over size cap (${st.size} bytes > ${MAX_BYTES})` }); return null; }
    let text;
    try { text = fs.readFileSync(absPath, 'utf8'); } catch { refusals.push({ item: title || rel, reason: 'unreadable' }); return null; }
    const trip = scanSecrets(text);
    if (trip) { refusals.push({ item: title || rel, reason: `credential-shaped content refused (${trip}) — values never logged` }); return null; }
    const key = _contentKey(text);
    const prior = seenKeys.get(key);
    if (prior) { refusals.push({ item: title || rel, reason: `already digested in cycle ${prior.cycle} (key ${key}, status ${prior.status})` }); return null; }
    return { title: title || path.basename(absPath), path: absPath, rel, key };
}

function collectSources(seenKeys) {
    const refusals = [];
    const picked = [];
    // A — repo docs changed since the last growth commit (bootstrap: HEAD).
    {
        const log = git(['log', '--format=%H%x1f%s', '-n', '200']);
        let range = 'HEAD';
        if (log) {
            for (const line of log.split('\n')) {
                const [hash, subject] = line.split('\x1f');
                if (subject && /^growth cycle \d+/.test(subject)) { range = `${hash}..HEAD`; break; }
            }
        }
        const names = range === 'HEAD'
            ? git(['show', '--name-only', '--pretty=format:', 'HEAD'])
            : git(['diff', '--name-only', range]);
        const files = (names || '').split('\n').map(s => s.trim()).filter(Boolean)
            .filter(f => /\.(md|txt)$/i.test(f))
            .filter(f => !f.startsWith('growth-reports/'))
            .filter(f => !f.includes('node_modules/'))
            .filter(f => !f.startsWith('WORKBENCH_COMPLETE/omniroute/'));
        let n = 0;
        for (const f of files) {
            if (n >= CAP_A || picked.length >= MAX_TOTAL) break;
            const c = vetCandidate(path.join(REPO, f), null, refusals, seenKeys);
            if (c) { c.class = 'A — repo doc changed since last growth commit'; picked.push(c); n++; }
        }
    }
    // B — curated in-repo list (Teacher queue + standing study items).
    {
        let list = [];
        try { list = (JSON.parse(fs.readFileSync(SOURCES_LIST, 'utf8')).sources) || []; } catch { /* no list → no class B */ }
        let n = 0;
        for (const entry of list) {
            if (n >= CAP_B || picked.length >= MAX_TOTAL) break;
            if (!entry || !entry.path) continue;
            const c = vetCandidate(path.join(REPO, entry.path), entry.title, refusals, seenKeys);
            if (c) { c.class = `B — curated (${entry.kind || 'list'})`; picked.push(c); n++; }
        }
    }
    // C — implant pages absent from the ledger, sorted order.
    {
        const roots = [path.join(DEEP, 'second-brain', 'pages'), path.join(DEEP, 'second-brain', 'journals')];
        const all = [];
        const walk = d => {
            let ents = [];
            try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
            for (const e of ents) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) walk(p);
                else if (e.isFile() && /\.md$/i.test(e.name)) all.push(p);
            }
        };
        roots.forEach(walk);
        all.sort();
        let n = 0;
        for (const f of all) {
            if (n >= CAP_C || picked.length >= MAX_TOTAL) break;
            const c = vetCandidate(f, null, refusals, seenKeys);
            if (c) { c.class = 'C — implant page, first undigested in sorted order'; picked.push(c); n++; }
        }
    }
    return { picked, refusals };
}

function reportHeader(cycle, mode) {
    return [
        `# GROWTH CYCLE #${cycle} — Seshat on GitHub Actions`,
        '',
        `**Date:** ${new Date().toISOString()} · **Mode:** ${mode} · **Trigger:** ${process.env.GROWTH_TRIGGER || 'schedule'}`,
        '',
    ].join('\n');
}

function writeNoopReport(cycle, refusals) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const file = path.join(REPORTS_DIR, `cycle-${pad(cycle)}.md`);
    const section = [
        reportHeader(cycle, 'honest no-op — diary entry'),
        'No fresh food survived the gates this run (every candidate was already in the growth ledger, excluded, oversized, or refused by the content scan). Nothing was digested, nothing was written back, the ledger is untouched. This report is the whole change set — her diary entry, so the repo shows a true reason instead of silence.',
        '',
        `**Candidates refused this run: ${refusals.length}**`,
        ...refusals.slice(0, 25).map(r => `- ${r.item} — ${r.reason}`),
        ...(refusals.length > 25 ? [`- …and ${refusals.length - 25} more refusals of the same kinds`] : []),
        '',
    ].join('\n');
    if (fs.existsSync(file)) fs.appendFileSync(file, '\n---\n\n' + section, 'utf8');
    else fs.writeFileSync(file, section, 'utf8');
    return file;
}

function writeCycleReport(cycle, record, picked, preRefusals) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const file = path.join(REPORTS_DIR, `cycle-${pad(cycle)}.md`);
    const d = record.stages.digest || { counts: {}, results: [] };
    const counts = d.counts || {};
    const lines = [
        reportHeader(cycle, 'GitHub Actions growth cycle'),
        `**Status:** ${record.status} · **Failures:** ${record.failures} · **Batch:** ${record.batchId}`,
        '',
        '## Digestion',
        '',
        `Offered ${d.sourcesOffered} · digested ${d.itemsDigested} · **landed ${counts.landed || 0}** · **quarantined ${counts.quarantined || 0}** · fetch-failed ${counts.fetchFailed || 0} · injection signals ${counts.injectionsDetected || 0} · judge consulted ${counts.judged || 0} · duplicates refused at ingest ${d.skippedDuplicates || 0}.`,
        '',
        '| Source | Class | P | L | T | TrueValue | Status | Judge |',
        '|---|---|---|---|---|---|---|---|',
    ];
    for (let i = 0; i < (d.results || []).length; i++) {
        const r = d.results[i];
        const cls = (picked[i] && picked[i].class) || '';
        const judge = r.judgeReview
            ? (r.judgeReview.status === 'answered' ? `${r.judgeReview.verdict} (substance ${r.judgeReview.substance}) — ${r.judgeReview.reason}` : `unavailable — ${r.judgeReview.reason || ''}`)
            : 'not consulted';
        lines.push(`| ${r.title} | ${cls} | ${r.plt ? r.plt.profit : ''} | ${r.plt ? r.plt.love : ''} | ${r.plt ? r.plt.tax : ''} | ${r.trueValue} | ${r.status} | ${judge} |`);
    }
    lines.push('', '## Write-back', '');
    const wb = record.stages.writeBack || {};
    lines.push(`Outcome recorded: ${wb.success ? 'yes' : 'NO'} · marker: \`${wb.marker || '—'}\` · recall verified in-process: ${wb.recallVerified ? 'yes' : 'no'}. The durable record of this cycle is the growth ledger + \`growth-cycles/cycle-${pad(cycle)}.json\` + this report; the DIGESTED pages live on the runner's unified shelf (runtime-local under the specimen .gitignore).`);
    const refusals = [...preRefusals, ...(record.refusals || [])];
    if (refusals.length) {
        lines.push('', '## Refusals (on record)', '');
        for (const r of refusals.slice(0, 30)) lines.push(`- ${r.item} — ${r.reason}`);
    }
    lines.push('', `_Machine record: WORKBENCH_COMPLETE/workbench/.seshat-brain/growth-cycles/cycle-${pad(cycle)}.json · Ledger: WORKBENCH_COMPLETE/workbench/.seshat-brain/growth-ledger.jsonl_`, '');
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    return file;
}

async function main() {
    const argv = process.argv.slice(2);
    const arg = name => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : null; };
    const summaryOut = arg('summary-out');
    const emit = obj => { if (summaryOut) { try { fs.writeFileSync(summaryOut, JSON.stringify(obj, null, 2), 'utf8'); } catch { /* summary is for the commit message only */ } } };

    const ledger = readLedger();
    const cycle = nextCycleNumber(ledger);
    const seenKeys = digestedKeys(ledger);
    const { picked, refusals } = collectSources(seenKeys);

    if (picked.length === 0) {
        const file = writeNoopReport(cycle, refusals);
        const summary = { cycle, noop: true, landed: 0, quarantined: 0, drafted: 0, report: path.relative(REPO, file) };
        emit(summary);
        console.log(JSON.stringify(summary, null, 2));
        return 0;
    }

    // BM25 index: rebuild from the committed implant if absent
    // (fresh Actions checkout — deep-index.json is gitignored).
    if (!fs.existsSync(INDEX_PATH)) {
        const dm = require('./deep-memory.cjs');
        if (typeof dm.refreshNow === 'function') dm.refreshNow('actions-bootstrap');
    }

    const { runCycle } = require('./growth-cycle.cjs');
    const record = await runCycle({
        judge: true,
        sources: picked.map(p => ({ title: p.title, path: p.path })),
    });
    const file = writeCycleReport(record.cycle, record, picked, refusals);
    const counts = (record.stages.digest && record.stages.digest.counts) || {};
    const summary = {
        cycle: record.cycle, noop: false, status: record.status, failures: record.failures,
        landed: counts.landed || 0, quarantined: counts.quarantined || 0,
        drafted: record.stages.draft && record.stages.draft.status === 'drafted' ? 1 : 0,
        marker: (record.stages.writeBack && record.stages.writeBack.marker) || null,
        report: path.relative(REPO, file),
    };
    emit(summary);
    console.log(JSON.stringify(summary, null, 2));
    return record.status === 'clean' ? 0 : 2;
}

main().then(code => process.exit(code)).catch(e => {
    console.error('GROWTH ACTIONS FAILED:', String(e && e.stack || e));
    try {
        const ledger = readLedger();
        const cycle = nextCycleNumber(ledger);
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
        const file = path.join(REPORTS_DIR, `cycle-${pad(cycle)}.md`);
        const entry = [
            reportHeader(cycle, 'FAILURE diary — the Actions entry itself failed'),
            'The cycle did not complete. The failure is recorded here, not hidden:',
            '',
            '```',
            String(e && e.message || e).slice(0, 1000),
            '```',
            '',
        ].join('\n');
        if (fs.existsSync(file)) fs.appendFileSync(file, '\n---\n\n' + entry, 'utf8');
        else fs.writeFileSync(file, entry, 'utf8');
    } catch { /* best effort only */ }
    process.exit(1);
});
