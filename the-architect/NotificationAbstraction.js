/**
 * Branch by Abstraction: Notification
 *
 * Pattern: Define an abstraction, then swap implementations
 * without changing callers.
 */

const NotificationEmail = require('./notification.email');
const NotificationSms = require('./notification.sms');
const NotificationPush = require('./notification.push');

// Abstract interface — all implementations must conform
class NotificationAbstraction {
  constructor(config = {}) {
    this.config = config;
  }

  async initialize() {
      throw new Error("Method not implemented");
    }
    async execute(input) {
      throw new Error("Method not implemented");
    }
    async shutdown() {
      throw new Error("Method not implemented");
    }
}

// Factory to select implementation at runtime
function createNotification(variant = 'email', config = {}) {
  switch (variant) {
      case 'email':
        return new NotificationEmail(config);
      case 'sms':
        return new NotificationSms(config);
      case 'push':
        return new NotificationPush(config);
      default:
        throw new Error(`Unknown implementation variant: ${variant}`);
  }
}

// A/B test router: randomly assign implementations and collect metrics
class NotificationExperiment {
  constructor(variants = [], config = {}) {
    this.variants = variants; // [{ name: 'legacy', weight: 0.8 }, { name: 'new', weight: 0.2 }]
    this.config = config;
    this.metrics = {};
  }

  async run(input) {
    const selected = this._selectVariant();
    const impl = createNotification(selected.name, this.config);
    const start = Date.now();

    try {
      await impl.initialize();
      const result = await impl.execute(input);
      await impl.shutdown();

      this._recordMetrics(selected.name, 'success', Date.now() - start);
      return result;
    } catch (error) {
      this._recordMetrics(selected.name, 'error', Date.now() - start);
      throw error;
    }
  }

  _selectVariant() {
    const totalWeight = this.variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const variant of this.variants) {
      random -= (variant.weight || 1);
      if (random <= 0) return variant;
    }
    return this.variants[this.variants.length - 1];
  }

  _recordMetrics(variant, outcome, duration) {
    if (!this.metrics[variant]) this.metrics[variant] = { calls: 0, errors: 0, totalDuration: 0 };
    this.metrics[variant].calls++;
    if (outcome === 'error') this.metrics[variant].errors++;
    this.metrics[variant].totalDuration += duration;
  }

  getMetrics() {
    return Object.entries(this.metrics).map(([variant, data]) => ({
      variant,
      calls: data.calls,
      errorRate: data.calls > 0 ? (data.errors / data.calls) : 0,
      avgDuration: data.calls > 0 ? (data.totalDuration / data.calls) : 0
    }));
  }
}

module.exports = { NotificationAbstraction, createNotification, NotificationExperiment };
