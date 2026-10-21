'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_mcporter(input) {
    const missing = [];
    const v_MCPORTER_TOKEN = vault.getKey('MCPORTER_TOKEN'); if (!v_MCPORTER_TOKEN) missing.push('MCPORTER_TOKEN');
    if (missing.length > 0) {
        return { skill: 'mcporter', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _MCPORTER_TOKEN = vault.getKey('MCPORTER_TOKEN');
    return { skill: 'mcporter', plt_affinity: PLT_AFFINITY, success: true, message: 'MCPorter skill ready — keys configured', keys_available: ['MCPORTER_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_mcporter, PLT_AFFINITY };