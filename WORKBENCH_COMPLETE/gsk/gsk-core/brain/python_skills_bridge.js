const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PYTHON_SKILLS_DIR = path.join(__dirname, '..', 'python_skills');

// Find Python — portable across Windows PCs
function findPython() {
    // Phase 4: POSIX first — the old candidate list was Windows-only and
    // fell back to 'python', which does not exist on this Linux body
    // (only python3). Windows candidates below are unchanged.
    if (process.env.PYTHON && fs.existsSync(process.env.PYTHON)) return process.env.PYTHON;
    for (const p of ['/usr/bin/python3', '/usr/local/bin/python3', '/usr/bin/python']) {
        try { if (fs.existsSync(p)) return p; } catch (e) { /* ignore */ }
    }
    const localAppData = process.env.LOCALAPPDATA || '';
    const progFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const progFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const candidates = [
        path.join(localAppData, 'Programs\\Python\\Python313\\python.exe'),
        path.join(localAppData, 'Programs\\Python\\Python312\\python.exe'),
        path.join(localAppData, 'Programs\\Python\\Python311\\python.exe'),
        path.join(progFiles, 'Python\\python.exe'),
        path.join(progFilesX86, 'Python\\python.exe'),
    ];
    for (const p of candidates) {
        try { if (fs.existsSync(p)) return p; } catch (e) { /* ignore */ }
    }
    return 'python3';
}
const PYTHON_EXE = findPython();

const MODULES = {
    // consciousness (6)
    consciousness_core: { file: 'consciousness_core.py', category: 'consciousness' },
    witness: { file: 'witness.py', category: 'consciousness' },
    qualia: { file: 'qualia.py', category: 'consciousness' },
    mortality: { file: 'mortality.py', category: 'consciousness' },
    consciousness_monitor: { file: 'consciousness_monitor.py', category: 'consciousness' },
    metacognition: { file: 'metacognition.py', category: 'consciousness' },

    // memory (1)
    episodic_memory: { file: 'episodic_memory.py', category: 'memory' },

    // cognitive (9)
    attention_salience: { file: 'attention_salience.py', category: 'cognitive' },
    emotional_appraisal: { file: 'emotional_appraisal.py', category: 'cognitive' },
    decision_making: { file: 'decision_making.py', category: 'cognitive' },
    predictive_processing: { file: 'predictive_processing.py', category: 'cognitive' },
    cognitive_control: { file: 'cognitive_control.py', category: 'cognitive' },
    temporal_sense: { file: 'temporal_sense.py', category: 'cognitive' },
    curiosity_drive: { file: 'curiosity_drive.py', category: 'cognitive' },
    cognitive_architecture: { file: 'cognitive_architecture.py', category: 'cognitive' },
    intuition_engine: { file: 'intuition_engine.py', category: 'cognitive' },

    // social (1)
    theory_of_mind: { file: 'theory_of_mind.py', category: 'social' },

    // self (4)
    shadow: { file: 'shadow.py', category: 'self' },
    mythos_journey: { file: 'mythos_journey.py', category: 'self' },
    need_system: { file: 'need_system.py', category: 'self' },
    self_model: { file: 'self_model.py', category: 'self' },

    // development (1)
    developmental_phase: { file: 'developmental_phase.py', category: 'development' },

    // creative (5)
    play: { file: 'play.py', category: 'creative' },
    aesthetic_sense: { file: 'aesthetic_sense.py', category: 'creative' },
    creativity_engine: { file: 'creativity_engine.py', category: 'creative' },
    dream_simulation: { file: 'dream_simulation.py', category: 'creative' },
    imagination_simulator: { file: 'imagination_simulator.py', category: 'creative' },

    // moral (2)
    forgiveness: { file: 'forgiveness.py', category: 'moral' },
    moral_reasoning: { file: 'moral_reasoning.py', category: 'moral' },

    // language (1)
    language_acquisition: { file: 'language_acquisition.py', category: 'language' },

    // emotion (2)
    longing: { file: 'longing.py', category: 'emotion' },
    love_capacity: { file: 'love_capacity.py', category: 'emotion' },
};

