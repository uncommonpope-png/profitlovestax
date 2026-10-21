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
 *   key        : scrypt(VAULT_PASSPHRASE || default, "buyasoul-workbench-vault", 32)
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
];

let cachedKeyPass = null;
let cachedKeyMaterial = null;

function vaultKeyMaterial() {
    const pass = process.env.VAULT_PASSPHRASE || 'buyasoul-vault-default-passphrase';
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
        const v = vault[field] || process.env[field];
        if (v) creds[field.replace(/_API_KEY$/, '').toLowerCase()] = String(v);
    }
    return creds;
}

module.exports = { readWorkbenchVault, resolveProviderCredentials, vaultPath };
