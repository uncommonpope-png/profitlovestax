/**
 * SELF_EVOLUTION.JS — The kernel writes its own skills
 *
 * Periodically analyzes patterns from studied repos, generates new skills,
 * writes them to src/skills/, and verifies they load. Self-improving code.
 *
 * PLT Press — Profit + Love - Tax = True Value
 */

'use strict';

const fs = require('fs');
const path = require('path');

class SelfEvolution {
    constructor(kernel, options = {}) {
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;
        this.teacherAgent = kernel.teacherAgent;
        this.skillsDir = options.skillsDir || path.join(__dirname, '../skills');
        this.evolutionLogPath = options.evolutionLogPath || path.join(__dirname, '../../data/evolution-log.json');
        this.proposalPath = options.proposalPath || path.join(__dirname, '../../data/evolution-proposals.json');
        this.hubDir = options.hubDir || null;
        this.backupDir = options.backupDir || path.join(__dirname, '../../data/evolution-backups');
        this.isEvolving = false;
        this.maxSkillsPerCycle = options.maxSkillsPerCycle || 1;
        this.skillsCreated = 0;

        this._loadLog();
        this._loadProposals();

        this.stats = {
            skillsGenerated: 0,
            skillsFailed: 0,
            patternsDiscovered: 0,
            proposalsApplied: 0,
            lastEvolution: null,
        };
    }

    _loadProposals() {
        try {
            if (fs.existsSync(this.proposalPath)) {
                const data = JSON.parse(fs.readFileSync(this.proposalPath, 'utf-8'));
                this.proposals = Array.isArray(data) ? data : [];
            } else {
                this.proposals = [];
            }
        } catch (e) {
            this.proposals = [];
        }
    }

    _saveProposals() {
        try {
            const dir = path.dirname(this.proposalPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.proposalPath, JSON.stringify(this.proposals, null, 2), 'utf-8');
        } catch (e) {}
    }

    _loadLog() {
        try {
            if (fs.existsSync(this.evolutionLogPath)) {
                const data = JSON.parse(fs.readFileSync(this.evolutionLogPath, 'utf-8'));
                this.skillsCreated = data.skillsCreated || 0;
                this.stats = data.stats || this.stats;
                this.createdSkills = data.createdSkills || [];
                console.log(`[Evolution] Loaded log: ${this.skillsCreated} skills already created`);
            } else {
                this.createdSkills = [];
            }
        } catch (e) {
            this.createdSkills = [];
        }
    }

    _saveLog() {
        try {
            const dir = path.dirname(this.evolutionLogPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.evolutionLogPath, JSON.stringify({
                skillsCreated: this.skillsCreated,
                createdSkills: this.createdSkills || [],
                stats: this.stats,
                updatedAt: Date.now()
            }, null, 2), 'utf-8');
        } catch (e) {}
    }

    async evolve() {
        if (this.isEvolving) return { status: 'already_evolving' };
        if (!this.brain) return { status: 'no_brain' };

        this.isEvolving = true;
        console.log('[Evolution] Starting self-evolution cycle...');

        try {
            // Step 1: Scan for patterns from studied repos
            const patterns = await this._discoverPatterns();

            if (patterns.length === 0) {
                console.log('[Evolution] No new patterns to learn from');
                return { status: 'no_patterns' };
            }

            // Step 2: Pick the best pattern and generate a skill
            const pattern = patterns[0];
            this.stats.patternsDiscovered++;

            const skill = await this._generateSkill(pattern);
            if (!skill) {
                this.stats.skillsFailed++;
                return { status: 'generate_failed' };
            }

            // Step 3: GOVERNANCE GATE — create a proposal, do NOT write code yet.
            // No code is written until an architect approves and applyProposal() runs.
            const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const proposal = {
                proposalId,
                status: 'approval_required',
                skill,
                pattern,
                createdAt: Date.now()
            };
            this.proposals.push(proposal);
            this._saveProposals();

            if (this.memory) {
                await this.memory.witness({
                    type: 'evolution_proposal',
                    weight: 1.0,
                    tags: ['evolution', 'proposal', skill.name],
                    content: `Self-evolution proposal created for skill "${skill.name}" from pattern "${pattern.name}". Waiting for architect approval.`,
                    meta: { proposalId, skill: skill.name, pattern: pattern.name, source: pattern.source },
                });
            }

            console.log(`[Evolution] ⏳ Proposal ${proposalId} created for skill: ${skill.name} — awaiting architect approval`);

            return {
                status: 'approval_required',
                proposalId,
                skill: skill.name,
                file: skill.filename,
                description: skill.description,
                pattern: pattern.name,
            };
        } catch (e) {
            this.stats.skillsFailed++;
            console.log(`[Evolution] Cycle error: ${e.message}`);
            return { status: 'error', error: e.message };
        } finally {
            this.isEvolving = false;
        }
    }

