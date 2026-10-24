'use strict';
/**
 * COUNCIL MODE — two seats deliberate, a judge reconciles
 * (Wiring Sprint Phase 2, 2026-10-23).
 *
 * Brain.think is single-seat: one rented model answers, and its
 * answer is the body's answer — quota fragility and all (the Oct 23
 * capability exam watched gemini 429 mid-exam while other seats sat
 * idle). For build/judgment-class work that is the wrong shape. The
 * council is the deliberate shape, OPT-IN via Brain.thinkCouncil():
 *
 *   1. PICK the best two LIVE seats from the body's own chain
 *      (vault-resolved; the local keyless seat first when present —
 *      SESHAT_LOCAL_MODEL=off means it normally is not). Liveness is
 *      PROBED with a minimal call, never assumed; a 429 is a dead
 *      seat for this sitting, and the probe walks on.
 *   2. ASK both seats the same question (with the same Seshat deep-
 *      recall context think() would inject — the council deliberates
 *      WITH his memory, not instead of it).
 *   3. RECONCILE through the digestion judge's machinery pattern:
 *      one strict-rubric call on the judge's own seat chain
 *      (skills/graft_digestion_judge.js SEATS), strict JSON or
 *      failure. The judge compares the two answers: substantive
 *      agreement → that answer stands; disagreement → the judge
 *      PICKS with a stated reason, or flags UNCERTAINTY honestly
 *      (both answers returned, no winner invented).
 *
 * Honesty rails: fewer than two live seats → council_unavailable
 * (the caller falls back to single-seat think; a council of one is
 * theater). An unparseable reconciliation → uncertainty flagged,
 * both answers preserved. Nothing here replaces think() for fast
 * single-seat answers — it is the heavy bench, called deliberately.
 */

const https = require('https');
const http = require('http');

