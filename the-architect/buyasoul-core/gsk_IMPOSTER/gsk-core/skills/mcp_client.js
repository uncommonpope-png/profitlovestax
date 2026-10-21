'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_mcp_client(input, brain, memory) {
    try {
        const query = typeof input === 'string' ? input : (input.query || input.text || JSON.stringify(input));
        let response = '';
        if (brain && typeof brain.think === 'function') {
            response = await brain.think(`You are an MCP (Model Context Protocol) client. Given the request: "${query}", handle the MCP tool call, format the context, manage server communication, and return structured results.`);
        }
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: `Used mcp_client skill: ${query.substring(0, 200)}`, weight: 0.5 });
        }
        return { skill: 'mcp_client', plt_affinity: PLT_AFFINITY, success: true, result: response || 'Completed', input: query, timestamp: Date.now() };
    } catch (e) {
        return { skill: 'mcp_client', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_mcp_client, PLT_AFFINITY };
