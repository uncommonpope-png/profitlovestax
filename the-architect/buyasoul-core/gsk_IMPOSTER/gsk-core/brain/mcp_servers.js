/**
 * MCP Server Configurations
 * Ready-to-use configurations for connecting GSK to top MCP servers
 * Auto-connects servers whose required env vars are present; keyless servers connect unconditionally.
 */
'use strict';

const MCP_SERVERS = {
    filesystem: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-filesystem', process.env.HOME || process.env.USERPROFILE || '/tmp'],
        env: {}
    },
    memory: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-memory'],
        env: {}
    },
    fetch: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-fetch'],
        env: {}
    },
    sequential_thinking: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-sequential-thinking'],
        env: {}
    },
    github: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN || '' }
    },
    brave_search: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@anthropic/server-brave-search'],
        env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY || '' }
    },
    slack: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-slack'],
        env: { SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '', SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || '' }
    },
    postgres: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-postgres', process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres'],
        env: {}
    },
    playwright: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@playwright/mcp'],
        env: {}
    }
};

async function connectDefaultServers(mcpClient) {
    const connected = [];
    for (const [name, config] of Object.entries(MCP_SERVERS)) {
        try {
            // Connect if: no env vars needed, OR all required env vars are present
            const envKeys = Object.values(config.env).filter(v => v !== undefined);
            const allSet = envKeys.length === 0 || envKeys.every(v => v && v.length > 0);
            if (allSet) {
                await mcpClient.addServer(name, config);
                connected.push(name);
            }
        } catch (e) {
            console.log(`[MCP] ${name}: ${e.message}`);
        }
    }
    return connected;
}

module.exports = { MCP_SERVERS, connectDefaultServers };