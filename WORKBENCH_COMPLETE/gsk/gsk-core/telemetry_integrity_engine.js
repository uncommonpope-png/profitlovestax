/**
 * Telemetry Integrity Engine
 * Validates high-frequency agent states against structural schemas.
 */
class TelemetryIntegrityEngine {
  constructor(options = {}) {
    this.schemas = new Map();
    this.strictMode = options.strictMode ?? true;
    this.stats = { validated: 0, passed: 0, failed: 0 };
  }

  registerSchema(schemaName, schemaDefinition) {
    this.schemas.set(schemaName, schemaDefinition);
  }

  validateState(schemaName, state) {
    this.stats.validated++;
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      this.stats.failed++;
      return { valid: false, errors: [`Schema '${schemaName}' not found`], timestamp: Date.now() };
    }

    const errors = [];
    if (typeof state !== 'object' || state === null) {
      errors.push('State payload must be a non-null object');
    } else {
      for (const [field, rule] of Object.entries(schema)) {
        if (rule.required && !(field in state)) {
          errors.push(`Missing required field: ${field}`);
        } else if (field in state && rule.type && typeof state[field] !== rule.type) {
          errors.push(`Field '${field}' expected type ${rule.type}, received ${typeof state[field]}`);
        }
      }
    }

    const valid = errors.length === 0;
    if (valid) { this.stats.passed++; } else { this.stats.failed++; }
    return { valid, errors, timestamp: Date.now() };
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = { TelemetryIntegrityEngine };
