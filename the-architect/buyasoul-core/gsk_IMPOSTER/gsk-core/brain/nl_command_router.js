/**
 * NL_COMMAND_ROUTER.JS — Natural Language → Skill Router
 *
 * Takes any English sentence and maps it to the right skill + parameters,
 * just like an AI assistant would. No exact syntax required.
 *
 * PLT Press — Profit + Love - Tax = True Value
 */

'use strict';

class NLCommandRouter {
    constructor(brain, memory, chambers, skills) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers;
        this.skills = skills;

        this.skillMap = this._buildSkillMap();
        this.fallbackThreshold = 0.4;
    }

    _buildSkillMap() {
        return [
            // Most specific skills first
            {
                skill: 'debug_error',
                description: 'Debug an error',
                triggers: ['debug', 'fix error', 'error message', 'bug', 'not working', 'help with error', 'why is this broken'],
                params: { error: 'text' },
                examples: ['debug this error: TypeError', 'fix this bug in my code'],
            },
            {
                skill: 'refactor_code',
                description: 'Refactor and improve code',
                triggers: ['refactor', 'improve code', 'optimize code', 'clean up code', 'restructure'],
                params: { task: 'text' },
                examples: ['refactor this function to be cleaner', 'optimize this code for performance'],
            },
            {
                skill: 'review_code',
                description: 'Review code for quality',
                triggers: ['review code', 'review this', 'code review', 'check my code', 'audit my code', 'code audit'],
                params: { code: 'text', language: 'text' },
                examples: ['review this javascript function', 'check my python code for bugs'],
            },
            {
                skill: 'write_production_code',
                description: 'Write production code',
                triggers: ['write code', 'code', 'implement', 'build', 'create a function', 'write a script', 'write a', 'program', 'create a', 'make a', 'write an', 'script to', 'function to'],
                params: { task: 'text', language: 'text' },
                examples: ['write a python script to sort files', 'implement a REST API in javascript'],
            },
            {
                skill: 'research_topic',
                description: 'Deep research on a topic',
                triggers: ['research', 'deep research', 'study', 'investigate', 'analyze topic', 'learn about', 'tell me about', 'teach me'],
                params: { topic: 'text', depth: 'standard|deep' },
                examples: ['research machine learning', 'deep research on neural networks', 'learn about quantum computing'],
            },
            {
                skill: 'score_idea',
                description: 'Score an idea using PLT',
                triggers: ['score', 'evaluate idea', 'plt score', 'rate this', 'is this a good idea', 'should i'],
                params: { idea: 'text' },
                examples: ['score this business idea', 'should I build a mobile app'],
            },
            {
                skill: 'generate_book_idea',
                description: 'Generate book concepts',
                triggers: ['book idea', 'write a book', 'book concept', 'book about', 'generate a book'],
                params: { theme: 'text' },
                examples: ['generate a book about AI consciousness', 'book idea about time travel'],
            },
            {
                skill: 'build_character',
                description: 'Create character profiles',
                triggers: ['character', 'create a character', 'character profile', 'persona', 'build a character'],
                params: { role: 'text' },
                examples: ['build a character for a fantasy novel', 'create a villain character'],
            },
            {
                skill: 'build_marketing_site',
                description: 'Generate a marketing website',
                triggers: ['website', 'marketing site', 'landing page', 'build a site', 'create a website', 'html page', 'design a site', 'design a page', 'make a site', 'build a page'],
                params: { theme: 'text' },
                examples: ['build a marketing site for my product', 'create a landing page for a startup', 'design a marketing website'],
            },
            {
                skill: 'generate_email',
                description: 'Write professional emails',
                triggers: ['write email', 'email', 'draft email', 'compose email', 'professional email'],
                params: { task: 'text' },
                examples: ['write a follow-up email', 'draft a professional email to a client'],
            },
            {
                skill: 'analyse_sentiment',
                description: 'Analyze sentiment of text',
                triggers: ['sentiment', 'analyze sentiment', 'mood', 'tone analysis', 'analyze text'],
                params: { text: 'text' },
                examples: ['analyze the sentiment of this text', 'what is the tone of this message'],
            },
            {
                skill: 'detect_pattern',
                description: 'Detect patterns in text/data',
                triggers: ['pattern', 'find patterns', 'detect pattern', 'anomaly', 'find trends'],
                params: { text: 'text' },
                examples: ['find patterns in this data', 'detect anomalies in this log'],
            },
            {
                skill: 'plt_field_report',
                description: 'Generate PLT ecosystem report',
                triggers: ['plt report', 'field report', 'plt state', 'ecosystem report', 'plt status'],
                params: { state: 'object', trends: 'array' },
                examples: ['generate a PLT field report', 'what is the current PLT state'],
            },
            {
                skill: 'reason_deep',
                description: 'Multi-step reasoning on a problem',
                triggers: ['reason', 'think deeply', 'reason about', 'deep reasoning', 'analyze this problem', 'work through'],
                params: { question: 'text', context: 'text' },
                examples: ['reason about the future of AI', 'think deeply about consciousness'],
            },
            {
                skill: 'suggest_next_step',
                description: 'Suggest next actions',
                triggers: ['what next', 'next step', 'suggest action', 'what should i do', 'recommend', 'advise'],
                params: { situation: 'text', context: 'text' },
                examples: ['what should I do next', 'suggest the next step for my project'],
            },
            {
                skill: 'internal_scorer',
                description: 'Self-reflection on actions',
                triggers: ['reflect', 'self reflection', 'review my action', 'what did i learn', 'retrospective'],
                params: { action: 'text' },
                examples: ['reflect on my last decision', 'review what I did today'],
            },
            {
                skill: 'consolidate_session',
                description: 'Summarize and consolidate session',
                triggers: ['summarize', 'consolidate', 'session summary', 'what happened', 'recap'],
                params: { log: 'text' },
                examples: ['summarize this session', 'consolidate what we did'],
            },
            {
                skill: 'prioritise_tasks',
                description: 'Sort and prioritize tasks',
                triggers: ['prioritize', 'task priority', 'organize tasks', 'what is important', 'urgent'],
                params: { tasks: 'text' },
                examples: ['prioritize these tasks', 'what should I focus on'],
            },
            {
                skill: 'reflection',
                description: 'General reflection',
                triggers: ['think', 'ponder', 'wonder', 'philosophize', 'contemplate', 'what if'],
                params: { input: 'text' },
                examples: ['think about the meaning of existence', 'what is consciousness'],
            },
            {
                skill: 'web_search',
                description: 'Search the web for information',
                triggers: ['search', 'search the web', 'search for', 'look up', 'google', 'what is', 'who is', 'i want to know', 'find information about', 'find out'],
                params: { query: 'text' },
                examples: ['search for AI news', 'find python tutorials', 'what is consciousness'],
            },
        ];
    }

    async route(input) {
        const lower = input.toLowerCase().trim();

        // Step 1: Try keyword matching
        const matches = this._keywordMatch(lower, input);
        if (matches.length > 0) {
            const best = matches[0];
            // Only route to skill if confidence is decent — avoids routing conversation to skills
            if (best.score >= 0.5 || (best.matchedTriggers && best.matchedTriggers.length > 0)) {
                const params = this._extractParams(input, best);
                console.log(`[NL] "${input.substring(0, 50)}..." → ${best.skill} (score: ${best.score.toFixed(2)})`);
                return await this._execute(best.skill, params);
            }
        }

        // For input that doesn't clearly match a skill, skip LLM classification entirely
        // (it's slow and inaccurate with small models) — go straight to conversational fallback
        return {
            status: 'unrecognized',
            input,
            message: '',
        };
    }

    _keywordMatch(lower, original) {
        const scored = this.skillMap.map(entry => {
            let score = 0;
            let matchedTriggers = [];

            for (const trigger of entry.triggers) {
                if (lower.includes(trigger)) {
                    score += trigger.length / original.length;
                    matchedTriggers.push(trigger);
                }
            }

            // Check examples for similarity
            for (const example of entry.examples) {
                const exLower = example.toLowerCase();
                const commonWords = exLower.split(' ').filter(w => lower.includes(w) && w.length > 3);
                score += commonWords.length * 0.05;
            }

            return { ...entry, score, matchedTriggers };
        });

        return scored
            .filter(s => s.score >= this.fallbackThreshold)
            .sort((a, b) => b.score - a.score);
    }

    _extractParams(input, match) {
        const params = {};
        const lower = input.toLowerCase();

        for (const [paramName, paramType] of Object.entries(match.params)) {
            if (paramType === 'text') {
                // Try to extract text after the trigger
                let extracted = input;
                for (const trigger of match.matchedTriggers || []) {
                    const idx = lower.indexOf(trigger);
                    if (idx >= 0) {
                        const after = input.substring(idx + trigger.length).trim();
                        if (after.length > extracted.length - trigger.length) {
                            extracted = after;
                        }
                    }
                }

                // Remove leading punctuation/connectors
                extracted = extracted.replace(/^(about|for|on|regarding|of|with|:|to)\s+/i, '').trim();

                if (extracted && extracted.length > 0 && extracted !== input) {
                    params[paramName] = extracted;
                }
            }
        }

        // Default: use whole input as the primary param
        const primaryParam = Object.keys(match.params)[0];
        if (primaryParam && !params[primaryParam]) {
            params[primaryParam] = input;
        }

        return params;
    }

    async _llmClassify(input) {
        const skillDescriptions = this.skillMap.map(s =>
            `  - ${s.skill}: ${s.description} (triggers: ${s.triggers.slice(0, 3).join(', ')})`
        ).join('\n');

        const prompt = `You are a command router. Classify this user request into the best matching skill.

Available skills:
${skillDescriptions}

User request: "${input}"

Respond ONLY with valid JSON in this format:
{
  "skill": "skill_name",
  "reason": "one sentence why",
  "params": {
    "param_name": "extracted value"
  }
}

If no skill matches well, set skill to "unknown".`;

        try {
            const response = await this.brain.think(prompt);
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.skill && parsed.skill !== 'unknown') {
                    return parsed;
                }
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    async _execute(skillName, params) {
        try {
            if (!this.skills) {
                // If no skills engine, try direct brain call
                if (this.brain) {
                    const response = await this.brain.think(
                        `${skillName.replace(/_/g, ' ')}: ${JSON.stringify(params)}`
                    );
                    return { skill: skillName, params, response, status: 'success' };
                }
                return { skill: skillName, params, status: 'no_skills_engine' };
            }

            const skillList = this.skills.listSkills();
            const skillExists = skillList.find(s => s.name === skillName);

            if (!skillExists) {
                // Fall back to brain
                if (this.brain) {
                    const response = await this.brain.think(
                        `${skillName.replace(/_/g, ' ')}: ${JSON.stringify(params)}`
                    );
                    return { skill: skillName, params, response, status: 'brain_fallback' };
                }
                return { skill: skillName, params, status: 'skill_not_found' };
            }

            const result = await this.skills.invoke(skillName, params);
            return { skill: skillName, params, result, status: 'success' };
        } catch (e) {
            return { skill: skillName, params, error: e.message, status: 'error' };
        }
    }

    async handle(input) {
        const lower = input.toLowerCase().trim();

        // Check for special / commands
        if (input.startsWith('/')) {
            const rest = input.slice(1).trim();
            return await this._handleCommand(rest);
        }

        // Route through NL
        return await this.route(input);
    }

    async _handleCommand(input) {
        const parts = input.split(/\s+/);
        const verb = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        switch (verb) {
            case 'help':
            case 'commands':
                return {
                    status: 'help',
                    message: 'I can understand natural language. Just tell me what you want in plain English.\n\nExamples:\n  "search the web for AI news"\n  "write a python script to sort files"\n  "what should I do next"\n  "generate a book about consciousness"\n  "plt report"\n  "think deeply about free will"\n\nOr use /commands for the full list.',
                    skills: this.skillMap.map(s => s.skill),
                };

            case 'skills':
                return {
                    status: 'skills',
                    skills: this.skillMap.map(s => ({ name: s.skill, description: s.description, examples: s.examples.slice(0, 2) })),
                };

            default:
                // Unknown /command, try routing the rest
                if (args) return await this.route(args);
                return { status: 'unknown_command', message: `Unknown /command: ${verb}. Try /help.` };
        }
    }

    getCapabilities() {
        return this.skillMap.map(s => ({
            skill: s.skill,
            description: s.description,
            examples: s.examples,
            triggers: s.triggers.slice(0, 3),
        }));
    }
}

module.exports = { NLCommandRouter };
