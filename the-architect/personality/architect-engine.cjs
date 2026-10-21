/**
 * ARCHITECT Decision Engine v1.0.0
 * 
 * Pattern recognition and architectural decision making.
 * 
 * Grafted from:
 * - domain-driven-hexagon decision patterns (14.7k★)
 * - modular-monolith-ddd strategic design (13.7k★)
 * - Clean Architecture principles (6.8k★)
 */

const architectProfile = require('./architect-profile.cjs');

class ArchitectDecisionEngine {
  constructor(context = {}) {
    this.context = context;
    this.decisionsMade = 0;
    this.patternMatches = new Map();
    this.initializePatterns();
  }

  /**
   * Initialize pattern recognition database
   */
  initializePatterns() {
    // Architectural pattern signatures
    this.patterns = {
      'hexagonal': {
        signals: ['ports', 'adapters', 'domain logic isolation', 'testable'],
        antiSignals: ['framework coupling', 'database in domain'],
        weight: 2.0
      },
      'ddd': {
        signals: ['bounded context', 'ubiquitous language', 'aggregate', 'entity', 'value object'],
        antiSignals: ['anemic domain model', 'transaction script'],
        weight: 1.9
      },
      'cqrs': {
        signals: ['read model', 'write model', 'command', 'query', 'eventual consistency'],
        antiSignals: ['single model', 'immediate consistency required'],
        weight: 1.7
      },
      'event_sourcing': {
        signals: ['event stream', 'state reconstruction', 'audit log', 'temporal query'],
        antiSignals: ['simple CRUD', 'no audit needs'],
        weight: 1.6
      },
      'modular_monolith': {
        signals: ['modules', 'bounded contexts', 'internal APIs', 'team alignment'],
        antiSignals: ['distributed deployment needed', 'independent scaling'],
        weight: 1.5
      },
      'microservices': {
        signals: ['distributed', 'independent deploy', 'service boundaries', 'polyglot'],
        antiSignals: ['team size < 10', 'no devops expertise'],
        weight: 1.4
      },
      'clean_architecture': {
        signals: ['dependency rule', 'inner circles', 'framework independence'],
        antiSignals: ['quick prototype', 'throwaway code'],
        weight: 1.8
      }
    };
  }

  /**
   * Main decision method
   * Pattern from: domain-driven-hexagon decision logic
   */
  decide({ task, options, context = {} }) {
    console.log('🏗️  ARCHITECT analyzing:', task);
    
    // Step 1: Pattern Recognition
    const detectedPatterns = this.detectPatterns(task, context);
    
    // Step 2: Score Options
    const scoredOptions = options.map(opt => {
      const score = this.scoreOption(opt, detectedPatterns, context);
      return { ...opt, score };
    });

    // Step 3: Apply Multipliers
    const withMultipliers = scoredOptions.map(opt => {
      const multiplier = this.getMultiplier(opt.type);
      return { ...opt, finalScore: opt.score * multiplier };
    });

    // Step 4: Sort and Select
    withMultipliers.sort((a, b) => b.finalScore - a.finalScore);
    const winner = withMultipliers[0];

    // Step 5: Generate Rationale
    const rationale = this.generateRationale(winner, detectedPatterns);

    // Step 6: Check for Shadow Warnings
    const warnings = this.checkShadows(winner, context);

    this.decisionsMade++;

    return {
      task,
      choice: winner.type,
      score: Math.round(winner.finalScore * 100) / 100,
      patterns: detectedPatterns,
      alternatives: withMultipliers.slice(1, 3).map(o => o.type),
      rationale,
      warnings,
      voice: this.getArchitectVoice(winner.type),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect architectural patterns in task description
   * Pattern from: Pattern recognition in modular-monolith-ddd
   */
  detectPatterns(task, context) {
    const taskLower = task.toLowerCase();
    const contextLower = JSON.stringify(context).toLowerCase();
    const combined = taskLower + ' ' + contextLower;
    
    const detected = [];
    
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      let signalScore = 0;
      let antiSignalScore = 0;
      
      // Check positive signals
      pattern.signals.forEach(signal => {
        if (combined.includes(signal.toLowerCase())) {
          signalScore += 1;
        }
      });
      
      // Check negative signals
      pattern.antiSignals.forEach(antiSignal => {
        if (combined.includes(antiSignal.toLowerCase())) {
          antiSignalScore += 1;
        }
      });
      
      // Calculate match score
      const matchScore = (signalScore / pattern.signals.length) - (antiSignalScore / pattern.antiSignals.length);
      
      if (matchScore > 0.3) {
        detected.push({
          pattern: patternName,
          confidence: Math.round(matchScore * 100) / 100,
          weight: pattern.weight,
          signals: pattern.signals.filter(s => combined.includes(s.toLowerCase()))
        });
      }
    }
    
    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence);
    
    return detected.slice(0, 3); // Top 3 patterns
  }

