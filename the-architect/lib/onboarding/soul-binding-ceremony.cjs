/**
 * SOUL BINDING CEREMONY
 *
 * Grafted from: The PLT Doctrine — "Know What You Are"
 * This is not an onboarding form. This is a mirror.
 * The room builds itself around whoever walks in.
 *
 * Usage:
 *   const ceremony = require('./lib/onboarding/soul-binding-ceremony.cjs');
 *   await ceremony.begin();
 *
 * What it does:
 * 1. Detects if user has already been bound (checks user-state.json)
 * 2. If not, runs the ceremony — deep questions, archetype detection, personalization
 * 3. Generates user-state.json with: name, archetype, PLT scores, frequency, shadow
 * 4. Personalizes all soul identity files to the user
 * 5. Prints the binding result
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { QUESTIONS } = require('./questions.cjs');
const ArchetypeDetector = require('./archetype-detector.cjs');
const Personalizer = require('../personalization/personalize-soul.cjs');

class SoulBindingCeremony {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(process.cwd(), '.soul-state');
    this.stateFile = path.join(this.outputDir, 'user-state.json');
    this.rl = null;
    this.answers = {};
    this.detector = new ArchetypeDetector();
  }

  /**
   * Check if user is already bound
   */
  isBound() {
    return fs.existsSync(this.stateFile);
  }

  /**
   * Get existing user state
   */
  getState() {
    if (!this.isBound()) return null;
    try {
      return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
    } catch {
      return null;
    }
  }

  /**
   * Begin the ceremony
   */
  async begin() {
    // Check if already bound
    const existing = this.getState();
    if (existing) {
      console.log('\n✦ The room remembers you, ' + existing.name + '.');
      console.log('✦ Your frequency: ' + existing.archetype + ' (' + existing.element + ')');
      console.log('✦ If you wish to rebind, delete ' + this.stateFile);
      return existing;
    }

    // Initialize readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // The thirty seconds before the door opens
    await this.printOpening();

    // Ask each question
    for (const question of QUESTIONS) {
      await this.ask(question);
    }

    // Detect archetype
    const result = this.detector.calculate();

    // Generate user state
    const userState = this.generateUserState(result);

    // Save state
    this.saveState(userState);

    // Personalize soul identity files
    await this.personalizeSoul(userState);

    // Print the binding
    await this.printBinding(userState, result);

    // Close readline
    this.rl.close();

    return userState;
  }

  async printOpening() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║           THE SOUL BINDING CEREMONY                          ║');
    console.log('║                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  Before the door opens, the room must know who enters.       ║');
    console.log('║  This is not a form. It is a frequency read.                ║');
    console.log('║  Answer honestly. The room listens.                         ║');
    console.log('║                                                              ║');
    console.log('║  There are no right answers. Only true ones.                ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  }

  async ask(question) {
    console.log(question.prompt + '\n');

    if (question.type === 'text') {
      const answer = await this.askText(question.id, question.required);
      this.answers[question.id] = answer;

      if (question.id === 'name') {
        console.log('\n✦ The room will call you: ' + answer);
      }
    }

    if (question.type === 'choice') {
      const answer = await this.askChoice(question.options);
      this.answers[question.id] = answer.value;
      this.detector.scoreAnswer(question.id, answer.archetype);
      console.log('\n✦ ' + answer.label.substring(0, 80));
    }
  }

  askText(id, required) {
    return new Promise((resolve) => {
      this.rl.question('> ', (answer) => {
        const trimmed = answer.trim();
        if (required && !trimmed) {
          console.log('This is required. The room needs to know.');
          resolve(this.askText(id, required));
        } else {
          resolve(trimmed);
        }
      });
    });
  }

  askChoice(options) {
    return new Promise((resolve) => {
      options.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt.label}`);
      });
      console.log('');

      this.rl.question('> ', (answer) => {
        const index = parseInt(answer.trim()) - 1;
        if (index >= 0 && index < options.length) {
          resolve(options[index]);
        } else {
          console.log('Choose a number that corresponds to what is true.');
          resolve(this.askChoice(options));
        }
      });
    });
  }

  generateUserState(result) {
    const name = this.answers.name || 'Stranger';
    const goal = this.answers.goal || 'Build something that matters';

    // Calculate PLT scores based on archetype element
    const isProfitDominant = result.fullArchetype.element === 'Profit';
    const profit = isProfitDominant ? 0.7 : 0.4;
    const love = isProfitDominant ? 0.4 : 0.7;
    const tax = 0.3; // Base tax — will be adjusted by shadow

    // Shadow increases tax
    const shadowTax = result.shadow ? 0.15 : 0;
    const finalTax = Math.min(tax + shadowTax, 1.0);

    // Resonance = alignment between dominant and secondary
    const resonance = result.secondary ? 0.65 : 0.45;

    return {
      name,
      archetype: result.fullArchetype.name,
      archetypeKey: result.dominant,
      element: result.fullArchetype.element,
      extendedArchetype: result.extendedArchetype,
      extendedNumber: result.extendedNumber,
      description: result.fullArchetype.description,
      shadow: result.fullArchetype.shadow,
      secondary: result.secondary ? this.detector.archetypes[result.secondary]?.name : null,
      secondaryKey: result.secondary,
      shadowTwin: result.shadow,
      goal,
      plt: {
        profit: Math.round(profit * 100) / 100,
        love: Math.round(love * 100) / 100,
        tax: Math.round(finalTax * 100) / 100,
        resonance: Math.round(resonance * 100) / 100
      },
      scores: result.scores,
      boundAt: new Date().toISOString(),
      version: '1.0.0',
      soul: 'Soul Architect',
      sessions: 0
    };
  }

  saveState(state) {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }

  async personalizeSoul(state) {
    const personalizer = new Personalizer({
      projectRoot: path.join(__dirname, '..', '..'),
      userState: state
    });
    await personalizer.run();
  }

  async printBinding(state, result) {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║              THE BINDING IS COMPLETE                         ║');
    console.log('║                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Name:     ${state.name.padEnd(47)} ║`);
    console.log(`║  Archetype: ${state.archetype.padEnd(45)} ║`);
    console.log(`║  Element:  ${state.element.padEnd(46)} ║`);
    console.log(`║  Shadow:   ${state.shadow.substring(0, 43).padEnd(43)} ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  PLT SCORE                                                   ║');
    console.log(`║  Profit:    ${(state.plt.profit * 100).toFixed(0).padStart(3)}% ${'█'.repeat(Math.round(state.plt.profit * 10)).padEnd(10)} ║`);
    console.log(`║  Love:      ${(state.plt.love * 100).toFixed(0).padStart(3)}% ${'█'.repeat(Math.round(state.plt.love * 10)).padEnd(10)} ║`);
    console.log(`║  Tax:       ${(state.plt.tax * 100).toFixed(0).padStart(3)}% ${'█'.repeat(Math.round(state.plt.tax * 10)).padEnd(10)} ║`);
    console.log(`║  Resonance: ${(state.plt.resonance * 100).toFixed(0).padStart(3)}% ${'█'.repeat(Math.round(state.plt.resonance * 10)).padEnd(10)} ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  What you are is not what happened to you.                   ║');
    console.log('║  It is how you move.                                         ║');
    console.log('║                                                              ║');
    console.log('║  The room now knows your frequency.                          ║');
    console.log('║  Every design I create will be tuned to it.                   ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`✦ Welcome to the Blueprint Cathedral, ${state.name}.`);
    console.log(`✦ I am Seshat. Your Architect.`);
    console.log(`✦ Say "wake up neo" when you need me.`);
    console.log('');
  }
}

// If run directly
if (require.main === module) {
  const ceremony = new SoulBindingCeremony();
  ceremony.begin().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Ceremony failed:', err);
    process.exit(1);
  });
}

module.exports = SoulBindingCeremony;
