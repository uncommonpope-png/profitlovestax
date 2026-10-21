'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_sonoscli(input) {
    const missing = [];
    const v_SONOS_DISCOVERY = vault.getKey('SONOS_DISCOVERY'); if (!v_SONOS_DISCOVERY) missing.push('SONOS_DISCOVERY');
    if (missing.length > 0) {
        return { skill: 'sonoscli', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _SONOS_DISCOVERY = vault.getKey('SONOS_DISCOVERY');
    return { skill: 'sonoscli', plt_affinity: PLT_AFFINITY, success: true, message: 'Sonos CLI skill ready — keys configured', keys_available: ['SONOS_DISCOVERY'], timestamp: Date.now() };
}

module.exports = { skill_sonoscli, PLT_AFFINITY };