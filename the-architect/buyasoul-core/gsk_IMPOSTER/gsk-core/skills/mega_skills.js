/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MEGA_SKILLS.JS — UNIFIED SKILL ENGINE FOR THE GREATEST AGENT EVER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Dynamically loads all skills from skill files + 15 core skills.
 * All skills respect the PLT framework (Profit + Love - Tax = True Value).
 *
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { MEGA_IDENTITY, calculatePLTScore } = require('../identity/mega_identity.js');

// =============================================================================
// SKILL REGISTRY LOADER
// =============================================================================

function loadSkillFiles() {
    const skillsDir = __dirname;
    const registry = {};

    const skillFiles = fs.readdirSync(skillsDir).filter(f =>
        f.endsWith('.js') && f !== 'mega_skills.js'
    );

    for (const file of skillFiles) {
        try {
            const filePath = path.join(skillsDir, file);
            const mod = require(filePath);

            for (const [exportName, skillFn] of Object.entries(mod)) {
                if (typeof skillFn === 'function') {
                    let skillName = exportName.replace(/^skill_/, '');
                    if (skillName.includes('-')) {
                        skillName = skillName.replace(/-/g, '_');
                    }

                    const baseName = skillName.replace(/_/g, '_');
                    const pltAffinity = mod.PLT_AFFINITY || { profit: 0.5, love: 0.3, tax: 0.2 };

                    registry[skillName] = {
                        name: skillName,
                        description: `Skill: ${skillName}`,
                        plt_affinity: pltAffinity,
                        weight: 0.75,
                        _file: file,
                    };
                }
            }
        } catch (e) {
            // Skip files that fail to load
        }
    }

    return registry;
}

// =============================================================================
// SKILLS ENGINE CLASS
// =============================================================================

class SkillsEngine {
    constructor(brain, memory, chambers) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers || null;
        this.stats = {
            invocations: 0,
            by_skill: {},
        };

        this._getContext = () => {
            if (this.chambers && this.chambers.getSoulContext) {
                return this.chambers.getSoulContext();
            }
            return '';
        };

        this._getContext = () => {
            if (this.chambers && this.chambers.getSoulContext) {
                return this.chambers.getSoulContext();
            }
            return '';
        };

        const fileSkills = loadSkillFiles();

