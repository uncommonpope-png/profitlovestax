/**
 * Telemetry Puppeteer Swarm Insight
 * Evaluates multi-agent dynamic activation and reduces redundant state overhead.
 */
function analyzeSwarmTelemetry(telemetryEvents) {
  if (!Array.isArray(telemetryEvents)) return { status: 'invalid_input' };
  
  const activeCount = telemetryEvents.filter(e => e.state === 'active').length;
  const totalCount = telemetryEvents.length;
  const activationRatio = totalCount > 0 ? activeCount / totalCount : 0;
  
  return {
    timestamp: new Date().toISOString(),
    insight: 'Dynamic puppeteer activation optimizes agent state footprint by idling non-executing swarm nodes.',
    metrics: {
      totalAgents: totalCount,
      activeAgents: activeCount,
      activationRatio: Number(activationRatio.toFixed(4))
    },
    recommendation: 'Enforce selective agent wakeups to preserve PLT value under swarm load.'
  };
}

module.exports = { analyzeSwarmTelemetry };
