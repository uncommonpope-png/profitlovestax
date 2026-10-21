'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_spotify_player(input) {
    const missing = [];
    const v_SPOTIFY_CLIENT_ID = vault.getKey('SPOTIFY_CLIENT_ID'); if (!v_SPOTIFY_CLIENT_ID) missing.push('SPOTIFY_CLIENT_ID');
    const v_SPOTIFY_CLIENT_SECRET = vault.getKey('SPOTIFY_CLIENT_SECRET'); if (!v_SPOTIFY_CLIENT_SECRET) missing.push('SPOTIFY_CLIENT_SECRET');
    if (missing.length > 0) {
        return { skill: 'spotify-player', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _SPOTIFY_CLIENT_ID = vault.getKey('SPOTIFY_CLIENT_ID');
    const _SPOTIFY_CLIENT_SECRET = vault.getKey('SPOTIFY_CLIENT_SECRET');
    return { skill: 'spotify-player', plt_affinity: PLT_AFFINITY, success: true, message: 'Spotify Player skill ready — keys configured', keys_available: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'], timestamp: Date.now() };
}

module.exports = { skill_spotify_player, PLT_AFFINITY };