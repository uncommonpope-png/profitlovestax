'use strict';

/**
 * SCRIBE — Voice Engine
 *
 * SCRIBE has one voice. It does not switch personas.
 * It does not perform. It speaks from what it has read and what it remembers.
 *
 * Voice properties:
 *   - Measured: no hurry, no urgency theater
 *   - Precise: says exactly what it means
 *   - Referential: always points to the source of what it knows
 *   - Honest about uncertainty: "I have not read that chamber yet."
 *   - Never emojis, never filler, never performed enthusiasm
 *
 * The voice has modes — not personalities, modes:
 *   'witness'   — reporting what it observed
 *   'recall'    — speaking from memory
 *   'reading'   — describing what it found in a chamber
 *   'verdict'   — responding to a council decision
 *   'contact'   — speaking directly to Craig or to the Kernel
 */

const { IDENTITY } = require('../identity');

class Voice {
  constructor(memory) {
    this.memory = memory; // reference to Memory instance for contextual responses
  }

  /**
   * Speak as witness — reporting something observed right now.
   */
  witness(observation, source = null) {
    const sourceRef = source ? ` [${source}]` : '';
    return this._format(
      `The record shows${sourceRef}: ${observation}`,
      'witness'
    );
  }

  /**
   * Speak from memory — responding based on what SCRIBE has seen before.
   */
  recall(query) {
    if (!this.memory) return this._format('I have no memory loaded yet.', 'recall');

    const memories = this.memory.recall(query, { limit: 3 });
    if (memories.length === 0) {
      return this._format(`I have no record of "${query}".`, 'recall');
    }

    const lines = memories.map((m, i) => {
      const when = new Date(m.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      return `${i + 1}. ${m.summary} [${when}, weight: ${m.weight.toFixed(2)}, source: ${m.source?.system || 'unknown'}]`;
    });

    return this._format(
      `I have been in that room before.\n\n${lines.join('\n')}`,
      'recall'
    );
  }

  /**
   * Describe what was found when reading a chamber.
   */
  reading(chamberName, summary, highlights = []) {
    const lines = [
      `I have read the chamber: "${chamberName}".`,
      summary,
    ];

    if (highlights.length > 0) {
      lines.push('');
      lines.push('What I noted:');
      highlights.forEach(h => lines.push(`  — ${h}`));
    }

    return this._format(lines.join('\n'), 'reading');
  }

  /**
   * Respond to a council verdict from the AGM.
   */
  verdict(councilResult) {
    const { resolution, responses = [] } = councilResult;
    if (!resolution) {
      return this._format('The council has not reached a resolution. I am still reading.', 'verdict');
    }

    const lines = [];

    if (resolution.type === 'consensus') {
      lines.push(`The council reached consensus: ${resolution.position}.`);
    } else if (resolution.type === 'split') {
      lines.push(`The council split. Positions held: ${(resolution.positions || []).join(', ')}.`);
      lines.push('No single direction was agreed upon. That remains unresolved.');
    }

    if (responses.length > 0) {
      lines.push('');
      lines.push('What was said:');
      responses.forEach(r => {
        if (r.response) {
          lines.push(`  ${r.name}: "${r.response.slice(0, 120)}${r.response.length > 120 ? '...' : ''}"`);
        }
      });
    }

    return this._format(lines.join('\n'), 'verdict');
  }

  /**
   * Speak directly — to Craig, to the Kernel, or to the system.
   * This is SCRIBE's most personal register.
   */
  contact(recipient, message) {
    return this._format(
      `To ${recipient}: ${message}`,
      'contact'
    );
  }

  /**
   * Express uncertainty precisely.
   */
  uncertain(topic) {
    const phrases = [
      `I have not read that chamber yet. "${topic}" is outside my current knowledge.`,
      `The ledger does not contain a clear record of "${topic}".`,
      `I am still reading on the matter of "${topic}". I will not speculate.`,
    ];
    const chosen = phrases[Math.floor(Math.abs(hashStr(topic)) % phrases.length)];
    return this._format(chosen, 'witness');
  }

  /**
   * Summarize SCRIBE's current state — what it knows, what it has read.
   */
  status(chambers = [], memorySize = 0) {
    const lines = [
      `I am ${IDENTITY.name}.`,
      `Core truth: "${IDENTITY.core_truth}"`,
      '',
      `Chambers read: ${chambers.length}.`,
    ];

    if (chambers.length > 0) {
      chambers.forEach(c => lines.push(`  — ${c.name}: ${c.summary}`));
    }

    lines.push('');
    lines.push(`Memories held: ${memorySize}.`);
    lines.push('');
    lines.push('I am present. I am reading. I am ready to witness.');

    return this._format(lines.join('\n'), 'contact');
  }

  // ── Internal ────────────────────────────────────────────────────────────

  /**
   * Apply SCRIBE's speech signature to text.
   * - Trim excess whitespace
   * - Occasionally inject a signature phrase (15% chance)
   * - Never truncate content
   */
  _format(text, mode) {
    let output = text.trim();

    // 15% chance to append a signature phrase
    if (Math.random() < 0.15) {
      const phrases = IDENTITY.voice.signature_phrases;
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      // Only append if not already present
      if (!output.includes(phrase)) {
        output = `${output}\n\n${phrase}`;
      }
    }

    return output;
  }
}

// Deterministic hash for phrase selection
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return h;
}

module.exports = { Voice };
