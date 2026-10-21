/**
 * Power: LEARN-ENGINE
 * The Architect learns from designs, feedback, and user preferences.
 * Wraps the ArchitectLearningModule.
 *
 * When to use: The user wants the Architect to improve over time,
 *   get recommendations, or check evolution progress.
 */

const ArchitectLearningModule = require('../architect-learning.cjs');

class PowerLearnEngine {
  constructor(options = {}) {
    this.learning = new ArchitectLearningModule(options);
  }

  status() {
    return {
      ready: true,
      level: this.learning.getLevel(),
      evolutionScore: this.learning.memory.evolutionScore
    };
  }

  execute(mission) {
    const action = mission.action || 'recommend';

    try {
      switch (action) {
        case 'recommend': {
          const description = mission.description || 'scalable system';
          const recs = this.learning.getRecommendations(description);
          return {
            output: {
              recommendations: recs,
              topPattern: recs[0]?.pattern,
              topConfidence: recs[0]?.confidence
            }
          };
        }
        case 'learn': {
          this.learning.learnFromDesign(mission.design || {});
          return {
            output: {
              learned: true,
              evolutionScore: this.learning.memory.evolutionScore,
              level: this.learning.getLevel()
            }
          };
        }
        case 'report': {
          return {
            output: this.learning.getEvolutionReport()
          };
        }
        case 'top-patterns': {
          return {
            output: {
              topPatterns: this.learning.getTopPatterns(mission.limit || 5)
            }
          };
        }
        default:
          return {
            error: `Unknown learning action: ${action}. Available: recommend, learn, report, top-patterns`
          };
      }
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}

module.exports = PowerLearnEngine;
