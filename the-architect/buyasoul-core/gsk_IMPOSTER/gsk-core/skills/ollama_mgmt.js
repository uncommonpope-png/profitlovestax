'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_ollama_mgmt(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are an Ollama management tool. Given the request: "${query}", manage Ollama models including pulling, creating, listing, deleting models, and managing model files and Modelfiles.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used ollama_mgmt skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'ollama_mgmt', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'ollama_mgmt', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_ollama_mgmt, PLT_AFFINITY };
