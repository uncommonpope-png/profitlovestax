'use strict';
/**
 * VISION SEAT (Assembly Phase 6 — SENSES)
 *
 * Image input for the body. The shipped body had NO working vision
 * path: deep_tool_use._inspectUI described a screenshot in text and
 * asked the (text) brain to imagine it — the image bytes never
 * reached a model. This module is the real seat:
 *
 *   - seats are tried in chain order, credentials resolved
 *     vault-first via ./vault_credentials.js (values never logged);
 *   - CAPABILITY MAP (Assembly Phase 7): every seat carries a static
 *     `vision` capability mark. Seats marked vision:false are SKIPPED,
 *     never probed blind — Poolside's Laguna seat is text-only, proven
 *     live in Phase 6 (HTTP 400 "does not support multimodal inputs"),
 *     so it is marked false here instead of burning a doomed call on
 *     every image. Order below follows the post-Poolside default
 *     chain (gemini → groq → openai → poolside).
 *   - each seat receives the image as an OpenAI-style image_url
 *     content part over a DIRECT https POST — :20128 is never
 *     involved, nothing is spawned, nothing is proxied;
 *   - a seat that rejects the image modality (or errors) is recorded
 *     in `attempts` and the next seat is tried; if no seat answers,
 *     the result says so plainly (success:false) with every attempt
 *     listed — the path stays ready for a vision-capable seat.
 */

const https = require('https');

const SEATS = [
    { id: 'gemini', model: 'gemini-3.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', vision: true, visionNote: 'multimodal model — answered the Phase 6 probe exactly' },
    { id: 'groq', model: 'meta-llama/llama-4-scout-17b-16e-instruct', endpoint: 'https://api.groq.com/openai/v1/chat/completions', vision: true, visionNote: 'vision model; seat used only for vision, text chain unchanged' },
    { id: 'openai', model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions', vision: true, visionNote: 'multimodal model' },
    { id: 'poolside', model: 'poolside/laguna-s-2.1', endpoint: 'https://inference.poolside.ai/v1/chat/completions', vision: false, visionNote: 'TEXT-ONLY — proven live 2026-10-21 (Phase 6): endpoint rejects image parts, HTTP 400 "This model does not support multimodal (image/video/audio) inputs." Never probed for vision; also note the hosted service shuts down 2026-10-31.' },
];

function postJson(endpoint, apiKey, body, timeoutMs = 60000) {
    return new Promise((resolve) => {
        let u;
        try { u = new URL(endpoint); } catch { return resolve({ ok: false, error: 'bad endpoint' }); }
        const payload = JSON.stringify(body);
        const req = https.request({
            hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey, 'Content-Length': Buffer.byteLength(payload) },
            timeout: timeoutMs,
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

function seatStatus() {
    let creds = {};
    try { creds = require('./vault_credentials.js').resolveProviderCredentials(); } catch { /* no creds → all seats dark */ }
    return SEATS.map(s => ({ provider: s.id, model: s.model, vision: s.vision, visionNote: s.visionNote, credentialAvailable: !!creds[s.id] }));
}

async function describeImage(input = {}) {
    const imageUrl = input.imageUrl || input.image_url || null;
    const imageDataUrl = input.imageDataUrl || input.dataUrl || null;
    const image = imageDataUrl || imageUrl;
    if (!image) return { success: false, error: 'image required (imageUrl or imageDataUrl)', attempts: [] };
    const question = String(input.question || 'Describe this image in detail. Name any text, colors, and objects you can see.').slice(0, 500);
    let creds = {};
    try { creds = require('./vault_credentials.js').resolveProviderCredentials(); } catch { /* handled below */ }
    const attempts = [];
    for (const seat of SEATS) {
        // Capability map first: a seat marked text-only is never probed.
        if (seat.vision === false) { attempts.push({ provider: seat.id, model: seat.model, status: 'skipped', error: 'seat marked text-only in the capability map — not probed' }); continue; }
        const key = creds[seat.id];
        if (!key) { attempts.push({ provider: seat.id, model: seat.model, status: 'skipped', error: 'no credential in vault/env' }); continue; }
        const body = {
            model: seat.model,
            messages: [{ role: 'user', content: [{ type: 'text', text: question }, { type: 'image_url', image_url: { url: image } }] }],
            max_tokens: 400, temperature: 0.2, stream: false,
        };
        const r = await postJson(seat.endpoint, key, body, input.timeoutMs || 60000);
        if (r.ok) {
            attempts.push({ provider: seat.id, model: seat.model, status: 'answered' });
            return { success: true, provider: seat.id, model: seat.model, description: r.content, attempts };
        }
        attempts.push({ provider: seat.id, model: seat.model, status: 'failed', error: r.error });
    }
    return { success: false, error: 'no vision-capable seat answered', attempts };
}

module.exports = { describeImage, seatStatus, SEATS };