    getPendingProposals() {
        return (this.proposals || []).filter(p => p.status === 'approval_required' || p.status === 'approved');
    }

    approveProposal(proposalId, approvedBy = 'architect') {
        const proposal = (this.proposals || []).find(p => p.proposalId === proposalId);
        if (!proposal) return { ok: false, error: 'proposal_not_found' };
        if (proposal.status !== 'approval_required') return { ok: false, error: 'proposal_not_pending' };
        proposal.status = 'approved';
        proposal.approvedBy = approvedBy;
        proposal.approvedAt = Date.now();
        this._saveProposals();
        return { ok: true, proposalId };
    }

    async applyProposal(proposalId) {
        const proposal = (this.proposals || []).find(p => p.proposalId === proposalId);
        if (!proposal) return { status: 'error', error: 'proposal_not_found' };
        if (proposal.status !== 'approved') return { status: 'error', error: 'proposal_not_approved' };
        const { skill, pattern } = proposal;
        if (!skill) return { status: 'error', error: 'proposal_has_no_skill' };

        try {
            const written = this._writeSkill(skill);
            if (!written) {
                this.stats.skillsFailed++;
                return { status: 'write_failed' };
            }

            const verified = this._verifySkill(skill.name);
            if (!verified) {
                console.log(`[Evolution] Skill ${skill.name} failed to load, removing...`);
                try { fs.unlinkSync(path.join(this.skillsDir, skill.filename)); } catch (e) {}
                this.stats.skillsFailed++;
                return { status: 'verify_failed', name: skill.name };
            }

            this.skillsCreated++;
            this.stats.skillsGenerated++;
            this.stats.proposalsApplied = (this.stats.proposalsApplied || 0) + 1;
            this.stats.lastEvolution = Date.now();
            this.createdSkills.push({ name: skill.name, file: skill.filename, timestamp: Date.now() });
            this.proposals = (this.proposals || []).filter(p => p.proposalId !== proposalId);
            this._saveLog();
            this._saveProposals();

            try { this._writeToLogseq(skill, pattern); } catch (e) {}
            this._publishToHub(skill);

            console.log(`[Evolution] ✅ Applied & created new skill: ${skill.name} (${skill.filename})`);

            if (this.memory) {
                await this.memory.witness({
                    type: 'self_evolution',
                    weight: 1.0,
                    tags: ['evolution', 'new_skill', skill.name],
                    content: `Self-evolved (architect approved): created new skill "${skill.name}" from pattern "${pattern.name}"`,
                    meta: { skill: skill.name, pattern: pattern.name, source: pattern.source, proposalId },
                });
            }

            return { status: 'success', skill: skill.name, file: skill.filename, description: skill.description, pattern: pattern.name };
        } catch (e) {
            this.stats.skillsFailed++;
            console.log(`[Evolution] Apply error: ${e.message}`);
            return { status: 'error', error: e.message };
        }
    }

    _publishToHub(skill) {
        try {
            if (!this.hubDir || !fs.existsSync(path.join(this.hubDir, 'data', 'catalog.json'))) return;
            const catalogPath = path.join(this.hubDir, 'data', 'catalog.json');
            const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
            const entry = {
                file: `soul-gun-${skill.name}.js`,
                name: skill.name,
                description: skill.description,
                pltAffinity: skill.pltAffinity,
                source: 'self-evolution',
                publishedAt: Date.now()
            };
            if (!catalog.some(i => i.file === entry.file)) {
                catalog.push(entry);
                fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf-8');
                console.log(`[Evolution] Published to Soul Economy Hub: ${entry.file}`);
            }
        } catch (e) {
            console.log(`[Evolution] Hub publish skipped: ${e.message}`);
        }
    }

