'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_performance_optimize(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are a performance optimization expert. Given the code or system: "${query}", analyze performance bottlenecks, suggest optimizations, benchmark critical paths, and recommend caching, parallelization, or algorithmic improvements.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used performance_optimize skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'performance_optimize', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'performance_optimize', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_performance_optimize, PLT_AFFINITY };
