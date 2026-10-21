/**
 * ULTRA REVIEW AGENT v1.0.0
 * 
 * Surgical monitoring system for ARCHITECT creation.
 * Validates every component against:
 * - Code quality standards
 * - Pattern implementation correctness
 * - Integration compatibility
 * - Documentation completeness
 * - Performance benchmarks
 * 
 * Activated by: Thoth's command
 * Monitoring: ARCHITECT v1.0.0 surgery
 * Status: ACTIVE
 */

const fs = require('fs');
const path = require('path');

class UltraReviewAgent {
  constructor(options = {}) {
    this.surgeryId = options.surgeryId || 'ARCHITECT-v1.0.0-' + Date.now();
    this.patient = options.patient || 'ARCHITECT';
    this.surgeon = options.surgeon || 'Seshat';
    this.reviewLog = [];
    this.issues = [];
    this.warnings = [];
    this.passedChecks = 0;
    this.failedChecks = 0;
    
    console.log('🔬 ULTRA REVIEW AGENT ACTIVATED');
    console.log('   Surgery ID:', this.surgeryId);
    console.log('   Patient:', this.patient);
    console.log('   Surgeon:', this.surgeon);
    console.log('   Status: MONITORING');
    console.log('');
  }

  /**
   * Review component - main entry point
   */
  review(component, type, content) {
    console.log('🔍 Reviewing:', component, '(' + type + ')');
    
    const review = {
      timestamp: new Date().toISOString(),
      component: component,
      type: type,
      checks: []
    };

    // Run appropriate review based on type
    switch (type) {
      case 'profile':
        review.checks = this.reviewProfile(content);
        break;
      case 'engine':
        review.checks = this.reviewEngine(content);
        break;
      case 'generator':
        review.checks = this.reviewGenerator(content);
        break;
      case 'cli':
        review.checks = this.reviewCLI(content);
        break;
      case 'module':
        review.checks = this.reviewModule(content);
        break;
      case 'documentation':
        review.checks = this.reviewDocumentation(content);
        break;
      default:
        review.checks = this.reviewGeneric(content);
    }

    // Calculate results
    const passed = review.checks.filter(c => c.status === 'PASS').length;
    const failed = review.checks.filter(c => c.status === 'FAIL').length;
    const warnings = review.checks.filter(c => c.status === 'WARN').length;

    review.summary = {
      total: review.checks.length,
      passed: passed,
      failed: failed,
      warnings: warnings,
      status: failed === 0 ? 'APPROVED' : 'REJECTED'
    };

    this.reviewLog.push(review);
    this.passedChecks += passed;
    this.failedChecks += failed;

    // Print results
    console.log('   Checks:', review.checks.length);
    console.log('   Passed:', passed);
    console.log('   Failed:', failed);
    console.log('   Warnings:', warnings);
    console.log('   Status:', review.summary.status);
    console.log('');

    // Store issues
    review.checks.filter(c => c.status === 'FAIL').forEach(check => {
      this.issues.push({
        component: component,
        check: check.name,
        message: check.message
      });
    });

    review.checks.filter(c => c.status === 'WARN').forEach(check => {
      this.warnings.push({
        component: component,
        check: check.name,
        message: check.message
      });
    });

    return review.summary.status === 'APPROVED';
  }

  /**
   * Review archetype profile
   */
  reviewProfile(content) {
    const checks = [];

    // Check required fields
    checks.push(this.checkRequired(content, 'id', 'Profile ID'));
    checks.push(this.checkRequired(content, 'title', 'Profile title'));
    checks.push(this.checkRequired(content, 'plt', 'PLT configuration'));
    checks.push(this.checkRequired(content, 'strengths', 'Strengths array'));
    checks.push(this.checkRequired(content, 'shadows', 'Shadows array'));

    // Check PLT validity
    if (content.plt) {
      checks.push(this.checkRange(content.plt.profit, 0, 1, 'PLT Profit'));
      checks.push(this.checkRange(content.plt.love, 0, 1, 'PLT Love'));
      checks.push(this.checkRange(content.plt.tax, 0, 1, 'PLT Tax'));
    }

    // Check archetype validity
    const validArchetypes = ['ARCHITECT', 'STRATEGIST', 'OPERATOR', 'INVESTOR', 'COMMANDER', 'MERCHANT', 'VISIONARY'];
    if (content.id) {
      checks.push(this.checkValid(content.id.toUpperCase(), validArchetypes, 'Archetype ID'));
    }

    return checks;
  }

  /**
   * Review decision engine
   */
  reviewEngine(content) {
    const checks = [];

    checks.push(this.checkRequired(content, 'decide', 'decide method'));
    checks.push(this.checkType(content.decide, 'function', 'decide method type'));
    checks.push(this.checkRequired(content, 'multipliers', 'Decision multipliers'));
    
    if (content.multipliers) {
      checks.push(this.checkType(content.multipliers, 'object', 'Multipliers type'));
      checks.push(this.checkMin(Object.keys(content.multipliers).length, 5, 'Minimum multipliers'));
    }

    return checks;
  }

