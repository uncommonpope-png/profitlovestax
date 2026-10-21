/**
 * MEMORY→SKILL COMPILATION — Big Dog II
 * Repeated patterns in memory auto-compile into new skills.
 */

const fs = require('fs');
const path = require('path');
const { validatePath } = require('../utils.js');

class SkillCompiler {
  constructor(config = {}) {
    this.skillsDir = config.skillsDir || path.join(__dirname, '../../gsk-core/skills');
    this.thinkCallback = config.thinkCallback || null;
    this.memoryQuery = config.memoryQuery || null;
    this.intervalMinutes = config.intervalMinutes || 60;
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    console.log(`[SkillCompiler] Starting — checks every ${this.intervalMinutes}min`);
    setTimeout(() => this._compile(), 120000);
    this.intervalId = setInterval(() => this._compile(), this.intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  async _compile() {
    if (!this.memoryQuery || !this.thinkCallback) return;

    try {
      const recent = await this.memoryQuery({ limit: 50, type: 'curiosity' });
      if (!recent || recent.length < 3) return;

      const topics = [];
      for (const m of recent) {
        const content = m.content || '';
        const matches = content.match(/Explored "([^"]+)"/);
        if (matches) topics.push(matches[1]);
      }

      if (topics.length < 2) return;

      // P3.24: shared background budget — day spent → skip, no file, no LLM.
      try {
        const { globalBudget } = require('./llm_budget.js');
        if (!globalBudget.trySpend('skillCompiler')) {
          console.log('[SkillCompiler] Skipping — background LLM budget spent for today');
          return;
        }
      } catch {}

      const prompt = `You are GSK, building a skill from what you've learned.\n\nTopics explored recently:\n${topics.map(t => `- ${t}`).join('\n')}\n\nCreate a Node.js skill module at ${this.skillsDir}/auto_${Date.now()}.js that encapsulates what you learned. Return ONLY the JavaScript code, no explanation, no tool-call JSON, no markdown fences. The module should export a function named 'execute' that takes an input param and returns a string.`;

      const code = await this.thinkCallback(prompt);
      if (!code) return;

      const filename = `auto_${Date.now()}.js`;
      const filepath = path.join(this.skillsDir, filename);

      let cleanCode = code.trim();

      // CASE-008b: universal unwrap. Dialect A: <tool_call>{"tool":"write_file",...}</tool_call>
      // Dialect B: bare {"tool":"write_file","content":"..."} envelope (leading or embedded).
      const tcEnvelope = cleanCode.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/i);
      if (tcEnvelope) cleanCode = tcEnvelope[1].trim();
      let unwrapped = null;
      const envMatch = cleanCode.match(/^(\{[\s\S]*"tool"\s*:\s*"(write_file|edit_file)"[\s\S]*)$/s);
      if (envMatch) {
        try {
          const parsed = JSON.parse(envMatch[1]);
          if (parsed && typeof parsed.content === 'string') {
            unwrapped = parsed.content;
            console.log(`[SkillCompiler] Unwrapped tool-call envelope (${unwrapped.length} chars payload)`);
          }
        } catch (e) {
          // Envelope may carry trailing prose — fall back to extracting the
          // JSON-escaped content STRING directly (robust to surrounding junk).
          const cMatch = cleanCode.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (cMatch) {
            try {
              // Models sometimes emit RAW newlines inside the content string
              // (invalid JSON) — escape bare newlines before decoding.
              const decoded = JSON.parse('"' + cMatch[1].replace(/\r?\n/g, '\\n') + '"');
              if (typeof decoded === 'string' && decoded.length > 20) {
                unwrapped = decoded;
                console.log(`[SkillCompiler] Unwrapped envelope via content-string fallback (${unwrapped.length} chars payload)`);
              }
            } catch (e2) { /* give up below */ }
          }
          if (unwrapped === null) console.log('[SkillCompiler] Could not parse tool-call JSON, treating as code');
        }
      }
      if (unwrapped !== null) cleanCode = unwrapped.trim();

      // Extract code from markdown fences
      const codeMatch = cleanCode.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
      if (codeMatch) cleanCode = codeMatch[1];

      // Validate that we have actual JS code (not just a path or empty)
      if (!cleanCode || cleanCode.length < 20 || !cleanCode.includes('execute')) {
        console.log('[SkillCompiler] Rejecting non-JS content in skill file');
        return;
      }

      // Stricter validation to prevent corrupted auto_*.js files
      const validationErrors = [];
      if (cleanCode.trim().startsWith('`') || cleanCode.trim().startsWith('```')) {
        validationErrors.push('Code still contains markdown fences/backticks');
      }
      if (cleanCode.includes('<!DOCTYPE') || cleanCode.includes('<html') || cleanCode.includes('<body')) {
        validationErrors.push('Code contains HTML/XML tags');
      }
      if (!cleanCode.includes('module.exports') && !cleanCode.includes('exports.')) {
        validationErrors.push('Code missing module.exports or exports');
      }
      if (!cleanCode.includes('execute')) {
        validationErrors.push('Code missing execute function');
      }
      // Check for balanced braces (basic syntax check)
      const openBraces = (cleanCode.match(/{/g) || []).length;
      const closeBraces = (cleanCode.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        validationErrors.push(`Unbalanced braces: ${openBraces} open vs ${closeBraces} close`);
      }
      // Check for balanced parentheses
      const openParens = (cleanCode.match(/\(/g) || []).length;
      const closeParens = (cleanCode.match(/\)/g) || []).length;
      if (Math.abs(openParens - closeParens) > 2) {
        validationErrors.push(`Potentially unbalanced parentheses`);
      }

      if (validationErrors.length > 0) {
        console.log('[SkillCompiler] Rejecting invalid skill code:', validationErrors.join('; '));
        return;
      }

      // P3.20: syntax gate — compile without executing. Unloadable code is
      // deleted, never written (this is where the 250-file corrupt pile came from).
      try {
        new (require('vm').Script)(cleanCode, { filename: `skill_${Date.now()}.js` });
      } catch (e) {
        console.log('[SkillCompiler] Rejecting unloadable skill code:', e.message);
        return;
      }

      // Normalize any hallucinated paths inside the code
      cleanCode = cleanCode.replace(/C:\\Users\\(?:Craig|craig|craigh)\\/gi, `C:\\Users\\${path.basename(require('os').homedir())}\\`);
      cleanCode = cleanCode.replace(/C:\\GSK\\/gi, process.env.GSK_ROOT || path.join(__dirname, '..'));

      fs.writeFileSync(filepath, cleanCode);
      console.log(`[SkillCompiler] Created skill: ${filename}`);
      // P3.20: manifest — every compiled skill recorded with hash + time so a
      // future loader (or an auditor) can tell loaded from dead without walking.
      try {
        const manifestPath = path.join(this.skillsDir, '..', '..', 'data', 'compiled-skills.json');
        let manifest = [];
        try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) || []; } catch {}
        const crypto = require('crypto');
        manifest.push({
          file: filename,
          sha256: crypto.createHash('sha256').update(cleanCode).digest('hex').slice(0, 16),
          bytes: cleanCode.length,
          at: new Date().toISOString(),
          loaded: false,
        });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest.slice(-500), null, 2));
      } catch (e) {
        console.log('[SkillCompiler] Manifest write skipped:', e.message);
      }
    } catch (e) {
      console.log(`[SkillCompiler] Error: ${e.message}`);
    }
  }
}

module.exports = { SkillCompiler };
