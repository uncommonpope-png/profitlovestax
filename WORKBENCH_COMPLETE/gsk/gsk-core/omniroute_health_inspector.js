"use strict";

/**
 * OmniRoute Health Inspector v2 — Complete Implementation
 *
 * Features:
 * - registerAgent / recordHeartbeat / inspectSwarmHealth
 * - triggerFallback(failedAgentId) — reroutes to next healthy agent
 * - exportTelemetrySnapshot() — writes diagnostic JSON
 * - Token burn tracking per agent
 * - Latency monitoring per agent
 * - Configurable staleness threshold
 */

class OmniRouteHealthInspector {
  constructor(config = {}) {
    this.subAgents = new Map();
    this.staleThresholdMs = config.staleThresholdMs || 30000;
    this.maxErrors = config.maxErrors || 5;
    this.fallbackHistory = [];
  }

  registerAgent(agentId, initialMeta = {}) {
    this.subAgents.set(agentId, {
      id: agentId,
      status: "active",
      lastHeartbeat: Date.now(),
      valence: initialMeta.valence || 0.5,
      errorCount: 0,
      tokenBurn: 0,
      latencyMs: 0,
      taskCount: 0,
      meta: initialMeta
    });
  }

  recordHeartbeat(agentId, metrics = {}) {
    const agent = this.subAgents.get(agentId);
    if (!agent) return false;
    agent.lastHeartbeat = Date.now();
    if (metrics.valence !== undefined) agent.valence = metrics.valence;
    if (metrics.error) agent.errorCount += 1;
    if (metrics.tokensBurned) agent.tokenBurn += metrics.tokensBurned;
    if (metrics.latencyMs) agent.latencyMs = metrics.latencyMs;
    if (metrics.taskCompleted) agent.taskCount += 1;
    return true;
  }

  _isHealthy(agent) {
    const isStale = (Date.now() - agent.lastHeartbeat) > this.staleThresholdMs;
    return !isStale && agent.errorCount < this.maxErrors;
  }

  inspectSwarmHealth() {
    const now = Date.now();
    const report = { totalAgents: this.subAgents.size, healthyCount: 0, staleCount: 0, details: [] };

    for (const [id, agent] of this.subAgents) {
      const isHealthy = this._isHealthy(agent);
      if (isHealthy) report.healthyCount++;
      else report.staleCount++;

      report.details.push({
        id,
        status: isHealthy ? "healthy" : "unhealthy",
        lastHeartbeatAgeMs: now - agent.lastHeartbeat,
        errorCount: agent.errorCount,
        valence: agent.valence,
        tokenBurn: agent.tokenBurn,
        latencyMs: agent.latencyMs,
        taskCount: agent.taskCount
      });
    }
    return report;
  }

  triggerFallback(failedAgentId, taskContext = {}) {
    const failed = this.subAgents.get(failedAgentId);
    if (!failed) return { success: false, error: "Agent not found" };

    const candidates = [];
    for (const [id, agent] of this.subAgents) {
      if (id !== failedAgentId && this._isHealthy(agent)) {
        candidates.push({ id, score: agent.valence - (agent.errorCount * 0.1) });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const target = candidates[0];

    if (!target) return { success: false, error: "No healthy agents available for fallback" };

    const entry = {
      timestamp: new Date().toISOString(),
      from: failedAgentId,
      to: target.id,
      taskContext
    };
    this.fallbackHistory.push(entry);

    return { success: true, reroutedTo: target.id, fallbackHistory: this.fallbackHistory.length };
  }

  exportTelemetrySnapshot() {
    const report = this.inspectSwarmHealth();
    return {
      snapshotTimestamp: new Date().toISOString(),
      swarm: report,
      fallbackHistory: this.fallbackHistory.slice(-20),
      summary: {
        totalTokensBurned: Array.from(this.subAgents.values()).reduce((s, a) => s + a.tokenBurn, 0),
        avgLatency: report.totalAgents
          ? Math.round(Array.from(this.subAgents.values()).reduce((s, a) => s + a.latencyMs, 0) / report.totalAgents)
          : 0,
        totalTasks: Array.from(this.subAgents.values()).reduce((s, a) => s + a.taskCount, 0)
      }
    };
  }
}

function createOmnirouteHealthInspector(config) { return new OmniRouteHealthInspector(config); }

module.exports = { OmniRouteHealthInspector, createOmnirouteHealthInspector };
