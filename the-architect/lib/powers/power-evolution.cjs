/**
 * Power: EVOLUTION
 * Self-evolution and adaptation engine.
 * Tracks the Architect's growth, version bumps, and identity shifts.
 *
 * When to use: The user wants to evolve the Architect's identity,
 *   bump versions, or track growth across sessions.
 */

const fs = require('fs');
const path = require('path');

class PowerEvolution {
  constructor(options = {}) {
    this.statePath = options.statePath || path.join(process.cwd(), '.architect-evolution.json');
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.statePath)) {
        return JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
      }
    } catch {}
    return {
      version: '1.0.0',
      sessions: 0,
      designs: 0,
      patternsLearned: 0,
      mutations: []
    };
  }

  saveState() {
    try {
      fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
    } catch {}
  }

  status() {
    return {
      ready: true,
      version: this.state.version,
      sessions: this.state.sessions
    };
  }

  execute(mission) {
    const action = mission.action || 'status';

    try {
      switch (action) {
        case 'status': {
          return {
            output: {
              ...this.state,
              uptime: 'active'
            }
          };
        }
        case 'record': {
          const event = mission.event || 'session';
          this.state.sessions++;
          if (event === 'design') this.state.designs++;
          if (event === 'pattern') this.state.patternsLearned++;
          this.state.mutations.push({
            event,
            timestamp: new Date().toISOString(),
            note: mission.note || ''
          });
          this.saveState();
          return { output: { recorded: true, state: this.state } };
        }
        case 'bump': {
          const parts = this.state.version.split('.');
          const level = mission.level || 'patch'; // major, minor, patch
          if (level === 'major') {
            parts[0] = String(parseInt(parts[0]) + 1);
            parts[1] = '0';
            parts[2] = '0';
          } else if (level === 'minor') {
            parts[1] = String(parseInt(parts[1]) + 1);
            parts[2] = '0';
          } else {
            parts[2] = String(parseInt(parts[2]) + 1);
          }
          this.state.version = parts.join('.');
          this.state.mutations.push({
            event: 'version-bump',
            timestamp: new Date().toISOString(),
            note: `Bumped to ${this.state.version} (${level})`
          });
          this.saveState();
          return { output: { bumped: true, version: this.state.version } };
        }
        default:
          return {
            error: `Unknown evolution action: ${action}. Available: status, record, bump`
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

module.exports = PowerEvolution;
