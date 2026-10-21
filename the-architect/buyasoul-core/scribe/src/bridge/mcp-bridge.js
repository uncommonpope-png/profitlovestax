'use strict';

/**
 * Universal MCP Bridge for SCRIBE
 * 
 * Connects SCRIBE to ANY MCP-compatible agent:
 * - LangChain agents
 * - AutoGen agents
 * - CrewAI agents
 * - ARIA (Grand Soul Kernel)
 * - Any custom MCP server
 * 
 * Protocol: Model Context Protocol (MCP)
 * Transport: HTTP POST with JSON-RPC 2.0
 */

const https = require('https');
const http = require('http');

class MCPBridge {
  constructor(options = {}) {
    this.connections = new Map();
    this.discoveredTools = new Map();
    this.bridgeId = options.bridgeId || `bridge-${Date.now()}`;
    this.timeout = options.timeout || 10000;
  }

  /**
   * Connect to an MCP server
   */
  async connect(url, options = {}) {
    const name = options.name || url;
    
    if (this.connections.has(name)) {
      return { success: false, error: `Already connected to ${name}` };
    }

    try {
      // Initialize connection
      const initResult = await this._rpcRequest(url, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true },
        },
        clientInfo: {
          name: 'SCRIBE',
          version: '1.0.0',
        },
      });

      // Discover tools
      const toolsResult = await this._rpcRequest(url, 'tools/list', {});
      
      const connection = {
        url,
        name,
        initializedAt: new Date().toISOString(),
        serverInfo: initResult.serverInfo || {},
        tools: toolsResult.tools || [],
        status: 'connected',
      };

      this.connections.set(name, connection);
      
      // Index tools for quick lookup
      for (const tool of connection.tools) {
        this.discoveredTools.set(`${name}:${tool.name}`, {
          connectionName: name,
          ...tool,
        });
      }

      return {
        success: true,
        connection: {
          name: connection.name,
          url: connection.url,
          toolCount: connection.tools.length,
          tools: connection.tools.map(t => t.name),
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(name) {
    const connection = this.connections.get(name);
    if (!connection) {
      return { success: false, error: `Not connected to ${name}` };
    }

    try {
      await this._rpcRequest(connection.url, 'disconnect', {});
      this.connections.delete(name);
      
      // Remove tools from index
      for (const [key, tool] of this.discoveredTools) {
        if (tool.connectionName === name) {
          this.discoveredTools.delete(key);
        }
      }

      return { success: true, message: `Disconnected from ${name}` };
    } catch (error) {
      this.connections.delete(name);
      return { success: true, message: `Force disconnected from ${name} (server error: ${error.message})` };
    }
  }

  /**
   * Call a tool on a connected MCP server
   */
  async callTool(connectionName, toolName, args = {}) {
    const connection = this.connections.get(connectionName);
    if (!connection) {
      return { success: false, error: `Not connected to ${connectionName}` };
    }

    try {
      const result = await this._rpcRequest(connection.url, 'tools/call', {
        name: toolName,
        arguments: args,
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get status of all connections
   */
  getStatus() {
    const connections = {};
    for (const [name, conn] of this.connections) {
      connections[name] = {
        url: conn.url,
        status: conn.status,
        toolCount: conn.tools.length,
        tools: conn.tools.map(t => t.name),
        initializedAt: conn.initializedAt,
      };
    }

    return {
      bridgeId: this.bridgeId,
      connectedCount: this.connections.size,
      connections,
      totalDiscoveredTools: this.discoveredTools.size,
    };
  }

  /**
   * List all available tools across all connections
   */
  listTools() {
    const tools = [];
    for (const [key, tool] of this.discoveredTools) {
      tools.push({
        id: key,
        name: tool.name,
        description: tool.description,
        connection: tool.connectionName,
        inputSchema: tool.inputSchema,
      });
    }
    return tools;
  }

  /**
   * Make an RPC request to an MCP server
   */
  _rpcRequest(url, method, params) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      const urlObj = new URL(url);

      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      });

      const req = client.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: this.timeout,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
            } else {
              resolve(parsed.result || {});
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request to ${url} timed out after ${this.timeout}ms`));
      });

      req.write(body);
      req.end();
    });
  }
}

module.exports = { MCPBridge };
