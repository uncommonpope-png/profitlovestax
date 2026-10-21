/**
 * Strangler Fig Facade: Legacy-payment → Stripe-payment
 *
 * Pattern: Incrementally replace legacy-payment with stripe-payment
 * by routing traffic through a feature-flagged facade.
 */

const LegacyLegacy-payment = require('./legacy-payment.legacy');
const NewStripe-payment = require('./stripe-payment.new');

class Legacy-paymentFacade {
  constructor(config = {}) {
    this.useNewImplementation = config.featureFlag || process.env.USE_STRIPE-PAYMENT === 'true';
    this.legacy = new LegacyLegacy-payment();
    this.newImpl = new NewStripe-payment();
    this.metrics = { legacyCalls: 0, newCalls: 0, errors: 0 };
  }

  async execute(...args) {
    if (this.useNewImplementation) {
      try {
        const result = await this.newImpl.execute(...args);
        this.metrics.newCalls++;
        return result;
      } catch (error) {
        this.metrics.errors++;
        console.warn(`[Strangler] New implementation failed, falling back to legacy: ${error.message}`);
        return this.legacy.execute(...args);
      }
    }

    this.metrics.legacyCalls++;
    return this.legacy.execute(...args);
  }

  // Shadow mode: run both and compare results without affecting callers
  async shadowExecute(...args) {
    const legacyResult = await this.legacy.execute(...args);
    let newResult;
    let match = false;

    try {
      newResult = await this.newImpl.execute(...args);
      match = JSON.stringify(legacyResult) === JSON.stringify(newResult);
      if (!match) {
        console.warn('[Strangler] Result mismatch detected:', { legacyResult, newResult });
      }
    } catch (error) {
      console.warn('[Strangler] New implementation error in shadow mode:', error.message);
    }

    return { legacyResult, newResult, match };
  }

  enableNewImplementation() {
    this.useNewImplementation = true;
    console.log('[Strangler] Switched to new implementation:', 'Stripe-payment');
  }

  disableNewImplementation() {
    this.useNewImplementation = false;
    console.log('[Strangler] Reverted to legacy implementation:', 'Legacy-payment');
  }

  getMetrics() {
    return { ...this.metrics, usingNew: this.useNewImplementation };
  }
}

module.exports = { Legacy-paymentFacade };