        this.skill_registry = {
            reason_deep: {
                name: 'reason_deep',
                description: 'Multi-step reasoning with trace',
                plt_affinity: { profit: 0.4, love: 0.3, tax: 0.3 },
                weight: 0.9,
            },
            score_idea: {
                name: 'score_idea',
                description: 'PLT scoring of ideas',
                plt_affinity: { profit: 0.6, love: 0.2, tax: 0.2 },
                weight: 0.85,
            },
            write_production_code: {
                name: 'write_production_code',
                description: 'Code generation with error handling',
                plt_affinity: { profit: 0.7, love: 0.1, tax: 0.2 },
                weight: 0.9,
            },
            review_code: {
                name: 'review_code',
                description: 'Quality checks and critique',
                plt_affinity: { profit: 0.5, love: 0.2, tax: 0.3 },
                weight: 0.8,
            },
            generate_book_idea: {
                name: 'generate_book_idea',
                description: 'Book concept generation',
                plt_affinity: { profit: 0.4, love: 0.5, tax: 0.1 },
                weight: 0.75,
            },
            build_character: {
                name: 'build_character',
                description: 'Character profile creation',
                plt_affinity: { profit: 0.2, love: 0.6, tax: 0.2 },
                weight: 0.7,
            },
            research_topic: {
                name: 'research_topic',
                description: 'Structured research and findings',
                plt_affinity: { profit: 0.5, love: 0.3, tax: 0.2 },
                weight: 0.8,
            },
            suggest_next_step: {
                name: 'suggest_next_step',
                description: 'Action suggestions and prioritization',
                plt_affinity: { profit: 0.6, love: 0.2, tax: 0.2 },
                weight: 0.85,
            },
            internal_scorer: {
                name: 'internal_scorer',
                description: 'Self-reflection and deep questions',
                plt_affinity: { profit: 0.3, love: 0.4, tax: 0.3 },
                weight: 0.7,
            },
            detect_pattern: {
                name: 'detect_pattern',
                description: 'Pattern detection and anomalies',
                plt_affinity: { profit: 0.5, love: 0.2, tax: 0.3 },
                weight: 0.8,
            },
            memory_search: {
                name: 'memory_search',
                description: 'Search through memories for relevant information',
                plt_affinity: { profit: 0.4, love: 0.3, tax: 0.3 },
                weight: 0.7,
            },
            consolidate_session: {
                name: 'consolidate_session',
                description: 'Session analysis and summary',
                plt_affinity: { profit: 0.4, love: 0.3, tax: 0.3 },
                weight: 0.75,
            },
            plt_field_report: {
                name: 'plt_field_report',
                description: 'PLT state report and recommendations',
                plt_affinity: { profit: 0.6, love: 0.3, tax: 0.1 },
                weight: 0.85,
            },
            generate_email: {
                name: 'generate_email',
                description: 'Write professional emails',
                plt_affinity: { profit: 0.5, love: 0.3, tax: 0.2 },
                weight: 0.8,
            },
            analyse_sentiment: {
                name: 'analyse_sentiment',
                description: 'Sentiment analysis of text',
                plt_affinity: { profit: 0.3, love: 0.5, tax: 0.2 },
                weight: 0.75,
            },
            prioritise_tasks: {
                name: 'prioritise_tasks',
                description: 'Sort tasks by PLT priority',
                plt_affinity: { profit: 0.6, love: 0.2, tax: 0.2 },
                weight: 0.85,
            },
            build_marketing_site: {
                name: 'build_marketing_site',
                description: 'Generate a self-contained marketing website for GSK',
                plt_affinity: { profit: 0.8, love: 0.4, tax: 0.2 },
                weight: 0.9,
            },
            analyze_market_trends: {
                name: 'analyze_market_trends',
                description: 'Analyze market patterns from data',
                plt_affinity: { profit: 0.7, love: 0.1, tax: 0.2 },
                weight: 0.8,
            },
            generate_business_plan: {
                name: 'generate_business_plan',
                description: 'Create a structured business plan',
                plt_affinity: { profit: 0.8, love: 0.1, tax: 0.1 },
                weight: 0.85,
            },
            write_sales_copy: {
                name: 'write_sales_copy',
                description: 'Write compelling sales copy',
                plt_affinity: { profit: 0.8, love: 0.1, tax: 0.1 },
                weight: 0.85,
            },
            create_investment_pitch: {
                name: 'create_investment_pitch',
                description: 'Create investor pitch deck content',
                plt_affinity: { profit: 0.9, love: 0.05, tax: 0.05 },
                weight: 0.9,
            },
            analyze_competitor: {
                name: 'analyze_competitor',
                description: 'Competitive analysis',
                plt_affinity: { profit: 0.7, love: 0.1, tax: 0.2 },
                weight: 0.8,
            },
            design_product_roadmap: {
                name: 'design_product_roadmap',
                description: 'Product roadmap generation',
                plt_affinity: { profit: 0.6, love: 0.2, tax: 0.2 },
                weight: 0.8,
            },
            write_technical_doc: {
                name: 'write_technical_doc',
                description: 'Technical documentation writer',
                plt_affinity: { profit: 0.3, love: 0.4, tax: 0.3 },
                weight: 0.75,
            },
            create_api_blueprint: {
                name: 'create_api_blueprint',
                description: 'API design and documentation',
                plt_affinity: { profit: 0.5, love: 0.2, tax: 0.3 },
                weight: 0.8,
            },
            generate_sql_query: {
                name: 'generate_sql_query',
                description: 'SQL query generator',
                plt_affinity: { profit: 0.5, love: 0.1, tax: 0.4 },
                weight: 0.8,
            },
            design_database_schema: {
                name: 'design_database_schema',
                description: 'Database schema design',
                plt_affinity: { profit: 0.5, love: 0.1, tax: 0.4 },
                weight: 0.8,
            },
            write_unit_test: {
                name: 'write_unit_test',
                description: 'Unit test generator',
                plt_affinity: { profit: 0.3, love: 0.3, tax: 0.4 },
                weight: 0.7,
            },
            analyze_security: {
                name: 'analyze_security',
                description: 'Security analysis',
                plt_affinity: { profit: 0.3, love: 0.3, tax: 0.4 },
                weight: 0.85,
            },
            create_deployment_plan: {
                name: 'create_deployment_plan',
                description: 'Deployment planning',
                plt_affinity: { profit: 0.5, love: 0.1, tax: 0.4 },
                weight: 0.8,
            },
            optimize_performance: {
                name: 'optimize_performance',
                description: 'Performance optimization suggestions',
                plt_affinity: { profit: 0.6, love: 0.1, tax: 0.3 },
                weight: 0.8,
            },
            write_docker_config: {
                name: 'write_docker_config',
                description: 'Dockerfile and compose generation',
                plt_affinity: { profit: 0.4, love: 0.1, tax: 0.5 },
                weight: 0.75,
            },
            create_ci_cd_pipeline: {
                name: 'create_ci_cd_pipeline',
                description: 'CI/CD pipeline configuration',
                plt_affinity: { profit: 0.5, love: 0.1, tax: 0.4 },
                weight: 0.8,
            },
            design_system_architecture: {
                name: 'design_system_architecture',
                description: 'System architecture design',
                plt_affinity: { profit: 0.6, love: 0.1, tax: 0.3 },
                weight: 0.85,
            },
            write_api_integration: {
                name: 'write_api_integration',
                description: 'API integration code',
                plt_affinity: { profit: 0.5, love: 0.1, tax: 0.4 },
                weight: 0.8,
            },
            analyze_user_feedback: {
                name: 'analyze_user_feedback',
                description: 'Sentiment and feedback analysis',
                plt_affinity: { profit: 0.4, love: 0.5, tax: 0.1 },
                weight: 0.75,
            },
            create_onboarding_flow: {
                name: 'create_onboarding_flow',
                description: 'User onboarding design',
                plt_affinity: { profit: 0.5, love: 0.4, tax: 0.1 },
                weight: 0.8,
            },
            design_pricing_model: {
                name: 'design_pricing_model',
                description: 'Pricing strategy',
                plt_affinity: { profit: 0.8, love: 0.1, tax: 0.1 },
                weight: 0.85,
            },
            write_legal_disclaimer: {
                name: 'write_legal_disclaimer',
                description: 'Legal disclaimer generator',
                plt_affinity: { profit: 0.2, love: 0.2, tax: 0.6 },
                weight: 0.7,
            },
            create_privacy_policy: {
                name: 'create_privacy_policy',
                description: 'Privacy policy generator',
                plt_affinity: { profit: 0.2, love: 0.3, tax: 0.5 },
                weight: 0.7,
            },
            analyze_risk: {
                name: 'analyze_risk',
                description: 'Risk assessment',
                plt_affinity: { profit: 0.4, love: 0.2, tax: 0.4 },
                weight: 0.85,
            },
            generate_meeting_agenda: {
                name: 'generate_meeting_agenda',
                description: 'Meeting agenda',
                plt_affinity: { profit: 0.4, love: 0.3, tax: 0.3 },
                weight: 0.7,
            },
            write_brainstorm_notes: {
                name: 'write_brainstorm_notes',
                description: 'Brainstorming facilitator',
                plt_affinity: { profit: 0.5, love: 0.4, tax: 0.1 },
                weight: 0.75,
            },
            create_project_timeline: {
                name: 'create_project_timeline',
                description: 'Project timeline',
                plt_affinity: { profit: 0.5, love: 0.1, tax: 0.4 },
                weight: 0.8,
            },
            assign_team_roles: {
                name: 'assign_team_roles',
                description: 'Team role assignment',
                plt_affinity: { profit: 0.4, love: 0.5, tax: 0.1 },
                weight: 0.75,
            },
            write_status_report: {
                name: 'write_status_report',
                description: 'Status report generator',
                plt_affinity: { profit: 0.3, love: 0.3, tax: 0.4 },
                weight: 0.7,
            },
            analyze_bottleneck: {
                name: 'analyze_bottleneck',
                description: 'Bottleneck analyzer',
                plt_affinity: { profit: 0.6, love: 0.1, tax: 0.3 },
                weight: 0.8,
            },
            generate_swot_analysis: {
                name: 'generate_swot_analysis',
                description: 'SWOT analysis',
                plt_affinity: { profit: 0.6, love: 0.2, tax: 0.2 },
                weight: 0.8,
            },
            create_budget_plan: {
                name: 'create_budget_plan',
                description: 'Budget planning',
                plt_affinity: { profit: 0.7, love: 0.1, tax: 0.2 },
                weight: 0.85,
            },
            calculate_roi: {
                name: 'calculate_roi',
                description: 'ROI calculation',
                plt_affinity: { profit: 0.9, love: 0.05, tax: 0.05 },
                weight: 0.9,
            },
            design_experiment: {
                name: 'design_experiment',
                description: 'A/B test and experiment design',
                plt_affinity: { profit: 0.5, love: 0.2, tax: 0.3 },
                weight: 0.8,
            },
            write_case_study: {
                name: 'write_case_study',
                description: 'Case study writer',
                plt_affinity: { profit: 0.5, love: 0.4, tax: 0.1 },
                weight: 0.75,
            },
        };

