'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_scientific_research(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are a scientific research assistant. Given the research question: "${query}", conduct literature analysis, formulate hypotheses, design experiments, analyze data, and draw evidence-based conclusions.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used scientific_research skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'scientific_research', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'scientific_research', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_scientific_research, PLT_AFFINITY };
