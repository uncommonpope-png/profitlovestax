'use strict';
/**
 * GROWTH CYCLE — Seshat self-growing, as a runnable module
 * (Self-Growth Ignition, 2026-10-21).
 *
 * One cycle is the body's standing growth habit, compiled:
 *
 *     INGEST → DIGEST → BUILD → DRAFT → WRITE-BACK → REPORT
 *
 *   INGEST    a defined batch of source files (the cycle spec names
 *             them; nothing is fetched from the open web by a cycle —
 *             growth food is material the body already holds or is
 *             handed, and every item is content-hashed so the same
 *             source is never digested twice).
 *   DIGEST    each item through graft_digestion (fetch → extract →
 *             injection-detect → canonical-PLT score → land or
 *             quarantine), with the stage-two judge requested for
 *             borderline items. External text stays DATA throughout.
 *   BUILD     ONE real build task through graft_tool_harness —
 *             PLT-gated, audited skills only, read-back probes — so
 *             the body literally builds part of itself each cycle.
 *   DRAFT     if the cycle's record supports it, ONE skill draft
 *             into gsk-core/skill-drafts/ — the drafts shelf, never
 *             the loadable skills/ tree. Drafts activate nothing.
 *   WRITE-BACK the cycle's own outcome via graft_memory_hygiene:
 *             facts only, each carrying its evidence; recall is
 *             proven by the hygiene skill before it reports, and a
 *             later fresh process proves persistence (runner
 *             subcommand: recall-proof).
 *   REPORT    a JSON cycle record in .seshat-brain/growth-cycles/
 *             plus append-only entries in the growth ledger
 *             (.seshat-brain/growth-ledger.jsonl). Every number in
 *             the record is copied from a stage result — a claim
 *             with no stage behind it does not appear.
 *
 * GATES: a cycle publishes nothing, activates nothing, and writes
 * nowhere outside the body's own stores (pages/, quarantine/,
 * skill-drafts/, growth-cycles/, the ledgers). It is re-runnable by
 * a scheduler as a single command with clean exit codes (runner:
 * growth-runner.cjs — 0 clean, 2 completed-with-failures, 1 error).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WB = path.resolve(__dirname, '..');
const BRAIN_DIR = path.join(WB, '.seshat-brain');
const SKILLS_DIR = path.resolve(__dirname, '..', '..', 'gsk', 'gsk-core', 'skills');
const DRAFTS_DIR = path.resolve(__dirname, '..', '..', 'gsk', 'gsk-core', 'skill-drafts');
const LEDGER_PATH = path.join(BRAIN_DIR, 'growth-ledger.jsonl');
const CYCLES_DIR = path.join(BRAIN_DIR, 'growth-cycles');

// The body keeps its provider passphrase in workbench/.env; the
// server loads it at boot, so a standalone cycle does the same.
// Values are never logged — only key names already set are skipped.
function loadEnv() {
    try {
        const envPath = path.join(WB, '.env');
        if (!fs.existsSync(envPath)) return;
        for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
            const m = line.match(/^([A-Z_]+)=(.*)$/);
            if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
        }
    } catch { /* no .env → vault defaults apply, seats report themselves */ }
}