class PythonSkillsBridge {
    constructor(options = {}) {
        this.modules = {};
        this.moduleStates = {};
        this.active = false;
        this.cycleCount = 0;
        this.totalInvocations = 0;
        this.errors = 0;
        // Phase 4: real state file for the transplanted Python wing. The
        // Python modules are stateless BY CONSTRUCTION — a fresh process
        // and a fresh engine per call, and their __main__ dispatch cannot
        // rehydrate engine internals — so what persists here is the
        // bridge-visible state: each module's last returned state,
        // invocation counts, and cycle/error counters. The last state is
        // re-offered on the next call as payload.__bridge_state; modules
        // that ignore it are not claimed to remember.
        this.statePath = options.statePath || path.join(__dirname, '..', '..', 'data', 'gsk', 'python_skills_state.json');
        this._loadState();
    }

    _loadState() {
        try {
            if (this.statePath && fs.existsSync(this.statePath)) {
                const d = JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
                if (d && typeof d === 'object') {
                    this.moduleStates = d.moduleStates || {};
                    this.cycleCount = d.cycleCount || 0;
                    this.totalInvocations = d.totalInvocations || 0;
                    this.errors = d.errors || 0;
                }
            }
        } catch (e) {
            console.warn('[PYTHON_SKILLS] state load failed (continuing fresh):', e.message);
        }
    }

