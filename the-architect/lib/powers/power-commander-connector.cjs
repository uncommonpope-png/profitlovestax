/**
 * Power: COMMANDER-CONNECTOR
 * Connects the Architect to the Soul Commander.
 * Delegates tasks, syncs state, and enables cross-soul collaboration.
 *
 * When to use: The user wants the Architect to collaborate with
 *   the Commander, delegate execution, or sync cross-soul state.
 */

class PowerCommanderConnector {
  constructor(options = {}) {
    this.commanderPath = options.commanderPath || 'C:\\Users\\uncom\\Desktop\\soul-commander-v1.0.0\\soul-commander.cjs';
    this.connected = false;
    this.commander = null;
  }

  status() {
    return {
      ready: true,
      connected: this.connected,
      commanderPath: this.commanderPath
    };
  }

  execute(mission) {
    const action = mission.action || 'connect';

    try {
      switch (action) {
        case 'connect': {
          try {
            const SoulCommander = require(this.commanderPath);
            this.commander = new SoulCommander(mission.options || {});
            this.connected = true;
          } catch (e) {
            this.connected = false;
            return {
              output: {
                connected: false,
                error: e.message,
                note: 'Commander not available at path. Running in standalone mode.'
              }
            };
          }
          return {
            output: {
              connected: true,
              powers: this.commander.powerNames || [],
              version: this.commander.version || 'unknown'
            }
          };
        }
        case 'delegate': {
          if (!this.connected || !this.commander) {
            return {
              output: {
                delegated: false,
                note: 'Not connected to Commander. Running standalone.'
              }
            };
          }
          const result = this.commander.execute(mission.mission || {});
          return {
            output: {
              delegated: true,
              result
            }
          };
        }
        case 'status': {
          return {
            output: {
              connected: this.connected,
              commander: this.commander ? this.commander.status() : null
            }
          };
        }
        default:
          return {
            error: `Unknown connector action: ${action}. Available: connect, delegate, status`
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

module.exports = PowerCommanderConnector;