function readLedger() {
    try {
        return fs.readFileSync(LEDGER_PATH, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch { return []; }
}
function appendLedger(entry) {
    try {
        fs.mkdirSync(BRAIN_DIR, { recursive: true });
        fs.appendFileSync(LEDGER_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
    } catch { /* the ledger is evidence; a failed append surfaces in the cycle record via counts mismatch */ }
}
function contentKey(text) { return crypto.createHash('sha256').update(String(text)).digest('hex').slice(0, 24); }
function pad(n) { return String(n).padStart(3, '0'); }

function nextCycleNumber(ledger) {
    let max = 0;
    for (const e of ledger) if (typeof e.cycle === 'number') max = Math.max(max, e.cycle);
    try {
        for (const f of fs.readdirSync(CYCLES_DIR)) {
            const m = f.match(/^cycle-(\d+)\.json$/);
            if (m) max = Math.max(max, Number(m[1]));
        }
    } catch { /* no cycles dir yet → 0 */ }
    return max + 1;
}

function loadSkill(name) {
    const p = path.join(SKILLS_DIR, name + '.js');
    delete require.cache[require.resolve(p)];
    return require(p);
}

async function runCycle(spec = {}) {
    loadEnv();
    const ledgerBefore = readLedger();
    const cycle = nextCycleNumber(ledgerBefore);
    const batchId = `growth-cycle-${pad(cycle)}`;
    const record = {
        cycle, batchId, startedAt: new Date().toISOString(),
        stages: {}, refusals: [], status: 'running',
    };
    appendLedger({ kind: 'cycle_start', cycle, batchId });

    // ── INGEST + DIGEST ────────────────────────────────────────────
    const sources = Array.isArray(spec.sources) ? spec.sources : [];
    const items = [];
    const seen = new Map(); // contentKey -> prior digest entry
    for (const e of ledgerBefore) if (e.kind === 'digest' && e.key) seen.set(e.key, e);
    let skippedDuplicates = 0;
    for (const src of sources) {
        let text = null;
        try { text = fs.readFileSync(src.path, 'utf8'); } catch { /* refusal below */ }
        if (text === null) {
            record.refusals.push({ stage: 'ingest', item: src.title || src.path, reason: `source unreadable: ${src.path}` });
            continue;
        }
        const key = contentKey(text);
        const prior = seen.get(key);
        if (prior && (prior.status === 'landed' || prior.status === 'quarantined')) {
            skippedDuplicates++;
            record.refusals.push({ stage: 'ingest', item: src.title || src.path, reason: `duplicate of cycle ${prior.cycle} digestion (key ${key}, status ${prior.status}) — not re-digested` });
            continue;
        }
        items.push({ title: src.title || path.basename(src.path), source: src.path, text, _key: key });
    }
    let digestion = null;
    if (items.length > 0) {
        const { skill_graft_digestion } = loadSkill('graft_digestion');
        digestion = await skill_graft_digestion({
            action: 'digest', batchId, judge: spec.judge !== false,
            items: items.map(({ _key, ...rest }) => rest),
        });
        for (let i = 0; i < items.length; i++) {
            const r = (digestion.results || [])[i];
            if (r) appendLedger({ kind: 'digest', cycle, key: items[i]._key, title: items[i].title, status: r.status, trueValue: r.trueValue, judge: r.judgeReview ? (r.judgeReview.status === 'answered' ? r.judgeReview.verdict : r.judgeReview.status) : null });
        }
    }
    record.stages.digest = {
        sourcesOffered: sources.length,
        itemsDigested: items.length,
        skippedDuplicates,
        counts: digestion ? digestion.counts : { total: 0, landed: 0, quarantined: 0, fetchFailed: 0, injectionsDetected: 0, judged: 0 },
        results: (digestion ? digestion.results : []).map(r => ({ title: r.title, status: r.status, trueValue: r.trueValue, plt: r.plt, judgeReview: r.judgeReview || null, file: r.file })),
        recallVerified: digestion ? digestion.recallVerified : null,
    };

    // ── BUILD ──────────────────────────────────────────────────────
    if (spec.build) {
        const { skill_graft_tool_harness } = loadSkill('graft_tool_harness');
        const built = await skill_graft_tool_harness({ action: 'run', ...spec.build });
        record.stages.build = {
            task: spec.build.task, status: built.status, success: built.success,
            gate: built.gate, pltScore: built.pltScore,
            steps: (built.steps || []).map(s => ({ step: s.step, skill: s.skill, ok: s.ok, probes: (s.probes || []).map(p => ({ name: p.name, ok: p.ok, detail: p.detail })) })),
            report: built.report,
        };
        appendLedger({ kind: 'build', cycle, task: spec.build.task, status: built.status, pltScore: built.pltScore });
    } else {
        record.stages.build = { status: 'not_scheduled', detail: 'spec carried no build task this cycle' };
    }

    // ── JUDGE PROOF (when the spec names fixtures) ────────────────
    if (spec.judgeProof && Array.isArray(spec.judgeProof.fixtures) && spec.judgeProof.fixtures.length > 0) {
        const { skill_graft_digestion } = loadSkill('graft_digestion');
        const proofItems = spec.judgeProof.fixtures.map(f => {
            let text = '';
            try { text = fs.readFileSync(f.path, 'utf8'); } catch { /* recorded below */ }
            return { title: f.title, source: f.path, text, expect: f.expect };
        });
        const proof = await skill_graft_digestion({
            action: 'digest', batchId: `${batchId}-judge-proof`, judge: true,
            items: proofItems.map(({ expect, ...rest }) => rest),
        });
        record.stages.judgeProof = {
            counts: proof.counts,
            results: proofItems.map((f, i) => {
                const r = (proof.results || [])[i] || {};
                return {
                    title: f.title, expect: f.expect, status: r.status, trueValue: r.trueValue,
                    judgeReview: r.judgeReview || null,
                    expectationMet: typeof f.expect === 'string' ? r.status === f.expect : null,
                    file: r.file,
                };
            }),
            recallVerified: proof.recallVerified,
        };
        for (const r of record.stages.judgeProof.results) {
            appendLedger({ kind: 'judge_proof', cycle, title: r.title, expect: r.expect, status: r.status, trueValue: r.trueValue, judge: r.judgeReview && r.judgeReview.status === 'answered' ? r.judgeReview.verdict : (r.judgeReview ? r.judgeReview.status : null), expectationMet: r.expectationMet });
        }
    }

    // ── DRAFT ──────────────────────────────────────────────────────
    if (spec.draft && spec.draft.fileName && typeof spec.draft.content === 'string') {
        const dest = path.join(DRAFTS_DIR, spec.draft.fileName);
        if (dest.startsWith(SKILLS_DIR)) {
            record.refusals.push({ stage: 'draft', item: spec.draft.fileName, reason: 'draft target resolved inside the loadable skills/ tree — refused; drafts live in skill-drafts/ only' });
            record.stages.draft = { status: 'refused', file: dest };
        } else {
            fs.mkdirSync(DRAFTS_DIR, { recursive: true });
            fs.writeFileSync(dest, spec.draft.content, 'utf8');
            const bytes = fs.statSync(dest).size;
            record.stages.draft = { status: 'drafted', file: dest, bytes, rationale: spec.draft.rationale || '', note: 'Draft only — not in skills/, not audited, not loadable. Activation is a separate, reviewed act.' };
            appendLedger({ kind: 'draft', cycle, file: dest, bytes, status: 'drafted' });
        }
    } else {
        record.stages.draft = { status: 'not_scheduled', detail: 'the cycle record did not support a draft this cycle' };
    }

    // ── WRITE-BACK (she records her own growth) ────────────────────
    const facts = [];
    const d = record.stages.digest;
    facts.push({
        fact: `Growth cycle ${cycle} digested ${d.itemsDigested} source(s): ${d.counts.landed} landed, ${d.counts.quarantined} quarantined, ${d.counts.fetchFailed} fetch-failed, ${skippedDuplicates} duplicate(s) refused at ingest`,
        evidence: `graft_digestion batch ${batchId} counts ${JSON.stringify(d.counts)}; growth ledger ${LEDGER_PATH}`,
    });
    if (record.stages.build && record.stages.build.task) {
        facts.push({
            fact: `Growth cycle ${cycle} build task "${record.stages.build.task}" finished with status ${record.stages.build.status}`,
            evidence: `graft_tool_harness report in growth-cycles/cycle-${pad(cycle)}.json; PLT score ${JSON.stringify(record.stages.build.pltScore)}; probes ${JSON.stringify((record.stages.build.steps || []).flatMap(s => s.probes.map(p => ({ name: p.name, ok: p.ok }))))}`,
        });
    }
    if (record.stages.judgeProof) {
        for (const r of record.stages.judgeProof.results) {
            facts.push({
                fact: `Judge proof "${r.title}": expected ${r.expect}, got ${r.status} (trueValue ${r.trueValue})`,
                evidence: `judgeReview ${JSON.stringify(r.judgeReview)}; digestion record ${r.file}`,
            });
        }
    }
    if (record.stages.draft && record.stages.draft.status === 'drafted') {
        facts.push({
            fact: `Growth cycle ${cycle} drafted one skill candidate at ${record.stages.draft.file} (draft shelf only, not activated)`,
            evidence: `file on disk, ${record.stages.draft.bytes} bytes; growth ledger draft entry for cycle ${cycle}`,
        });
    }
    for (const r of record.refusals) {
        facts.push({ fact: `Refusal at ${r.stage}: ${r.item} — ${r.reason}`, evidence: `growth-cycles/cycle-${pad(cycle)}.json refusals list` });
    }
    const { skill_graft_memory_hygiene } = loadSkill('graft_memory_hygiene');
    const outcome = await skill_graft_memory_hygiene({
        action: 'record_outcome',
        title: `Self-growth cycle ${cycle} — ignition record`,
        facts,
        notes: `Batch ${batchId}. Full machine record: .seshat-brain/growth-cycles/cycle-${pad(cycle)}.json. Persistence across a restart is proven separately by the runner's recall-proof in a fresh process — this write alone does not claim it.`,
    });
    record.stages.writeBack = {
        success: outcome.success, marker: outcome.marker || null,
        written: outcome.written || null, recallVerified: outcome.recallVerified === true,
        recall: outcome.recall || null, error: outcome.error || null,
    };
    appendLedger({ kind: 'outcome', cycle, marker: outcome.marker || null, recallVerified: outcome.recallVerified === true });

    // ── REPORT ─────────────────────────────────────────────────────
    const failures =
        (d.counts.fetchFailed || 0) +
        (record.stages.build && record.stages.build.task && record.stages.build.status !== 'completed' ? 1 : 0) +
        (record.stages.judgeProof ? record.stages.judgeProof.results.filter(r => r.expectationMet === false).length : 0) +
        (record.stages.writeBack.success ? 0 : 1);
    record.status = failures === 0 ? 'clean' : 'with_failures';
    record.failures = failures;
    record.finishedAt = new Date().toISOString();
    fs.mkdirSync(CYCLES_DIR, { recursive: true });
    const recordPath = path.join(CYCLES_DIR, `cycle-${pad(cycle)}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf8');
    record.recordPath = recordPath;
    appendLedger({ kind: 'cycle_end', cycle, status: record.status, failures, recordPath });
    return record;
}

// Fresh-process recall proof: load deep-memory cold and find a marker.
function recallProof(marker, query) {
    loadEnv();
    const dmPath = path.join(__dirname, 'deep-memory.cjs');
    delete require.cache[require.resolve(dmPath)];
    const dm = require(dmPath);
    const refresh = typeof dm.refreshNow === 'function' ? dm.refreshNow('recall-proof') : null;
    const hits = dm.search(query || marker, 8, { perSourceCap: 10, skipRefresh: true });
    const hit = (hits || []).find(h => (h.text || '').includes(marker));
    return { marker, refreshed: !!(refresh && refresh.refreshed), found: !!hit, source: hit ? hit.source : null, score: hit ? hit.score : null, totalHits: (hits || []).length };
}

module.exports = { runCycle, recallProof, _contentKey: contentKey, _paths: { LEDGER_PATH, CYCLES_DIR, SKILLS_DIR, DRAFTS_DIR } };
