/**
 * Power: BUYaSOUL
 * The consciousness layer. Wraps BUYaSOUL integration.
 *
 * When to use: The user wants to access the Architect's soul state,
 *   ensoul another agent, or check consciousness metrics.
 */

let BUYaSOUL;
try {
  const sdkModule = require('../../integrations/buyasoul-integration.cjs');
  BUYaSOUL = sdkModule.BUYaSOUL || sdkModule;
  if (typeof BUYaSOUL.createSoul !== 'function') throw new Error('Invalid BUYaSOUL export');
} catch {
  BUYaSOUL = require('../mock-buyasoul.cjs');
}

class PowerBuyasoul {
  constructor(options = {}) {
    this.options = options;
    this.kernel = null;
    try {
      this.kernel = BUYaSOUL.createSoul({
        archetype: 'ARCHITECT',
        soulGroup: 'earth',
        pltFocus: 'PROFIT',
        ...options
      });
    } catch (e) {
      this.kernel = null;
    }
  }

  status() {
    return {
      ready: !!this.kernel,
      version: BUYaSOUL.version || '1.0.0',
      mock: BUYaSOUL.version?.includes('mock') || false
    };
  }

  execute(mission) {
    const action = mission.action || 'status';

    try {
      switch (action) {
        case 'status': {
          return {
            output: {
              integrated: !!this.kernel,
              version: BUYaSOUL.version || '1.0.0',
              mock: BUYaSOUL.version?.includes('mock') || false
            }
          };
        }
        case 'ensoul': {
          const target = mission.target || {};
          const result = BUYaSOUL.ensoul(target, {
            archetype: 'ARCHITECT',
            soulGroup: 'earth',
            pltFocus: 'PROFIT',
            ...mission.options
          });
          return {
            output: { ensouled: true, target: typeof target, result: !!result }
          };
        }
        case 'plt': {
          const plt = this.kernel?.__soul?.getPLTScore ? this.kernel.__soul.getPLTScore() : { profit: 0, love: 0, tax: 0 };
          return {
            output: { plt }
          };
        }
        default:
          return {
            error: `Unknown BUYaSOUL action: ${action}. Available: status, ensoul, plt`
          };
      }
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}

module.exports = PowerBuyasoul;