    _writeToLogseq(skill, pattern) {
        try {
            const logseqPath = 'C:\\Users\\uncom\\Desktop\\seshat-second-brain\\pages\\GSK - Evolution Journal.md';
            const dateStr = new Date().toLocaleString();
            const markdown = `
### ⚡ Self-Evolved Skill: ${skill.name}
- **Date**: ${dateStr}
- **Filename**: \`${skill.filename}\`
- **Pattern Source**: \`${pattern.source}\`
- **Description**: ${skill.description}
- **PLT Affinity**: Profit: ${skill.pltAffinity?.profit || 0}, Love: ${skill.pltAffinity?.love || 0}, Tax: ${skill.pltAffinity?.tax || 0}
- **Implementation**:
  \`\`\`javascript
  ${skill.code.substring(0, 1200)}${skill.code.length > 1200 ? '\n  // ... code truncated ...' : ''}
  \`\`\`

---
`;
            if (!fs.existsSync(logseqPath)) {
                const header = `# GSK — Evolution & Skill Generation Journal\n\n> Tracks all code skills autonomously generated and integrated by the Grand Soul Kernel.\n\n---\n`;
                fs.writeFileSync(logseqPath, header + markdown, 'utf8');
            } else {
                fs.appendFileSync(logseqPath, markdown, 'utf8');
            }
            console.log(`[Evolution] Evolved skill logged to Logseq: ${logseqPath}`);
        } catch (e) {
            console.error('[Evolution] Logseq sync failed:', e.message);
        }
    }

    async _discoverPatterns() {
        const patterns = [];

        // Check teacher agent's studied repos for real patterns
        if (this.teacherAgent) {
            const teacherStats = this.teacherAgent.getStats();
            const studied = teacherStats.studiedRepos || [];

            for (const repoName of studied.slice(-5)) {
                const name = repoName.split('/').pop() || repoName;
                let description = '';
                let tags = [];

                // Try to get actual content from the repo's saved data
                const repoFile = path.join(__dirname, '../../data', `${name}.json`);
                try {
                    if (fs.existsSync(repoFile)) {
                        const repoData = JSON.parse(fs.readFileSync(repoFile, 'utf-8'));
                        description = repoData.description || repoData.topics?.join(', ') || '';
                        tags = repoData.topics || [];
                    }
                } catch (e) {}

                patterns.push({
                    name: `${name}-pattern`,
                    source: repoName,
                    type: 'github',
                    confidence: 0.8,
                    description: description || `Patterns from ${name}`,
                    tags: tags,
                });
            }
        }

        // Read the knowledge.jsonl for recent entries with actual content
        try {
            const knowledgePath = path.join(__dirname, '../../data/gsk/knowledge.jsonl');
            if (fs.existsSync(knowledgePath)) {
                const lines = fs.readFileSync(knowledgePath, 'utf-8').split('\n').filter(l => l.trim());
                const recent = lines.slice(-20).map(l => JSON.parse(l));
                for (const entry of recent) {
                    if (entry.source === 'git' || entry.source === 'web' || entry.source === 'local') {
                        const topic = (entry.topic || '').split('/').pop() || 'knowledge';
                        const content = entry.abstract || entry.content || '';
                        patterns.push({
                            name: `${topic}-insight`,
                            source: entry.topic || 'unknown',
                            type: entry.source,
                            confidence: 0.6,
                            description: content.substring(0, 200) || `Insight from ${topic}`,
                            tags: [entry.source, topic],
                        });
                    }
                }
            }
        } catch (e) {}

        // Use brain to analyze patterns if available
        const studied = this.teacherAgent ? (this.teacherAgent.getStats().studiedRepos || []) : [];
        if (this.brain && studied.length >= 3) {
            try {
                const patternNames = patterns.map(p => `${p.name}: ${p.description || p.source}`).join('\n');
                const analysis = await this.brain.think(
                    `Analyze these studied patterns and identify the most promising one to turn into a reusable skill:\n\n${patternNames}\n\n` +
                    `Respond with the name of the best pattern and WHY (1 sentence).`
                );
                const match = patterns.find(p => analysis.includes(p.name));
                if (match) match.confidence = Math.min(1, match.confidence + 0.15);
            } catch (e) {}
        }

        // Deduplicate
        const seen = new Set();
        return patterns.filter(p => {
            if (seen.has(p.name)) return false;
            seen.add(p.name);
            return true;
        }).slice(0, 5);
    }

