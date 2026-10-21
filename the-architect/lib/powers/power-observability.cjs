/**
 * Power: OBSERVABILITY
 * Architecture health monitoring, metrics, and alerts.
 * Tracks system design quality, pattern usage, and evolution.
 *
 * When to use: The user wants to monitor architecture health,
 *   track metrics, or generate observability dashboards.
 */

const fs = require('fs');
const path = require('path');

class PowerObservability {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), '.architect-observability');
    this.metrics = {
      designs: 0,
      patterns: {},
      errors: 0,
      reviews: 0,
      startTime: Date.now()
    };
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  status() {
    return {
      ready: true,
      uptime: Date.now() - this.metrics.startTime,
      designs: this.metrics.designs
    };
  }

  execute(mission) {
    const action = mission.action || 'metrics';

    try {
      switch (action) {
        case 'metrics': {
          return {
            output: {
              metrics: this.metrics,
              uptime: Date.now() - this.metrics.startTime
            }
          };
        }
        case 'record': {
          const event = mission.event || 'design';
          if (event === 'design') this.metrics.designs++;
          if (event === 'error') this.metrics.errors++;
          if (event === 'review') this.metrics.reviews++;
          if (mission.pattern) {
            this.metrics.patterns[mission.pattern] = (this.metrics.patterns[mission.pattern] || 0) + 1;
          }
          this.saveMetrics();
          return { output: { recorded: true, event, metrics: this.metrics } };
        }
        case 'health': {
          const healthy = this.metrics.errors < 10;
          return {
            output: {
              healthy,
              designs: this.metrics.designs,
              errors: this.metrics.errors,
              reviews: this.metrics.reviews,
              patternsUsed: Object.keys(this.metrics.patterns).length
            }
          };
        }
        case 'alert': {
          const threshold = mission.threshold || 5;
          const alerts = [];
          if (this.metrics.errors >= threshold) {
            alerts.push({ level: 'critical', message: `Errors reached ${this.metrics.errors}` });
          }
          return { output: { alerts, triggered: alerts.length > 0 } };
        }
        default:
          return {
            error: `Unknown observability action: ${action}. Available: metrics, record, health, alert`
          };
      }
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  saveMetrics() {
    const filePath = path.join(this.dataDir, 'metrics.json');
    fs.writeFileSync(filePath, JSON.stringify(this.metrics, null, 2));
  }
}

module.exports = PowerObservability;
