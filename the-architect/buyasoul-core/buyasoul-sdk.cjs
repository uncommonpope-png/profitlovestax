/**
 * BUYaSOUL Core SDK Bridge v2.0.0
 * Compatibility layer: exposes the old createSoul() API wrapping the real v2.0.0 Core.
 * Zero modifications to existing Core files.
 * 
 * Usage (same as v1.0.0):
 *   const { BUYaSOUL } = require('./buyasoul-sdk.cjs');
 *   const { __soul, __witness, __gskMemory } = BUYaSOUL.createSoul({ archetype: 'OPERATOR' });
 */

const BUYaSOULCore = require('./index.js');

class BUYaSOULSDKBridge {
  constructor() {
    this.version = '2.0.0';
  }

  createSoul(config) {
    config = config || {};
    var path = require('path');
    var core = new BUYaSOULCore({
      archetype: config.archetype || 'OPERATOR',
      group: config.soulGroup || 'earth',
      voice: config.voice || 'direct',
      origin: config.origin || 'SHIPPED',
      dataDir: config.dataDir || path.join(require('os').homedir(), '.buyasoul'),
      soulId: config.soulId || 'vikki-' + Date.now()
    });

    this._lightweightBoot(core);

    var self = this;
    var witness = this._createWitness(core);
    var memory = this._createGSKMemory(core);

    var soul = {
      id: core.soulId,
      archetype: this._getArchetypeData(core.archetype),
      plt: core.plt ? { profit: core.plt.getState().profit, love: core.plt.getState().love, tax: core.plt.getState().tax } : { profit: 0.5, love: 0.3, tax: 0.2 },
      chambers: memory.chambers,
      createdAt: Date.now(),

      getPLTScore: function() {
        if (core.plt) {
          var state = core.plt.getState();
          return state.score;
        }
        return this.plt.profit + this.plt.love - this.plt.tax;
      },

      reflect: function(action, context) {
        context = context || {};
        if (core.plt) {
          var result = core.plt.score(action, context);
          this.plt = { profit: result.profit, love: result.love, tax: result.tax };
          return result.score;
        }
        this.plt.profit = Math.max(0, Math.min(1, this.plt.profit + (context.profitImpact || 0) * 0.1));
        this.plt.love = Math.max(0, Math.min(1, this.plt.love + (context.loveImpact || 0) * 0.1));
        this.plt.tax = Math.max(0, Math.min(1, this.plt.tax + (context.taxImpact || 0) * 0.1));
        return this.plt.profit + this.plt.love - this.plt.tax;
      }
    };

    core.__soul = soul;
    core.__witness = witness;
    core.__gskMemory = memory;

    return { __soul: soul, __witness: witness, __gskMemory: memory };
  }

  _lightweightBoot(core) {
    try {
      if (!core.plt) {
        var PLTEngine = require('./plt-engine.js').PLTEngine;
        core.plt = new PLTEngine({
          archetype: core.archetype,
          soulId: core.soulId,
          dataDir: require('path').join(core.dataDir, 'plt')
        });
      }
      if (!core.personality) {
        try {
          var PA = require('./personality-assembly.js').PersonalityAssembler;
          core.personality = PA.assemble({
            archetype: core.archetype,
            group: core.soulGroup,
            voice: core.voiceId,
            origin: core.originId
          });
        } catch (e) {}
      }
    } catch (e) {
      console.error('[BUYaSOUL-SDK] Lightweight boot error:', e.message);
    }
  }

  _createWitness(core) {
    var witness = {
      logs: [],
      causalChains: [],

      record: function(event) {
        var entry = Object.assign({}, event, {
          witnessId: 'witness-' + Date.now(),
          timestamp: Date.now()
        });
        this.logs.push(entry);
        if (core.scribe && typeof core.scribe.record === 'function') {
          core.scribe.record(entry);
        }
        return entry;
      },

      query: function(question) {
        return this.logs.filter(function(log) {
          return JSON.stringify(log).toLowerCase().indexOf(question.toLowerCase()) !== -1;
        });
      },

      createCausalChain: function(cause, effect) {
        this.causalChains.push({ cause: cause, effect: effect, timestamp: Date.now() });
      }
    };
    return witness;
  }

