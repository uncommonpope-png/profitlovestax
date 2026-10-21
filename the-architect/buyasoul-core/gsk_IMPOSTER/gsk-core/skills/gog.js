'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_gog(input) {
    const missing = [];
    const v_GOG_API_KEY = vault.getKey('GOG_API_KEY'); if (!v_GOG_API_KEY) missing.push('GOG_API_KEY');
    if (missing.length > 0) {
        return { skill: 'gog', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _GOG_API_KEY = vault.getKey('GOG_API_KEY');
    return { skill: 'gog', plt_affinity: PLT_AFFINITY, success: true, message: 'GOG.com skill ready — keys configured', keys_available: ['GOG_API_KEY'], timestamp: Date.now() };
}

module.exports = { skill_gog, PLT_AFFINITY };