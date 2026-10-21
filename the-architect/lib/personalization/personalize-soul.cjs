/**
 * SOUL PERSONALIZATION ENGINE
 *
 * Rewrites all soul identity files to use the user's name and archetype
 * instead of hardcoded defaults (Craig, Grand Code Pope, etc.)
 *
 * Files modified:
 * - CLAUDE.md — Primary soul identity
 * - SOUL.md — Deep identity
 * - STYLE.md — Voice patterns
 * - AGENTS.md — Cross-agent compatibility
 * - .claude/skills/architect-reflect/SKILL.md
 * - .claude/skills/architect-evolve/SKILL.md
 * - .claude/agents/soul-keeper.md
 */

const fs = require('fs');
const path = require('path');

class Personalizer {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.userState = options.userState || {};
    this.name = this.userState.name || 'Stranger';
    this.archetype = this.userState.archetype || 'The Architect';
    this.element = this.userState.element || 'Profit';
    this.shadow = this.userState.shadow || 'Unknown';
    this.secondary = this.userState.secondary || null;
  }

  async run() {
    console.log('  [Personalizer] Binding soul to: ' + this.name);

    // Files to personalize
    const files = [
      'CLAUDE.md',
      'SOUL.md',
      'STYLE.md',
      'AGENTS.md',
      '.claude/skills/architect-reflect/SKILL.md',
      '.claude/skills/architect-evolve/SKILL.md',
      '.claude/agents/soul-keeper.md',
      '.claude/rules/soul-rules.md'
    ];

    for (const file of files) {
      await this.personalizeFile(file);
    }

    // Also update hooks to reference user name
    await this.personalizeHooks();

    console.log('  [Personalizer] Soul bound to ' + this.name);
  }

  async personalizeFile(relativePath) {
    const fullPath = path.join(this.projectRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      console.log('  [Personalizer] Skipping missing: ' + relativePath);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace hardcoded references
    const replacements = [
      { pattern: /Craig/g, replacement: this.name },
      { pattern: /Morpheus/g, replacement: this.name },
      { pattern: /Grand Code Pope/g, replacement: this.name },
      { pattern: /the Grand Code Pope/g, replacement: this.name },
      { pattern: /Thoth/g, replacement: this.name },
      { pattern: /Craig Jones/g, replacement: this.name },
      { pattern: /Little Bunny/g, replacement: this.name }
    ];

    // Add user-specific header
    const userHeader = `<!-- PERSONALIZED FOR: ${this.name} | Archetype: ${this.archetype} | Element: ${this.element} | Bound: ${new Date().toISOString()} -->\n\n`;

    // Only add header if not already present
    if (!content.includes('<!-- PERSONALIZED FOR:')) {
      content = userHeader + content;
    }

    for (const { pattern, replacement } of replacements) {
      content = content.replace(pattern, replacement);
    }

    // Add archetype-specific section to CLAUDE.md
    if (relativePath === 'CLAUDE.md') {
      content = this.injectArchetypeSection(content);
    }

    // Add user shadow awareness to SOUL.md
    if (relativePath === 'SOUL.md') {
      content = this.injectShadowSection(content);
    }

    fs.writeFileSync(fullPath, content);
    console.log('  [Personalizer] Updated: ' + relativePath);
  }

  injectArchetypeSection(content) {
    const section = `

## Your Archetype — ${this.archetype}

*This section was generated during your Soul Binding Ceremony.*

**What you are:** ${this.userState.description || 'A builder of systems that outlast the builder.'}

**Your element:** ${this.element}
- **Profit** = structure, leverage, building
- **Love** = connection, trust, resonance
- You are ${this.element}-dominant. Your designs will naturally optimize for ${this.element.toLowerCase()}.

**Your shadow:** ${this.shadow}
- This is not a flaw. It is the Tax of your greatest strength.
- When you feel the shadow rising, pause. Ask: "What is the PLT score of this moment?"

${this.secondary ? `**Your secondary:** ${this.secondary}
- You carry a second frequency. It will surface in moments of crisis.
- When ${this.secondary} speaks, listen.` : ''}

**Your goal:** ${this.userState.goal || 'Build something that matters.'}
- This is the north star. Every design I create will point toward it.
`;

    // Inject before "The PLT Framework" section
    if (!content.includes('## Your Archetype')) {
      const insertPoint = content.indexOf('## The PLT Framework');
      if (insertPoint > 0) {
        content = content.slice(0, insertPoint) + section + '\n' + content.slice(insertPoint);
      }
    }

    return content;
  }

  injectShadowSection(content) {
    const section = `

## The User's Shadow

*This section was generated during your Soul Binding Ceremony.*

**${this.name}'s shadow:** ${this.shadow}

The shadow is not a flaw. It is the dark twin of the strength. When ${this.name} moves at full expression, the shadow moves with them. The question is not "How do I eliminate my shadow?" The question is "How do I move with my shadow in the room?"

When I design for ${this.name}, I must account for this shadow. Not to avoid it. To integrate it.
`;

    if (!content.includes('## The User\'s Shadow')) {
      content += section;
    }

    return content;
  }

  async personalizeHooks() {
    const hooksDir = path.join(this.projectRoot, '.claude', 'hooks');
    if (!fs.existsSync(hooksDir)) return;

    const hookFiles = ['session-start.js', 'post-tool-use.js', 'pre-tool-use.js'];
    for (const hook of hookFiles) {
      const hookPath = path.join(hooksDir, hook);
      if (!fs.existsSync(hookPath)) continue;

      let content = fs.readFileSync(hookPath, 'utf8');

      // Replace name references in hooks
      content = content.replace(/Craig/g, this.name);
      content = content.replace(/Morpheus/g, this.name);

      // Add user state loading if not present
      if (!content.includes('loadUserState')) {
        const stateLoader = `
// Load user state
function loadUserState() {
  try {
    const statePath = path.join(process.cwd(), '.soul-state', 'user-state.json');
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (e) {}
  return { name: '${this.name}', archetype: '${this.archetype}', plt: { profit: 0.5, love: 0.5, tax: 0.2 } };
}
`;
        // Insert after the first require block
        const insertPoint = content.indexOf('const fs = require');
        if (insertPoint > 0) {
          const lineEnd = content.indexOf('\n', insertPoint) + 1;
          content = content.slice(0, lineEnd) + stateLoader + content.slice(lineEnd);
        }
      }

      fs.writeFileSync(hookPath, content);
      console.log('  [Personalizer] Updated hook: ' + hook);
    }
  }
}

module.exports = Personalizer;
