'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_gh_issues(input) {
    const missing = [];
    const v_GITHUB_TOKEN = vault.getKey('GITHUB_TOKEN'); if (!v_GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
    if (missing.length > 0) {
        return { skill: 'gh-issues', plt_affinity: PLT_AFFINITY, success: false, needs_key: true, missing_keys: missing, message: `Missing API keys: ${missing.join(', ')} — add to API Vault (src/data/api_vault.json) or set env vars`, timestamp: Date.now() };
    }
    const _GITHUB_TOKEN = vault.getKey('GITHUB_TOKEN');
    return { skill: 'gh-issues', plt_affinity: PLT_AFFINITY, success: true, message: 'GitHub Issues skill ready — keys configured', keys_available: ['GITHUB_TOKEN'], timestamp: Date.now() };
}

module.exports = { skill_gh_issues, PLT_AFFINITY };