  /**
   * Score an option based on detected patterns
   */
  scoreOption(option, detectedPatterns, context) {
    let score = option.baseUtility || 0.5;
    
    // Boost score if option matches detected patterns
    detectedPatterns.forEach(pattern => {
      if (option.patterns && option.patterns.includes(pattern.pattern)) {
        score += pattern.confidence * pattern.weight * 0.2;
      }
    });
    
    // Context modifiers
    if (context.phase === 'design') {
      score *= 1.3; // ARCHITECT excels in design phase
    }
    
    if (context.complexity === 'high') {
      score *= 1.2; // Complex systems need architecture
    }
    
    if (context.teamSize > 5) {
      score *= 1.1; // Larger teams benefit from clear architecture
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Get multiplier for option type
   */
  getMultiplier(type) {
    const multipliers = architectProfile.multipliers;
    return multipliers[type] || 1.0;
  }

  /**
   * Generate rationale for decision
   */
  generateRationale(winner, detectedPatterns) {
    let rationale = 'Selected ' + winner.type + ' because:';
    
    if (detectedPatterns.length > 0) {
      rationale += '\n- Detected ' + detectedPatterns[0].pattern + ' pattern (' + Math.round(detectedPatterns[0].confidence * 100) + '% confidence)';
    }
    
    if (winner.patterns) {
      rationale += '\n- Aligns with ' + winner.patterns.join(', ') + ' principles';
    }
    
    rationale += '\n- Base utility: ' + (winner.baseUtility || 0.5);
    rationale += '\n- Final score: ' + Math.round(winner.finalScore * 100) / 100;
    
    return rationale;
  }

  /**
   * Check for shadow warnings
   */
  checkShadows(winner, context) {
    const warnings = [];
    
    // Check for analysis paralysis
    if (this.decisionsMade > 10 && context.phase === 'design') {
      warnings.push({
        shadow: 'Analysis Paralysis',
        message: 'You have made ' + this.decisionsMade + ' design decisions. Consider time-boxing.',
        severity: 'high'
      });
    }
    
    // Check for premature abstraction
    if (winner.type === 'abstraction' && !context.concreteFirst) {
      warnings.push({
        shadow: 'Premature Abstraction',
        message: 'Build concrete implementation first, then abstract.',
        severity: 'medium'
      });
    }
    
    // Check for over-engineering
    if (detectedPatterns.length > 3) {
      warnings.push({
        shadow: 'Over-Engineering',
        message: 'Multiple patterns detected. Are they all necessary?',
        severity: 'medium'
      });
    }
    
    return warnings;
  }

  /**
   * Get ARCHITECT voice for decision
   */
  getArchitectVoice(choice) {
    const voices = {
      'hexagonal': 'Ports and adapters will isolate our domain.',
      'ddd': 'Let the domain drive the design.',
      'cqrs': 'Separate reads from writes for clarity.',
      'clean_architecture': 'Dependencies point inward.',
      'modular_monolith': 'Modules first, microservices later.',
      'abstraction': 'The pattern reveals itself.',
      'refactoring': 'Continuous improvement.',
      'default': 'Design for change.'
    };
    
    return voices[choice] || voices.default;
  }

  /**
   * Recommend architecture for system
   */
  recommendArchitecture(systemDescription) {
    const patterns = this.detectPatterns(systemDescription, {});
    
    return {
      description: systemDescription,
      recommendedPatterns: patterns,
      primaryPattern: patterns[0]?.pattern || 'layered',
      confidence: patterns[0]?.confidence || 0.5,
      alternatives: patterns.slice(1).map(p => p.pattern),
      rationale: this.generateArchitectureRationale(patterns)
    };
  }

  /**
   * Generate architecture rationale
   */
  generateArchitectureRationale(patterns) {
    if (patterns.length === 0) {
      return 'No strong pattern matches detected. Consider starting with layered architecture.';
    }
    
    const primary = patterns[0];
    let rationale = 'Primary pattern: ' + primary.pattern + ' (' + Math.round(primary.confidence * 100) + '% confidence)';
    
    rationale += '\n\nSignals detected:';
    primary.signals.forEach(signal => {
      rationale += '\n- ' + signal;
    });
    
    if (patterns.length > 1) {
      rationale += '\n\nSecondary patterns to consider:';
      patterns.slice(1).forEach(p => {
        rationale += '\n- ' + p.pattern + ' (' + Math.round(p.confidence * 100) + '%)';
      });
    }
    
    return rationale;
  }

  /**
   * Get engine stats
   */
  getStats() {
    return {
      decisionsMade: this.decisionsMade,
      patternsRecognized: this.patternMatches.size,
      archetype: 'ARCHITECT',
      focus: 'System Design',
      multipliers: Object.keys(architectProfile.multipliers).length
    };
  }
}

module.exports = ArchitectDecisionEngine;

// CLI demo
if (require.main === module) {
  const engine = new ArchitectDecisionEngine();
  
  console.log('🏗️  ARCHITECT Decision Engine v1.0.0');
  console.log('');
  
  // Test decision
  const result = engine.decide({
    task: 'Design e-commerce order system with event tracking',
    options: [
      { type: 'hexagonal', baseUtility: 0.8, patterns: ['hexagonal', 'ddd'] },
      { type: 'ddd', baseUtility: 0.9, patterns: ['ddd', 'clean_architecture'] },
      { type: 'cqrs', baseUtility: 0.7, patterns: ['cqrs', 'event_sourcing'] },
      { type: 'ship_fast', baseUtility: 0.6 }
    ],
    context: {
      phase: 'design',
      complexity: 'high',
      teamSize: 8
    }
  });
  
  console.log('Decision Result:');
  console.log('Choice:', result.choice);
  console.log('Score:', result.score);
  console.log('Patterns:', result.patterns.map(p => p.pattern).join(', '));
  console.log('Voice:', result.voice);
  console.log('');
  console.log('Stats:', engine.getStats());
}
