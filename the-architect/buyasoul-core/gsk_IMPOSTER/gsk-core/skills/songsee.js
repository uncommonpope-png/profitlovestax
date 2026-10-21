'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_songsee(input) {
    const missing = [];
    const v_SONGSEE_KEY = vault.getKey('SONGSEE_KEY'); if (!v_SONGSEE_KEY) missing.push('SONGSEE_KEY');
    if (missing.length > 0) {
        return { skill: 'songsee', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _SONGSEE_KEY = vault.getKey('SONGSEE_KEY');
    return { skill: 'songsee', plt_affinity: PLT_AFFINITY, success: true, message: 'SongSee skill ready — keys configured', keys_available: ['SONGSEE_KEY'], timestamp: Date.now() };
}

module.exports = { skill_songsee, PLT_AFFINITY };