'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_eightctl(input) {
    const missing = [];
    const v_EIGHTCTL_TOKEN = vault.getKey('EIGHTCTL_TOKEN'); if (!v_EIGHTCTL_TOKEN) missing.push('EIGHTCTL_TOKEN');
    if (missing.length > 0) {
        return { skill: 'eightctl', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _EIGHTCTL_TOKEN = vault.getKey('EIGHTCTL_TOKEN');
    return { skill: 'eightctl', plt_affinity: PLT_AFFINITY, success: true, message: 'Eight Control skill ready — keys configured', keys_available: ['EIGHTCTL_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_eightctl, PLT_AFFINITY };