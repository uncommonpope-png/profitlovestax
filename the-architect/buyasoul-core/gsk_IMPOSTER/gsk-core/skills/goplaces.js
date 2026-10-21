'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_goplaces(input) {
    const missing = [];
    const v_GOOGLE_API_KEY = vault.getKey('GOOGLE_API_KEY'); if (!v_GOOGLE_API_KEY) missing.push('GOOGLE_API_KEY');
    if (missing.length > 0) {
        return { skill: 'goplaces', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _GOOGLE_API_KEY = vault.getKey('GOOGLE_API_KEY');
    return { skill: 'goplaces', plt_affinity: PLT_AFFINITY, success: true, message: 'Google Places skill ready — keys configured', keys_available: ['GOOGLE_API_KEY'], timestamp: Date.now() };
}

module.exports = { skill_goplaces, PLT_AFFINITY };