/**
 * Adaptive Identity Circuit-Breaker & Filesystem Rate-Limiter
 * Stabilizes telemetry loops by damping recursive identity re-ingestion
 * and bounding file operations under high tax/friction state.
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 10000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('CircuitBreaker: OPEN - Request shed to protect telemetry stability');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  recordFailure() {
    this.failures += 1;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

class FilesystemRateLimiter {
  constructor(tokensPerSec = 10, maxBurst = 20) {
    this.tokens = maxBurst;
    this.maxBurst = maxBurst;
    this.refillRate = tokensPerSec;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const delta = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxBurst, this.tokens + delta * this.refillRate);
    this.lastRefill = now;
  }

  tryConsume(count = 1) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}

module.exports = {
  CircuitBreaker,
  FilesystemRateLimiter
};
