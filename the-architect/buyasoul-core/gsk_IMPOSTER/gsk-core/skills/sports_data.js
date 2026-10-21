'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_sports_data(input) {
    const missing = [];
    const v_SPORTS_DATA_API_KEY = vault.getKey('SPORTS_DATA_API_KEY'); if (!v_SPORTS_DATA_API_KEY) missing.push('SPORTS_DATA_API_KEY');
    if (missing.length > 0) {
        return { skill: 'sports_data', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _SPORTS_DATA_API_KEY = vault.getKey('SPORTS_DATA_API_KEY');
    return { skill: 'sports_data', plt_affinity: PLT_AFFINITY, success: true, message: 'Sports Data skill ready — keys configured', keys_available: ['SPORTS_DATA_API_KEY'], timestamp: Date.now() };
}

module.exports = { skill_sports_data, PLT_AFFINITY };