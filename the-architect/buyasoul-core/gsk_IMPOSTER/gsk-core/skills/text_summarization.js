'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_text_summarization(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are a text summarization engine. Given the text: "${query}", generate concise, accurate summaries that capture key points, main arguments, and essential details while preserving meaning.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used text_summarization skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'text_summarization', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'text_summarization', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_text_summarization, PLT_AFFINITY };
