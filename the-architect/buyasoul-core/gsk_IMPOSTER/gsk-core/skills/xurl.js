'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_xurl(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are an xURL tool. Given the URL request: "${query}", fetch, parse, and transform web content from URLs. Handle redirects, content extraction, and format conversion.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used xurl skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'xurl', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'xurl', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_xurl, PLT_AFFINITY };
