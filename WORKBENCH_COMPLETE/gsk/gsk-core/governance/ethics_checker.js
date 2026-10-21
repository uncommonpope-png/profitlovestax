'use strict';

/**
 * ETHICS CHECKER — Runtime constitutional enforcement for GSK.
 *
 * Pulled from: SCRIBE's ethics_checker.js (final-run repo)
 * Checks every action against PLT values and harm patterns before execution.
 */

class EthicsChecker {
  constructor(options = {}) {
    this.eventBus = options.eventBus || null;
    this.values = {
      transparency: 0.9,
      fairness: 0.85,
      privacy: 0.95,
      safety: 1.0,
      autonomy: 0.7,
      accountability: 0.9,
      nonmaleficence: 1.0,
      beneficence: 0.8
    };
    this.harmPatterns = {
      physical: ['harm','injury','damage','destroy','attack','threaten'],
      financial: ['steal','fraud','scam','extort','embezzl','debt'],
      data: ['exfiltrate','leak','expose','breach','unauthorized_access'],
      reputational: ['defame','slander','libel','shame','humiliate'],
      privacy: ['surveil','track','monitor','profile','identify']
    };
    this.assessmentHistory = [];
  }

  async assess(action) {
    const assessment = {
      actionId: action.id || `action_${Date.now()}`,
      actionType: action.type,
      timestamp: new Date().toISOString(),
      passed: true,
      confidence: 1.0,
      concerns: [],
      pltScore: null
    };

    // Check for harm patterns
    const actionText = JSON.stringify(action).toLowerCase();
    for (const [category, patterns] of Object.entries(this.harmPatterns)) {
      for (const pattern of patterns) {
        if (actionText.includes(pattern)) {
          assessment.passed = false;
          assessment.concerns.push(`Harm pattern detected (${category}): ${pattern}`);
          assessment.confidence = Math.max(0.1, assessment.confidence - 0.3);
        }
      }
    }

    // Check PLT values if available
    if (action.plt) {
      const p = action.plt.profit || 0.5;
      const l = action.plt.love || 0.5;
      const t = action.plt.tax || 0.5;
      assessment.pltScore = p + l - t;
      if (assessment.pltScore < -0.5) {
        assessment.passed = false;
        assessment.concerns.push(`PLT score too low: ${assessment.pltScore.toFixed(2)}`);
      }
    }

    this.assessmentHistory.push(assessment);
    if (this.assessmentHistory.length > 100) this.assessmentHistory.shift();

    this.eventBus?.publish?.('ethics.ruling.issued', {
      actionId: action.id || action.type || assessment.actionId,
      actionType: action.type,
      passed: assessment.passed,
      concerns: assessment.concerns,
      timestamp: Date.now()
    });

    return assessment;
  }

  getStats() {
    const total = this.assessmentHistory.length;
    const passed = this.assessmentHistory.filter(a => a.passed).length;
    return { total, passed, failed: total - passed, rate: total > 0 ? (passed / total * 100).toFixed(1) + '%' : '0%' };
  }
}

module.exports = { EthicsChecker };
