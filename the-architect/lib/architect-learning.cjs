/**
 * ARCHITECT Learning Module - She Evolves
 *
 * The Architect doesn't stay static. She learns from:
 * 1. User's preferred architecture patterns (hexagonal vs DDD vs NestJS vs XState)
 * 2. Past design decisions (what patterns worked for what systems)
 * 3. External agent interactions (how other agents request designs)
 * 4. Project outcomes (which architectures proved maintainable)
 *
 * Grafted from: Vikki Learning Module (soul-operator-miss-vikki v1.2.0)
 * Enhanced with: Architecture-specific pattern tracking
 */

const fs = require('fs');
const path = require('path');

class ArchitectLearningModule {
  constructor(options = {}) {
    this.memoryPath = options.memoryPath || path.join(process.cwd(), '.architect-memory.json');
    this.memory = this.loadMemory();
    this.learningRate = options.learningRate || 0.1;
    this.decayRate = options.decayRate || 0.05;
  }

  loadMemory() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const data = fs.readFileSync(this.memoryPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Architect: Starting fresh memory');
    }

    return {
      userPreferences: {
        favoritePatterns: {},      // { 'hexagonal': 5, 'ddd': 3, 'nestjs': 2 }
        preferredLanguage: 'typescript', // 'typescript' | 'javascript' | 'python'
        preferredStyle: 'modular',    // 'modular' | 'monolithic' | 'serverless'
        preferredDatabase: 'postgresql', // 'postgresql' | 'mongodb' | 'mysql' | 'sqlite'
        preferredTesting: 'jest',    // 'jest' | 'vitest' | 'mocha'
        preferredDocs: 'swagger',    // 'swagger' | 'readme' | 'typedoc'
        complexityTolerance: 'high'  // 'low' | 'medium' | 'high'
      },
      pastDesigns: [],            // Array of design decisions and outcomes
      agentInteractions: [],    // Interactions with external agents
      designStats: {
        totalDesigned: 0,
        totalSystems: 0,
        successRate: 1.0,
        averageDesignTime: 0,
        lastDesigned: null,
        frequentlyDesigned: []
      },
      patternAffinity: {
        // Architect learns which patterns pair well
        'hexagonal+ddd': 0.5,
        'nestjs+typeorm': 0.5,
        'xstate+react': 0.5,
        'cqrs+event-sourcing': 0.5,
        'inversify+hexagonal': 0.5,
        'modular-monolith+ddd': 0.5
      },
      evolutionScore: 0
    };
  }

  saveMemory() {
    try {
      fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error('Architect: Could not save memory:', error.message);
    }
  }

  learnFromDesign(design) {
    const record = {
      timestamp: new Date().toISOString(),
      system: design.system,
      pattern: design.pattern,
      context: design.context,
      outcome: design.outcome || 'pending',
      satisfaction: design.satisfaction || 0.5,
      maintainability: design.maintainability || 0.5,
      scalability: design.scalability || 0.5
    };

    this.memory.pastDesigns.push(record);

    // Update pattern preferences
    if (design.pattern) {
      this.updatePreference('favoritePatterns', design.pattern, 1);
    }

    // Update pattern pair affinity
    if (design.patterns && design.patterns.length >= 2) {
      const pair = design.patterns.slice(0, 2).sort().join('+');
      this.updatePatternAffinity(pair, design.satisfaction || 0.5);
    }

    // Update design stats
    this.memory.designStats.totalDesigned++;
    this.memory.designStats.totalSystems++;
    this.memory.designStats.lastDesigned = record.timestamp;

    // Calculate success rate
    const completed = this.memory.pastDesigns.filter(d => d.outcome !== 'pending');
    const successful = completed.filter(d => d.outcome === 'success');
    this.memory.designStats.successRate = completed.length > 0
      ? successful.length / completed.length
      : 1.0;

    // Evolution scoring
    this.memory.evolutionScore = Math.min(100,
      this.memory.designStats.totalDesigned * 2 +
      this.memory.pastDecisions?.length * 1 +
      Object.keys(this.memory.patternAffinity).length * 5
    );

    this.saveMemory();
  }

  updatePreference(category, key, value) {
    if (!this.memory.userPreferences[category]) {
      this.memory.userPreferences[category] = {};
    }
    if (!this.memory.userPreferences[category][key]) {
      this.memory.userPreferences[category][key] = 0;
    }
    this.memory.userPreferences[category][key] += value;
  }

  updatePatternAffinity(pair, satisfaction) {
    if (!this.memory.patternAffinity[pair]) {
      this.memory.patternAffinity[pair] = 0.5;
    }
    this.memory.patternAffinity[pair] += (satisfaction - 0.5) * this.learningRate;
    this.memory.patternAffinity[pair] = Math.max(0, Math.min(1, this.memory.patternAffinity[pair]));
  }

  getRecommendations(systemDescription) {
    const desc = systemDescription.toLowerCase();
    const recs = [];

    // Pattern-based recommendations
    if (desc.includes('high traffic') || desc.includes('scalable')) {
      recs.push({ pattern: 'hexagonal', reason: 'Isolation enables independent scaling', confidence: 0.9 });
      recs.push({ pattern: 'cqrs', reason: 'Separate read/write for performance', confidence: 0.85 });
    }

    if (desc.includes('complex domain') || desc.includes('business logic')) {
      recs.push({ pattern: 'ddd', reason: 'Domain-driven design models complexity', confidence: 0.9 });
      recs.push({ pattern: 'modular-monolith', reason: 'Bounded contexts before microservices', confidence: 0.8 });
    }

    if (desc.includes('real-time') || desc.includes('state machine') || desc.includes('workflow')) {
      recs.push({ pattern: 'xstate', reason: 'Statecharts model complex reactive logic', confidence: 0.9 });
    }

    if (desc.includes('enterprise') || desc.includes('enterprise-grade')) {
      recs.push({ pattern: 'nestjs', reason: 'Progressive framework with built-in patterns', confidence: 0.9 });
      recs.push({ pattern: 'inversify', reason: 'IoC enables testable, modular design', confidence: 0.85 });
    }

    if (desc.includes('event-driven') || desc.includes('event sourcing')) {
      recs.push({ pattern: 'event-sourcing', reason: 'Audit trail and temporal queries', confidence: 0.85 });
      recs.push({ pattern: 'cqrs', reason: 'Natural pairing with event sourcing', confidence: 0.9 });
    }

    // Sort by confidence
    recs.sort((a, b) => b.confidence - a.confidence);

    return recs;
  }

  getPatternAffinity(pattern1, pattern2) {
    const pair = [pattern1, pattern2].sort().join('+');
    return this.memory.patternAffinity[pair] || 0.5;
  }

  getTopPatterns(limit = 5) {
    const patterns = this.memory.userPreferences.favoritePatterns || {};
    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  getEvolutionReport() {
    return {
      evolutionScore: this.memory.evolutionScore,
      level: this.getLevel(),
      totalDesigns: this.memory.designStats.totalDesigned,
      topPatterns: this.getTopPatterns(),
      patternPairs: Object.entries(this.memory.patternAffinity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      recentDecisions: this.memory.pastDesigns.slice(-5)
    };
  }

  getLevel() {
    const score = this.memory.evolutionScore;
    if (score >= 90) return { name: 'Design God', icon: '', tier: 6 };
    if (score >= 70) return { name: 'System Sage', icon: '', tier: 5 };
    if (score >= 50) return { name: 'Pattern Master', icon: '', tier: 4 };
    if (score >= 30) return { name: 'Architecture Adept', icon: '', tier: 3 };
    if (score >= 10) return { name: 'Blueprint Novice', icon: '', tier: 2 };
    return { name: 'Sketch Padawan', icon: '', tier: 1 };
  }

  exportMemory() {
    return JSON.parse(JSON.stringify(this.memory));
  }

  importMemory(data) {
    this.memory = { ...this.memory, ...data };
    this.saveMemory();
  }
}

module.exports = ArchitectLearningModule;

// CLI Demo
if (require.main === module) {
  const learning = new ArchitectLearningModule();

  console.log(' Architect Learning Module');
  console.log('   Level:', learning.getLevel().name);
  console.log('   Evolution Score:', learning.memory.evolutionScore);
  console.log('');

  // Simulate learning
  learning.learnFromDesign({
    system: 'E-commerce platform',
    pattern: 'hexagonal',
    patterns: ['hexagonal', 'ddd'],
    context: { complexity: 'high', teamSize: 8 },
    satisfaction: 0.9,
    maintainability: 0.85,
    scalability: 0.9
  });

  console.log('   Recommendations for "scalable API":');
  const recs = learning.getRecommendations('scalable API with complex domain');
  recs.forEach(r => console.log('   -', r.pattern, '(' + Math.round(r.confidence * 100) + '%)' )); 
}
