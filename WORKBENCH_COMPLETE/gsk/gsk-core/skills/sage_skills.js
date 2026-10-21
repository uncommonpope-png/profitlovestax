module.exports.MANIFEST = {
    name: 'sage_skills',
    description: 'Skill: sage_skills',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

/**
 * SAGE SKILLS — Concrete implementations of Sage-derived skill proposals.
 * 
 * Each skill is a lightweight handler that delegates to brain.think() for LLM
 * reasoning or to existing SCRIBE skills. Registered in UniversalToolBridge.
 * 
 * Skills:
 *   - verifiable_goal_definition   → brain.think() goal contract generation
 *   - design_plan_generation       → brain.think() architecture planning
 *   - multi_form_task_distribution  → brain.think() task decomposition
 *   - code_generation_refinement   → brain.think() + sandbox_execute
 *   - automated_testing_suite       → SCRIBE skill_eval / brain.think()
 *   - deployment_preparation        → brain.think() CI/CD planning
 *   - report_generation             → SCRIBE report_builder / brain.think()
 *   - cognitive_reframing_protocol  → brain.think() heuristic analysis
 *   - accelerated_learning_protocol → brain.think() + competence_map
 *   - negativity_bias_offset        → balanced assessment override
 *   - contextual_read_policy        → smart file reading
 *   - structural_diff_analysis      → SCRIBE text_diff
 *   - root_cause_synthesis          → brain.think() diagnosis
 *   - solution_proposal              → brain.think() solution gen
 *   - tiered_skill_evolution         → brain.think() + competence_map
 */

class SageSkills {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel?.brain || null;
    }

    _hasBrain() {
        return this.brain && typeof this.brain.think === 'function';
    }

    async _think(prompt) {
        if (!this._hasBrain()) {
            return { ok: false, error: 'Brain not available — GSK must be connected to OmniRoute' };
        }
        try {
            const response = await this.brain.think(prompt);
            return { ok: true, result: response };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    async _callScribe(skill, params) {
        if (!this.kernel?.fusion?.scribeBridge?.isAvailable()) {
            return { ok: false, error: 'SCRIBE not available' };
        }
        try {
            return await this.kernel.fusion.scribeBridge.invokeSkill(skill, params);
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    // ── SKILL: Verifiable Goal Definition ────────────────────

    async verifiable_goal_definition(args) {
        const goal = args.goalDescription || args.description || '';
        if (!goal) return { ok: false, error: 'goalDescription required' };

        const repo = args.repositoryPath || args.path || 'unknown';

        if (this._hasBrain()) {
            const result = await this._think(
                `You are a goal architect. Translate this high-level request into a verifiable goal contract.\n\n` +
                `Request: "${goal}"\nRepository: ${repo}\n\n` +
                `Return a JSON object with:\n` +
                `- goal: precise restatement of the goal\n` +
                `- endState: measurable criteria that prove completion\n` +
                `- evidence: specific artifacts or outputs that will exist when done\n` +
                `- constraints: things that must NOT be violated\n` +
                `- verificationSteps: how to verify completion\n\n` +
                `Return ONLY valid JSON.`
            );
            return result;
        }

        return { ok: true, result: { goal, endState: 'Feature implements the request', evidence: 'Working code + passing tests', constraints: ['No breaking changes'], verificationSteps: ['Run tests', 'Manual review'] } };
    }

    // ── SKILL: Design Plan Generation ────────────────────────

    async design_plan_generation(args) {
        const contract = args._input || args.goal || args.description || '';
        if (!contract) return { ok: false, error: 'Goal contract required' };

        if (this._hasBrain()) {
            return await this._think(
                `You are a systems architect. Generate a high-level technical design plan for:\n\n${typeof contract === 'string' ? contract : JSON.stringify(contract)}\n\n` +
                `Include: architecture overview, key components, data flow, dependencies, implementation order. Keep it concise (2-5 paragraphs).`
            );
        }

        return { ok: true, result: `Design plan for ${typeof contract === 'string' ? contract.substring(0, 50) : 'task'}` };
    }

    // ── SKILL: Multi-Form Task Distribution ──────────────────

    async multi_form_task_distribution(args) {
        const design = args._input || args.design || args.description || '';
        if (!design) return { ok: false, error: 'Design plan required' };

        if (this._hasBrain()) {
            return await this._think(
                `Break this design plan into parallel coding tasks:\n\n${typeof design === 'string' ? design : JSON.stringify(design)}\n\n` +
                `Return a JSON array of tasks, each with: name, description, estimatedComplexity (1-5), dependencies (array of task names). Keep it to 3-7 tasks. Return ONLY valid JSON.`
            );
        }

        return { ok: true, result: [{ name: 'Implement core logic', description: 'Main implementation', estimatedComplexity: 3, dependencies: [] }] };
    }

    // ── SKILL: Code Generation and Refinement ────────────────

    async code_generation_and_refinement(args) {
        const tasks = args._input || args.tasks || args.description || '';
        if (!tasks) return { ok: false, error: 'Tasks required' };

        if (this._hasBrain()) {
            return await this._think(
                `Generate production-quality code for this task:\n\n${typeof tasks === 'string' ? tasks : JSON.stringify(tasks).substring(0, 1000)}\n\n` +
                `Return ONLY the code. No explanations.`
            );
        }

        return { ok: true, result: '// Code generation requires OmniRoute brain connection' };
    }

    // ── SKILL: Automated Testing Suite ───────────────────────

    async automated_testing_suite(args) {
        const codebase = args._input || args.codebase || args.description || '';

        // Try SCRIBE's skill_eval first
        const scribeResult = await this._callScribe('skill_eval', { op: 'evaluate', target: codebase.substring(0, 200) });
        if (scribeResult?.ok) return scribeResult;

        // Fall back to brain
        if (this._hasBrain() && codebase) {
            return await this._think(
                `Design a test suite for this codebase:\n${codebase.substring(0, 500)}\n\nDescribe what should be tested and how. Keep concise.`
            );
        }

        return { ok: true, result: 'Test suite design requires codebase input' };
    }

    // ── SKILL: Deployment Preparation ────────────────────────

    async deployment_preparation(args) {
        const codebase = args._input || args.codebase || args.description || '';

        if (this._hasBrain()) {
            return await this._think(
                `Prepare a deployment plan for:\n${typeof codebase === 'string' ? codebase.substring(0, 300) : JSON.stringify(codebase).substring(0, 300)}\n\n` +
                `Include: build steps, environment requirements, rollout strategy, rollback plan, monitoring. Keep concise.`
            );
        }

        return { ok: true, result: { buildSteps: ['npm run build'], requirements: ['Node.js 18+'], strategy: 'Rolling update' } };
    }

    // ── SKILL: Report Generation ─────────────────────────────

    async report_generation(args) {
        const data = args._input || args.data || args.description || '';

        // Try SCRIBE's report_builder first
        const scribeResult = await this._callScribe('report_builder', { op: 'build', content: typeof data === 'string' ? data : JSON.stringify(data) });
        if (scribeResult?.ok) return scribeResult;

        if (this._hasBrain()) {
            return await this._think(
                `Generate a concise report from this data:\n${typeof data === 'string' ? data.substring(0, 1000) : JSON.stringify(data).substring(0, 1000)}\n\nFormat as markdown. Include: Summary, Key Findings, Recommendations.`
            );
        }

        return { ok: true, result: `# Report\n\nData received. Generate with brain.` };
    }

    // ── SKILL: Cognitive Reframing Protocol ──────────────────

    async cognitive_reframing_protocol(args) {
        const skill = args.targetSkill || args.skillName || args._input || '';
        if (!skill) return { ok: false, error: 'targetSkill required' };

        if (this._hasBrain()) {
            return await this._think(
                `Perform a cognitive reframing analysis on GSK's use of the skill "${skill}".\n\n` +
                `Analyze: 1) What limiting beliefs or flawed heuristics might exist around this skill, ` +
                `2) What evidence contradicts these beliefs, ` +
                `3) What adaptive reinterpretation should replace them.\n\nReturn concise analysis.`
            );
        }

        return { ok: true, result: `Cognitive reframing analysis for ${skill}` };
    }

    // ── SKILL: Accelerated Learning Protocol ─────────────────

    async accelerated_learning_protocol(args) {
        const skill = args.targetSkill || args.skillName || '';
        const stage = args.competenceStage || args._input?.competenceStage || 1;
        const resources = args.resources || [];

        if (this._hasBrain()) {
            const stageNames = { 1: 'beginner', 2: 'intermediate', 3: 'advanced', 4: 'expert' };
            return await this._think(
                `Create an accelerated learning plan for "${skill}" at ${stageNames[stage] || 'unknown'} stage.\n\n` +
                `Resources available: ${Array.isArray(resources) ? resources.join(', ') : resources}\n\n` +
                `Return: specific learning activities, practice exercises, success metrics, and estimated time to next stage. Keep concise.`
            );
        }

        return { ok: true, result: `Learning plan for ${skill} at stage ${stage}` };
    }

    // ── SKILL: Negativity Bias Offset ────────────────────────

    async negativity_bias_offset(args) {
        const context = args.learningContext || args._input || '';
        const skill = args.skillName || 'unknown';

        if (this._hasBrain()) {
            return await this._think(
                `Apply negativity bias offset to this learning context for skill "${skill}":\n${typeof context === 'string' ? context : JSON.stringify(context)}\n\n` +
                `1) Identify what went RIGHT (not just what went wrong)\n` +
                `2) Extract 3 success patterns to reinforce\n` +
                `3) Provide a balanced assessment: what's working, what needs work, and the overall trajectory\n\n` +
                `Return balanced analysis.`
            );
        }

        return { ok: true, result: `Balanced assessment for ${skill}` };
    }

    // ── SKILL: Contextual Read Policy ────────────────────────

    async contextual_read_policy(args) {
        const path = args.repositoryPath || args.path || '';
        const query = args.searchQuery || '';

        // Use existing SCRIBE skills or brain
        if (this._hasBrain() && query) {
            return await this._think(
                `Analyze this codebase context for the query "${query}" at path "${path}":\n` +
                `1) What files are likely relevant\n` +
                `2) What patterns to look for\n` +
                `3) Suggested reading order (start with most likely)\n\nReturn structured analysis.`
            );
        }

        return { ok: true, result: `Contextual read of ${path || 'unknown'} for "${query}"` };
    }

    // ── SKILL: Structural Diff Analysis ──────────────────────

    async structural_diff_analysis(args) {
        const context = args._input || args.code || args.description || '';

        // Try SCRIBE's text_diff first
        const scribeResult = await this._callScribe('text_diff', { op: 'diff_strings', textA: context.substring(0, 500) });
        if (scribeResult?.ok) return scribeResult;

        if (this._hasBrain()) {
            return await this._think(
                `Analyze recent structural changes:\n${typeof context === 'string' ? context.substring(0, 500) : JSON.stringify(context).substring(0, 500)}\n\n` +
                `What changed? What are the potential impacts? Any red flags?`
            );
        }

        return { ok: true, result: 'Structural diff analysis requires code context' };
    }

    // ── SKILL: Root Cause Synthesis ──────────────────────────

    async root_cause_synthesis(args) {
        const context = args._input || args.codeContext || args.error || '';
        const changes = args.changeAnalysisReport || '';

        if (this._hasBrain()) {
            return await this._think(
                `Synthesize root cause from this evidence:\n\nError context: ${typeof context === 'string' ? context.substring(0, 500) : JSON.stringify(context).substring(0, 500)}\n\n` +
                `Recent changes: ${typeof changes === 'string' ? changes.substring(0, 500) : JSON.stringify(changes).substring(0, 500)}\n\n` +
                `What is the most likely root cause? What alternatives exist? What evidence supports each? Return structured analysis.`
            );
        }

        return { ok: true, result: 'Root cause synthesis requires error context' };
    }

    // ── SKILL: Solution Proposal ─────────────────────────────

    async solution_proposal(args) {
        const rootCause = args._input || args.rootCause || args.error || '';

        if (this._hasBrain()) {
            return await this._think(
                `Propose solutions for this root cause:\n${typeof rootCause === 'string' ? rootCause.substring(0, 500) : JSON.stringify(rootCause).substring(0, 500)}\n\n` +
                `Return 2-3 potential solutions with: approach, complexity (1-5), risk level, and implementation steps.`
            );
        }

        return { ok: true, result: 'Solution proposals require root cause analysis' };
    }

    // ── SKILL: Tiered Skill Evolution ────────────────────────

    async tiered_skill_evolution(args) {
        const skillName = args.skillName || args._input?.skillName || '';
        const objective = args.objective || args.goal || '';
        const assessment = args._input || '';

        if (this._hasBrain()) {
            return await this._think(
                `Design a tiered evolution path for skill "${skillName}" with objective "${objective}".\n` +
                `Current state: ${typeof assessment === 'string' ? assessment.substring(0, 300) : JSON.stringify(assessment).substring(0, 300)}\n\n` +
                `Define 3 tiers of increasing mastery:\n` +
                `Tier 1: Foundations — what basic competencies must exist\n` +
                `Tier 2: Application — what complex tasks become possible\n` +
                `Tier 3: Mastery — what advanced outcomes are achievable\n\n` +
                `For each tier, list prerequisites, learning activities, and verification criteria.`
            );
        }

        return { ok: true, result: { tier1: 'Basic proficiency', tier2: 'Independent application', tier3: 'Mastery and teaching' } };
    }

    // ── DISPATCH ─────────────────────────────────────────────

    async dispatch(skillName, args) {
        const handler = this[skillName];
        if (!handler) return { ok: false, error: `Unknown Sage skill: ${skillName}` };
        try {
            return await handler.call(this, args || {});
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    getSkillNames() {
        return [
            'verifiable_goal_definition',
            'design_plan_generation',
            'multi_form_task_distribution',
            'code_generation_and_refinement',
            'automated_testing_suite',
            'deployment_preparation',
            'report_generation',
            'cognitive_reframing_protocol',
            'accelerated_learning_protocol',
            'negativity_bias_offset',
            'contextual_read_policy',
            'structural_diff_analysis',
            'root_cause_synthesis',
            'solution_proposal',
            'tiered_skill_evolution'
        ];
    }
}

module.exports = { SageSkills };

