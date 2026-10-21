/**
 * Power: ULTRA-REVIEW
 * Surgical monitoring system. Validates architecture against standards.
 * Wraps the UltraReviewAgent.
 *
 * When to use: The user wants quality assurance, code review, or
 *   architecture validation.
 */

const UltraReviewAgent = require('../../ultra-review/ultra-review-agent.cjs');

class PowerUltraReview {
  constructor(options = {}) {
    this.reviewer = new UltraReviewAgent({
      surgeryId: 'ARCHITECT-REVIEW-' + Date.now(),
      patient: options.patient || 'ARCHITECT',
      surgeon: options.surgeon || 'Seshat'
    });
  }

  status() {
    return {
      ready: true,
      reviews: this.reviewer.reviewLog?.length || 0,
      issues: this.reviewer.issues?.length || 0
    };
  }

  execute(mission) {
    const component = mission.component || mission.description || 'unknown';
    const type = mission.reviewType || mission.type || 'generic';
    const content = mission.content || mission;

    try {
      const approved = this.reviewer.review(component, type, content);
      const report = this.reviewer.generateReport();

      return {
        output: {
          approved,
          component,
          type,
          checks: report.components?.find(c => c.name === component) || {},
          totalIssues: report.issues?.length || 0,
          totalWarnings: report.warnings?.length || 0,
          recommendations: report.recommendations
        }
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}

module.exports = PowerUltraReview;
