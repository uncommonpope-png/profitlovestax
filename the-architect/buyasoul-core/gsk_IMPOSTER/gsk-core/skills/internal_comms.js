'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_internal_comms(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are an internal communications system. Given the message: "${query}", format and route internal messages between system components, agents, and sub-systems with proper addressing and priority.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used internal_comms skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'internal_comms', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'internal_comms', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_internal_comms, PLT_AFFINITY };
