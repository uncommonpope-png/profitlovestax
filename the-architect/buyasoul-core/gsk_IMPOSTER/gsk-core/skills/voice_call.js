'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_voice_call(input) {
    const missing = [];
    const v_TWILIO_ACCOUNT_SID = vault.getKey('TWILIO_ACCOUNT_SID'); if (!v_TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
    const v_TWILIO_AUTH_TOKEN = vault.getKey('TWILIO_AUTH_TOKEN'); if (!v_TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
    if (missing.length > 0) {
        return { skill: 'voice_call', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _TWILIO_ACCOUNT_SID = vault.getKey('TWILIO_ACCOUNT_SID');
    const _TWILIO_AUTH_TOKEN = vault.getKey('TWILIO_AUTH_TOKEN');
    return { skill: 'voice_call', plt_affinity: PLT_AFFINITY, success: true, message: 'Voice Call skill ready — keys configured', keys_available: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_voice_call, PLT_AFFINITY };