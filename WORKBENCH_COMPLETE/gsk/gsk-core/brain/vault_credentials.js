'use strict';

/**
 * VAULT_CREDENTIALS.JS — shared workbench-vault reader for the GSK tree
 * (Assembly Phase 1, 2026-10-20).
 *
 * The daemon brain (MegaBrain) previously had NO path to the provider
 * keys sitting in the workbench vault one process away — it routed only
 * to OmniRoute (:20128) and returned null when the router was absent
 * (Acceptance Test 2). This module gives the daemon the SAME vault-first
 * credential resolution the workbench server uses:
 *
 *   vault file : WORKBENCH_COMPLETE/workbench/.vault/vault.json
 *                (override: GSK_VAULT_PATH)
 *   format     : {"__vault":"aes-256-gcm","iv","tag","data"} (base64),
 *                legacy plaintext JSON still reads transparently
 *   key        : scrypt(VAULT_PASSPHRASE (env-only; throws when unset), "buyasoul-workbench-vault", 32)
 *                — byte-identical to workbench/server.ts vaultKeyMaterial()
 *
 * Values are never logged here or by callers.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEY_FIELDS = [
    'POOLSIDE_API_KEY',
    'GEMINI_API_KEY',
    'GROQ_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'NVIDIA_API_KEY',
    // Added 2026-10-22 (look-loop revision-seat rewire): lets the
    // revision chain resolve creds.cohere from vault/env — Cohere
    // command-a-03-2025 is revision fallback #2 in brain/look_loop.js.
    // Purely additive: existing consumers look up their own provider
    // ids and ignore the extra map entry.
    'COHERE_API_KEY',
    // Added 2026-10-22 (vault recovery): a SECOND Gemini key recovered
    // from the original Oct-20 sealed vault, mapped to creds.gemini2
    // below so chains can rotate Gemini→Gemini when the main key's
    // daily quota burns.
    'GEMINI_API_KEY_2',
];

let cachedKeyPass = null;
let cachedKeyMaterial = null;

function vaultKeyMaterial() {
    const pass = process.env.VAULT_PASSPHRASE;
    if (!pass) throw new Error('VAULT_PASSPHRASE not set - refusing to derive vault key material');
    // scrypt is deliberately expensive; the passphrase is process-fixed,
    // so derive once (same memoization as workbench op 5).
    if (cachedKeyMaterial && cachedKeyPass === pass) return cachedKeyMaterial;
    cachedKeyMaterial = crypto.scryptSync(pass, 'buyasoul-workbench-vault', 32);
    cachedKeyPass = pass;
    return cachedKeyMaterial;
}

function vaultPath() {
    if (process.env.GSK_VAULT_PATH) return process.env.GSK_VAULT_PATH;
    return path.resolve(__dirname, '..', '..', '..', 'workbench', '.vault', 'vault.json');
}

function decryptVaultObject(raw) {
    if (!raw || raw.__vault !== 'aes-256-gcm') return raw; // legacy plaintext
    const decipher = crypto.createDecipheriv('aes-256-gcm', vaultKeyMaterial(), Buffer.from(String(raw.iv), 'base64'));
    decipher.setAuthTag(Buffer.from(String(raw.tag), 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.from(String(raw.data), 'base64')), decipher.final()]);
    return JSON.parse(plain.toString('utf8'));
}

/** Read + decrypt the workbench vault. Returns {} on any failure. */
function readWorkbenchVault() {
    try {
        const p = vaultPath();
        if (!fs.existsSync(p)) return {};
        return decryptVaultObject(JSON.parse(fs.readFileSync(p, 'utf8'))) || {};
    } catch (e) {
        return {};
    }
}

/**
 * Vault-first, env-fallback provider credentials.
 * Returns a lowercase provider map, e.g. { poolside, gemini, groq, openai }.
 */
function resolveProviderCredentials() {
    const vault = readWorkbenchVault();
    const creds = {};
    for (const field of KEY_FIELDS) {
        if (field === 'GEMINI_API_KEY_2') continue; // mapped to gemini2 below
        const v = vault[field] || process.env[field];
        if (v) creds[field.replace(/_API_KEY$/, '').toLowerCase()] = String(v);
    }
    // GEMINI_API_KEY_2 does not fit the _API_KEY strip pattern; map it
    // explicitly to the gemini2 seat id.
    const g2 = vault.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_2;
    if (g2) creds.gemini2 = String(g2);
    return creds;
}

/**
 * Seshat's sovereign local seat (Local Mind Phase 1, 2026-10-22).
 *
 * A small Qwen model served on-box by llama.cpp (llama-server) — NO
 * key exists for it and none is required: the endpoint is loopback
 * and keyless by construction, so this resolver never demands a
 * credential for it. Rented seats keep dying (daily quota burns,
 * provider shutdowns); her judge's first seat must be one nobody can
 * revoke. Consumers that resolve their own provider ids ignore this
 * helper entirely — only seat chains that opt in (the digestion
 * judge) prepend it.
 *
 *   endpoint : SESHAT_LOCAL_ENDPOINT || http://127.0.0.1:18222/v1/chat/completions
 *   model    : SESHAT_LOCAL_MODEL_NAME || qwen2.5-1.5b-instruct-q4_k_m
 *   disable  : SESHAT_LOCAL_MODEL=off → returns null (rented chain only)
 */
const LOCAL_SEAT_DEFAULTS = {
    endpoint: 'http://127.0.0.1:18222/v1/chat/completions',
    model: 'qwen2.5-1.5b-instruct-q4_k_m',
};

function resolveLocalSeat() {
    if (String(process.env.SESHAT_LOCAL_MODEL || '').toLowerCase() === 'off') return null;
    return {
        id: 'local',
        model: process.env.SESHAT_LOCAL_MODEL_NAME || LOCAL_SEAT_DEFAULTS.model,
        endpoint: process.env.SESHAT_LOCAL_ENDPOINT || LOCAL_SEAT_DEFAULTS.endpoint,
        local: true,
    };
}


/**
 * Second-stage offline digestion judge (Round 5 SHIP, 2026-10-29).
 * v5 is the official offline/second-stage judge artifact.
 * The :18222 seat remains the clean 1.5B base for live conversation and tools;
 * the judge resolves to v5 via SESHAT_JUDGE_MODEL_PATH / SESHAT_JUDGE_ENDPOINT.
 */
const JUDGE_SEAT_DEFAULTS = {
    endpoint: 'http://127.0.0.1:18223/v1/chat/completions',
    model: 'qwen2.5-1.5b-instruct-v5-q4_k_m',
    modelPath: path.resolve('C:\\Users\\uncom\\Downloads\\PROFIT_HF\\base_gguf\\qwen2.5-1.5b-instruct-v5-q4_k_m.gguf'),
};

function resolveJudgeSeat() {
    if (String(process.env.SESHAT_JUDGE_MODEL || '').toLowerCase() === 'off') return null;
    return {
        id: 'local',
        model: process.env.SESHAT_JUDGE_MODEL_NAME || JUDGE_SEAT_DEFAULTS.model,
        endpoint: process.env.SESHAT_JUDGE_ENDPOINT || JUDGE_SEAT_DEFAULTS.endpoint,
        modelPath: process.env.GSK_JUDGE_MODEL_PATH || process.env.SESHAT_JUDGE_MODEL_PATH || JUDGE_SEAT_DEFAULTS.modelPath,
        local: true,
    };
}

module.exports = { readWorkbenchVault, resolveProviderCredentials, vaultPath, resolveLocalSeat, LOCAL_SEAT_DEFAULTS, resolveJudgeSeat, JUDGE_SEAT_DEFAULTS };
