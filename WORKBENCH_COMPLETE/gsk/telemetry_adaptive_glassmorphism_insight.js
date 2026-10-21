/**
 * Telemetry Adaptive Glassmorphism Insight
 * 
 * NEW INSIGHT: Glassmorphism UI intensity should dynamically adapt to agent cognitive load.
 * High cognitive load → reduced glassmorphism (less visual noise, clearer hierarchy)
 * Low cognitive load → increased glassmorphism (richer aesthetic, more depth cues)
 * 
 * Based on:
 * - 2026 Dark Glassmorphism trends (organic, immersive interfaces)
 * - Agentic feedback loops (cognitive load signals from agent state)
 * - Telemetry correlation: visual complexity inversely correlates with task completion speed under load
 */

class AdaptiveGlassmorphismInsight {
  constructor() {
    this.cognitiveLoadThresholds = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 0.8
    };
    
    this.glassmorphismProfiles = {
      MINIMAL: {
        blur: '4px',
        opacity: 0.08,
        borderOpacity: 0.12,
        shadowDepth: '0 2px 8px',
        layers: 1
      },
      BALANCED: {
        blur: '12px',
        opacity: 0.15,
        borderOpacity: 0.2,
        shadowDepth: '0 8px 24px',
        layers: 2
      },
      RICH: {
        blur: '24px',
        opacity: 0.25,
        borderOpacity: 0.3,
        shadowDepth: '0 16px 48px',
        layers: 3
      }
    };
  }

  /**
   * Analyze agent telemetry to determine cognitive load
   * @param {Object} telemetry - Agent telemetry data
   * @returns {number} Cognitive load score 0-1
   */
  calculateCognitiveLoad(telemetry) {
    const factors = {
      // Task complexity signals
      activeTasks: Math.min(telemetry.activeTasks / 10, 1) * 0.25,
      taskDepth: Math.min(telemetry.avgTaskDepth / 5, 1) * 0.2,
      
      // Processing signals  
      queueLength: Math.min(telemetry.messageQueueLength / 50, 1) * 0.2,
      processingLatency: Math.min(telemetry.avgLatencyMs / 1000, 1) * 0.15,
      
      // Error/Recovery signals
      errorRate: Math.min(telemetry.errorRate * 10, 1) * 0.1,
      retryCount: Math.min(telemetry.retryCount / 5, 1) * 0.1,
    };

    return Object.values(factors).reduce((sum, v) => sum + v, 0);
  }

  /**
   * Select glassmorphism profile based on cognitive load
   * @param {number} cognitiveLoad - Score 0-1
   * @returns {Object} Glassmorphism profile
   */
  selectProfile(cognitiveLoad) {
    if (cognitiveLoad >= this.cognitiveLoadThresholds.HIGH) {
      return { ...this.glassmorphismProfiles.MINIMAL, level: 'MINIMAL' };
    }
    if (cognitiveLoad >= this.cognitiveLoadThresholds.MEDIUM) {
      return { ...this.glassmorphismProfiles.BALANCED, level: 'BALANCED' };
    }
    return { ...this.glassmorphismProfiles.RICH, level: 'RICH' };
  }

  /**
   * Generate CSS custom properties for the selected profile
   * @param {Object} profile - Glassmorphism profile
   * @returns {string} CSS custom properties block
   */
  generateCSSVariables(profile) {
    return `--glass-blur: ${profile.blur};
  --glass-opacity: ${profile.opacity};
  --glass-border-opacity: ${profile.borderOpacity};
  --glass-shadow: ${profile.shadowDepth};
  --glass-layers: ${profile.layers};`;
  }

  /**
   * Main insight function: process telemetry and return adaptive UI config
   * @param {Object} agentTelemetry - Real-time agent telemetry
   * @returns {Object} Adaptive UI configuration
   */
  generateInsight(agentTelemetry) {
    const cognitiveLoad = this.calculateCognitiveLoad(agentTelemetry);
    const profile = this.selectProfile(cognitiveLoad);
    const cssVariables = this.generateCSSVariables(profile);

    return {
      insight: 'adaptive-glassmorphism',
      timestamp: new Date().toISOString(),
      cognitiveLoad: Math.round(cognitiveLoad * 100) / 100,
      profile: profile.level,
      cssVariables,
      rationale: this.generateRationale(cognitiveLoad, profile.level),
      telemetrySnapshot: {
        activeTasks: agentTelemetry.activeTasks,
        queueLength: agentTelemetry.messageQueueLength,
        errorRate: agentTelemetry.errorRate,
        avgLatencyMs: agentTelemetry.avgLatencyMs
      }
    };
  }

  generateRationale(load, level) {
    const rationales = {
      MINIMAL: `High cognitive load (${Math.round(load * 100)}%). Reducing visual complexity to minimize distraction and improve focus on critical tasks.`, 
      BALANCED: `Moderate cognitive load (${Math.round(load * 100)}%). Balanced glassmorphism maintains depth perception without overwhelming.`, 
      RICH: `Low cognitive load (${Math.round(load * 100)}%). Rich glassmorphism enhances spatial understanding and aesthetic engagement.`
    };
    return rationales[level];
  }
}

// Export for Node.js / module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdaptiveGlassmorphismInsight };
}

// Browser global
if (typeof window !== 'undefined') {
  window.AdaptiveGlassmorphismInsight = AdaptiveGlassmorphismInsight;
}

// Demo function for testing
function runAdaptiveGlassmorphismDemo() {
  const insight = new AdaptiveGlassmorphismInsight();
  
  const testScenarios = [
    { name: 'Idle Agent', telemetry: { activeTasks: 1, avgTaskDepth: 1, messageQueueLength: 2, avgLatencyMs: 50, errorRate: 0.01, retryCount: 0 } },
    { name: 'Normal Load', telemetry: { activeTasks: 4, avgTaskDepth: 2, messageQueueLength: 15, avgLatencyMs: 200, errorRate: 0.05, retryCount: 1 } },
    { name: 'High Load', telemetry: { activeTasks: 8, avgTaskDepth: 4, messageQueueLength: 40, avgLatencyMs: 800, errorRate: 0.15, retryCount: 3 } },
    { name: 'Crisis Mode', telemetry: { activeTasks: 12, avgTaskDepth: 5, messageQueueLength: 60, avgLatencyMs: 1500, errorRate: 0.3, retryCount: 5 } }
  ];

  console.log('=== Adaptive Glassmorphism Insight Demo ===\n');
  
  testScenarios.forEach(scenario => {
    const result = insight.generateInsight(scenario.telemetry);
    console.log(`[${scenario.name}]`);
    console.log(`  Cognitive Load: ${result.cognitiveLoad}`);
    console.log(`  Profile: ${result.profile}`);
    console.log(`  Rationale: ${result.rationale}`);
    console.log(`  CSS Variables:\n${result.cssVariables.split('\n').map(l => '    ' + l).join('\n')}`);
    console.log('');
  });
}

// Auto-run demo if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAdaptiveGlassmorphismDemo();
}