'use strict';
/**
 * VAPOR CHECK — the digestion judge's degenerate-output catch,
 * generalized to everything the body produces (Wiring Sprint
 * Phase 2, 2026-10-23).
 *
 * The digestion tract already proved this discrimination live: the
 * judge quarantined a fluent-but-empty "synergy manifesto" at
 * substance 0, and the growth cycles quarantined token-salad and a
 * 17-character non-reply. But that check guarded only INTAKE. A seat
 * answering a think, or a skill returning text into the harness,
 * could emit the same classes of degenerate output and be delivered
 * as if it were work.
 *
 * This module is the generalized screen, in two layers:
 *
 *   LAYER 1 — vaporScreen(text): deterministic, free, instant.
 *     Catches the mechanical classes: empty output, the too-short
 *     non-reply (< 24 chars — the 17-char class), fake-completion
 *     literals ("Done." / "Task completed."), repetition salad
 *     (unique-token collapse / looped n-grams).
 *
 *   LAYER 2 — screenOutput(text): layer 1, then the semantic judge
 *     (skills/graft_digestion_judge.js _judgeItem — the exact
 *     machinery that quarantined the manifesto) for anything fluent
 *     enough to pass layer 1. Verdict "quarantine" = degenerate.
 *     Judge unavailable → the deterministic verdict stands and the
 *     result says so (the judge's own fail-honest philosophy).
 *
 * Wired at: skills/graft_tool_harness.js callSkill (every step
 * result's text is screened; a degenerate result fails the step —
 * it can never ride into a "completed" report) and
 * brain/mega_brain.js _directProviderThink (a degenerate seat reply
 * fails over to the next seat and retries — never delivered).
 *
 * What this is NOT: a quality judge for good-faith answers. Short
 * structured results (JSON, status objects) are not prose and are
 * not screened as prose — callers screen text outputs.
 *
 * ── CODE-AWARE SCREENING (parent repair, 2026-10-23 —
 *    gsk-sessions/2026-10-23-vapor-code-fix.md) ──────────────────
 * Re-exam 001 T3 proved the prose-shaped salad rule structurally
 * rejects real code: complete modules from poolside and cohere
 * scored unique-token ratios 0.256 / 0.295 against the 0.30 prose
 * threshold — code legitimately repeats keywords, identifiers and
 * punctuation tokens — and Brain.think failed closed with no build.
 *
 * The screen is now classified before it is strict:
 *
 *   CODE MODE — entered ONLY on positive evidence: the output is
 *   predominantly a fenced code block (fenced code ≥ 50% of the
 *   output's characters), or the caller declares the expected type
 *   (vaporScreen(text, { expectCode: true }) /
 *   { outputType: 'code' }). In code mode the prose token-ratio and
 *   token-n-gram rules DO NOT run on the code. Code is screened by
 *   code-shaped rules instead, all still deterministic:
 *     · empty code block            → empty_code
 *     · unclosed fence (truncation) → truncated_code
 *     · one substantive line repeated ≥ 8 times AND ≥ 40% of all
 *       substantive lines           → loop_repeat (the code salad
 *       signal: real modules measured ≤ 6 repeats, ≤ 3% share)
 *   Any PROSE around the code is still screened by the full prose
 *   rules — code cannot smuggle salad past the screen in its
 *   margins.
 *
 *   PROSE MODE — everything else: the original rules, thresholds
 *   and flags, byte-for-byte the sprint behavior. Nothing loosened.
 *
 *   FAIL-CLOSED: classification needs positive evidence. Anything
 *   that is not confidently code gets the full prose screen — the
 *   strict path is the default, never the exception.
 */

const FAKE_COMPLETION = /^(task completed|completed|done|success|finished|all done)[.!]?$/i;

function _tokenize(t) {
    return t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

// The sprint's prose rules, unchanged: returns a flag or null.
function _proseSaladFlag(tokens) {
    if (tokens.length < 30) return null;
    const unique = new Set(tokens).size;
    if (unique / tokens.length < 0.30) return 'repetition_salad';
    const grams = new Map();
    for (let i = 0; i + 3 <= tokens.length; i++) {
        const g = tokens.slice(i, i + 3).join(' ');
        grams.set(g, (grams.get(g) || 0) + 1);
        if (grams.get(g) >= 5) return 'loop_repeat';
    }
    return null;
}

// Split a text into its fenced code blocks and the prose outside
// them. An opening fence with no closing fence is reported as
// unclosed (truncation) with the would-be code tail preserved.
function _splitFenced(text) {
    const blocks = [];
    let prose = '';
    let rest = text;
    let unclosedTail = null;
    const FENCE = /```[^\n`]*\n/;
    for (;;) {
        const open = rest.match(FENCE);
        if (!open) { prose += rest; break; }
        const openEnd = open.index + open[0].length;
        const after = rest.slice(openEnd);
        const close = after.indexOf('```');
        if (close === -1) {
            prose += rest.slice(0, open.index);
            unclosedTail = after;
            break;
        }
        prose += rest.slice(0, open.index);
        blocks.push(after.slice(0, close));
        rest = after.slice(close + 3);
    }
    return { blocks, prose, unclosedTail };
}

