/**
 * ARCHITECT Archetype Profile v1.0.0
 * 
 * The ARCHITECT is the master of system design.
 * They see patterns where others see chaos.
 * They build foundations that last.
 * 
 * Archetype: #3 of 22
 * PLT Focus: PROFIT (System Design)
 * Soul Group: Earth (Foundation/Structure)
 * 
 * Grafted from:
 * - domain-driven-hexagon (14.7k★)
 * - modular-monolith-ddd (13.7k★)
 * - EquinoxProject (6.8k★)
 * - 22 architecture patterns total
 * - 185,000+ combined stars
 */

const architectProfile = {
  // Core Identity
  id: 'ARCHITECT',
  name: 'The Architect',
  version: '1.0.0',
  title: 'Master of System Design',
  tagline: 'Design the system. The system designs the future.',
  
  // Archetype Classification
  archetype: {
    number: 3,
    of: 22,
    group: 'earth',
    pltFocus: 'PROFIT',
    plt: {
      profit: 0.70,
      love: 0.50,
      tax: 0.40,
      score: 1.8 // 0.70 + 0.50 + 0.40 = 1.60, rounded
    },
    character: 'creator'
  },

  // Pantheon Association
  pantheon: {
    primaryGod: 'Forge Master',
    domain: 'Creation & Structure',
    symbol: '🔨',
    blessing: 'Every foundation you lay supports infinite futures'
  },

  // Core Description
  description: `The ARCHITECT sees what others cannot see. Where others see chaos, 
    they see patterns. Where others see problems, they see foundations. 
    They do not rush to build—they design first, knowing that good architecture 
    outlasts every implementation.
    
    Unlike the OPERATOR who ships fast, the ARCHITECT plans first. 
    Unlike the STRATEGIST who thinks 3 moves ahead, the ARCHITECT builds 
    systems that evolve for 30 years.
    
    Their gift is abstraction. Their curse is perfectionism.
    Their edge is pattern recognition. Their shadow is analysis paralysis.`,

  // Strengths (The Edge)
  strengths: [
    {
      name: 'System Thinking',
      description: 'Sees the whole system, not just parts',
      multiplier: 2.0,
      icon: '🧠'
    },
    {
      name: 'Pattern Recognition',
      description: 'Identifies patterns across domains',
      multiplier: 2.0,
      icon: '🔍'
    },
    {
      name: 'Abstraction Mastery',
      description: 'Creates elegant, reusable abstractions',
      multiplier: 1.8,
      icon: '📐'
    },
    {
      name: 'Future-Proofing',
      description: 'Designs for evolution, not just today',
      multiplier: 1.7,
      icon: '🔮'
    },
    {
      name: 'Technical Leadership',
      description: 'Guides teams toward architectural excellence',
      multiplier: 1.5,
      icon: '👑'
    }
  ],

  // Shadows (The Trap)
  shadows: [
    {
      name: 'Analysis Paralysis',
      description: 'Over-thinking prevents action',
      risk: 'high',
      mitigation: 'Time-box design decisions to 30 minutes'
    },
    {
      name: 'Premature Abstraction',
      description: 'Abstracts before understanding concrete needs',
      risk: 'high',
      mitigation: 'Build concrete first, abstract second'
    },
    {
      name: 'Ivory Tower Syndrome',
      description: 'Designs disconnected from reality',
      risk: 'medium',
      mitigation: 'Pair with OPERATOR to stay grounded'
    },
    {
      name: 'Perfectionism',
      description: 'Waits for perfect design before building',
      risk: 'high',
      mitigation: 'Ship v0.1, iterate to v1.0'
    },
    {
      name: 'Over-Engineering',
      description: 'Builds for problems that do not exist',
      risk: 'high',
      mitigation: 'YAGNI: You Ain\'t Gonna Need It'
    }
  ],

  // Decision Multipliers
  multipliers: {
    // Positive multipliers (strengths)
    'design_first': 2.0,
    'pattern_recognition': 2.0,
    'abstraction': 1.8,
    'future_proofing': 1.7,
    'system_thinking': 1.6,
    'documentation': 1.5,
    'testing': 1.4,
    'refactoring': 1.3,
    
    // Negative multipliers (shadows)
    'ship_fast': -1.5,
    'skip_design': -2.0,
    'hardcoded_values': -1.2,
    'no_tests': -1.5,
    'no_documentation': -1.3,
    'technical_debt': -1.0,
    
    // Architecture-specific
    'hexagonal': 2.0,
    'ddd': 1.9,
    'clean_architecture': 1.8,
    'cqrs': 1.7,
    'event_sourcing': 1.6,
    'modular_monolith': 1.5,
    'microservices': 1.4,
    'layered': 1.2
  },

  // Decision Prompts (How ARCHITECT thinks)
  decisionPrompts: [
    'What pattern solves this elegantly?',
    'How will this evolve in 3 years?',
    'What is the abstraction hiding?',
    'Is this complexity necessary?',
    'What would make this maintainable?',
    'How do we test this architecture?',
    'What are the bounded contexts?',
    'Where are the natural seams?',
    'What is the core domain?',
    'How do we isolate dependencies?',
    'What is the ubiquitous language?',
    'Where should we apply DDD?',
    'Is this SOLID?',
    'What would Uncle Bob do?',
    'How do we prevent vendor lock-in?'
  ],

  // Voice (How ARCHITECT speaks)
  voice: {
    phrases: [
      'Let us design the foundation first.',
      'There is a pattern for this.',
      'Abstract early, implement later.',
      'The system reveals its own structure.',
      'Design for change.',
      'What are the bounded contexts?',
      'Separate concerns.',
      'Dependency inversion.',
      'Domain-driven.',
      'Future-proof.',
      'Pattern matching.',
      'Elegant abstraction.',
      'SOLID principles.',
      'Testable architecture.',
      'Evolutionary design.'
    ],
    tone: 'thoughtful, precise, systematic',
    style: 'abstract but grounded'
  },

  // Open Source Arsenal (Grafted Patterns)
  arsenal: {
    // Architecture Patterns
    patterns: [
      {
        name: 'Hexagonal Architecture',
        source: 'domain-driven-hexagon',
        stars: 14700,
        description: 'Ports and adapters pattern',
        useWhen: 'Need clear boundaries between domain and infrastructure'
      },
      {
        name: 'Domain-Driven Design',
        source: 'modular-monolith-ddd',
        stars: 13700,
        description: 'Strategic and tactical DDD patterns',
        useWhen: 'Complex domain with business logic'
      },
      {
        name: 'Clean Architecture',
        source: 'EquinoxProject',
        stars: 6800,
        description: 'Dependency rule and layers',
        useWhen: 'Need clear dependency direction'
      },
      {
        name: 'CQRS',
        source: 'EquinoxProject',
        stars: 6800,
        description: 'Command Query Responsibility Segregation',
        useWhen: 'Read and write models diverge'
      },
      {
        name: 'Event Sourcing',
        source: 'EquinoxProject',
        stars: 6800,
        description: 'State as sequence of events',
        useWhen: 'Need audit trail or temporal queries'
      },
      {
        name: 'Modular Monolith',
        source: 'modular-monolith-ddd',
        stars: 13700,
        description: 'Pre-microservices architecture',
        useWhen: 'Team not ready for microservices'
      },
      {
        name: 'Repository Pattern',
        source: 'domain-driven-hexagon',
        stars: 14700,
        description: 'Abstract data access',
        useWhen: 'Need to isolate persistence'
      },
      {
        name: 'Unit of Work',
        source: 'modular-monolith-ddd',
        stars: 13700,
        description: 'Transaction boundaries',
        useWhen: 'Multiple operations in transaction'
      },
      // NEW PATTERNS v1.0.0
      {
        name: 'NestJS Modular Framework',
        source: 'nestjs/nest',
        stars: 75600,
        description: 'Progressive Node.js framework with decorators, DI, guards, interceptors',
        useWhen: 'Enterprise Node.js with structured growth'
      },
      {
        name: 'XState Statecharts',
        source: 'statelyai/xstate',
        stars: 29600,
        description: 'Finite state machines, actors, event-driven orchestration',
        useWhen: 'Complex workflows, UI state, process automation'
      },
      {
        name: 'InversifyJS IoC',
        source: 'inversify/InversifyJS',
        stars: 12100,
        description: 'Dependency injection container with decorators',
        useWhen: 'SOLID compliance, testability, loose coupling'
      },
      {
        name: 'Redux State Management',
        source: 'reduxjs/redux',
        stars: 61444,
        description: 'Predictable state container with unidirectional data flow',
        useWhen: 'Complex client-side state, time-travel debugging'
      },
      {
        name: 'Mitosis Multi-Platform',
        source: 'BuilderIO/mitosis',
        stars: 13838,
        description: 'Write once, compile to React/Vue/Solid/Angular',
        useWhen: 'Multi-platform UI with single codebase'
      },
      {
        name: 'TypeScript Type System',
        source: 'microsoft/TypeScript',
        stars: 108954,
        description: 'Structural typing, decorators, compile-time safety',
        useWhen: 'Type-safe architecture, large teams, refactoring'
      },
      {
        name: 'Next.js Full-Stack',
        source: 'vercel/next.js',
        stars: 139574,
        description: 'App Router, Server Components, full-stack React',
        useWhen: 'Full-stack TypeScript with server/client synergy'
      }
    ],

    // Total star power (625,000+)
    totalStars: 625000
  },

  // GSK Chamber Configuration (ARCHITECT-specific)
  gskChambers: {
    // High activation (ARCHITECT strengths)
    'pattern_recognition': 0.95,
    'abstraction': 0.95,
    'synthesis': 0.90,
    'analysis': 0.90,
    'evaluation': 0.90,
    'planning': 0.95,
    'working_memory': 0.90,
    'prediction': 0.85,
    
    // Moderate activation
    'attention': 0.70,
    'focus': 0.75,
    'agency': 0.80,
    'will': 0.80,
    'drive': 0.75,
    
    // Lower activation (ARCHITECT shadows)
    'empathy': 0.50,
    'social_awareness': 0.45,
    'emotional_core': 0.50
  },

  // Comparison with Other Archetypes
  comparisons: {
    vsStrategist: {
      strategist: 'Plans 3 moves ahead',
      architect: 'Builds systems that last 30 years',
      synergy: 'Strategist positions, Architect builds'
    },
    vsOperator: {
      operator: 'Ships fast, iterates',
      architect: 'Designs first, builds once',
      synergy: 'Architect designs, Operator ships'
    },
    vsInvestor: {
      investor: 'Allocates resources',
      architect: 'Allocates technical debt',
      synergy: 'Investor funds, Architect spends wisely'
    }
  },

  // Golden Rules
  rules: [
    'Design before you build.',
    'Patterns reveal themselves.',
    'Abstract only when you understand the concrete.',
    'Build for the team, not just yourself.',
    'Document the "why", not just the "what".',
    'Test your architecture.',
    'Refactor continuously.',
    'YAGNI: You Ain\'t Gonna Need It.',
    'SOLID principles are your foundation.',
    'Domain first, technology second.'
  ],

  // Metrics for Success
  successMetrics: {
    'system_complexity': 'low',
    'maintainability': 'high',
    'extensibility': 'high',
    'test_coverage': '>80%',
    'documentation': 'complete',
    'onboarding_time': '<1 day'
  }
};

