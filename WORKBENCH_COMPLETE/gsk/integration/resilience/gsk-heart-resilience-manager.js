'use strict';

/**
 * GSK-HEART — Phase 5: Resilience Manager
 *
 * Ports omniroute/src/shared/utils/circuitBreaker.ts (CircuitBreaker class:
 * CLOSED → DEGRADED → OPEN → HALF_OPEN) into a dependency-free CommonJS module.
 * Tracks per-provider quotas and trips the circuit on repeated failures.
 *
 * Requirement: fail 3x in 1 min → stop traffic 5 min.
 */

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 5 * 60 * 1000;
const FAILURE_WINDOW_MS = 60 * 1000;

const STATE = {
  CLOSED: 'CLOSED',
  DEGRADED: 'DEGRADED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

class CircuitBreakerOpenError extends Error {
  constructor(message, name, retryAfterMs) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
    this.circuitName = name;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * CircuitBreakerManager — per-provider circuit breaker tracking
 */
class CircuitBreakerManager {
  constructor(options = {}) {
    this.breakers = new Map();
    this.defaultFailureThreshold = options.failureThreshold || 5;
    this.defaultResetTimeout = options.resetTimeout || 60000;
    this.defaultHalfOpenRequests = options.halfOpenRequests || 3;
    this.onStateChange = options.onStateChange || null;
  }

  getBreaker(name) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, {
        name,
        state: STATE.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        openUntil: 0,
        halfOpenRequests: 0,
      });
    }
    return this.breakers.get(name);
  }

  canExecute(name) {
    const breaker = this.getBreaker(name);
    const now = Date.now();

    switch (breaker.state) {
      case STATE.CLOSED:
        return { allowed: true };

      case STATE.DEGRADED:
        return { allowed: true };

      case STATE.OPEN:
        if (now >= breaker.openUntil) {
          breaker.state = STATE.HALF_OPEN;
          breaker.halfOpenRequests = 0;
          if (this.onStateChange) this.onStateChange(name, STATE.OPEN, STATE.HALF_OPEN);
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: `Circuit breaker OPEN until ${new Date(breaker.openUntil).toISOString()}`,
        };

      case STATE.HALF_OPEN:
        if (breaker.halfOpenRequests < this.defaultHalfOpenRequests) {
          breaker.halfOpenRequests++;
          return { allowed: true };
        }
        return { allowed: false, reason: 'Circuit breaker HALF_OPEN: max probe requests reached' };

      default:
        return { allowed: true };
    }
  }

  recordSuccess(name) {
    const breaker = this.getBreaker(name);
    breaker.successes++;
    if (breaker.state === STATE.HALF_OPEN) {
      breaker.state = STATE.CLOSED;
      breaker.failures = 0;
      breaker.halfOpenRequests = 0;
      if (this.onStateChange) this.onStateChange(name, STATE.HALF_OPEN, STATE.CLOSED);
    } else if (breaker.state === STATE.DEGRADED && breaker.successes > 10) {
      breaker.state = STATE.CLOSED;
      breaker.failures = 0;
      if (this.onStateChange) this.onStateChange(name, STATE.DEGRADED, STATE.CLOSED);
    }
  }

  recordFailure(name, error) {
    const breaker = this.getBreaker(name);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    const now = Date.now();
    const threshold = this.defaultFailureThreshold;

    if (breaker.state === STATE.HALF_OPEN) {
      const escalationFactor = Math.min(8, Math.pow(2, Math.floor(breaker.failures / threshold)));
      breaker.openUntil = now + (this.defaultResetTimeout * escalationFactor);
      breaker.state = STATE.OPEN;
      breaker.halfOpenRequests = 0;
      if (this.onStateChange) this.onStateChange(name, STATE.HALF_OPEN, STATE.OPEN);
    } else if (breaker.state === STATE.CLOSED || breaker.state === STATE.DEGRADED) {
      if (breaker.failures >= threshold) {
        breaker.state = STATE.OPEN;
        breaker.openUntil = now + this.defaultResetTimeout;
        if (this.onStateChange) this.onStateChange(name, breaker.state === STATE.OPEN ? STATE.CLOSED : STATE.DEGRADED, STATE.OPEN);
      } else if (breaker.failures >= Math.floor(threshold / 2)) {
        const oldState = breaker.state;
        breaker.state = STATE.DEGRADED;
        if (this.onStateChange) this.onStateChange(oldState, STATE.DEGRADED);
      }
    }
  }

  getStatus(name) {
    const breaker = this.getBreaker(name);
    const now = Date.now();
    return {
      name: breaker.name,
      state: breaker.state,
      failures: breaker.failures,
      successes: breaker.successes,
      canExecute: this.canExecute(name).allowed,
      timeUntilReset: breaker.state === STATE.OPEN ? Math.max(0, breaker.openUntil - now) : 0,
    };
  }

  reset(name) {
    const breaker = this.getBreaker(name);
    const oldState = breaker.state;
    breaker.state = STATE.CLOSED;
    breaker.failures = 0;
    breaker.successes = 0;
    breaker.openUntil = 0;
    breaker.halfOpenRequests = 0;
    if (this.onStateChange) this.onStateChange(name, oldState, STATE.CLOSED);
  }

  getAllStatuses() {
    return Array.from(this.breakers.keys()).map(name => this.getStatus(name));
  }
}

