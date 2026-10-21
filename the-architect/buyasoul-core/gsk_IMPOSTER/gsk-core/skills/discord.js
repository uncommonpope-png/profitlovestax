'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_discord(input) {
    const missing = [];
    const v_DISCORD_BOT_TOKEN = vault.getKey('DISCORD_BOT_TOKEN'); if (!v_DISCORD_BOT_TOKEN) missing.push('DISCORD_BOT_TOKEN');
    if (missing.length > 0) {
        return { skill: 'discord', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _DISCORD_BOT_TOKEN = vault.getKey('DISCORD_BOT_TOKEN');
    return { skill: 'discord', plt_affinity: PLT_AFFINITY, success: true, message: 'Discord skill ready — keys configured', keys_available: ['DISCORD_BOT_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_discord, PLT_AFFINITY };