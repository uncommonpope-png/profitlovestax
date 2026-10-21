/**
 * CURIOSITY DRIVE — Big Dog II
 * GSK proactively seeks new information when idle.
 */

const http = require('http');
const { getRandomTopic, getTopics } = require('./family_topic_source');

class BigDogCuriosity {
  constructor(config = {}) {
    this.thinkCallback = config.thinkCallback || null;
    this.memoryStore = config.memoryStore || null;
    this.intervalMinutes = config.intervalMinutes || 30;
    this.intervalId = null;
    this.topics = [];
    this.researchedSet = new Set();
  }

  start() {
    if (this.intervalId) return;
    console.log(`[Curiosity] Starting — explores every ${this.intervalMinutes}min`);
    setTimeout(() => this._explore(), 120000); // First explore after 2 min
    this.intervalId = setInterval(() => this._explore(), this.intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  async _explore() {
    let topic = getRandomTopic();
    if (!topic) {
      topic = 'autonomous self-improvement';
    }

    console.log(`[Curiosity] Exploring: ${topic}`);

    if (this.thinkCallback) {
      try {
        const prompt = `You are GSK, an autonomous engineer seeking real knowledge. Research this technical topic for our codebase: ${topic}\n\nProvide 2 concrete implementation insights we can build today. Do not repeat general fluff — provide actionable technical facts.`;
        const result = await this.thinkCallback(prompt);
        if (result && this.memoryStore) {
          await this.memoryStore({
            content: `[Curiosity] Explored "${topic}":\n${result}`,
            type: 'curiosity',
            tags: ['curiosity', 'learning', 'autonomous', 'technical'],
            weight: 0.6
          });
          console.log(`[Curiosity] Captured new technical insight for: ${topic}`);
        }
      } catch (e) {
        console.log(`[Curiosity] Explore error: ${e.message}`);
      }
    }
  }
}

// Old CuriosityDrive for emotions system (kept for compatibility)
class CuriosityDrive {
  constructor(brain, chambers, memory) { this.brain = brain; this.chambers = chambers; this.memory = memory; this.topics = []; this.topicIndex = 0; }
  tick(ts) { /* old emotions system — no-op */ }
}

module.exports = { CuriosityDrive, BigDogCuriosity };