/**
 * QuotaTracker — per-provider rate limiting
 */
class QuotaTracker {
  constructor(options = {}) {
    this.quotas = new Map();
    this.defaultLimit = options.defaultLimit || 1000;
    this.windowMs = options.windowMs || 3600000;
  }

  checkQuota(providerId, cost = 1) {
    const now = Date.now();
    let quota = this.quotas.get(providerId);
    if (!quota || now >= quota.windowStart + this.windowMs) {
      quota = { used: 0, limit: this.defaultLimit, windowStart: now };
      this.quotas.set(providerId, quota);
    }
    const remaining = quota.limit - quota.used;
    return {
      allowed: remaining >= cost,
      remaining: Math.max(0, remaining),
      limit: quota.limit,
      used: quota.used,
      resetAt: quota.windowStart + this.windowMs,
    };
  }

  recordUsage(providerId, cost = 1) {
    const quota = this.quotas.get(providerId);
    if (quota) quota.used += cost;
  }

  setLimit(providerId, limit) {
    let quota = this.quotas.get(providerId);
    if (!quota) {
      quota = { used: 0, limit, windowStart: Date.now() };
      this.quotas.set(providerId, quota);
    } else {
      quota.limit = limit;
    }
  }

  getStatus(providerId) {
    const result = this.checkQuota(providerId, 0);
    return {
      providerId,
      ...result,
      utilization: result.limit > 0 ? (result.used / result.limit) * 100 : 0,
    };
  }
}

/**
 * GSKHeartResilienceManager — combines circuit breakers + quota tracking
 */
class GSKHeartResilienceManager {
  constructor(options = {}) {
    this.circuitBreakers = new CircuitBreakerManager(options.circuitBreaker);
    this.quotas = new QuotaTracker(options.quota);
    this.globalQuota = null;
    this.quotaLimit = null;
  }

  checkAvailability(providerId) {
    const quotaResult = this.quotas.checkQuota(providerId);
    const circuitResult = this.circuitBreakers.canExecute(providerId);
    if (!circuitResult.allowed) {
      return { available: false, reason: circuitResult.reason, circuit: this.circuitBreakers.getStatus(providerId) };
    }
    if (!quotaResult.allowed) {
      return { available: false, reason: `Quota exceeded. ${quotaResult.remaining}/${quotaResult.limit} remaining`, quota: quotaResult };
    }
    return { available: true, quota: quotaResult, circuit: this.circuitBreakers.getStatus(providerId) };
  }

  canUse(providerId) {
    const status = this.getStatus(providerId);
    return status.state !== STATE.OPEN;
  }

  recordSuccess(providerId, quotaCost = 1) {
    this.circuitBreakers.recordSuccess(providerId);
    this.quotas.recordUsage(providerId, quotaCost);
  }

  recordFailure(providerId, error) {
    this.circuitBreakers.recordFailure(providerId, error);
  }

  getStatus(providerId) {
    const cbStatus = this.circuitBreakers.getStatus(providerId);
    const quotaStatus = this.quotas.getStatus(providerId);
    const now = Date.now();
    const retryAfterMs = cbStatus.state === STATE.OPEN ? cbStatus.timeUntilReset : 0;
    return {
      provider: providerId,
      state: cbStatus.state,
      failures: cbStatus.failures,
      successes: cbStatus.successes,
      canExecute: cbStatus.canExecute,
      timeUntilReset: cbStatus.timeUntilReset,
      retryAfterMs,
      quota: quotaStatus,
      recentFailures: cbStatus.failures,
      lastFailureTime: cbStatus.lastFailureTime,
    };
  }

  reset(providerId) {
    if (providerId) {
      this.circuitBreakers.reset(providerId);
    } else {
      this.breakers?.clear?.();
      this.quotas = new QuotaTracker();
    }
  }

  setQuota(used, limit, windowStart) {
    this.globalQuota = { used, limit, windowStart: windowStart || Date.now() };
    this.quotaLimit = limit;
  }

  recordQuotaUsage(amount) {
    if (!this.globalQuota) return;
    this.globalQuota.used += amount;
  }

  quotaRemaining() {
    if (this.globalQuota == null || this.quotaLimit == null) return Infinity;
    return Math.max(0, this.quotaLimit - this.globalQuota.used);
  }
}

module.exports = {
  STATE,
  CircuitBreakerManager,
  QuotaTracker,
  GSKHeartResilienceManager,
  ResilienceManager: GSKHeartResilienceManager,
  CircuitBreakerOpenError,
  FAILURE_THRESHOLD,
  RESET_TIMEOUT_MS,
  FAILURE_WINDOW_MS,
};
