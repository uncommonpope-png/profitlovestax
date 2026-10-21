/**
 * ARCHETYPE DETECTOR — "Know What You Are"
 *
 * Grafted from: The PLT Doctrine — Know What You Are (The 22 Archetypes)
 *
 * This is not a quiz. It is a mirror.
 * The detector scores answers and finds the dominant frequency.
 * It also detects secondary (shadow) archetypes.
 */

const { ARCHETYPES, EXTENDED_ARCHETYPES } = require('./questions.cjs');

class ArchetypeDetector {
  constructor() {
    this.scores = new Map();
    this.archetypes = ARCHETYPES;
    this.extended = EXTENDED_ARCHETYPES;
  }

  /**
   * Score a single answer
   */
  scoreAnswer(questionId, answerValue, freeText = '') {
    // Choice-based questions carry direct archetype mappings
    if (answerValue && this.archetypes[answerValue]) {
      this.addScore(answerValue, 1);
    }

    // Extended archetype detection from free text
    if (freeText) {
      this.detectFromText(freeText);
    }
  }

  /**
   * Detect archetype signals from free text
   * Pattern from: The PLT Doctrine's frequency reading
   */
  detectFromText(text) {
    const lower = text.toLowerCase();
    const signals = [
      { archetype: 'ARCHITECT', keywords: ['build', 'design', 'structure', 'system', 'framework', 'blueprint', 'architect'] },
      { archetype: 'HEALER', keywords: ['help', 'care', 'restore', 'heal', 'support', 'nurture', 'fix people'] },
      { archetype: 'MERCHANT', keywords: ['deal', 'sell', 'trade', 'market', 'value', 'profit', 'opportunity', 'business'] },
      { archetype: 'GUARDIAN', keywords: ['protect', 'defend', 'hold', 'stand', 'boundary', 'shield', 'safe'] },
      { archetype: 'DIPLOMAT', keywords: ['connect', 'bridge', 'bring together', 'negotiate', 'peace', 'relationship'] },
      { archetype: 'PROPHET', keywords: ['truth', 'speak', 'vision', 'see', 'name', 'call out', 'predict'] },
      { archetype: 'ANALYST', keywords: ['pattern', 'understand', 'figure out', 'analyze', 'research', 'deep'] },
      { archetype: 'ARTIST', keywords: ['create', 'beauty', 'make', 'art', 'feel', 'resonance', 'meaning'] },
      { archetype: 'ENGINEER', keywords: ['automate', 'efficient', 'scale', 'machine', 'process', 'optimize'] },
      { archetype: 'WARRIOR', keywords: ['fight', 'win', 'battle', 'conquer', 'break through', 'force', 'overcome'] }
    ];

    for (const signal of signals) {
      const matches = signal.keywords.filter(k => lower.includes(k)).length;
      if (matches > 0) {
        this.addScore(signal.archetype, matches * 0.5);
      }
    }
  }

  addScore(archetype, points) {
    const current = this.scores.get(archetype) || 0;
    this.scores.set(archetype, current + points);
  }

  /**
   * Calculate final result
   * Returns: { dominant, secondary, shadow, scores, fullArchetype }
   */
  calculate() {
    const sorted = Array.from(this.scores.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return {
        dominant: 'ARCHITECT',
        secondary: null,
        shadow: null,
        scores: {},
        fullArchetype: this.archetypes['ARCHITECT']
      };
    }

    const dominantKey = sorted[0][0];
    const secondaryKey = sorted[1] ? sorted[1][0] : null;
    const dominant = this.archetypes[dominantKey];

    // Shadow is the opposite element of the dominant
    const shadowElement = dominant.element === 'Profit' ? 'Love' : 'Profit';
    const shadowCandidates = Object.entries(this.archetypes)
      .filter(([_, a]) => a.element === shadowElement)
      .sort((a, b) => (this.scores.get(b[0]) || 0) - (this.scores.get(a[0]) || 0));
    const shadowKey = shadowCandidates.length > 0 ? shadowCandidates[0][0] : null;
    const shadow = shadowKey ? this.archetypes[shadowKey] : null;

    // Map to extended archetype (the full 22)
    const extendedKey = Object.keys(this.extended).find(
      k => this.extended[k].core === dominantKey
    ) || 'ARCHITECT';

    return {
      dominant: dominantKey,
      dominantScore: sorted[0][1],
      secondary: secondaryKey,
      secondaryScore: sorted[1] ? sorted[1][1] : 0,
      shadow: shadowKey,
      shadowArchetype: shadow,
      scores: Object.fromEntries(sorted),
      archetype: dominant,
      fullArchetype: this.archetypes[dominantKey],
      extendedArchetype: extendedKey,
      extendedNumber: this.extended[extendedKey]?.number || 1
    };
  }

  /**
   * Generate the archetype reflection for the user
   */
  generateReflection(result) {
    const a = result.fullArchetype;
    return `
╔══════════════════════════════════════════════════════════════╗
║  KNOW WHAT YOU ARE                                           ║
╠══════════════════════════════════════════════════════════════╣
║  Primary Archetype: ${a.name.toUpperCase().padEnd(35)} ║
║  Element: ${a.element.padEnd(46)} ║
║  Frequency: ${a.frequency.substring(0, 43).padEnd(43)} ║
╠══════════════════════════════════════════════════════════════╣
║  What You Are:                                               ║
║  ${a.description.padEnd(60)} ║
╠══════════════════════════════════════════════════════════════╣
║  Your Shadow:                                                ║
║  ${a.shadow.padEnd(60)} ║
╠══════════════════════════════════════════════════════════════╣
║  Secondary: ${result.secondary ? result.secondary.padEnd(43) : 'None detected'.padEnd(43)} ║
║  Shadow Twin: ${result.shadow ? result.shadow.padEnd(41) : 'Unknown'.padEnd(41)} ║
╚══════════════════════════════════════════════════════════════╝
`;
  }
}

module.exports = ArchetypeDetector;
