'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_openhue(input) {
    const missing = [];
    const v_PHILIPS_HUE_IP = vault.getKey('PHILIPS_HUE_IP'); if (!v_PHILIPS_HUE_IP) missing.push('PHILIPS_HUE_IP');
    const v_PHILIPS_HUE_USER = vault.getKey('PHILIPS_HUE_USER'); if (!v_PHILIPS_HUE_USER) missing.push('PHILIPS_HUE_USER');
    if (missing.length > 0) {
        return { skill: 'openhue', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _PHILIPS_HUE_IP = vault.getKey('PHILIPS_HUE_IP');
    const _PHILIPS_HUE_USER = vault.getKey('PHILIPS_HUE_USER');
    return { skill: 'openhue', plt_affinity: PLT_AFFINITY, success: true, message: 'Philips Hue skill ready — keys configured', keys_available: ['PHILIPS_HUE_IP', 'PHILIPS_HUE_USER'], timestamp: Date.now() };
}

module.exports = { skill_openhue, PLT_AFFINITY };