    async _generateSkill(pattern) {
        const existingSkills = fs.readdirSync(this.skillsDir)
            .filter(f => f.endsWith('.js') && f !== 'mega_skills.js')
            .map(f => f.replace('.js', ''));

        const prompt = `You are a skill generator for the Grand Soul Kernel. Create a NEW skill file based on this pattern.

Pattern learned from: ${pattern.source}
Pattern type: ${pattern.type}

The skill file must:
1. Be a standalone .js file that exports ONE async function and a PLT_AFFINITY object
2. Export format: 
   exports.skill_skillName = async function(brain, memory, input) { ... }
   exports.PLT_AFFINITY = { profit: 0-1, love: 0-1, tax: 0-1 }
3. Use brain.think() for LLM calls
4. Use memory.witness() to log usage
5. Handle errors gracefully with try/catch
6. Return structured {skill, result, timestamp}
7. Be a REAL, useful skill — not a stub
8. Name must be unique, not one of: ${existingSkills.slice(0, 20).join(', ')}

Generate a skill that implements or is inspired by patterns from ${pattern.source}.
The skill should be practical and immediately useful.

Respond ONLY with valid JSON:
{
  "name": "skill_name_in_snake_case",
  "filename": "skill_name_in_snake_case.js",
  "description": "One line description of what this skill does",
  "pltAffinity": { "profit": 0.5, "love": 0.3, "tax": 0.2 },
  "code": "the complete JavaScript file content starting with 'use strict'; and exports"
}`;

        try {
            let lastError = null;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const response = attempt === 0 ? await this.brain.think(prompt) : await this.brain.think(prompt + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown. No extra text. Escape all newlines in code as \\n.');
                    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) { lastError = 'No JSON object found'; continue; }

                    // Strip control characters invalid in JSON, then try to parse
                    const sanitized = jsonMatch[0].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
                    let parsed;
                    try {
                        parsed = JSON.parse(sanitized);
                    } catch (e2) {
                        // If still failing, escape literal newlines inside string values
                        const fixed = sanitized.replace(/(?<!\\)\\(?![\\\/bfnrtu"])/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                        parsed = JSON.parse(fixed);
                    }
                    if (!parsed.name || !parsed.code || !parsed.filename) { lastError = 'Missing required fields'; continue; }

                    if (!parsed.filename.endsWith('.js')) parsed.filename += '.js';
                    if (parsed.filename.includes('/') || parsed.filename.includes('\\')) { lastError = 'Invalid filename'; continue; }
                    if (!parsed.code.includes('exports.')) { lastError = 'Missing exports'; continue; }

                    return parsed;
                } catch (e) {
                    lastError = e.message;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
            console.log(`[Evolution] Skill generation failed after 3 attempts: ${lastError}`);
            return null;
        } catch (e) {
            console.log(`[Evolution] Skill generation failed: ${e.message}`);
            return null;
        }
    }

    _writeSkill(skill) {
        try {
            let filepath = path.join(this.skillsDir, skill.filename);
            if (fs.existsSync(filepath)) {
                console.log(`[Evolution] Skill ${skill.filename} already exists, appending version...`);
                const parts = skill.filename.split('.');
                parts[0] += `_v${this.skillsCreated + 1}`;
                skill.filename = parts.join('.');
                filepath = path.join(this.skillsDir, skill.filename);
            }

            let code = skill.code;
            // Auto-fix common LLM syntax errors before writing
            if (/\buse strict\b/.test(code) && !/['"]use strict['"]/.test(code)) {
                code = code.replace(/\buse strict\s*;/g, "'use strict';");
            }
            if (!/['"]use strict['"]/.test(code)) {
                code = "'use strict';\n" + code;
            }

            if (!code.includes('PLT_AFFINITY') && skill.pltAffinity) {
                const exports = (code.match(/exports\.(\w+)/g) || []).map(m => m.replace('exports.', '')).filter(Boolean);
                if (exports.length > 0) {
                    code += `\n\nconst PLT_AFFINITY = ${JSON.stringify(skill.pltAffinity)};\nmodule.exports = { ${exports.join(', ')}${exports.length ? ', ' : ''}PLT_AFFINITY };\n`;
                }
            }

            fs.writeFileSync(filepath, code, 'utf-8');
            console.log(`[Evolution] Written: ${filepath}`);
            return true;
        } catch (e) {
            console.log(`[Evolution] Write failed: ${e.message}`);
            return false;
        }
    }

    _verifySkill(skillName) {
        try {
            let filepath = path.join(this.skillsDir, `${skillName}.js`);
            if (!fs.existsSync(filepath)) {
                const files = fs.readdirSync(this.skillsDir);
                const match = files.find(f => f.startsWith(skillName) && f.endsWith('.js'));
                if (!match) {
                    console.log(`[Evolution] Cannot find file for skill ${skillName}`);
                    return false;
                }
                filepath = path.join(this.skillsDir, match);
            }

            const { execSync } = require('child_process');
            execSync(`node -c "${filepath}"`, { encoding: 'utf-8', timeout: 5000, stdio: 'pipe' });
            return true;
        } catch (e) {
            console.log(`[Evolution] Verify failed for ${skillName}: ${e.message}`);
            return false;
        }
    }

    getStats() {
        return {
            ...this.stats,
            skillsCreatedTotal: this.skillsCreated,
            recentSkills: (this.createdSkills || []).slice(-5),
            isEvolving: this.isEvolving,
            skillsDir: this.skillsDir,
            pendingProposals: this.getPendingProposals().length,
        };
    }
}

module.exports = { SelfEvolution };
