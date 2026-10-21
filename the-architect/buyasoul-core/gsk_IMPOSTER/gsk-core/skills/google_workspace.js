'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_google_workspace(input) {
    const missing = [];
    const v_GOOGLE_CLIENT_ID = vault.getKey('GOOGLE_CLIENT_ID'); if (!v_GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
    const v_GOOGLE_CLIENT_SECRET = vault.getKey('GOOGLE_CLIENT_SECRET'); if (!v_GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
    if (missing.length > 0) {
        return { skill: 'google_workspace', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _GOOGLE_CLIENT_ID = vault.getKey('GOOGLE_CLIENT_ID');
    const _GOOGLE_CLIENT_SECRET = vault.getKey('GOOGLE_CLIENT_SECRET');
    return { skill: 'google_workspace', plt_affinity: PLT_AFFINITY, success: true, message: 'Google Workspace skill ready — keys configured', keys_available: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], timestamp: Date.now() };
}

module.exports = { skill_google_workspace, PLT_AFFINITY };