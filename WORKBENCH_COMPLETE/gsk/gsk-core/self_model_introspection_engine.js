'use strict';

const fs = require('fs');
const path = require('path');

class SelfModelIntrospectionEngine {
  constructor(options = {}) {
    this.capabilities = new Map();
    this.history = [];
  }

  registerCapability(name, evaluator) {
    this.capabilities.set(name, { evaluator, lastScore: null, lastEvaluated: null });
  }

  async evaluateAll() {
    const results = {};
    for (const [name, cap] of this.capabilities.entries()) {
      const score = await cap.evaluator();
      cap.lastScore = score;
      cap.lastEvaluated = Date.now();
      results[name] = score;
    }
    return results;
  }
}

module.exports = SelfModelIntrospectionEngine;
