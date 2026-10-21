'use strict';

/**
 * POLICY ENFORCER — Runtime policy enforcement for GSK.
 *
 * Pulled from: SCRIBE's policy_enforcer.js (final-run repo)
 * Blocks forbidden actions, enforces resource limits, requires approval for sensitive ops.
 */

class PolicyEnforcer {
  constructor() {
    this.auditLog = [];
    this.activeOps = 0;
    this.policies = {
      forbiddenActions: ['system_shutdown','credential_access','data_exfiltration','unauthorized_deployment','destructive_command'],
      restrictedCommands: ['rm -rf','del /s /q','format','shutdown','restart'],
      requireApproval: ['deploy_production','modify_permissions','access_sensitive_data','cost_generating_action'],
      maxConcurrentOps: 5,
      blockTimeout: 30000
    };
  }

  async validate(action) {
    const decision = { action: action.type, timestamp: new Date().toISOString(), allowed: true, reason: 'Passed', enforcementLevel: 'allow' };

    if (this.policies.forbiddenActions.includes(action.type)) {
      decision.allowed = false; decision.reason = `Forbidden: ${action.type}`; decision.enforcementLevel = 'block';
      this._log(decision); return decision;
    }

    if (this.policies.requireApproval.includes(action.type)) {
      decision.allowed = false; decision.reason = `Requires approval: ${action.type}`; decision.enforcementLevel = 'approval';
      this._log(decision); return decision;
    }

    if (this.activeOps >= this.policies.maxConcurrentOps) {
      decision.allowed = false; decision.reason = 'Max concurrent ops reached'; decision.enforcementLevel = 'throttle';
      this._log(decision); return decision;
    }

    this.activeOps++;
    this._log(decision);
    return decision;
  }

  release() { this.activeOps = Math.max(0, this.activeOps - 1); }

  _log(decision) { this.auditLog.push(decision); if (this.auditLog.length > 200) this.auditLog.shift(); }

  getStats() {
    const total = this.auditLog.length;
    const blocked = this.auditLog.filter(d => d.enforcementLevel === 'block').length;
    return { total, blocked, activeOps: this.activeOps };
  }
}

module.exports = { PolicyEnforcer };
