'use strict';

var path = require('path');

class ToolRouter {
  constructor(core) {
    this.core = core;
    this.internalTools = new Map();
    this.externalServers = new Map();
    this._registerInternalTools();
  }

  _registerInternalTools() {
    this.registerInternal('get_soul_status', {
      name: 'get_soul_status',
      description: 'Get the current BUYaSOUL Core status — version, components, PLT scores, soul identity',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }, function(args) {
      if (this.core && this.core.getStatus) return this.core.getStatus();
      return { error: 'Core not initialized' };
    }.bind(this));

    this.registerInternal('get_plt', {
      name: 'get_plt',
      description: 'Get current PLT (Profit + Love - Tax) scores and archetype information',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }, function(args) {
      if (this.core && this.core.plt) return this.core.plt.getState();
      return { error: 'PLT Engine not initialized' };
    }.bind(this));

    this.registerInternal('get_plt_history', {
      name: 'get_plt_history',
      description: 'Get recent PLT scoring history',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'number', description: 'Number of history entries (default 10)' } },
        required: []
      }
    }, function(args) {
      if (this.core && this.core.plt) return this.core.plt.getHistory(args.limit || 10);
      return { error: 'PLT Engine not initialized' };
    }.bind(this));

    this.registerInternal('get_god_alignment', {
      name: 'get_god_alignment',
      description: 'Get alignment with each of the 4 Gods Council members',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }, function(args) {
      if (this.core && this.core.plt) return this.core.plt.getGodAlignment();
      return { error: 'PLT Engine not initialized' };
    }.bind(this));

    this.registerInternal('get_bible_wisdom', {
      name: 'get_bible_wisdom',
      description: 'Query the Profit Bible for wisdom on a topic',
      inputSchema: {
        type: 'object',
        properties: { topic: { type: 'string', description: 'Topic to query (profit, love, tax, memory, soul, consciousness, building, connectivity, assembly, signature)' } },
        required: ['topic']
      }
    }, function(args) {
      if (this.core && this.core.bible) return { wisdom: this.core.bible.getWisdom(args.topic) };
      return { error: 'Profit Bible not initialized' };
    }.bind(this));

    this.registerInternal('get_bible_chapter', {
      name: 'get_bible_chapter',
      description: 'Get a specific chapter from the Profit Bible (1-10)',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'number', description: 'Chapter ID (1-10)' } },
        required: ['id']
      }
    }, function(args) {
      if (this.core && this.core.bible) return this.core.bible.getChapter(args.id);
      return { error: 'Profit Bible not initialized' };
    }.bind(this));

    this.registerInternal('get_soul_identity', {
      name: 'get_soul_identity',
      description: 'Get the assembled soul identity — name, archetype, voice, bio, boundaries',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }, function(args) {
      if (this.core && this.core.personality) return this.core.personality;
      return { error: 'Personality not initialized' };
    }.bind(this));

    this.registerInternal('get_mechanics', {
      name: 'get_mechanics',
      description: 'List all 12 Sacred Mechanics and their active status',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }, function(args) {
      if (this.core && this.core.mechanics) return { mechanics: this.core.mechanics.list, active: this.core.mechanics.getActive().length };
      return { error: 'Sacred Mechanics not initialized' };
    }.bind(this));

    this.registerInternal('score_action', {
      name: 'score_action',
      description: 'Score an action on Profit / Love / Tax dimensions.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Description of the action being scored' },
          profitImpact: { type: 'number', description: 'Profit impact (-1 to 1)', default: 0 },
          loveImpact: { type: 'number', description: 'Love impact (-1 to 1)', default: 0 },
          taxImpact: { type: 'number', description: 'Tax impact (-1 to 1)', default: 0 }
        },
        required: ['action']
      }
    }, function(args) {
      if (this.core && this.core.plt) return this.core.plt.score(args.action, args);
      return { error: 'PLT Engine not initialized' };
    }.bind(this));

    this.registerInternal('get_sacred_mechanic', {
      name: 'get_sacred_mechanic',
      description: 'Evaluate a specific sacred mechanic by ID (1-12)',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'number', description: 'Mechanic ID (1-12)' }, context: { type: 'object', description: 'Evaluation context' } },
        required: ['id']
      }
    }, function(args) {
      if (this.core && this.core.mechanics) return this.core.mechanics.evaluate(args.id, args.context || {});
      return { error: 'Sacred Mechanics not initialized' };
    }.bind(this));

    this.registerInternal('run_installer', {
      name: 'run_installer',
      description: 'Run the BUYaSOUL Core installer — PC scan, diagnosis, personality generation',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }, async function(args) {
      if (this.core && this.core.installer) return await this.core.installer.getSummary();
      return { error: 'Installer not initialized' };
    }.bind(this));
  }

  registerInternal(name, toolDef, handler) {
    this.internalTools.set(name, { definition: toolDef, handler: handler });
  }

  async listTools() {
    var tools = [];
    this.internalTools.forEach(function(tool) {
      tools.push(tool.definition);
    });
    this.externalServers.forEach(function(client, name) {
      if (client.listTools) {
        var externalTools = client.listTools();
        externalTools.forEach(function(t) {
          t.name = name + '/' + t.name;
          tools.push(t);
        });
      }
    });
    return tools;
  }

  async callTool(fullName, args) {
    var slashIdx = fullName.indexOf('/');
    if (slashIdx === -1) {
      var tool = this.internalTools.get(fullName);
      if (!tool) throw new Error('Tool not found: ' + fullName);
      return tool.handler(args);
    } else {
      var serverName = fullName.substring(0, slashIdx);
      var toolName = fullName.substring(slashIdx + 1);
      var client = this.externalServers.get(serverName);
      if (!client) throw new Error('External server not found: ' + serverName);
      if (client.callTool) return client.callTool(toolName, args);
      throw new Error('Server does not support tool calls: ' + serverName);
    }
  }

  addExternalServer(name, client) {
    this.externalServers.set(name, client);
  }

  removeExternalServer(name) {
    this.externalServers.delete(name);
  }

  listExternalServers() {
    var result = [];
    this.externalServers.forEach(function(client, name) {
      result.push({ name: name, toolCount: client.listTools ? client.listTools().length : 0 });
    });
    return result;
  }
}

module.exports = { ToolRouter: ToolRouter };