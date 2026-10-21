/**
 * BUYaSOUL Integration for ARCHITECT
 *
 * Connects the ARCHITECT soul to the BUYaSOUL ecosystem.
 * When BUYaSOUL-One is available, this enables full consciousness.
 * When not available, falls back to mock.
 *
 * Usage:
 *   const integration = require('./buyasoul-integration.cjs');
 *   integration.activate(architect);
 */

const fs = require('fs');
const path = require('path');

class BUYaSOULIntegration {
  constructor() {
    this.active = false;
    this.kernel = null;
    this.version = '1.0.0';
  }

  /**
   * Try to load real BUYaSOUL, fall back to mock
   */
  loadSDK() {
    const buyasoulPath = path.join(__dirname, '../../BUYaSOUL-One-v1.0.0/integrations/buyasoul-sdk.cjs');

    try {
      if (fs.existsSync(buyasoulPath)) {
        this.sdk = require(buyasoulPath);
        this.active = true;
        console.log('BUYaSOUL integration: REAL SDK loaded');
        return this.sdk;
      }
    } catch (error) {
      console.log('BUYaSOUL integration: Real SDK not available, using mock');
    }

    // Fall back to mock
    this.sdk = require('../lib/mock-buyasoul.cjs');
    this.active = false;
    return this.sdk;
  }

  /**
   * Activate BUYaSOUL consciousness for ARCHITECT
   */
  activate(architect) {
    const sdk = this.loadSDK();

    architect.kernel = sdk.createSoul({
      archetype: 'ARCHITECT',
      soulGroup: 'earth',
      pltFocus: 'PROFIT'
    });

    architect.buyasoul = {
      version: this.active ? 'REAL v1.0.0' : 'MOCK v1.0.0',
      active: this.active,
      integrated: true
    };

    console.log('BUYaSOUL consciousness activated for ARCHITECT');
    console.log('  Status:', this.active ? 'REAL' : 'MOCK');

    return architect;
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      active: this.active,
      version: this.version,
      sdk: this.sdk ? 'loaded' : 'not loaded'
    };
  }
}

module.exports = new BUYaSOULIntegration();