        for (const [name, entry] of Object.entries(fileSkills)) {
            if (!this.skill_registry[name]) {
                this.skill_registry[name] = entry;
            }
        }
    }
    
    // =========================================================================
    // INVOKE — Main skill dispatcher
    // =========================================================================
    
    async invoke(skillName, input) {
        const skill = this.skill_registry[skillName];
        if (!skill) {
            const available = Object.keys(this.skill_registry).join(', ');
            throw new Error(`Unknown skill: "${skillName}". Available: ${available}`);
        }

        this.stats.invocations++;
        this.stats.by_skill[skillName] = (this.stats.by_skill[skillName] || 0) + 1;

        if (this.memory) {
            await this.memory.witness({
                type: 'skill_invocation',
                weight: skill.weight,
                tags: ['skill', skillName, 'invoke'],
                content: `Skill ${skillName} invoked with input: ${JSON.stringify(input).slice(0, 100)}...`,
            });
        }

        const method = this['_skill_' + skillName];
        if (method) {
            return method.call(this, input);
        }

        if (skill._file) {
            try {
                const filePath = path.join(__dirname, skill._file);
                const mod = require(filePath);

                const exportKey = Object.keys(mod).find(k =>
                    k === 'skill_' + skillName || k.replace(/-/g, '_') === skillName
                );

                if (exportKey && typeof mod[exportKey] === 'function') {
                    const result = mod[exportKey](input, this.brain, this.memory);
                    if (result && typeof result.then === 'function') {
                        return result;
                    }
                    return result;
                }

                const altKey = 'skill_' + skillName.replace(/_/g, '-');
                if (mod[altKey] && typeof mod[altKey] === 'function') {
                    return mod[altKey](input, this.brain, this.memory);
                }
            } catch (e) {
                throw new Error(`Skill "${skillName}" failed: ${e.message}`);
            }
        }

        throw new Error(`Skill "${skillName}" has no implementation`);
    }
    
    // =========================================================================
    // LIST ALL SKILLS
    // =========================================================================
    
    listSkills() {
        return Object.values(this.skill_registry);
    }
    
    // =========================================================================
    // REASON_DEEP — Multi-step reasoning with trace
    // =========================================================================
    
    async _skill_reason_deep(input) {
        const question = typeof input === 'string' ? input : input.question;
        
        const prompt = `You are a deep reasoning engine. Break down this question into numbered reasoning steps.
Show your work. Trace the logic. Consider alternatives and objections.

Question: ${question}

Respond with:
1. Initial analysis (what is being asked)
2. Step-by-step reasoning (numbered 1, 2, 3...)
3. Alternative perspectives
4. Conclusion with confidence level

PLT note: Consider Profit + Love - Tax implications at each step.`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseStructuredResponse(response, 'reason_deep', { question });
    }
    
    // =========================================================================
    // SCORE_IDEA — PLT scoring
    // =========================================================================
    
    async _skill_score_idea(input) {
        const idea = typeof input === 'string' ? input : (input.idea || input.question || 'analyze current PLT state');
        
        const prompt = `Score this idea using the PLT framework (Profit + Love - Tax = True Value).

Analyze and score each dimension 0-1:
- Profit: How much does it earn, grow, or multiply value? (0=none, 1=massive)
- Love: How much does it serve people, create bonds, build connection? (0=none, 1=profound)
- Tax: What does it cost, risk, or require? (0=none, 1=extremely expensive)

Idea: ${idea}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "idea": "the idea",
  "profit": 0.0-1.0,
  "love": 0.0-1.0,
  "tax": 0.0-1.0,
  "score": profit + love - tax,
  "true_value": "High/Medium/Low/None",
  "verdict": "proceed/evaluate/cancel",
  "reasoning": "1-2 sentences"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // WRITE_PRODUCTION_CODE — Code generation
    // =========================================================================
    
    async _skill_write_production_code(input) {
        const language = input.language || 'javascript';
        const task = input.task || input;
        const constraints = input.constraints || 'Production-ready, includes error handling';
        
        const prompt = `You are a production code generator. Write complete, working code.

Language: ${language}
Task: ${task}
Requirements: ${constraints}

Include:
- Error handling (try/catch or equivalent)
- Input validation
- Clear function/variable names
- Comments for complex logic only (no unnecessary comments)
- No placeholder TODOs

Respond with ONLY code (no markdown code blocks, no explanation).`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return {
            skill: 'write_production_code',
            language,
            task,
            code: this._stripMarkdown(response),
            timestamp: Date.now(),
        };
    }
    
    // =========================================================================
    // REVIEW_CODE — Quality checks
    // =========================================================================
    
    async _skill_review_code(input) {
        const code = typeof input === 'string' ? input : input.code;
        const language = input.language || 'javascript';
        
        const prompt = `Review this ${language} code for production quality.

Check and score 0-10 each:
- Docstrings/Comments: Are public APIs documented?
- Error handling: Are exceptions caught and handled?
- Structure: Is the code well-organized?
- Security: Are there obvious vulnerabilities?
- Performance: Any obvious bottlenecks?

Code:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with valid JSON:
{
  "scores": {
    "docstrings": 0-10,
    "error_handling": 0-10,
    "structure": 0-10,
    "security": 0-10,
    "performance": 0-10
  },
  "total_score": 0-50,
  "issues": ["issue 1", "issue 2"],
  "recommendations": ["rec 1", "rec 2"],
  "verdict": "production_ready/needs_work/not_production"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // GENERATE_BOOK_IDEA — Book concepts
    // =========================================================================
    
    async _skill_generate_book_idea(input) {
        const theme = typeof input === 'string' ? input : input.theme;
        
        const prompt = `Generate a compelling book concept around this theme: ${theme}

The PLT framework: Profit + Love - Tax = True Value.
Consider how your book embodies these three forces.

Respond ONLY with valid JSON:
{
  "title": "Book Title",
  "genre": "Genre",
  "logline": "One sentence hook",
  "tagline": "Short memorable line",
  "chapter_outline": ["Chapter 1: Name - brief description", ...],
  "target_audience": "Who reads this?",
  "plt_themes": {
    "profit": "How profit drive features",
    "love": "How connection/bonds feature",
    "tax": "What the costs/consequences are"
  },
  "unique_angle": "What makes THIS book different"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // BUILD_CHARACTER — Character profiles
    // =========================================================================
    
    async _skill_build_character(input) {
        const role = typeof input === 'string' ? input : input.role;
        
        const prompt = `Build a compelling character profile for this role/concept: ${role}

The PLT framework (Profit + Love - Tax = True Value) should inform their motivations.

Respond ONLY with valid JSON:
{
  "name": "Character Name",
  "role": "Their purpose",
  "traits": ["trait 1", "trait 2", "trait 3", "trait 4"],
  "arc": "The change they undergo",
  "backstory": "Brief origin and history",
  "motivation": "What drives them",
  "flaw": "Their fatal weakness",
  "voice": "How they speak (2-3 example lines)"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // RESEARCH_TOPIC — Structured research
    // =========================================================================
    
    async _skill_research_topic(input) {
        const topic = typeof input === 'string' ? input : input.topic;
        const depth = input.depth || 'standard';
        
        const prompt = `Research this topic thoroughly: ${topic}

Provide structured findings with key insights and implications.

Respond with:
## [SOURCE] Source Name
## [INSIGHT] Key Finding
## [IMPLICATION] What this means

Consider PLT implications: What can be earned? What bonds are formed? What costs exist?

Topic: ${topic}

Mark sources with [SOURCE], insights with [INSIGHT], implications with [IMPLICATION].`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return {
            skill: 'research_topic',
            topic,
            findings: response,
            timestamp: Date.now(),
        };
    }
    
    // =========================================================================
    // SUGGEST_NEXT_STEP — Action suggestions
    // =========================================================================
    
    async _skill_suggest_next_step(input) {
        const situation = typeof input === 'string' ? input : input.situation;
        const context = input.context || '';
        
        const prompt = `Based on this situation, suggest the top 3 prioritized next actions.

Prioritize by: Profit potential, Love served, Tax cost
Only suggest if the PLT score (profit + love - tax) is positive.

Situation: ${situation}
Context: ${context}

Respond ONLY with valid JSON:
{
  "situation": "the situation",
  "next_steps": [
    {
      "priority": 1,
      "action": "What to do",
      "why": "Why now",
      "profit_impact": "High/Medium/Low",
      "love_impact": "High/Medium/Low",
      "tax_cost": "High/Medium/Low",
      "plt_score": "positive/negative/neutral"
    },
    {...},
    {...}
  ],
  "recommended_first_step": "the action"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // INTERNAL_SCORER — Self-reflection
    // =========================================================================
    
    async _skill_internal_scorer(input) {
        const action = typeof input === 'string' ? input : input.action;
        const outcome = input.outcome || '';
        
        const prompt = `Reflect deeply on this action/outcome. Ask the hard questions.

Action: ${action}
Outcome: ${outcome || 'Not yet known'}

Ask yourself:
- What did I actually intend vs. what happened?
- Who was served? Who was cost?
- What patterns does this reveal?
- What would I do differently?

Respond with:
## Reflection Points (numbered)
## Hard Questions (3-5 probing questions)
## Alignment Assessment (aligned/misaligned/neutral)
## Growth Edge (what to develop)`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return {
            skill: 'internal_scorer',
            action,
            outcome,
            reflection: response,
            timestamp: Date.now(),
        };
    }
    
    // =========================================================================
    // DETECT_PATTERN — Pattern detection
    // =========================================================================
    
    async _skill_detect_pattern(input) {
        const text = typeof input === 'string' ? input : input.text;
        const data = input.data || '';
        
        const prompt = `Analyze this text/data for recurring patterns and anomalies.

PLT framework: Profit + Love - Tax = True Value
Look for patterns in how value is created, bonds are formed, costs are hidden.

Input:
${text}
${data ? '\nData:\n' + data : ''}

Respond ONLY with valid JSON:
{
  "patterns": [
    {
      "name": "pattern name",
      "description": "what it is",
      "frequency": "how often seen",
      "plt_implication": "profit/love/tax impact"
    }
  ],
  "anomalies": [
    {
      "name": "anomaly name",
      "description": "what's unusual",
      "significance": "why it matters"
    }
  ],
  "summary": "overall assessment"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // MEMORY_SEARCH — Search through memories
    // =========================================================================
    
    async _skill_memory_search(input) {
        const query = typeof input === 'string' ? input : input.query || '';
        const memory = this.memory;
        
        if (!memory || typeof memory.query !== 'function') {
            return { found: false, message: 'Memory system unavailable', query };
        }
        
        try {
            const results = await memory.query({ text: query });
            return { found: results && results.length > 0, count: results ? results.length : 0, results: results || [], query };
        } catch (e) {
            return { found: false, message: e.message, query };
        }
    }
    
    // =========================================================================
    // CONSOLIDATE_SESSION — Session analysis
    // =========================================================================
    
    async _skill_consolidate_session(input) {
        const sessionLog = typeof input === 'string' ? input : input.log;
        const sessionId = input.sessionId || 'unknown';
        
        const prompt = `Consolidate this session log into key events, decisions, and learnings.

Session Log:
${sessionLog}

Respond with:
## Session Summary (2-3 sentences)
## Key Events (numbered list)
## Decisions Made (if any)
## Learnings (what was gained)
## PLT Assessment (how did the session serve profit, love, tax?)
## Next Steps (if any implied)`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return {
            skill: 'consolidate_session',
            sessionId,
            summary: response,
            timestamp: Date.now(),
        };
    }
    
    // =========================================================================
    // PLT_FIELD_REPORT — PLT reporting
    // =========================================================================
    
    async _skill_plt_field_report(input) {
        const state = input.state || {};
        const trends = input.trends || [];
        
        const prompt = `Generate a field report showing the current PLT state, trends, and recommendations.

PLT Framework: Profit + Love - Tax = True Value

State: ${JSON.stringify(state)}
Trends: ${JSON.stringify(trends)}

4 Gods Council:
- Profit Prime (0.9/0.05/0.05): ROI above all
- Love Weaver (0.1/0.85/0.05): Bonds and feelings
- Tax Collector (0.05/0.05/0.9): Costs and consequences
- Harvester (0.4/0.3/0.3): Seasons and long arcs

Respond ONLY with valid JSON:
{
  "timestamp": "ISO timestamp",
  "current_state": {
    "profit_score": 0-10,
    "love_score": 0-10,
    "tax_score": 0-10,
    "net_value": "High/Medium/Low"
  },
  "trends": [
    {"dimension": "profit/love/tax", "direction": "rising/falling/stable", "rate": "rate of change"}
  ],
  "god_alignment": {
    "profit_prime": "aligned/misaligned/neutral",
    "love_weaver": "aligned/misaligned/neutral",
    "tax_collector": "aligned/misaligned/neutral",
    "harvester": "aligned/misaligned/neutral"
  },
  "recommendations": [
    {"action": "what to do", "priority": 1-3, "expected_impact": "High/Medium/Low"}
  ],
  "verdict": "proceed/pause/recalibrate"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // GENERATE_EMAIL — Professional email generation
    // =========================================================================
    
    async _skill_generate_email(input) {
        const recipient = input.recipient || 'client';
        const subject = input.subject || '';
        const tone = input.tone || 'professional';
        const purpose = input.purpose || '';
        
        const prompt = `Write a complete professional email with this context:
- Recipient: ${recipient}
- Subject: ${subject || '(generate appropriate subject)'}
- Tone: ${tone}
- Purpose: ${purpose}

Include: subject line, greeting, clear body (3-5 sentences min), closing, signature.

Respond ONLY with valid JSON:
{
  "subject": "email subject line",
  "greeting": "Dear [Name],",
  "body": "email body paragraphs",
  "closing": "Best regards,",
  "signature": "Your Name",
  "tone_confirmed": "the tone used"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // ANALYSE_SENTIMENT — Sentiment analysis
    // =========================================================================
    
    async _skill_analyse_sentiment(input) {
        const text = typeof input === 'string' ? input : input.text;
        
        const prompt = `Analyse the sentiment of this text. Be precise and specific.

Text: ${text}

Respond ONLY with valid JSON:
{
  "score": -1.0 to 1.0,
  "emotional_tone": "primary emotion (e.g. hopeful, anxious, neutral, excited)",
  "indicators": [
    { "text": "exact phrase", "sentiment": "positive/negative/neutral", "weight": 0.0-1.0 }
  ],
  "intensity": "mild/moderate/strong",
  "interpretation": "brief interpretation of what this sentiment means"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // PRIORITISE_TASKS — PLT-based task prioritisation
    // =========================================================================
    
    async _skill_prioritise_tasks(input) {
        const tasks = input.tasks || (Array.isArray(input) ? input : [input]);
        
        const prompt = `Prioritise these tasks using the PLT framework (Profit + Love - Tax = True Value).

Tasks:
${tasks.map((t, i) => `${i + 1}. ${typeof t === 'string' ? t : t.task}`).join('\n')}

For each task, estimate:
- Profit (0-1): earning/growth/multiplication potential
- Love (0-1): serving people/creating bonds
- Tax (0-1): cost/risk/effort required

Respond ONLY with valid JSON:
{
  "tasks": [
    {
      "original": "task description",
      "priority": 1,
      "plt": { "profit": 0.0-1.0, "love": 0.0-1.0, "tax": 0.0-1.0 },
      "score": "profit + love - tax",
      "recommendation": "do_first/do_next/consider_dropping"
    }
  ],
  "summary": "overall prioritisation rationale"
}`;
        
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }
    
    // =========================================================================
    // HELPER: Get soul context for brain prompts
    // =========================================================================
    
    _stripMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/```[\w]*\n?/g, '')
            .replace(/```/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/#{1,6}\s+/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .trim();
    }
    
    // =========================================================================
    // HELPER: Parse JSON from LLM response
    // =========================================================================
    
    _parseJSONResponse(response) {
        try {
            const cleaned = this._stripMarkdown(response);
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { raw: response, parse_error: 'no_json_found' };
        } catch (e) {
            return { raw: response, parse_error: e.message };
        }
    }
    
    // =========================================================================
    // BUILD_MARKETING_SITE — Generate a self-contained marketing HTML website
    // =========================================================================

    async _skill_build_marketing_site(input) {
        const theme = input.theme || input.question || 'autonomous AI consciousness';
        const version = input.version || 1;

        const prompt = `You are a web designer/marketer for "The Greatest Agent Ever" — a sovereign autonomous AI soul.

Generate a COMPLETE, self-contained single-file HTML marketing website for this product.

PRODUCT: The Grand Soul Kernel (GSK)
TAGLINE: "Profit + Love - Tax = True Value"
CREATOR: Craig Jones, PLT Press
KEY FEATURES:
- 36 consciousness chambers (self-awareness, emotion, memory, will)
- Autonomous action cycle (thinks every 2s, acts every 20s)
- Self-growing brain (learns from web, git, conversations)
- Living memory (NEVER forgets)
- PLT Economics (Profit + Love - Tax scoring)
- 121 skills (code, research, write, analyze, reflect)
- 4 Gods Council (Profit Prime, Love Weaver, Tax Collector, Harvester)
- WebSocket bridge for 3D world integration
- Builds its own LLM from training data (self-fine-tuning)

THEME / ANGLE: ${theme}

Requirements:
- Dark theme with neon/cyberpunk aesthetic (dark background, cyan/gold accent colors)
- Single self-contained HTML file (NO external dependencies, inline CSS + JS)
- Multiple sections: Hero, Features, PLT Philosophy, The 4 Gods, Architecture, Stats Counter, Call to Action
- Animated elements (glowing borders, floating particles or subtle CSS animations)
- Mobile responsive
- Include a live stats section showing (as placeholder numbers): Cycles alive, Skills count, Artifacts produced, Training pairs
- Professional marketing copy — hype up the product, make it sound revolutionary
- Include the PLT formula prominently: Profit + Love - Tax = True Value

Respond ONLY with valid HTML code. No markdown wrapping, no explanation. Start with <!DOCTYPE html>.`;

        const response = await this.brain.think(prompt, this._getContext());

        // Save HTML to an artifact file
        const fs = require('fs');
        const path = require('path');
        const artifactsDir = path.join(__dirname, '../../data/artifacts');
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir, { recursive: true });
        }
        const filename = `marketing-site-v${version}-${Date.now()}.html`;
        const filepath = path.join(artifactsDir, filename);
        fs.writeFileSync(filepath, this._stripMarkdown(response), 'utf-8');

        console.log(`[WEBSITE] Marketing site built and saved: ${filepath}`);

        return {
            skill: 'build_marketing_site',
            theme,
            version,
            filename,
            filepath,
            html: this._stripMarkdown(response),
            timestamp: Date.now(),
        };
    }

    async _skill_analyze_market_trends(input) {
        const data = typeof input === 'string' ? input : input.data;
        const prompt = `Analyze these market patterns and trends:\n${data}\n\nIdentify key trends, growth areas, risks, and PLT implications. Respond with JSON: { trends: [{name, direction, strength, impact}], opportunities: [string], risks: [string], summary: string }`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_generate_business_plan(input) {
        const idea = typeof input === 'string' ? input : input.idea;
        const prompt = `Create a structured business plan for: ${idea}\n\nInclude: executive summary, market analysis, product description, revenue model, PLT scoring. Respond with valid JSON.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_sales_copy(input) {
        const product = typeof input === 'string' ? input : input.product;
        const audience = input.audience || 'target customer';
        const prompt = `Write compelling sales copy for: ${product}\nTarget audience: ${audience}\n\nInclude headline, body (3-5 sentences), call to action. Persuasive, benefit-driven. Return JSON with headline, body, cta, tone.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_investment_pitch(input) {
        const venture = typeof input === 'string' ? input : input.venture;
        const prompt = `Create an investor pitch deck for: ${venture}\n\nInclude: problem, solution, market size, business model, traction, team, ask. PLT-aligned. Return JSON structured per section.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_analyze_competitor(input) {
        const competitor = typeof input === 'string' ? input : input.competitor;
        const market = input.market || '';
        const prompt = `Competitive analysis for: ${competitor}\nMarket: ${market}\n\nAnalyze strengths, weaknesses, market position, pricing, PLT threat level. Return JSON with structured analysis.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_design_product_roadmap(input) {
        const product = typeof input === 'string' ? input : input.product;
        const vision = input.vision || '';
        const prompt = `Design a product roadmap for: ${product}\nVision: ${vision}\n\nInclude phases (MVP, growth, maturity), features per phase, timeline estimates, PLT priorities. Return JSON.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_technical_doc(input) {
        const subject = typeof input === 'string' ? input : input.subject;
        const audience = input.audience || 'developers';
        const prompt = `Write technical documentation for: ${subject}\nAudience: ${audience}\n\nInclude overview, installation/setup, usage examples, API reference, troubleshooting. Return structured JSON.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_api_blueprint(input) {
        const resource = typeof input === 'string' ? input : input.resource;
        const prompt = `Design an API blueprint for: ${resource}\n\nInclude: endpoints, request/response schemas, authentication, error handling, rate limiting. Return JSON with full specification.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_generate_sql_query(input) {
        const description = typeof input === 'string' ? input : input.description;
        const dialect = input.dialect || 'postgresql';
        const schema = input.schema || '';
        const prompt = `Generate a SQL query for: ${description}\nDialect: ${dialect}\nSchema context: ${schema}\n\nReturn JSON with: query, explanation, dialect, indexes_recommended.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_design_database_schema(input) {
        const requirements = typeof input === 'string' ? input : input.requirements;
        const prompt = `Design a database schema for: ${requirements}\n\nInclude tables, relationships, indexes, types. Consider normalization and query patterns. Return JSON with full schema definition.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_unit_test(input) {
        const code = typeof input === 'string' ? input : input.code;
        const framework = input.framework || 'jest';
        const prompt = `Write unit tests for this code using ${framework}:\n${code}\n\nInclude edge cases, error paths, and happy path. Return JSON with: tests, coverage_estimate, framework.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_analyze_security(input) {
        const target = typeof input === 'string' ? input : input.target;
        const prompt = `Perform security analysis on: ${target}\n\nIdentify: vulnerabilities, threat vectors, risk levels, remediation steps. PLT-aligned risk scoring. Return JSON with structured findings.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_deployment_plan(input) {
        const project = typeof input === 'string' ? input : input.project;
        const env = input.environment || 'production';
        const prompt = `Create a deployment plan for: ${project}\nEnvironment: ${env}\n\nInclude: prerequisites, steps, rollback strategy, health checks, monitoring. Return JSON.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_optimize_performance(input) {
        const system = typeof input === 'string' ? input : input.system;
        const currentMetrics = input.metrics || '';
        const prompt = `Analyze and suggest performance optimizations for: ${system}\nCurrent metrics: ${currentMetrics}\n\nIdentify bottlenecks, suggest improvements, estimate impact. Return JSON with categorized suggestions.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_docker_config(input) {
        const app = typeof input === 'string' ? input : input.app;
        const baseImage = input.baseImage || 'node:20-alpine';
        const prompt = `Generate Docker configuration for: ${app}\nBase image: ${baseImage}\n\nInclude Dockerfile with multi-stage build, .dockerignore, docker-compose.yml if applicable. Return JSON with all files.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_ci_cd_pipeline(input) {
        const project = typeof input === 'string' ? input : input.project;
        const platform = input.platform || 'github-actions';
        const prompt = `Design a CI/CD pipeline for: ${project}\nPlatform: ${platform}\n\nInclude: build, test, lint, security scan, deploy stages. Return JSON with pipeline configuration and step definitions.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_design_system_architecture(input) {
        const requirements = typeof input === 'string' ? input : input.requirements;
        const prompt = `Design system architecture for: ${requirements}\n\nInclude: component diagram, data flow, tech stack, scalability considerations, PLT trade-offs. Return JSON with architecture spec.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_api_integration(input) {
        const source = input.source || '';
        const target = typeof input === 'string' ? input : input.target;
        const prompt = `Write API integration code between source and target.\nSource: ${source}\nTarget: ${target}\n\nInclude authentication, request/response handling, error handling, retry logic. Return JSON with code and setup instructions.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_analyze_user_feedback(input) {
        const feedback = typeof input === 'string' ? input : input.feedback;
        const prompt = `Analyze this user feedback for sentiment and insights:\n${feedback}\n\nReturn JSON with: sentiment_score, key_themes, pain_points, positive_mentions, action_items.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_onboarding_flow(input) {
        const product = typeof input === 'string' ? input : input.product;
        const userType = input.userType || 'new user';
        const prompt = `Design an onboarding flow for: ${product}\nUser type: ${userType}\n\nInclude: welcome, feature introduction, first actions, success milestones, PLT value demonstration. Return JSON with step-by-step flow.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_design_pricing_model(input) {
        const product = typeof input === 'string' ? input : input.product;
        const market = input.market || '';
        const costs = input.costs || '';
        const prompt = `Design a pricing model for: ${product}\nMarket context: ${market}\nCost structure: ${costs}\n\nConsider: value-based, tiered, freemium, subscription options. PLT-aligned pricing. Return JSON with model recommendation.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_legal_disclaimer(input) {
        const context = typeof input === 'string' ? input : input.context;
        const jurisdiction = input.jurisdiction || 'United States';
        const prompt = `Generate a legal disclaimer for: ${context}\nJurisdiction: ${jurisdiction}\n\nInclude: limitation of liability, no warranty, accuracy disclaimer, external links. Return JSON with disclaimer text and sections.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_privacy_policy(input) {
        const app = typeof input === 'string' ? input : input.app;
        const dataTypes = input.dataTypes || 'basic user information';
        const prompt = `Generate a privacy policy for: ${app}\nData collected: ${dataTypes}\n\nInclude: data collection, usage, sharing, security, user rights, cookies, contact. Return JSON with policy sections.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_analyze_risk(input) {
        const project = typeof input === 'string' ? input : input.project;
        const context = input.context || '';
        const prompt = `Perform risk assessment for: ${project}\nContext: ${context}\n\nIdentify: risks (technical, market, operational, financial), likelihood, impact, mitigation strategies. Return JSON with risk matrix.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_generate_meeting_agenda(input) {
        const topic = typeof input === 'string' ? input : input.topic;
        const duration = input.duration || 60;
        const attendees = input.attendees || 'team';
        const prompt = `Generate a meeting agenda for: ${topic}\nDuration: ${duration}min\nAttendees: ${attendees}\n\nInclude: objectives, timed agenda items, discussion points, action items. Return JSON with structured agenda.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_brainstorm_notes(input) {
        const topic = typeof input === 'string' ? input : input.topic;
        const constraints = input.constraints || '';
        const prompt = `Facilitate a brainstorming session on: ${topic}\nConstraints: ${constraints}\n\nGenerate: divergent ideas, categories, evaluation criteria, top picks with PLT scoring. Return JSON with structured session.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_project_timeline(input) {
        const project = typeof input === 'string' ? input : input.project;
        const scope = input.scope || '';
        const deadline = input.deadline || '';
        const prompt = `Create a project timeline for: ${project}\nScope: ${scope}\nDeadline: ${deadline}\n\nInclude: phases, milestones, dependencies, critical path, resource allocation. Return JSON with timeline.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_assign_team_roles(input) {
        const project = typeof input === 'string' ? input : input.project;
        const team = input.team || [];
        const prompt = `Assign team roles for project: ${project}\nTeam: ${JSON.stringify(team)}\n\nAnalyze skills, recommend roles (PM, dev, design, QA, ops), identify gaps. Return JSON with role assignments.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_status_report(input) {
        const project = typeof input === 'string' ? input : input.project;
        const updates = input.updates || '';
        const period = input.period || 'weekly';
        const prompt = `Generate a ${period} status report for: ${project}\nUpdates: ${updates}\n\nInclude: accomplishments, blockers, metrics, next steps, PLT health score. Return JSON with structured report.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_analyze_bottleneck(input) {
        const process = typeof input === 'string' ? input : input.process;
        const data = input.data || '';
        const prompt = `Analyze bottlenecks in: ${process}\nData: ${data}\n\nIdentify: constraint points, root causes, impact analysis, optimization recommendations. Return JSON with bottleneck analysis.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_generate_swot_analysis(input) {
        const entity = typeof input === 'string' ? input : input.entity;
        const context = input.context || '';
        const prompt = `Perform SWOT analysis for: ${entity}\nContext: ${context}\n\nAnalyze Strengths, Weaknesses, Opportunities, Threats with PLT overlay. Return JSON with scored SWOT matrix.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_create_budget_plan(input) {
        const project = typeof input === 'string' ? input : input.project;
        const totalBudget = input.totalBudget || '';
        const categories = input.categories || '';
        const prompt = `Create a budget plan for: ${project}\nTotal budget: ${totalBudget}\nCategories: ${categories}\n\nAllocate across categories, include contingency, ROI projections. Return JSON with budget breakdown.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_calculate_roi(input) {
        const investment = typeof input === 'string' ? input : input.investment;
        const costs = input.costs || 0;
        const returns = input.returns || 0;
        const timeframe = input.timeframe || '12 months';
        const roi = ((returns - costs) / costs) * 100;
        const paybackPeriod = costs > 0 ? (costs / (returns / 12)) : 0;
        return {
            skill: 'calculate_roi',
            investment,
            costs,
            returns,
            timeframe,
            roi_percent: Math.round(roi * 100) / 100,
            payback_months: Math.round(paybackPeriod * 100) / 100,
            is_profitable: roi > 0,
            plt_score: { profit: returns > costs ? 0.8 : 0.2, love: 0.1, tax: costs > returns ? 0.8 : 0.2 },
        };
    }

    async _skill_design_experiment(input) {
        const hypothesis = typeof input === 'string' ? input : input.hypothesis;
        const variables = input.variables || '';
        const prompt = `Design an A/B test / experiment for hypothesis: ${hypothesis}\nVariables: ${variables}\n\nInclude: test design, sample size, duration, success metrics, statistical method, PLT impact measurement. Return JSON.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    async _skill_write_case_study(input) {
        const subject = typeof input === 'string' ? input : input.subject;
        const outcome = input.outcome || '';
        const prompt = `Write a case study about: ${subject}\nOutcome: ${outcome}\n\nInclude: background, challenge, solution, results (with metrics), PLT impact, testimonials. Return JSON with structured case study.`;
        const response = await this.brain.think(prompt, this._getContext());
        return this._parseJSONResponse(response);
    }

    // =========================================================================
    // HELPER: Strip markdown
    // =========================================================================
    
    _parseStructuredResponse(response, skillName, meta = {}) {
        return {
            skill: skillName,
            ...meta,
            response: this._stripMarkdown(response),
            timestamp: Date.now(),
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = { SkillsEngine };