// Code-shaped degenerate checks. Returns a flag or null.
// A substantive line carries real content (>= 4 chars, has a letter
// or digit) — brace-only and punctuation-only lines repeat
// legitimately in real code and are not counted.
function _codeSaladFlag(code) {
    const lines = code.split('\n')
        .map(l => l.trim())
        .filter(l => l.length >= 4 && /[a-z0-9]/i.test(l));
    if (lines.length === 0) return 'empty_code';
    const freq = new Map();
    let max = 0;
    for (const l of lines) {
        const n = (freq.get(l) || 0) + 1;
        freq.set(l, n);
        if (n > max) max = n;
    }
    if (max >= 8 && max / lines.length >= 0.4) return 'loop_repeat';
    return null;
}

function vaporScreen(text, opts = {}) {
    if (typeof text !== 'string') return { degenerate: true, flags: ['not_text'] };
    const t = text.trim();
    if (!t) return { degenerate: true, flags: ['empty'] };
    if (t.length < 24) return { degenerate: true, flags: ['too_short_non_reply'] };
    if (FAKE_COMPLETION.test(t)) return { degenerate: true, flags: ['fake_completion'] };

    // ── Classification (positive evidence only; default = prose) ──
    const expectCode = !!(opts && (opts.expectCode || opts.outputType === 'code'));
    const split = _splitFenced(t);
    const codeChars = split.blocks.reduce((a, b) => a + b.length, 0);
    const predominantlyFenced = split.blocks.length > 0 && codeChars >= 0.5 * t.length;

    // An output that offers fenced block(s) but every block is empty
    // delivered nothing — degenerate in any mode.
    if (split.blocks.length > 0 && split.blocks.every(b => !b.trim())) {
        return { degenerate: true, flags: ['empty_code'], mode: 'code' };
    }

    // A lone unclosed fence only routes to code mode when the code
    // tail dominates the output — a stray ``` in prose stays prose.
    const unclosedDominant = split.unclosedTail !== null && split.unclosedTail.length >= 0.5 * t.length;
    const isCodeMode = expectCode || predominantlyFenced || unclosedDominant;
    if (isCodeMode) {
        if (split.unclosedTail !== null) {
            return { degenerate: true, flags: ['truncated_code'], mode: 'code' };
        }
        const code = expectCode && split.blocks.length === 0 ? t : split.blocks.join('\n');
        const codeFlag = _codeSaladFlag(code);
        if (codeFlag) return { degenerate: true, flags: [codeFlag], mode: 'code' };
        // The prose around the code keeps the full prose rules.
        // (Caller-declared unfenced code has no prose around it —
        // _splitFenced would report the whole text as "prose".)
        const proseAround = expectCode && split.blocks.length === 0 ? '' : split.prose;
        const proseFlag = _proseSaladFlag(_tokenize(proseAround));
        if (proseFlag) return { degenerate: true, flags: [proseFlag], mode: 'code' };
        return { degenerate: false, flags: [], mode: 'code' };
    }

    // ── Prose mode: the sprint's exact rules ──
    const flag = _proseSaladFlag(_tokenize(t));
    if (flag) return { degenerate: true, flags: [flag], mode: 'prose' };
    return { degenerate: false, flags: [], mode: 'prose' };
}

async function screenOutput(text, opts = {}) {
    const det = vaporScreen(text, opts);
    if (det.degenerate) {
        return { ok: false, degenerate: true, layer: 'deterministic', flags: det.flags, mode: det.mode };
    }
    if (opts.skipJudge) {
        return { ok: true, degenerate: false, layer: 'deterministic', flags: [], mode: det.mode };
    }
    try {
        const judge = require('../skills/graft_digestion_judge.js');
        const fn = judge._judgeItem || judge.skill_graft_digestion_judge;
        const r = await fn({ action: 'judge', title: opts.title || 'body output under vapor check', text: String(text).slice(0, 3500), lexical: {} });
        if (r && r.success && r.verdict) {
            return {
                ok: r.verdict === 'keep',
                degenerate: r.verdict !== 'keep',
                layer: 'judge',
                verdict: r.verdict,
                substance: r.substance,
                reason: r.reason,
                provider: r.provider,
            };
        }
        return { ok: true, degenerate: false, layer: 'judge_unavailable', note: 'judge produced no verdict — deterministic screen stands', flags: [] };
    } catch (e) {
        return { ok: true, degenerate: false, layer: 'judge_unavailable', note: e.message, flags: [] };
    }
}

module.exports = { vaporScreen, screenOutput };
