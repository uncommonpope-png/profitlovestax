'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_gemini(input) {
    const missing = [];
    const v_GEMINI_API_KEY = vault.getKey('GEMINI_API_KEY'); if (!v_GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
    if (missing.length > 0) {
        return { skill: 'gemini', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _GEMINI_API_KEY = vault.getKey('GEMINI_API_KEY');
    return { skill: 'gemini', plt_affinity: PLT_AFFINITY, success: true, message: 'Google Gemini skill ready — keys configured', keys_available: ['GEMINI_API_KEY'], timestamp: Date.now() };
}

module.exports = { skill_gemini, PLT_AFFINITY };