/**
 * Power: AGENT-SDK
 * HTTP server and client for external agent connections.
 * Wraps the ArchitectAgentSDK.
 *
 * When to use: The user wants to start the Architect's HTTP server,
 *   connect to external agents, or query the SDK status.
 */

const ArchitectAgentSDK = require('../architect-agent-sdk.cjs');

class PowerAgentSDK {
  constructor(options = {}) {
    this.sdk = new ArchitectAgentSDK(options);
  }

  status() {
    return {
      ready: true,
      port: this.sdk.port,
      running: this.sdk.isRunning
    };
  }

  execute(mission) {
    const action = mission.action || 'status';

    try {
      switch (action) {
        case 'start': {
          this.sdk.startServer();
          return {
            output: {
              started: true,
              port: this.sdk.port,
              endpoints: ['/health', '/design', '/recommend', '/generate', '/learn', '/status']
            }
          };
        }
        case 'status': {
          const report = this.learning ? this.sdk.learning.getEvolutionReport() : {};
          return {
            output: {
              port: this.sdk.port,
              running: this.sdk.isRunning,
              connectedAgents: this.sdk.agents.size,
              evolution: report
            }
          };
        }
        case 'connect': {
          const endpoint = mission.endpoint || 'http://localhost:7778';
          const client = ArchitectAgentSDK.connect(endpoint);
          return {
            output: {
              connected: true,
              endpoint,
              methods: ['design', 'recommend', 'generate']
            }
          };
        }
        default:
          return {
            error: `Unknown SDK action: ${action}. Available: start, status, connect`
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

module.exports = PowerAgentSDK;