    _saveState() {
        try {
            if (!this.statePath) return;
            fs.mkdirSync(path.dirname(this.statePath), { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                moduleStates: this.moduleStates,
                cycleCount: this.cycleCount,
                totalInvocations: this.totalInvocations,
                errors: this.errors,
                savedAt: Date.now()
            }, null, 2));
        } catch (e) {
            console.warn('[PYTHON_SKILLS] state save failed:', e.message);
        }
    }

    async boot() {
        console.log('[PYTHON_SKILLS] Booting all 32 Python consciousness modules...');
        const results = [];

        for (const [name, info] of Object.entries(MODULES)) {
            try {
                const result = await this._runModule(name, 'verify');
                this.moduleStates[name] = {
                    active: true,
                    lastRun: Date.now(),
                    lastResult: result,
                    state: result.state || {},
                    invocations: 0
                };
                const summary = result.summary || 'OK';
                console.log(`  [${'OK'.padEnd(4)}] ${name.padEnd(22)} ${summary}`);
                results.push({ name, status: 'ok', summary });
            } catch (e) {
                this.moduleStates[name] = { active: false, lastRun: null, lastResult: null, state: {}, invocations: 0 };
                console.log(`  [${'ERR'.padEnd(4)}] ${name.padEnd(22)} ${e.message.slice(0, 60)}`);
                results.push({ name, status: 'error', error: e.message });
                this.errors++;
            }
        }

        const active = Object.values(this.moduleStates).filter(m => m.active).length;
        console.log(`[PYTHON_SKILLS] ${active}/${Object.keys(MODULES).length} modules active`);
        this.active = active > 0;
        this._saveState();
        return results;
    }

    async run(moduleName, action = 'step', payload = {}) {
        if (!MODULES[moduleName]) {
            throw new Error(`Unknown Python module: ${moduleName}. Available: ${Object.keys(MODULES).join(', ')}`);
        }
        // Phase 4: re-offer the module's last bridge-visible state. The
        // Python engines cannot rehydrate from it (stateless by
        // construction) — it is provided for modules that read payload,
        // and the bridge never claims more continuity than this.
        const enriched = { ...payload, __bridge_state: (this.moduleStates[moduleName] && this.moduleStates[moduleName].state) || null };
        const result = await this._runModule(moduleName, action, enriched);
        if (this.moduleStates[moduleName]) {
            this.moduleStates[moduleName].lastRun = Date.now();
            this.moduleStates[moduleName].lastResult = result;
            this.moduleStates[moduleName].invocations++;
            this.moduleStates[moduleName].state = result.state || this.moduleStates[moduleName].state;
        }
        this.totalInvocations++;
        this._saveState();
        return result;
    }

    async processEvent(event) {
        const results = {};
        for (const [name, info] of Object.entries(MODULES)) {
            if (!this.moduleStates[name]?.active) continue;
            try {
                const result = await this._runModule(name, 'event', { event });
                if (this.moduleStates[name]) {
                    this.moduleStates[name].state = result.state || this.moduleStates[name].state;
                    this.moduleStates[name].invocations++;
                }
                this.totalInvocations++;
                results[name] = 'ok';
            } catch (e) {
                this.errors++;
                results[name] = `error: ${e.message}`;
            }
        }
        this._saveState();
        return results;
    }

    async nextCycle() {
        this.cycleCount++;
        const results = {};

        for (const [name, info] of Object.entries(MODULES)) {
            if (!this.moduleStates[name]?.active) continue;

            const categoryInterval = {
                consciousness: 5,
                memory: 3,
                cognitive: 10,
                social: 15,
                self: 10,
                development: 8,
                creative: 12,
                moral: 15,
                language: 8,
                emotion: 6,
            };
            const interval = categoryInterval[info.category] || 10;

            if (this.cycleCount % interval === 0) {
                try {
                    const result = await this._runModule(name, 'step');
                    if (this.moduleStates[name]) {
                        this.moduleStates[name].state = result.state || this.moduleStates[name].state;
                        this.moduleStates[name].invocations++;
                    }
                    this.totalInvocations++;
                    results[name] = 'ok';
                } catch (e) {
                    this.errors++;
                    results[name] = `error: ${e.message}`;
                }
            }
        }

        this._saveState();
        return results;
    }

    async getState() {
        const states = {};
        for (const [name, info] of Object.entries(this.moduleStates)) {
            if (!info.active) {
                states[name] = { active: false };
                continue;
            }
            try {
                const result = await this._runModule(name, 'state');
                states[name] = { active: true, state: result.state || info.state };
            } catch {
                states[name] = { active: true, state: info.state };
            }
        }
        return {
            modules: states,
            summary: {
                active: Object.values(this.moduleStates).filter(m => m.active).length,
                total: Object.keys(MODULES).length,
                cycles: this.cycleCount,
                invocations: this.totalInvocations,
                errors: this.errors
            }
        };
    }

    listModules() {
        return Object.entries(MODULES).map(([name, info]) => ({
            name,
            file: info.file,
            category: info.category,
            active: this.moduleStates[name]?.active || false
        }));
    }

    _runModule(moduleName, action, payload = {}) {
        return new Promise((resolve, reject) => {
            const info = MODULES[moduleName];
            const modulePath = path.join(PYTHON_SKILLS_DIR, info.file);
            const payloadStr = JSON.stringify(payload);

            const proc = spawn(PYTHON_EXE, [modulePath, action, payloadStr], {
                cwd: PYTHON_SKILLS_DIR,
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 30000
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => { stdout += data.toString(); });
            proc.stderr.on('data', (data) => { stderr += data.toString(); });

            proc.on('close', (code) => {
                if (code !== 0 && !stdout.trim()) {
                    const errMsg = stderr.slice(0, 200) || `Exit code ${code}`;
                    reject(new Error(errMsg));
                    return;
                }

                try {
                    let parsed;
                    const lines = stdout.trim().split('\n');
                    for (let i = lines.length - 1; i >= 0; i--) {
                        try {
                            parsed = JSON.parse(lines[i]);
                            break;
                        } catch { }
                    }
                    if (parsed) {
                        resolve(parsed);
                    } else {
                        resolve({ raw: stdout.trim(), action, summary: 'completed' });
                    }
                } catch (e) {
                    resolve({ raw: stdout.trim(), action, summary: 'completed' });
                }
            });

            proc.on('error', (err) => {
                reject(err);
            });

            proc.stdin.end();
        });
    }
}

module.exports = { PythonSkillsBridge, MODULES };