// The judge's seat table (mirrors skills/graft_digestion_judge.js).
const SEATS = [
    { id: 'gemini', model: 'gemini-3.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
    { id: 'gemini2', model: 'gemini-3.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
    { id: 'groq', model: 'meta-llama/llama-4-scout-17b-16e-instruct', endpoint: 'https://api.groq.com/openai/v1/chat/completions' },
    { id: 'openai', model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions' },
    { id: 'poolside', model: 'poolside/laguna-s-2.1', endpoint: 'https://inference.poolside.ai/v1/chat/completions' },
    { id: 'cohere', model: 'command-a-03-2025', endpoint: 'https://api.cohere.ai/compatibility/v1/chat/completions' },
];

const RECONCILE_RUBRIC = [
    'You are the reconciliation judge for a two-seat council. Two models answered the same question independently. Your one job: decide what the council\'s answer is.',
    '',
    'If the two answers SUBSTANTIVELY AGREE (same conclusions, same mechanism — wording may differ), return agreement:"agree" and the fuller of the two answers as the council answer (lightly merged only where one plainly completes the other).',
    'If they DISAGREE on a material point, either PICK the stronger answer with a stated reason (agreement:"disagree", chosen:"A" or "B"), or — when the material genuinely cannot be decided from the answers alone — flag it: agreement:"uncertain", chosen:"none", and say what is undecided.',
    'Never invent a third answer. Never hide a disagreement behind a merge.',
    '',
    'Reply with ONLY a JSON object, no markdown, no commentary:',
    '{"agreement":"agree"|"disagree"|"uncertain","chosen":"A"|"B"|"merged"|"none","answer":"<the council answer text>","reason":"<one or two sentences>"}',
].join('\n');

function postJson(endpoint, apiKey, body, timeoutMs = 60000) {
    return new Promise((resolve) => {
        let u;
        try { u = new URL(endpoint); } catch { return resolve({ ok: false, error: 'bad endpoint' }); }
        const payload = JSON.stringify(body);
        const isHttp = u.protocol === 'http:';
        const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) };
        if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
        const req = (isHttp ? http : https).request({
            hostname: u.hostname, port: u.port || (isHttp ? 80 : 443), path: u.pathname + u.search, method: 'POST',
            headers, timeout: timeoutMs,
        }, (res) => {
            let data = '';
            res.on('data', c => { data += c; if (data.length > 2e6) req.destroy(); });
            res.on('end', () => {
                if (res.statusCode !== 200) return resolve({ ok: false, status: res.statusCode, error: ('HTTP ' + res.statusCode + ': ' + data.slice(0, 240)) });
                try {
                    const j = JSON.parse(data);
                    const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
                    if (typeof content === 'string' && content.trim()) return resolve({ ok: true, content });
                    return resolve({ ok: false, error: 'no text content in response' });
                } catch (e) { return resolve({ ok: false, error: 'unparseable response: ' + e.message }); }
            });
        });
        req.on('error', e => resolve({ ok: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
        req.write(payload); req.end();
    });
}

function resolveSeats() {
    let creds = {};
    let localSeat = null;
    try {
        const vc = require('./vault_credentials.js');
        creds = vc.resolveProviderCredentials();
        if (typeof vc.resolveLocalSeat === 'function') localSeat = vc.resolveLocalSeat();
    } catch { /* no vault → no seats */ }
    const all = localSeat ? [localSeat, ...SEATS] : SEATS;
    return all
        .filter(s => s.local || creds[s.id])
        .map(s => ({ id: s.id, model: s.model, endpoint: s.endpoint, local: !!s.local, key: s.local ? null : creds[s.id] }));
}

async function probeSeat(seat, timeoutMs = 25000) {
    const r = await postJson(seat.endpoint, seat.key, {
        model: seat.model,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 8, temperature: 0, stream: false,
    }, timeoutMs);
    return r.ok;
}

function parseReconciliation(content) {
    if (typeof content !== 'string') return null;
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
        const j = JSON.parse(m[0]);
        if (!['agree', 'disagree', 'uncertain'].includes(j.agreement)) return null;
        if (typeof j.answer !== 'string' || !j.answer.trim()) return null;
        return {
            agreement: j.agreement,
            chosen: ['A', 'B', 'merged', 'none'].includes(j.chosen) ? j.chosen : 'none',
            answer: j.answer,
            reason: String(j.reason || '').slice(0, 500),
        };
    } catch { return null; }
}

/**
 * Convene the council on `question`.
 * opts: { context, system, maxTokens, timeoutMs, probeTimeoutMs }
 * Returns { success, answer, agreement, chosen, reason, judgeSeat,
 *           answers: [{seat, model, content}], trace } or
 *         { success:false, error, trace }.
 */
async function councilThink(question, opts = {}) {
    const trace = { seatsConsidered: [], probes: [], seatsSat: [] };
    const seats = resolveSeats();
    trace.seatsConsidered = seats.map(s => s.id);

    const live = [];
    for (const s of seats) {
        if (live.length >= 2) break;
        const ok = await probeSeat(s, opts.probeTimeoutMs || 25000);
        trace.probes.push({ seat: s.id, live: ok });
        if (ok) live.push(s);
    }
    if (live.length < 2) {
        return { success: false, error: 'council_unavailable', detail: `only ${live.length} live seat(s) — a council of one is theater`, trace };
    }
    trace.seatsSat = live.map(s => s.id);

    const system = opts.system || 'Answer the question directly and completely. Be specific and concrete.';
    const userContent = (opts.context ? opts.context + '\n\n' : '') + String(question);
    const answers = [];
    for (const s of live) {
        const r = await postJson(s.endpoint, s.key, {
            model: s.model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
            max_tokens: opts.maxTokens || 1200, temperature: 0.3, stream: false,
        }, opts.timeoutMs || 90000);
        answers.push({ seat: s.id, model: s.model, ok: r.ok, content: r.ok ? r.content : null, error: r.ok ? undefined : r.error });
    }
    const good = answers.filter(a => a.ok);
    if (good.length < 2) {
        return { success: false, error: 'council_seat_failed', detail: 'a seated council member failed to answer', answers, trace };
    }

    // Reconcile: the judge's chain, first seat that returns parseable JSON.
    const judgePrompt = [
        'QUESTION:', String(question).slice(0, 1500), '',
        'ANSWER A (seat ' + good[0].seat + '):', good[0].content.slice(0, 3500), '',
        'ANSWER B (seat ' + good[1].seat + '):', good[1].content.slice(0, 3500),
    ].join('\n');
    for (const s of seats) {
        const r = await postJson(s.endpoint, s.key, {
            model: s.model,
            messages: [{ role: 'system', content: RECONCILE_RUBRIC }, { role: 'user', content: judgePrompt }],
            max_tokens: 1600, temperature: 0, stream: false,
        }, opts.timeoutMs || 90000);
        if (!r.ok) { trace.judgeAttempts = [...(trace.judgeAttempts || []), { seat: s.id, status: 'failed', error: r.error }]; continue; }
        const parsed = parseReconciliation(r.content);
        if (!parsed) { trace.judgeAttempts = [...(trace.judgeAttempts || []), { seat: s.id, status: 'unparseable' }]; continue; }
        trace.judgeAttempts = [...(trace.judgeAttempts || []), { seat: s.id, status: 'answered' }];
        return {
            success: true,
            answer: parsed.answer,
            agreement: parsed.agreement,
            chosen: parsed.chosen,
            reason: parsed.reason,
            judgeSeat: s.id,
            answers: good.map(a => ({ seat: a.seat, model: a.model, content: a.content })),
            trace,
        };
    }
    // No judge could reconcile: flag uncertainty honestly, keep both.
    return {
        success: true,
        answer: null,
        agreement: 'uncertain',
        chosen: 'none',
        reason: 'no seat produced a parseable reconciliation — both answers preserved, no winner invented',
        judgeSeat: null,
        answers: good.map(a => ({ seat: a.seat, model: a.model, content: a.content })),
        trace,
    };
}

module.exports = { councilThink, resolveSeats, probeSeat, _parseReconciliation: parseReconciliation, SEATS };
