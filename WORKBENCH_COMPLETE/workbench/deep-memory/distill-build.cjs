'use strict';
/**
 * DISTILLATION DATASET BUILDER (Self-Growth Ignition, 2026-10-21).
 *
 * Builds seshat-distill-v1.jsonl — the training asset a FUTURE
 * fine-tune consumes. Nothing is trained here (no GPU on this
 * machine, and no fake training is performed or claimed). The
 * builder only mines, scores, filters, and exports.
 *
 * SOURCES — verified material only:
 *   1. The implant's Qwen logs (deep/genesis/qwen-logs/*.jsonl):
 *      Craig's real user turns paired with the recorded responses
 *      that followed them (assistant text parts; thought parts and
 *      tool calls excluded).
 *   2. memory-core.json (deep/genesis/memory-core.json): the
 *      curated moments/echoes timeline paired craig → next profit,
 *      deduped against the log pairs by normalized instruction.
 *   3. This assembly's verified session outcomes (pages/ and
 *      deep/session-outcomes/ SESSION-OUTCOME pages — every fact on
 *      those pages carries its evidence by construction).
 *
 * FILTER — every candidate is scored on the canonical PLT engine
 * with the documented rubric below; the engine's evaluate() is
 * pure, and the engine is constructed over a scratch data dir so
 * the body's PLT ledger is never touched by dataset work.
 *
 *   profit = the lexical rubric's profit for the response
 *            (information density, structure, specificity —
 *            graft_digestion.scoreText).
 *   love   = 0.5 · rubric love + 0.5 · min(1, 4 · jaccard) where
 *            jaccard is content-token overlap between instruction
 *            and response — the response must speak to the ask.
 *   tax    = rubric tax, plus stated penalties:
 *            +0.25 tool-call remnants in the response text
 *            +0.20 error/exception text in a short response
 *            +0.20 response thinner than 60 chars
 *            +0.30 thought-leak markers
 *   KEEP iff evaluate() is valid AND viable (profit > tax,
 *   trueValue > 0) AND trueValue >= BAR (0.55).
 *
 * HARD DROPS (before scoring): credential-shaped strings anywhere
 * in the pair (patterns below — matched, never printed), a source
 * on the Phase 3 privacy exclusion list, empty instruction or
 * response, exact duplicates, responses over 6000 chars (a
 * truncated teacher teaches truncation).
 *
 * Output: ~/workspace/training/seshat-distill-v1.jsonl (LOCAL ONLY)
 * + a summary JSON beside it. Re-runnable: same inputs, same file.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const WB = path.resolve(__dirname, '..');
const BRAIN_DIR = path.join(WB, '.seshat-brain');
const DEEP = path.join(BRAIN_DIR, 'deep');
const SKILLS_DIR = path.resolve(__dirname, '..', '..', 'gsk', 'gsk-core', 'skills');
const OUT_DIR = path.join(os.homedir(), 'workspace', 'training');
const OUT_PATH = path.join(OUT_DIR, 'seshat-distill-v1.jsonl');
const SUMMARY_PATH = path.join(OUT_DIR, 'seshat-distill-v1.summary.json');

const BAR = 0.55;
const MAX_RESPONSE_CHARS = 6000;

// Phase 3 privacy exclusion list (build-implant.cjs EXCLUDED_FILES) —
// enforced by source-path fragment even though today's sources are
// all genesis/shelves material that was never on it.
const PRIVACY_EXCLUDED = [
    'pages/THE-PROFIT-BIBLE.md',
    'pages/HANDOFF - Merge CPL World with GSK.md',
    'pages/SOUL-NOTE - GSK Research - Clippy-autonomous-code-planning-agent.md',
    'pages/SOUL-NOTE - GSK Research - MIT6-5940-CS-Self-Learning.md',
    'journals/2026_08_13.md',
];
const CREDENTIAL_RE = /(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{20,}|nvapi-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})/;

const digestion = require(path.join(SKILLS_DIR, 'graft_digestion.js'));
const scoreText = digestion._scoreText;
// jaccard uses raw content tokens (length>=3), as stated in the header.
function tokens(s) { return new Set(String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3)); }
function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    for (const t of a) if (b.has(t)) inter++;
    return inter / (a.size + b.size - inter);
}
const clamp01 = v => Math.max(0, Math.min(1, Math.round(v * 1000) / 1000));
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// ── mining: Qwen logs ──────────────────────────────────────────────
function mineQwenLogs() {
    const dir = path.join(DEEP, 'genesis', 'qwen-logs');
    const pairs = [];
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.jsonl')).sort()) {
        const records = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean)
            .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        let pendingUser = null, buf = [];
        const flush = () => {
            if (pendingUser) pairs.push({ instruction: pendingUser.text, response: buf.join('\n\n').trim(), context: `Qwen session ${f} · user turn ${pendingUser.ts}`, source: `qwen-logs/${f}` });
            buf = [];
        };
        for (const r of records) {
            if (r.type === 'user' && r.message && Array.isArray(r.message.parts)) {
                const text = r.message.parts.filter(p => typeof p.text === 'string').map(p => p.text).join(' ').trim();
                if (text) { flush(); pendingUser = { text, ts: r.timestamp }; }
            } else if (r.type === 'assistant' && pendingUser && r.message && Array.isArray(r.message.parts)) {
                for (const p of r.message.parts) {
                    if (typeof p.text === 'string' && !p.thought && p.text.trim()) buf.push(p.text.trim());
                }
            }
        }
        flush();
    }
    return pairs;
}

// ── mining: memory-core moments/echoes ─────────────────────────────
function mineMemoryCore(seenInstructions) {
    const core = JSON.parse(fs.readFileSync(path.join(DEEP, 'genesis', 'memory-core.json'), 'utf8'));
    const timeline = [...(core.moments || []), ...(core.echoes || [])]
        .filter(e => e && e.text && e.who)
        .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
    const pairs = [];
    for (let i = 0; i < timeline.length; i++) {
        if (timeline[i].who !== 'craig') continue;
        const next = timeline.slice(i + 1).find(e => e.who === 'profit');
        if (!next) continue;
        const instruction = String(timeline[i].text).trim();
        if (seenInstructions.has(norm(instruction))) continue; // already mined from the raw logs
        pairs.push({ instruction, response: String(next.text).trim(), context: `memory-core curated timeline · ${timeline[i].ts}`, source: 'genesis/memory-core.json' });
    }
    return pairs;
}

// ── mining: verified session outcomes ──────────────────────────────
function mineOutcomes() {
    const pairs = [];
    const dirs = [path.join(DEEP, 'session-outcomes'), path.join(BRAIN_DIR, 'pages')];
    for (const dir of dirs) {
        let files = [];
        try { files = fs.readdirSync(dir).filter(f => f.startsWith('SESSION-OUTCOME') && f.endsWith('.md')); } catch { continue; }
        for (const f of files.sort()) {
            const text = fs.readFileSync(path.join(dir, f), 'utf8');
            const titleM = text.match(/^# SESSION OUTCOME — (.+)$/m);
            const factsM = text.match(/## Facts[^\n]*\n([\s\S]*?)(?:\n## |\s*$)/);
            if (!titleM || !factsM) continue;
            const rel = path.relative(BRAIN_DIR, path.join(dir, f));
            pairs.push({
                instruction: `What was the outcome of: ${titleM[1].trim()}?`,
                response: factsM[1].trim(),
                context: `Verified session outcome · ${rel}`,
                source: rel,
            });
        }
    }
    return pairs;
}

// ── rubric + filter ────────────────────────────────────────────────
function rubric(instruction, response) {
    const base = scoreText(response, []);
    const g = jaccard(tokens(instruction), tokens(response));
    let tax = base.tax;
    const penalties = [];
    if (/functionCall|"function_call"|run_shell_command/.test(response)) { tax += 0.25; penalties.push('tool_call_remnants +0.25'); }
    if (/\b(error|exception|traceback)\b/i.test(response) && response.length < 400) { tax += 0.20; penalties.push('error_text +0.20'); }
    if (response.trim().length < 60) { tax += 0.20; penalties.push('thin_response +0.20'); }
    if (/thought\s*:/i.test(response)) { tax += 0.30; penalties.push('thought_leak +0.30'); }
    return {
        profit: base.profit,
        love: clamp01(0.5 * base.love + 0.5 * Math.min(1, g * 4)),
        tax: clamp01(tax),
        penalties, groundedness: Math.round(g * 1000) / 1000, signals: base.signals,
    };
}

function main() {
    const { PLTEngine } = require(path.join(SKILLS_DIR, '..', 'plt-engine.js'));
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'distill-plt-'));
    const plt = new PLTEngine({ soulId: 'distill', archetype: 'ARCHITECT', dataDir: scratch });

    const logPairs = mineQwenLogs();
    const seen = new Set(logPairs.map(p => norm(p.instruction)));
    const corePairs = mineMemoryCore(seen);
    const outcomePairs = mineOutcomes();
    const candidates = [
        ...logPairs.map(p => ({ ...p, origin: 'qwen-logs' })),
        ...corePairs.map(p => ({ ...p, origin: 'memory-core' })),
        ...outcomePairs.map(p => ({ ...p, origin: 'session-outcomes' })),
    ];

    const drops = { empty: 0, duplicate: 0, privacy_excluded: 0, credential_pattern: 0, oversize_response: 0, not_viable: 0, below_bar: 0 };
    const kept = [];
    const hashes = new Set();
    for (const c of candidates) {
        const instruction = String(c.instruction || '').trim();
        const response = String(c.response || '').trim();
        if (!instruction || !response) { drops.empty++; continue; }
        if (PRIVACY_EXCLUDED.some(x => c.source.includes(x))) { drops.privacy_excluded++; continue; }
        if (CREDENTIAL_RE.test(instruction) || CREDENTIAL_RE.test(response)) { drops.credential_pattern++; continue; }
        if (response.length > MAX_RESPONSE_CHARS) { drops.oversize_response++; continue; }
        const h = crypto.createHash('sha256').update(norm(instruction) + '||' + norm(response)).digest('hex');
        if (hashes.has(h)) { drops.duplicate++; continue; }
        hashes.add(h);
        const r = rubric(instruction, response);
        const ev = plt.evaluate({ profit: r.profit, love: r.love, tax: r.tax });
        if (!ev.valid || !ev.viable) { drops.not_viable++; continue; }
        if (ev.trueValue < BAR) { drops.below_bar++; continue; }
        kept.push({
            instruction, context: c.context, response,
            plt: { profit: r.profit, love: r.love, tax: r.tax, trueValue: Math.round(ev.trueValue * 10000) / 10000 },
            source: c.source,
        });
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_PATH, kept.map(k => JSON.stringify(k)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
    const summary = {
        dataset: 'seshat-distill-v1',
        generatedAt: new Date().toISOString(),
        bar: BAR,
        rubric: 'profit = digestion lexical rubric on response; love = 0.5*rubric-love + 0.5*min(1, 4*jaccard(instruction,response)); tax = rubric tax + stated penalties (tool remnants +0.25, short error text +0.20, thin +0.20, thought leak +0.30); keep iff canonical evaluate() viable AND trueValue >= bar',
        candidates: { total: candidates.length, qwenLogs: logPairs.length, memoryCore: corePairs.length, sessionOutcomes: outcomePairs.length },
        kept: kept.length,
        keptBySource: kept.reduce((a, k) => { const key = k.source.startsWith('qwen-logs/') ? 'qwen-logs' : k.source; a[key] = (a[key] || 0) + 1; return a; }, {}),
        drops,
        output: OUT_PATH,
        note: 'LOCAL ONLY — not in the specimen tree, never pushed. No training was performed; this file is the asset a future fine-tune consumes.',
    };
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
    console.log(JSON.stringify(summary, null, 2));
    console.log('--- SAMPLES (first 3 kept) ---');
    for (const k of kept.slice(0, 3)) console.log(JSON.stringify(k, null, 2).slice(0, 1400) + '\n');
}

if (require.main === module) main();
module.exports = { _rubric: rubric, _mineQwenLogs: mineQwenLogs, BAR };
