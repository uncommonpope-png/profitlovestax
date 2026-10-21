'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_himalaya(input) {
    const missing = [];
    const v_HIMALAYA_ACCOUNT = vault.getKey('HIMALAYA_ACCOUNT'); if (!v_HIMALAYA_ACCOUNT) missing.push('HIMALAYA_ACCOUNT');
    if (missing.length > 0) {
        return { skill: 'himalaya', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _HIMALAYA_ACCOUNT = vault.getKey('HIMALAYA_ACCOUNT');
    return { skill: 'himalaya', plt_affinity: PLT_AFFINITY, success: true, message: 'Himalaya Email skill ready — keys configured', keys_available: ['HIMALAYA_ACCOUNT'], timestamp: Date.now() };
}

module.exports = { skill_himalaya, PLT_AFFINITY };