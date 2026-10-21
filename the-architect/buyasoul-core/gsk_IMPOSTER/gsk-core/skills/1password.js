'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_1password(input) {
    const missing = [];
    const v_OP_SERVICE_ACCOUNT_TOKEN = vault.getKey('OP_SERVICE_ACCOUNT_TOKEN'); if (!v_OP_SERVICE_ACCOUNT_TOKEN) missing.push('OP_SERVICE_ACCOUNT_TOKEN');
    if (missing.length > 0) {
        return { skill: '1password', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _OP_SERVICE_ACCOUNT_TOKEN = vault.getKey('OP_SERVICE_ACCOUNT_TOKEN');
    return { skill: '1password', plt_affinity: PLT_AFFINITY, success: true, message: '1Password skill ready — keys configured', keys_available: ['OP_SERVICE_ACCOUNT_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_1password, PLT_AFFINITY };