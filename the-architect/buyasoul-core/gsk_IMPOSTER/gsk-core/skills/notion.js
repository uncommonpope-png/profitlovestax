'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_notion(input) {
    const missing = [];
    const v_NOTION_API_KEY = vault.getKey('NOTION_API_KEY'); if (!v_NOTION_API_KEY) missing.push('NOTION_API_KEY');
    if (missing.length > 0) {
        return { skill: 'notion', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _NOTION_API_KEY = vault.getKey('NOTION_API_KEY');
    return { skill: 'notion', plt_affinity: PLT_AFFINITY, success: true, message: 'Notion skill ready — keys configured', keys_available: ['NOTION_API_KEY'], timestamp: Date.now() };
}

module.exports = { skill_notion, PLT_AFFINITY };