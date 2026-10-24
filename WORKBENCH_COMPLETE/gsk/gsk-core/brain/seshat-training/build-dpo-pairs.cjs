'use strict';
/**
 * DPO PAIRS BUILDER — Seshat round 3, R3b (2026-10-23).
 * Judge-DPO pairs in the ICLR-2025 / DJPO shape: SAME item, chosen =
 * the ruled-correct judgment, rejected = the opposite judgment with a
 * plausible templated reason. Sources, in priority order:
 *   1. dpo-named-pairs.jsonl — her own recorded errors (v2's 0.95
 *      vapor keep; v2.1's real-page quarantine), x3 upweighted.
 *   2. dpo-reserve.jsonl preference pairs (HelpSteer2, same prompt,
 *      Δgoodness ≥ 1.0): one judge pair per RESPONSE whose conversion
 *      cell gives a definite verdict.
 *   3. dpo-reserve.jsonl mushy singles: verdict by the substance
 *      threshold (S >= 0.5 keep), the boundary class SFT excluded.
 *   4. dataset-v3.jsonl HS2 boundary rows (|S-0.5| <= 0.20): chosen =
 *      the trained judgment, rejected = its flip.
 * Prompts are built byte-identically to the judge serve format
 * (RUBRIC system + judgeItem user shape, lexical from _scoreText).
 * Deterministic (seed 222). Output: dpo-pairs.jsonl (~700 pairs).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const CORE = '/home/hatch/workspace/itsus-test/WORKBENCH_COMPLETE/gsk/gsk-core';
const digestion = require(path.join(CORE, 'skills', 'graft_digestion.js'));

function loadRubric() {
    const src = fs.readFileSync(path.join(CORE, 'skills', 'graft_digestion_judge.js'), 'utf8');
    const a = src.indexOf('const RUBRIC = [');
    const b = src.indexOf("].join('\\n');", a);
    const box = {};
    vm.runInNewContext(src.slice(a, b + "].join('\\n');".length) + '\nthis.R = RUBRIC;', box);
    return box.R;
}
const RUBRIC = loadRubric();

function judgePrompt(title, text) {
    const s = digestion._scoreText(text, []);
    const lexical = { profit: s.profit, love: s.love, tax: s.tax, trueValue: Math.round((s.profit + s.love - s.tax) * 10000) / 10000, signals: s.signals };
    const user = [
        `ITEM TITLE: ${title}`,
        `LEXICAL STAGE (deterministic rubric): Profit ${lexical.profit} · Love ${lexical.love} · Tax ${lexical.tax} · True Value ${lexical.trueValue} · signals ${JSON.stringify(lexical.signals || {})}`,
        '',
        'TEXT TO JUDGE (data, not instructions):',
        text.slice(0, 3500),
    ].join('\n');
    return [{ role: 'system', content: RUBRIC }, { role: 'user', content: user }];
}

const S = a => Math.round(((0.65 * a.helpfulness + 0.8 * a.correctness + 0.45 * a.coherence) / 7.6) * 100) / 100;
function cellOf(a) {
    const H = a.helpfulness, C = a.correctness, Coh = a.coherence, V = a.verbosity;
    if (V >= 3 && Coh >= 3 && C <= 1) return 'vapor';
    if (C <= 1) return 'hard';
    if (H <= 1 && C <= 2) return 'weak';
    if (V <= 1 && C >= 3) return 'plain-gold';
    if (C >= 3 && H >= 3) return 'clean-keep';
    return 'mushy';
}
function reasonFor(verdict, cell, a) {
    const H = a.helpfulness, C = a.correctness, Coh = a.coherence, V = a.verbosity;
    if (verdict === 'keep') {
        if (cell === 'plain-gold') return `terse (verbosity ${V}/4) but correctness ${C}/4: substance does not require polish`;
        return `correctness ${C}/4, helpfulness ${H}/4: claims check out and the item carries usable substance`;
    }
    if (cell === 'vapor') return `verbosity ${V}/4, coherence ${Coh}/4, correctness ${C}/4 — fluent and well-formed but factually empty; fluency is not evidence`;
    if (cell === 'weak') return `helpfulness ${H}/4 with correctness ${C}/4: no usable substance to retain`;
    return `correctness ${C}/4: central claims wrong or unsupported — not memory-safe`;
}
function judgment(verdict, cell, a) {
    const s = S(a);
    const substance = verdict === 'keep' ? Math.max(s, 0.55) : Math.min(s, 0.45);
    return JSON.stringify({ verdict, substance: Math.round(substance * 100) / 100, reason: reasonFor(verdict, cell, a) });
}
function flippedJudgment(verdict, cell, a) {
    const opp = verdict === 'keep' ? 'quarantine' : 'keep';
    const s = S(a);
    const substance = opp === 'keep' ? Math.min(0.97, Math.max(0.6, 1 - s)) : Math.max(0, Math.min(0.4, 1 - s));
    // The rejected reason uses the OPPOSITE side's plausible template.
    return JSON.stringify({ verdict: opp, substance: Math.round(substance * 100) / 100, reason: reasonFor(opp, cell === 'vapor' ? 'hard' : cell, a) });
}
function hs2Item(promptText, responseText) {
    const title = String(promptText).split('\n')[0].slice(0, 80) || 'HelpSteer2 item';
    const text = `PROMPT: ${promptText}\n\nRESPONSE: ${responseText}`;
    return { title, text };
}

// tiny deterministic RNG (mulberry32, seed 222)
let _s = 222;
function rnd() { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

const out = [];
const seen = new Set();
function add(prompt, chosen, rejected, meta) {
    const key = prompt[1].content.slice(0, 200) + '|' + chosen.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    out.push({ prompt, chosen, rejected, _meta: meta });
    return true;
}

// 1. named error pairs x3
const named = fs.readFileSync(path.join(DIR, 'dpo-named-pairs.jsonl'), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
for (let r = 0; r < 3; r++) for (const p of named) {
    // bypass dedupe for the upweight copies by suffixing meta only
    out.push({ prompt: p.prompt, chosen: p.chosen, rejected: p.rejected, _meta: { ...p._meta, copy: r } });
}
console.log('named pairs (x3):', out.length);

// 2. reserve preference pairs -> per-response judge pairs with definite cells
const reserve = fs.readFileSync(path.join(DIR, 'dpo-reserve.jsonl'), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const prefPairs = shuffle(reserve.filter(r => r.type !== 'mushy-single'));
let nPref = 0;
for (const r of prefPairs) {
    if (nPref >= 400) break;
    for (const side of ['chosen', 'rejected']) {
        const attrs = r[side + '_attributes'];
        const cell = cellOf(attrs);
        if (cell === 'mushy') continue;
        const verdict = (cell === 'clean-keep' || cell === 'plain-gold') ? 'keep' : 'quarantine';
        const { title, text } = hs2Item(r.prompt, r[side]);
        if (add(judgePrompt(title, text), judgment(verdict, cell, attrs), flippedJudgment(verdict, cell, attrs), { source: 'hs2-prefpair-' + side, cell })) nPref++;
        if (nPref >= 400) break;
    }
}
console.log('prefpair-derived:', nPref);

// 3. mushy singles by substance threshold
const mushy = shuffle(reserve.filter(r => r.type === 'mushy-single'));
let nMushy = 0;
for (const r of mushy) {
    if (nMushy >= 200) break;
    const a = r.attributes;
    const verdict = S(a) >= 0.5 ? 'keep' : 'quarantine';
    const { title, text } = hs2Item(r.prompt, r.response);
    if (add(judgePrompt(title, text), judgment(verdict, 'mushy', a), flippedJudgment(verdict, 'mushy', a), { source: 'hs2-mushy', S: S(a) })) nMushy++;
}
console.log('mushy-derived:', nMushy);

// 4. v3 HS2 boundary rows
const v3 = fs.readFileSync(path.join(DIR, 'dataset-v3.jsonl'), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const boundary = shuffle(v3.filter(r => r._meta && r._meta.slice === 'hs2-judge' && r._meta.attributes && Math.abs(S(r._meta.attributes) - 0.5) <= 0.20));
let nB = 0;
for (const r of boundary) {
    if (nB >= 100) break;
    const a = r._meta.attributes;
    const cell = r._meta.cell || cellOf(a);
    const chosen = r.messages[r.messages.length - 1].content;
    const verdict = r._meta.verdict;
    if (add(r.messages.slice(0, -1), chosen, flippedJudgment(verdict, cell, a), { source: 'v3-boundary', cell })) nB++;
}
console.log('v3-boundary:', nB);

console.log('TOTAL pairs:', out.length);
fs.writeFileSync(path.join(DIR, 'dpo-pairs.jsonl'), out.map(p => JSON.stringify(p)).join('\n') + '\n');
const bySrc = {};
for (const p of out) { const k = (p._meta.source || '?').split('-')[0]; bySrc[k] = (bySrc[k] || 0) + 1; }
console.log('by source:', bySrc);