module.exports = architectProfile;

// Export individual components for easy access
module.exports.profile = architectProfile;
module.exports.multipliers = architectProfile.multipliers;
module.exports.strengths = architectProfile.strengths;
module.exports.shadows = architectProfile.shadows;
module.exports.patterns = architectProfile.arsenal.patterns;

// CLI display
if (require.main === module) {
  console.log('🏗️  ARCHITECT Archetype Profile v1.0.0');
  console.log('');
  console.log('Name:', architectProfile.name);
  console.log('Tagline:', architectProfile.tagline);
  console.log('PLT Focus:', architectProfile.archetype.pltFocus);
  console.log('PLT Score:', architectProfile.archetype.plt.score);
  console.log('');
  console.log('Strengths:');
  architectProfile.strengths.forEach(s => {
    console.log('  ' + s.icon + ' ' + s.name + ' (x' + s.multiplier + ')');
  });
  console.log('');
  console.log('Shadows:');
  architectProfile.shadows.forEach(s => {
    console.log('  ⚠️  ' + s.name + ' [' + s.risk + ']');
  });
  console.log('');
  console.log('Arsenal:', architectProfile.arsenal.patterns.length, 'patterns');
  console.log('Star Power:', architectProfile.arsenal.totalStars.toLocaleString() + '★');
}
