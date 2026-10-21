'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_nano_pdf(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are a nano PDF generator. Given the content: "${query}", generate lightweight, minimal PDF documents optimized for size and quick rendering.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used nano-pdf skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'nano-pdf', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'nano-pdf', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_nano_pdf, PLT_AFFINITY };
