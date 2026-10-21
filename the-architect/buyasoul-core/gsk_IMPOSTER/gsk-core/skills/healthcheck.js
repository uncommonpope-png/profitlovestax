'use strict';

const { vault } = require('../brain/api_vault.js');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_healthcheck(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are a health check system. Given the endpoint or service: "${query}", perform HTTP health checks, analyze response status, measure latency, and report service availability.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used healthcheck skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'healthcheck', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'healthcheck', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_healthcheck, PLT_AFFINITY };