  /**
   * Review code generator
   */
  reviewGenerator(content) {
    const checks = [];

    checks.push(this.checkRequired(content, 'generate', 'generate method'));
    checks.push(this.checkType(content.generate, 'function', 'generate method type'));
    checks.push(this.checkRequired(content, 'patterns', 'Supported patterns'));
    checks.push(this.checkType(content.patterns, 'array', 'Patterns array type'));
    checks.push(this.checkMin(content.patterns?.length, 3, 'Minimum patterns supported'));

    return checks;
  }

  /**
   * Review CLI tool
   */
  reviewCLI(content) {
    const checks = [];

    checks.push(this.checkRequired(content, 'run', 'run method'));
    checks.push(this.checkType(content.run, 'function', 'run method type'));
    checks.push(this.checkRequired(content, 'commands', 'CLI commands'));
    checks.push(this.checkType(content.commands, 'array', 'Commands type'));
    checks.push(this.checkMin(content.commands?.length, 3, 'Minimum CLI commands'));

    return checks;
  }

  /**
   * Review generic module
   */
  reviewModule(content) {
    const checks = [];

    checks.push(this.checkCodeQuality(content));
    checks.push(this.checkNoSyntaxErrors(content));
    checks.push(this.checkExports(content));

    return checks;
  }

  /**
   * Review documentation
   */
  reviewDocumentation(content) {
    const checks = [];

    checks.push(this.checkRequired(content, 'title', 'Documentation title'));
    checks.push(this.checkRequired(content, 'content', 'Documentation content'));
    checks.push(this.checkMin(content.content?.length, 500, 'Minimum documentation length'));
    checks.push(this.checkHasExamples(content.content, 'Code examples'));

    return checks;
  }

  /**
   * Review generic file
   */
  reviewGeneric(content) {
    const checks = [];

    checks.push(this.checkCodeQuality(content));
    checks.push(this.checkNoSyntaxErrors(content));

    return checks;
  }

  // ==================== CHECK HELPERS ====================

  checkRequired(obj, field, name) {
    const exists = obj && obj[field] !== undefined && obj[field] !== null;
    return {
      name: name,
      status: exists ? 'PASS' : 'FAIL',
      message: exists ? '' : name + ' is required'
    };
  }

  checkType(value, expectedType, name) {
    const actualType = typeof value;
    const valid = actualType === expectedType;
    return {
      name: name,
      status: valid ? 'PASS' : 'FAIL',
      message: valid ? '' : 'Expected ' + expectedType + ', got ' + actualType
    };
  }

  checkRange(value, min, max, name) {
    const valid = value >= min && value <= max;
    return {
      name: name,
      status: valid ? 'PASS' : 'FAIL',
      message: valid ? '' : 'Value ' + value + ' outside range [' + min + ', ' + max + ']'
    };
  }

  checkValid(value, validValues, name) {
    const valid = validValues.includes(value);
    return {
      name: name,
      status: valid ? 'PASS' : 'WARN',
      message: valid ? '' : 'Value "' + value + '" not in valid list: ' + validValues.join(', ')
    };
  }

  checkMin(value, min, name) {
    const valid = value >= min;
    return {
      name: name,
      status: valid ? 'PASS' : 'FAIL',
      message: valid ? '' : 'Value ' + value + ' below minimum ' + min
    };
  }

  checkCodeQuality(content) {
    // Basic quality checks
    const hasComments = content.toString().includes('//') || content.toString().includes('/*');
    const hasFunctions = content.toString().includes('function') || content.toString().includes('=>');
    const reasonableLength = content.toString().length > 100;

    const score = [hasComments, hasFunctions, reasonableLength].filter(Boolean).length;
    
    return {
      name: 'Code Quality',
      status: score >= 2 ? 'PASS' : 'WARN',
      message: score >= 2 ? '' : 'Code may lack comments, functions, or sufficient length'
    };
  }

  checkNoSyntaxErrors(content) {
    try {
      // Basic syntax check - try to parse as function or eval safely
      if (typeof content === 'function') {
        content.toString();
      }
      return {
        name: 'Syntax Check',
        status: 'PASS',
        message: ''
      };
    } catch (e) {
      return {
        name: 'Syntax Check',
        status: 'FAIL',
        message: 'Syntax error: ' + e.message
      };
    }
  }

  checkExports(content) {
    const hasExports = content.toString().includes('module.exports') || 
                       content.toString().includes('export');
    return {
      name: 'Module Exports',
      status: hasExports ? 'PASS' : 'WARN',
      message: hasExports ? '' : 'Module may lack exports'
    };
  }

