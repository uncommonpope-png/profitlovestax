/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MCP INDEX.JS — MCP Server Starter for Grand Soul Kernel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Export factory function to create and start the MCP server with
 * kernel system connections.
 *
 * Usage:
 *   const { startMCPServer } = require('./src/mcp');
 *   const server = await startMCPServer(kernelSystems);
 *
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { MCPServer } = require('./mcp_server.js');

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULTS = {
    port: 3001,
    host: '0.0.0.0',
};

// =============================================================================
// START MCP SERVER — Factory function
// =============================================================================

async function startMCPServer(kernelSystems = {}, options = {}) {
    const config = { ...DEFAULTS, ...options };

    const server = new MCPServer(kernelSystems, config);
    const started = await server.start();

    return {
        server,
        started,
        port: config.port,
        url: `http://${config.host}:${config.port}`,
        stop: () => server.stop(),
    };
}

// =============================================================================
// GET STATUS — Check if server is running
// =============================================================================

function getServerStatus(server) {
    if (!server) return { running: false };
    return {
        running: server._running || false,
        port: server.port,
        uptime: server._running ? Date.now() - server._startTime : 0,
        stats: server.stats,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    MCPServer,
    startMCPServer,
    getServerStatus,
};
