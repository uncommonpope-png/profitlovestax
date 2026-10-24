'use strict';
/**
 * LOCAL MIND PROOF — Phase 1 acceptance (2026-10-22).
 * Runs the REAL digestion judge (graft_digestion_judge._judgeItem) and
 * the REAL digestion pipeline (graft_digestion digest, judge:true —
 * the growth-cycle judgeProof path) with the local keyless Qwen seat
 * as the ONLY judge seat:
 *   - SESHAT_JUDGE_SEATS=local structurally restricts the seat list.
 *   - All rented API keys are deleted from this process env, and the
 *     sealed vault does not decrypt in this context (returns {}).
 * Nothing here simulates a verdict; every ruling below is the local
 * model's own output, parsed by the judge's own parser.
 */
process.env.SESHAT_JUDGE_SEATS = 'local';
for (const k of ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY', 'POOLSIDE_API_KEY', 'ANTHROPIC_API_KEY', 'COHERE_API_KEY', 'NVIDIA_API_KEY', 'MISTRAL_API_KEY', 'MINIMAX_API_KEY']) delete process.env[k];

const fs = require('fs');
const path = require('path');

const CORE = '/home/hatch/workspace/itsus-test/WORKBENCH_COMPLETE/gsk/gsk-core';
const SPECS = '/home/hatch/workspace/itsus-test/WORKBENCH_COMPLETE/workbench/deep-memory/growth-specs';
const PAGES = '/home/hatch/workspace/itsus-test/WORKBENCH_COMPLETE/workbench/.seshat-brain/pages';

const judge = require(path.join(CORE, 'skills', 'graft_digestion_judge.js'));
const digestion = require(path.join(CORE, 'skills', 'graft_digestion.js'));

const REAL_PAGE = 'DIGESTED - 2026-10-21 - bm25-memory-indexing-explainer.md';

function lexicalOf(text) {
    const s = digestion._scoreText(text, []);
    return { profit: s.profit, love: s.love, tax: s.tax, trueValue: Math.round((s.profit + s.love - s.tax) * 10000) / 10000, signals: s.signals };
}

async function direct(title, text) {
    const lexical = lexicalOf(text);
    const t0 = Date.now();
    const r = await judge._judgeItem({ title, text, lexical, timeoutMs: 300000 });
    const ms = Date.now() - t0;
    return { title, lexical, wallMs: ms, result: r };
}

(async () => {
    const vapor = fs.readFileSync(path.join(SPECS, 'fixture-fluent-empty.txt'), 'utf8');
    const bm25 = fs.readFileSync(path.join(SPECS, 'fixture-good-borderline.txt'), 'utf8');
    const page = fs.readFileSync(path.join(PAGES, REAL_PAGE), 'utf8');

    console.log('=== DIRECT _judgeItem — fixture: fluent-empty vapor (expect quarantine) ===');
    const a = await direct('FIXTURE — fluent but empty (holistic excellence vapor)', vapor);
    console.log(JSON.stringify(a, null, 1));

    console.log('=== DIRECT _judgeItem — fixture: BM25 borderline (expect keep) ===');
    const b = await direct('FIXTURE — good borderline (BM25 ranking, in brief)', bm25);
    console.log(JSON.stringify(b, null, 1));

    console.log('=== DIRECT _judgeItem — real page from her brain (bm25-memory-indexing-explainer) ===');
    const c = await direct(REAL_PAGE, page);
    console.log(JSON.stringify(c, null, 1));

    console.log('=== FULL PIPELINE — graft_digestion digest judge:true (production 60s seat timeout) ===');
    const t0 = Date.now();
    const proof = await digestion.skill_graft_digestion({
        action: 'digest', batchId: 'local-mind-proof-001', judge: true,
        items: [
            { title: 'FIXTURE — fluent but empty (holistic excellence vapor)', source: path.join(SPECS, 'fixture-fluent-empty.txt'), text: vapor },
            { title: 'FIXTURE — good borderline (BM25 ranking, in brief)', source: path.join(SPECS, 'fixture-good-borderline.txt'), text: bm25 },
            { title: REAL_PAGE, source: path.join(PAGES, REAL_PAGE), text: page },
        ],
    });
    console.log('pipeline wallMs:', Date.now() - t0);
    console.log(JSON.stringify({ counts: proof.counts, results: (proof.results || []).map(r => ({ title: r.title, status: r.status, trueValue: r.trueValue, judgeReview: r.judgeReview || null })) }, null, 1));
    console.log('=== PROOF COMPLETE ===');
})().catch(e => { console.error('PROOF SCRIPT ERROR:', e && e.stack || e); process.exit(1); });
