'use strict';

var path = require('path');

class AgentBridge {
  constructor(serverName, serverVersion) {
    this.serverName = serverName || 'buyasoul-core';
    this.serverVersion = serverVersion || '2.0.0';
    this.serverScript = path.join(__dirname, 'mcp-server.js');
  }

  generateConfigFor(agent, options) {
    options = options || {};
    var serverPath = options.serverPath || this.serverScript;
    var envVars = options.env || {};

    var baseConfig = {
      mcpServers: {}
    };

    switch (agent) {
      case 'claude-code':
        baseConfig.mcpServers[this.serverName] = {
          command: 'node',
          args: [serverPath, '--mcp'],
          env: envVars
        };
        return baseConfig;

      case 'cursor':
        baseConfig.mcpServers[this.serverName] = {
          command: 'node',
          args: [serverPath, '--mcp'],
          env: envVars
        };
        return baseConfig;

      case 'cline':
        baseConfig.mcpServers[this.serverName] = {
          command: 'node',
          args: [serverPath, '--mcp'],
          env: envVars,
          disabled: false,
          autoApprove: ['get_soul_status', 'get_plt', 'get_soul_identity'],
          timeout: 60
        };
        return baseConfig;

      case 'copilot':
        return {
          mcpServers: {
            [this.serverName]: {
              type: 'http',
              url: 'http://localhost:' + (options.port || 4001) + '/mcp',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          }
        };

      case 'claude-desktop':
        return {
          mcpServers: {
            [this.serverName]: {
              command: 'node',
              args: [serverPath, '--mcp'],
              env: envVars
            }
          }
        };

      default:
        baseConfig.mcpServers[this.serverName] = {
          command: 'node',
          args: [serverPath, '--mcp'],
          env: envVars
        };
        return baseConfig;
    }
  }

  getConfigInstructions(agent, options) {
    var config = this.generateConfigFor(agent, options);
    var json = JSON.stringify(config, null, 2);
    var instructions = {
      'claude-code': {
        file: '.mcp.json (project) or ~/.claude.json (user)',
        instructions: 'Create or edit ' + config.file + ' and add this block under "mcpServers":\n\n' + json,
        config: config
      },
      'cursor': {
        file: '.cursor/mcp.json (project) or ~/.cursor/mcp.json (global)',
        instructions: 'Create or edit ' + config.file + ' with:\n\n' + json,
        config: config
      },
      'cline': {
        file: 'cline_mcp_settings.json in VS Code globalStorage',
        instructions: 'Open Cline MCP Servers panel, click "Add Server", or edit:\n' + config.file + '\n\n' + json,
        config: config
      },
      'copilot': {
        file: 'VS Code Settings > MCP > Add Server',
        instructions: 'Open VS Code Settings, search for MCP, click "Add Server", use:\n\n' + json,
        config: config
      },
      'claude-desktop': {
        file: 'claude_desktop_config.json',
        instructions: 'Edit claude_desktop_config.json:\n\n' + json,
        config: config
      }
    };
    return instructions[agent] || {
      file: 'agent config file',
      instructions: 'Add this to your MCP server configuration:\n\n' + json,
      config: config
    };
  }
}

module.exports = { AgentBridge: AgentBridge };