'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_trello(input) {
    const missing = [];
    const v_TRELLO_API_KEY = vault.getKey('TRELLO_API_KEY'); if (!v_TRELLO_API_KEY) missing.push('TRELLO_API_KEY');
    const v_TRELLO_TOKEN = vault.getKey('TRELLO_TOKEN'); if (!v_TRELLO_TOKEN) missing.push('TRELLO_TOKEN');
    if (missing.length > 0) {
        return { skill: 'trello', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _TRELLO_API_KEY = vault.getKey('TRELLO_API_KEY');
    const _TRELLO_TOKEN = vault.getKey('TRELLO_TOKEN');
    return { skill: 'trello', plt_affinity: PLT_AFFINITY, success: true, message: 'Trello skill ready — keys configured', keys_available: ['TRELLO_API_KEY', 'TRELLO_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_trello, PLT_AFFINITY };