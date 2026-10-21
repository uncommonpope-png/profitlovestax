'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_wacli(input) {
    const missing = [];
    const v_WACLI_TOKEN = vault.getKey('WACLI_TOKEN'); if (!v_WACLI_TOKEN) missing.push('WACLI_TOKEN');
    if (missing.length > 0) {
        return { skill: 'wacli', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _WACLI_TOKEN = vault.getKey('WACLI_TOKEN');
    return { skill: 'wacli', plt_affinity: PLT_AFFINITY, success: true, message: 'WA CLI skill ready — keys configured', keys_available: ['WACLI_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_wacli, PLT_AFFINITY };