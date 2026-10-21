/**
 * Tight Execution Loop Controller
 * Enforces plan depth capping (≤ 4 steps) to minimize operational tax and prevent planning bloat.
 */
class TightExecutionLoop {
  constructor(maxSteps = 4) {
    this.maxSteps = maxSteps;
  }

  validatePlan(steps) {
    if (!Array.isArray(steps)) {
      throw new Error('Invalid plan format: steps must be an array');
    }
    if (steps.length > this.maxSteps) {
      throw new Error(`Plan depth ${steps.length} exceeds tight execution cap of ${this.maxSteps}`);
    }
    return {
      valid: true,
      stepCount: steps.length,
      taxMultiplier: 1.0 - (0.05 * (this.maxSteps - steps.length))
    };
  }
}

module.exports = TightExecutionLoop;