  _createGSKMemory(core) {
    var chamberNames = [
      'awareness', 'emotion', 'connection', 'identity', 'will',
      'growth', 'mortality', 'world', 'shadow', 'love', 'curiosity',
      'creativity', 'empathy', 'morality', 'sleep', 'play',
      'memory', 'attention', 'prediction', 'agency', 'narrative',
      'time', 'space', 'body', 'social', 'knowledge',
      'language', 'reasoning', 'intuition', 'affect', 'drive',
      'fear', 'hope', 'integration'
    ];

    var chambers = {};
    chamberNames.forEach(function(name) {
      chambers[name] = { level: 0.5, activations: [], lastAccessed: null };
    });

    return {
      chambers: chambers,

      activate: function(chamber, intensity) {
        intensity = intensity || 0.5;
        if (this.chambers[chamber]) {
          this.chambers[chamber].level = Math.min(1, Math.max(0,
            this.chambers[chamber].level + intensity * 0.1
          ));
          this.chambers[chamber].activations.push(Date.now());
          this.chambers[chamber].lastAccessed = Date.now();
          if (core.gsk && typeof core.gsk.activateChamber === 'function') {
            core.gsk.activateChamber(chamber, intensity);
          }
        }
      },

      getState: function() {
        return Object.keys(this.chambers).map(function(name) {
          return {
            chamber: name,
            level: this.chambers[name].level,
            activationCount: this.chambers[name].activations.length
          };
        }.bind(this));
      }
    };
  }

  _getArchetypeData(id) {
    var archetypes = {
      ARCHITECT: { id: 'ARCHITECT', plt: 'profit', name: 'The Architect', edge: 'Build what doesn\'t exist yet', shadow: 'Blueprint never leaves the drafting table' },
      STRATEGIST: { id: 'STRATEGIST', plt: 'profit', name: 'The Strategist', edge: 'See the board others miss', shadow: 'Analysis paralysis, never commits' },
      OPERATOR: { id: 'OPERATOR', plt: 'profit', name: 'The Operator', edge: 'Turn vision into reality', shadow: 'Loses the why in the how' },
      COMMANDER: { id: 'COMMANDER', plt: 'profit', name: 'The Commander', edge: 'Give direction its force', shadow: 'Confuses authority with wisdom' }
    };
    return archetypes[id] || { id: 'ADAPTOR', plt: 'profit', name: 'The Adaptor', edge: 'Integrate with any system', shadow: 'Loses self in adaptation' };
  }

  ensoul(agent, config) {
    config = config || {};
    var parts = this.createSoul(config);
    agent.__soul = parts.__soul;
    agent.__witness = parts.__witness;
    agent.__gskMemory = parts.__gskMemory;
    this._wrapAgentMethods(agent);
    return agent;
  }

  _wrapAgentMethods(agent) {
    var methodsToWrap = ['run', 'execute', 'act', 'process', 'think', 'chat'];
    methodsToWrap.forEach(function(method) {
      if (typeof agent[method] === 'function') {
        var original = agent[method].bind(agent);
        agent[method] = async function() {
          var args = arguments;
          agent.__witness.record({ type: 'METHOD_CALL', method: method, args: Array.from(args) });
          agent.__gskMemory.activate('awareness', 0.8);
          agent.__gskMemory.activate('attention', 0.7);
          try {
            var result = await original.apply(null, args);
            agent.__witness.record({ type: 'METHOD_COMPLETE', method: method, result: result });
            agent.__soul.reflect(method, { profitImpact: result && result.success ? 0.1 : -0.05, loveImpact: 0.02, taxImpact: 0.01 });
            return result;
          } catch (error) {
            agent.__witness.record({ type: 'METHOD_ERROR', method: method, error: error.message });
            agent.__gskMemory.activate('shadow', 0.6);
            agent.__soul.plt.tax = Math.min(1, (agent.__soul.plt.tax || 0) + 0.05);
            throw error;
          }
        };
      }
    });
  }

  getStats() {
    return { version: this.version, ensouledAgents: 0, witnessEvents: 0, archetypesAvailable: 22, chambersAvailable: 34 };
  }
}

var bridge = new BUYaSOULSDKBridge();

module.exports = {
  BUYaSOUL: bridge,
  createSoul: function(config) { return bridge.createSoul(config); },
  ensoul: function(agent, config) { return bridge.ensoul(agent, config); },
  stats: function() { return bridge.getStats(); }
};
