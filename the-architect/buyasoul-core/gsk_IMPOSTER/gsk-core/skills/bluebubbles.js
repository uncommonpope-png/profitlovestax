'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_bluebubbles(input) {
    const missing = [];
    const v_BLUEBUBBLES_URL = vault.getKey('BLUEBUBBLES_URL'); if (!v_BLUEBUBBLES_URL) missing.push('BLUEBUBBLES_URL');
    const v_BLUEBUBBLES_PASSWORD = vault.getKey('BLUEBUBBLES_PASSWORD'); if (!v_BLUEBUBBLES_PASSWORD) missing.push('BLUEBUBBLES_PASSWORD');
    if (missing.length > 0) {
        return { skill: 'bluebubbles', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _BLUEBUBBLES_URL = vault.getKey('BLUEBUBBLES_URL');
    const _BLUEBUBBLES_PASSWORD = vault.getKey('BLUEBUBBLES_PASSWORD');
    return { skill: 'bluebubbles', plt_affinity: PLT_AFFINITY, success: true, message: 'BlueBubbles skill ready — keys configured', keys_available: ['BLUEBUBBLES_URL', 'BLUEBUBBLES_PASSWORD'], timestamp: Date.now() };
}

module.exports = { skill_bluebubbles, PLT_AFFINITY };