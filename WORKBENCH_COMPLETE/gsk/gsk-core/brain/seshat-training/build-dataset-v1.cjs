'use strict';
/**
 * SESHAT LOCAL-MIND TRAINING DATASET v1 — groundwork only (2026-10-22).
 * NO TRAINING IS PERFORMED OR CLAIMED by this script. It assembles
 * candidate SFT examples from HER OWN stores, in the conventions of
 * deep-memory/distill-build.cjs (same privacy list, same credential
 * hard-drop, same 6000-char response cap — a truncated teacher
 * teaches truncation, so oversize is DROPPED, not cut).
 *
 * Sources:
 *   1. seshat-distill-v1.jsonl (~/workspace/training) — the verified
 *      pairs already mined from the Qwen-era logs + memory-core +
 *      session outcomes by distill-build (PLT bar 0.55 there).
 *   2. Her digested knowledge pages (.seshat-brain/pages/*.md).
 *   3. Verified SESSION-OUTCOME pages (pages/ + deep/session-outcomes/)
 *      — tagged kind=outcome when the name matches.
 * The Qwen-era logs are covered via source 1 (distill-build already
 * mined them); they are not re-mined here, to avoid double-counting.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BRAIN = '/home/hatch/workspace/itsus-test/WORKBENCH_COMPLETE/workbench/.seshat-brain';
const DISTILL = '/home/hatch/workspace/training/seshat-distill-v1.jsonl';
const OUT = '/home/hatch/workspace/seshat-local/dataset-v1.jsonl';
const MAX_CHARS = 6000;

// Phase 3 privacy exclusion list (distill-build.cjs, verbatim) +
// the Form B bible basename from the standing privacy gate.
const PRIVACY_EXCLUDED = [
    'pages/THE-PROFIT-BIBLE.md',
    'pages/HANDOFF - Merge CPL World with GSK.md',
    'pages/SOUL-NOTE - GSK Research - Clippy-autonomous-code-planning-agent.md',
    'pages/SOUL-NOTE - GSK Research - MIT6-5940-CS-Self-Learning.md',
    'journals/2026_08_13.md',
    'profit_bible.md',
];
const CREDENTIAL_RE = /(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{20,}|nvapi-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})/;

const stats = { pairsFromDistill: 0, pagesSeen: 0, pagesKept: 0, outcomesKept: 0, drops: { privacy: 0, credential: 0, oversize: 0, thin: 0, duplicate: 0, empty: 0 } };
const out = [];
const seen = new Set();
const hash = s => crypto.createHash('sha256').update(s.toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 16);

function push(kind, source, user, assistant) {
    const blob = user + '\n' + assistant;
    if (CREDENTIAL_RE.test(blob)) { stats.drops.credential++; return; }
    if (!user.trim() || !assistant.trim()) { stats.drops.empty++; return; }
    if (assistant.length > MAX_CHARS) { stats.drops.oversize++; return; }
    if (assistant.trim().length < 200) { stats.drops.thin++; return; }
    const h = hash(assistant);
    if (seen.has(h)) { stats.drops.duplicate++; return; }
    seen.add(h);
    out.push({ messages: [{ role: 'user', content: user }, { role: 'assistant', content: assistant }], source, kind });
}

// 1 — distill pairs (Qwen logs / memory-core / outcomes, pre-filtered by distill-build)
for (const line of fs.readFileSync(DISTILL, 'utf8').split('\n').filter(Boolean)) {
    const r = JSON.parse(line);
    const before = out.length;
    push('pair', 'training/seshat-distill-v1.jsonl', String(r.instruction || ''), String(r.response || ''));
    if (out.length > before) stats.pairsFromDistill++;
}

// 2+3 — her pages (knowledge + session outcomes)
function minePages(dir, rel) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.md')).sort()) {
        const relPath = `${rel}/${f}`;
        stats.pagesSeen++;
        if (PRIVACY_EXCLUDED.some(x => relPath.endsWith(x) || f === x)) { stats.drops.privacy++; continue; }
        const raw = fs.readFileSync(path.join(dir, f), 'utf8');
        const title = f.replace(/\.md$/, '');
        const isOutcome = title.startsWith('SESSION-OUTCOME');
        const user = isOutcome
            ? `Seshat, give me the verified session outcome recorded as "${title}".`
            : `Seshat, what does your memory hold in the page "${title}"?`;
        const before = out.length;
        push(isOutcome ? 'outcome' : 'knowledge', relPath, user, raw.trim());
        if (out.length > before) { stats.pagesKept++; if (isOutcome) stats.outcomesKept++; }
    }
}
minePages(path.join(BRAIN, 'pages'), 'pages');
minePages(path.join(BRAIN, 'deep', 'session-outcomes'), 'deep/session-outcomes');

fs.writeFileSync(OUT, out.map(o => JSON.stringify(o)).join('\n') + '\n', 'utf8');
const totalChars = out.reduce((n, o) => n + o.messages.reduce((m, x) => m + x.content.length, 0), 0);
console.log(JSON.stringify({
    dataset: 'seshat-local/dataset-v1',
    examples: out.length,
    totalChars,
    estTokens: Math.round(totalChars / 4),
    byKind: out.reduce((a, o) => (a[o.kind] = (a[o.kind] || 0) + 1, a), {}),
    stats,
    out: OUT,
}, null, 1));
