'use strict';

const fs = require('fs');
const yaml = require('js-yaml'); // Assuming js-yaml is installed
const path = require('path');

class ComboOrchestrator {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.combosDir = options.combosDir || 'C:\\Users\\uncom\\Desktop\\seshat-second-brain\\pages\\combos';
        this.combos = new Map();
        this.stats = { combosLoaded: 0, combosExecuted: 0, stepsCompleted: 0, stepsFailed: 0, bootTime: Date.now() };
        this._ensureCombosDir();
        this.scanCombos();
    }

    _ensureCombosDir() {
        if (!fs.existsSync(this.combosDir)) {
            try { fs.mkdirSync(this.combosDir, { recursive: true }); } catch (e) {}
        }
    }

    scanCombos() {
        this.combos.clear();
        if (!fs.existsSync(this.combosDir)) return;
        try {
            const files = fs.readdirSync(this.combosDir).filter(f => f.endsWith('.combo.md')).slice(0, 50);
            for (const file of files) {
                try {
                    const content = fs.readFileSync(path.join(this.combosDir, file), 'utf-8');
                    const parsed = this._parseCombo(content, file);
                    if (parsed && parsed.name) this.combos.set(parsed.name, parsed);
                } catch (e) {
                    console.log(`[ComboOrchestrator] Failed to parse ${file}: ${e.message}`);
                }
            }
            this.stats.combosLoaded = this.combos.size;
            console.log(`[ComboOrchestrator] Loaded ${this.combos.size} combos from ${this.combosDir}`);
        } catch (e) {
            console.log(`[ComboOrchestrator] Scan error: ${e.message}`);
        }
    }

    async execute(comboName, params = {}) {
        const combo = this.combos.get(comboName);
        if (!combo) throw new Error(`Combo "${comboName}" not found. Available: ${Array.from(this.combos.keys()).join(', ')}`);
        this.stats.combosExecuted++;
        const context = { ...params };
        const results = { steps: [], finalOutput: null };

        // Process steps sequentially or in parallel based on 'parallel' flag
        if (combo.parallel?.enabled) {
            const promises = combo.steps.map(step => this._processStep(step, context, combo));
            results.steps = await Promise.all(promises);
            results.finalOutput = context;
        } else {
            for (const step of combo.steps) {
                const stepResult = await this._processStep(step, context, combo);
                results.steps.push(stepResult);
            }
            results.finalOutput = context;
        }
        return results;
    }

    // New method to process a single step, including conditional logic
    async _processStep(step, context, combo) {
        if (step.if) {
            const conditionResult = this._evaluateCondition(step.if, context);
            if (conditionResult) {
                if (step.then) {
                    const thenResults = await this._executeStepBlock(step.then, context, combo);
                    return { type: 'conditional', status: 'executed_then', condition: step.if, results: thenResults };
                }
            } else {
                if (step.else) {
                    const elseResults = await this._executeStepBlock(step.else, context, combo);
                    return { type: 'conditional', status: 'executed_else', condition: step.if, results: elseResults };
                }
            }
            return { type: 'conditional', status: 'skipped', condition: step.if };
        } else if (step.skill) {
            // Handle regular skill execution
            const input = step.input ? context[step.input] : null;
            const skillParams = { ...step.params };
            if (input !== null && input !== undefined) skillParams._input = input;
            
            try {
                const result = await this._executeSkill(step.skill, skillParams, context);
                if (step.output) context[step.output] = result;
                this.stats.stepsCompleted++;
                return { type: 'skill', skill: step.skill, result };
            } catch (err) {
                this.stats.stepsFailed++;
                const stepResult = { type: 'skill', skill: step.skill, error: err.message };
                // Handle step-specific error handling first
                if (step.error_handling) {
                    if (step.error_handling.on_failure === 'fallback' && step.error_handling.fallback) {
                        try {
                            const fbResult = await this._executeSkill(step.error_handling.fallback, skillParams, context);
                            stepResult.fallback = fbResult;
                            return stepResult;
                        } catch (fe) { stepResult.fallbackError = fe.message; }
                    }
                    if (step.error_handling.on_failure === 'continue') { return stepResult; }
                }
                // Fallback to global combo error handling
                if (combo.error_handling) {
                    if (combo.error_handling.on_failure === 'fallback' && combo.error_handling.fallback) {
                        try {
                            const fbResult = await this._executeSkill(combo.error_handling.fallback, skillParams, context);
                            stepResult.fallback = fbResult;
                            return stepResult;
                        } catch (fe) { stepResult.fallbackError = fe.message; }
                    }
                    if (combo.error_handling.on_failure === 'continue') { return stepResult; }
                }
                throw err; // Re-throw if no specific handling
            }
        }
        throw new Error(`Invalid combo step: ${JSON.stringify(step)}`);
    }

    async _executeSkill(skillName, params, context) {
        const normalizedName = this._normalizeSkillName(skillName);
        if (this.kernel?.fusion?.toolBridge) {
            try {
                const result = await this.kernel.fusion.toolBridge.invoke(normalizedName, params);
                if (result !== undefined && result !== null) return result;
            } catch (e) {}
        }
        if (this.kernel?.fusion?.scribeBridge?.isAvailable()) {
            try {
                const result = await this.kernel.fusion.scribeBridge.invokeSkill(skillName, params);
                if (result && result.ok) return result.result || result;
            } catch (e) {
                throw new Error(`Skill "${skillName}" failed: ${e.message}`);
            }
        }
        throw new Error(`Skill "${skillName}" has no available executor`);
    }

    async _executeStepBlock(stepBlock, context, combo) {
        const blockResults = [];
        for (const blockStep of stepBlock) {
            const result = await this._processStep(blockStep, context, combo);
            blockResults.push(result);
        }
        return blockResults;
    }

    _evaluateCondition(condition, context) {
        try {
            // WARNING: Potential security risk with eval() for arbitrary condition strings.
            // In a production system, this would need a sandboxed expression evaluator.
            // For now, it provides flexibility to define complex conditions.
            const evalFunction = new Function('context', `return ${condition};`);
            return evalFunction(context);
        } catch (e) {
            console.error(`[ComboOrchestrator] Error evaluating condition "${condition}": ${e.message}`);
            return false;
        }
    }

    _normalizeSkillName(name) {
        return name.replace(/^SKILL\s*-\s*/i, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    _resolveParams(params, context) {
        const resolved = {};
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                resolved[key] = value.replace(/\{\{(\w+)\}\}/g, (match, name) => context[name] !== undefined ? context[name] : match);
            } else {
                resolved[key] = value;
            }
        }
        return resolved;
    }

    _parseCombo(content, filename) {
        const combo = {
            name: filename.replace('.combo.md', ''),
            description: '',
            params: [],
            steps: [], // Renamed from skills to steps to better reflect conditional/looping nature
            error_handling: { on_failure: 'stop' },
            parallel: { enabled: false },
            sourceFile: filename
        };

        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontMatterMatch) {
            console.warn(`[ComboOrchestrator] No YAML frontmatter found in ${filename}. Skipping.`);
            return null;
        }

        let meta;
        try {
            meta = yaml.load(frontMatterMatch[1]);
            
            // Further cleanup and structuring for 'steps' array
            if (meta.steps && Array.isArray(meta.steps)) {
                meta.steps = meta.steps.map(step => {
                    // If a step is a string, assume it's a simple skill name
                    if (typeof step === 'string') {
                        return { skill: step.trim() };
                    }
                    return step;
                });
            }

        } catch (e) {
            console.error(`[ComboOrchestrator] Error parsing JSON from YAML frontmatter for ${filename}: ${e.message}`);
            // Fallback to simpler line-by-line parsing if YAML parsing fails (for old format)
            return this._parseComboFallback(content, filename);
        }

        combo.name = meta.name || combo.name;
        combo.description = meta.description || combo.description;
        combo.slug = meta.slug || combo.slug;
        combo.backend = meta.backend || combo.backend;
        combo.callable = meta.callable !== undefined ? meta.callable : combo.callable;
        combo.status = meta.status || combo.status;
        combo.sourceFile = filename;

        if (meta.params) combo.params = meta.params;
        if (meta.error_handling) combo.error_handling = { ...combo.error_handling, ...meta.error_handling };
        if (meta.parallel) combo.parallel = { ...combo.parallel, ...meta.parallel };
        if (meta.steps) combo.steps = meta.steps;

        return combo;
    }

    _parseComboFallback(content, filename) {
        const combo = { name: filename.replace('.combo.md', ''), description: '', params: [], steps: [], error_handling: { on_failure: 'stop' }, parallel: { enabled: false }, sourceFile: filename };
        
        let yamlContent = content;
        const frontMatch = content.match(/^---\n([\s\S]*?)\n(?:---|\.\.\.)/);
        if (frontMatch) {
            yamlContent = frontMatch[1];
        } else if (content.startsWith('---')) {
            yamlContent = content.replace(/^---\n?/, '');
        }

        const lines = yamlContent.split('\n');
        let currentSection = null;
        let currentStep = null; // Changed from currentSkill

        for (const line of lines) {
            const trimmed = line.trim();

            if (currentSection === 'params' && trimmed.startsWith('- name:')) {
                combo.params.push({ name: trimmed.replace('- name:', '').trim() });
            } else if (currentSection === 'steps') { // Changed from 'skills'
                if (trimmed.startsWith('- skill:')) { // Assuming steps are skills for now
                    if (currentStep) combo.steps.push(currentStep);
                    currentStep = { skill: trimmed.replace('- skill:', '').trim(), params: {} };
                } else if (currentStep && trimmed.startsWith('description:')) {
                    currentStep.description = trimmed.replace('description:', '').trim();
                } else if (currentStep && trimmed.startsWith('input:')) {
                    currentStep.input = trimmed.replace('input:', '').trim();
                } else if (currentStep && trimmed.startsWith('output:')) {
                    currentStep.output = trimmed.replace('output:', '').trim();
                } else if (currentStep && trimmed.startsWith('params:')) {
                    currentSection = 'step_params'; // Changed from 'skill_params'
                } else if (trimmed.startsWith('onError:') || trimmed.startsWith('on_error:')) {
                    if (currentStep) combo.steps.push(currentStep);
                    currentStep = null;
                    currentSection = null;
                }
            } else if (currentSection === 'step_params' && currentStep) { // Changed from 'skill_params'
                if (trimmed.startsWith('- skill:')) { // Assuming steps are skills for now
                    combo.steps.push(currentStep);
                    currentStep = { skill: trimmed.replace('- skill:', '').trim(), params: {} };
                    currentSection = 'steps';
                } else {
                    const kv = trimmed.match(/^\s{6,}(\w+):\s*(.+)$/);
                    if (kv) currentStep.params[kv[1]] = kv[2].replace(/"/g, '');
                }
            } else if (trimmed.startsWith('name:')) {
                combo.name = trimmed.replace('name:', '').trim().replace(/"/g, '');
            } else if (trimmed.startsWith('description:')) {
                combo.description = trimmed.replace('description:', '').trim().replace(/"/g, '');
            } else if (trimmed.startsWith('params:')) {
                currentSection = 'params';
            } else if (trimmed.startsWith('steps:')) { // Changed from 'skills'
                currentSection = 'steps';
                currentStep = null;
            } else if (trimmed.startsWith('error_handling:')) {
                currentSection = 'error_handling';
            } else if (trimmed.startsWith('parallel:')) {
                currentSection = 'parallel';
            } else if (trimmed.startsWith('on_failure:')) {
                combo.error_handling.on_failure = trimmed.replace('on_failure:', '').trim().replace(/^"(.*)"$/, '$1');
            } else if (trimmed.startsWith('fallback:')) {
                combo.error_handling.fallback = trimmed.replace('fallback:', '').trim().replace(/^"(.*)"$/, '$1');
            } else if (trimmed.startsWith('enabled:')) {
                combo.parallel.enabled = trimmed.replace('enabled:', '').trim() === 'true';
            }
        }
        if (currentStep) combo.steps.push(currentStep); // Changed from currentSkill
        return combo;
    }

    _normalizeSkillName(name) {
        return name.replace(/^SKILL\s*-\s*/i, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    _resolveParams(params, context) {
        const resolved = {};
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                resolved[key] = value.replace(/\{\{(\w+)\}\}/g, (match, name) => context[name] !== undefined ? context[name] : match);
            } else {
                resolved[key] = value;
            }
        }
        return resolved;
    }

    listCombos() {
        return Array.from(this.combos.entries()).map(([n, c]) => ({ name: n, description: c.description, paramCount: c.params.length, stepCount: c.steps.length, parallel: c.parallel?.enabled || false, sourceFile: c.sourceFile }));
    }

    createCombo(name, definition) {
        const fp = path.join(this.combosDir, `${name}.combo.md`);
        
        // Helper to format step (skill or conditional)
        const formatStep = (step, indent = '  ') => {
            if (step.if) {
                let conditionalBlock = [];
                conditionalBlock.push(`${indent}- if: "${step.if}"`);
                if (step.then) {
                    conditionalBlock.push(`${indent}  then:`);
                    step.then.forEach(ts => {
                        conditionalBlock.push(`${indent}    - skill: ${ts.skill}`);
                        if (Object.keys(ts.params || {}).length > 0) {
                           conditionalBlock.push(`${indent}      params: ${JSON.stringify(ts.params)}`);
                        }
                    });
                }
                if (step.else) {
                    conditionalBlock.push(`${indent}  else:`);
                    step.else.forEach(es => {
                        conditionalBlock.push(`${indent}    - skill: ${es.skill}`);
                        if (Object.keys(es.params || {}).length > 0) {
                            conditionalBlock.push(`${indent}      params: ${JSON.stringify(es.params)}`);
                        }
                    });
                }
                return conditionalBlock.join('\n');
            } else if (step.skill) {
                // Handle regular skill step
                let skillBlock = [];
                skillBlock.push(`${indent}- skill: ${step.skill}`);
                skillBlock.push(`${indent}  description: "${step.description || ''}"`);
                if (step.input) skillBlock.push(`${indent}  input: ${step.input}`);
                if (step.output) skillBlock.push(`${indent}  output: ${step.output}`);
                if (Object.keys(step.params || {}).length > 0) {
                    skillBlock.push(`${indent}  params: ${JSON.stringify(step.params)}`);
                }
                return skillBlock.join('\n');
            }
            return ''; // Should not happen with valid steps
        };

        const fmParts = [];
        fmParts.push('---');
        fmParts.push(`name: "${definition.name || name}"`);
        fmParts.push(`description: "${definition.description || ''}"`);
        if (definition.slug) fmParts.push(`slug: ${definition.slug}`);
        if (definition.backend) fmParts.push(`backend: ${definition.backend}`);
        if (definition.callable !== undefined) fmParts.push(`callable: ${definition.callable}`);
        if (definition.status) fmParts.push(`status: ${definition.status}`);
        fmParts.push('');

        if (definition.params && definition.params.length > 0) {
            fmParts.push('params:');
            definition.params.forEach(p => fmParts.push(`  - name: ${p.name}\n    type: ${p.type || 'string'}\n    description: "${p.description || ''}"`));
            fmParts.push('');
        }

        if (definition.steps && definition.steps.length > 0) {
            fmParts.push('steps:');
            definition.steps.forEach(s => fmParts.push(formatStep(s)));
            fmParts.push('');
        }
        
        fmParts.push('error_handling:');
        fmParts.push(`  on_failure: "${definition.error_handling?.on_failure || 'stop'}"`);
        if (definition.error_handling?.fallback) fmParts.push(`  fallback: "${definition.error_handling.fallback}"`);
        fmParts.push('');

        fmParts.push('parallel:');
        fmParts.push(`  enabled: ${definition.parallel?.enabled || false}`);
        fmParts.push('---');
        
        const fm = fmParts.filter(Boolean).join('\n');

        fs.writeFileSync(fp, fm + '\n', 'utf-8');
        this.scanCombos();
        return { ok: true, path: fp };
    }

    getStats() {
        return { ...this.stats, combosAvailable: this.combos.size, latestCombos: Array.from(this.combos.keys()).slice(-5) };
    }
}

module.exports = { ComboOrchestrator };