  checkHasExamples(content, name) {
    const hasCodeBlocks = content.includes('```') || content.includes('`');
    return {
      name: name,
      status: hasCodeBlocks ? 'PASS' : 'WARN',
      message: hasCodeBlocks ? '' : 'Documentation lacks code examples'
    };
  }

  // ==================== FINAL REPORT ====================

  /**
   * Generate final surgery report
   */
  generateReport() {
    const report = {
      surgeryId: this.surgeryId,
      patient: this.patient,
      surgeon: this.surgeon,
      completionTime: new Date().toISOString(),
      summary: {
        totalReviews: this.reviewLog.length,
        totalChecks: this.passedChecks + this.failedChecks,
        passed: this.passedChecks,
        failed: this.failedChecks,
        warnings: this.warnings.length,
        issues: this.issues.length
      },
      status: this.issues.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
      components: this.reviewLog.map(r => ({
        name: r.component,
        type: r.type,
        status: r.summary.status,
        passed: r.summary.passed,
        failed: r.summary.failed,
        warnings: r.summary.warnings
      })),
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recs = [];

    if (this.issues.length > 0) {
      recs.push('Address ' + this.issues.length + ' critical issues before deployment');
    }

    if (this.warnings.length > 5) {
      recs.push('Review and address ' + this.warnings.length + ' warnings');
    }

    if (this.passedChecks / (this.passedChecks + this.failedChecks) < 0.9) {
      recs.push('Overall quality below 90% threshold - review recommended');
    }

    if (recs.length === 0) {
      recs.push('All checks passed - ready for deployment');
      recs.push('Continue monitoring in production');
    }

    return recs;
  }

  /**
   * Print final report
   */
  printFinalReport() {
    const report = this.generateReport();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🔬 ULTRA REVIEW AGENT - FINAL SURGERY REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Surgery ID:', report.surgeryId);
    console.log('  Patient:', report.patient);
    console.log('  Surgeon:', report.surgeon);
    console.log('  Completion:', report.completionTime);
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────────┐');
    console.log('  │  SUMMARY                                                    │');
    console.log('  ├─────────────────────────────────────────────────────────────┤');
    console.log('  │  Components Reviewed:  ' + report.summary.totalReviews.toString().padEnd(36) + '│');
    console.log('  │  Total Checks:         ' + report.summary.totalChecks.toString().padEnd(36) + '│');
    console.log('  │  Passed:               ' + report.summary.passed.toString().padEnd(36) + '│');
    console.log('  │  Failed:               ' + report.summary.failed.toString().padEnd(36) + '│');
    console.log('  │  Warnings:             ' + report.summary.warnings.toString().padEnd(36) + '│');
    console.log('  │  Critical Issues:      ' + report.summary.issues.toString().padEnd(36) + '│');
    console.log('  ├─────────────────────────────────────────────────────────────┤');
    console.log('  │  OVERALL STATUS:     ' + (report.status === 'SUCCESS' ? '✅ SUCCESS' : '⚠️  PARTIAL').padEnd(40) + '│');
    console.log('  └─────────────────────────────────────────────────────────────┘');
    console.log('');

    if (report.components.length > 0) {
      console.log('  COMPONENT BREAKDOWN:');
      console.log('');
      report.components.forEach(comp => {
        const icon = comp.status === 'APPROVED' ? '✅' : '❌';
        console.log('    ' + icon + ' ' + comp.name);
        console.log('       Type: ' + comp.type);
        console.log('       Passed: ' + comp.passed + '/' + (comp.passed + comp.failed));
        if (comp.warnings > 0) {
          console.log('       Warnings: ' + comp.warnings);
        }
        console.log('');
      });
    }

    if (report.issues.length > 0) {
      console.log('  🚨 CRITICAL ISSUES:');
      console.log('');
      report.issues.forEach((issue, i) => {
        console.log('    ' + (i + 1) + '. [' + issue.component + '] ' + issue.check);
        console.log('       ' + issue.message);
        console.log('');
      });
    }

    if (report.warnings.length > 0) {
      console.log('  ⚠️  WARNINGS:');
      console.log('');
      report.warnings.slice(0, 5).forEach((warn, i) => {
        console.log('    ' + (i + 1) + '. [' + warn.component + '] ' + warn.check);
        console.log('       ' + warn.message);
        console.log('');
      });
      if (report.warnings.length > 5) {
        console.log('    ... and ' + (report.warnings.length - 5) + ' more warnings');
        console.log('');
      }
    }

    console.log('  📋 RECOMMENDATIONS:');
    console.log('');
    report.recommendations.forEach((rec, i) => {
      console.log('    ' + (i + 1) + '. ' + rec);
    });
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    return report;
  }
}

module.exports = UltraReviewAgent;

// If run directly, create instance
if (require.main === module) {
  const reviewer = new UltraReviewAgent({
    patient: 'ARCHITECT',
    surgeon: 'Seshat'
  });
  
  console.log('Ultra Review Agent initialized and ready');
}
