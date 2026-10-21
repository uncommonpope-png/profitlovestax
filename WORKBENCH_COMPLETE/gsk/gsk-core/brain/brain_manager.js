'use strict';

/**
 * BRAIN MANAGER — Isolated agent instances per task type
 *
 * Pattern from Claude Code / Hermes: separate brain instances for user chat
 * vs background tasks so they never contend for the same lock.
 *
 * - USER BRAIN (THE BRAIN): dedicated to chat + task execution. Always responsive.
 *   Routed to its own router/model list (e.g. OmniRoute top-10 confirmed models).
 * - BACKGROUND BRAIN (THE HEART): perpetual consciousness, curiosity, journaling.
 *   Routed to its own router (e.g. NVIDIA NIM cloud) so a timeout there never
 *   blocks chat, and it never contends for the Brain's models.
 *
 * Each gets independent _thinkInProgress locks, failure counters, cooldowns,
 * AND its own routerUrl / apiKey / model / modelFallbacks.
 */

const { Brain } = require('./mega_brain.js');

class BrainManager {
    constructor(options = {}) {
        const userCfg = options.user || {};
        const backgroundCfg = options.background || {};

        this.userBrain = new Brain({ ...options, ...userCfg });
        this.backgroundBrain = new Brain({ ...options, ...backgroundCfg });

        // Native function calling: give the Brain a real tools array so it emits
        // structured tool_calls instead of hand-rolled inline JSON. Defaults to
        // GSK's core file/system tools; can be overridden per instance.
        const defaultTools = options.nativeTools || BrainManager.defaultNativeTools();
        this.userBrain.nativeTools = defaultTools;
        this.backgroundBrain.nativeTools = backgroundCfg.nativeTools || options.nativeTools || null;

        // Background brain (Heart): deeper reasoning (SESHAT Directive 014) — generous
        // timeout, calmer cooldown, bounded tokens so one autonomous thought can never
        // camp both model slots on a single-router CPU.
        this.backgroundBrain._brainCooldownMs = backgroundCfg.cooldownMs || 30000;
        this.backgroundBrain.max_tokens = Math.min(backgroundCfg.maxTokens || 1536, 2048);
        this.backgroundBrain.temperature = backgroundCfg.temperature || 0.9;

        // User brain (Brain): full tokens, slightly lower temperature for coherence.
        // Clamped to the 2048 ceiling and the Continue loop disabled: a user chat
        // must return fast and bounded, never silently become 6x the cap.
        this.userBrain.max_tokens = Math.min(options.max_tokens || userCfg.maxTokens || 1024, 2048);
        this.userBrain.temperature = options.temperature || userCfg.temperature || 0.95;
        this.userBrain._allowContinue = false;

        this._sharedFusion = null;
    }

    /**
     * defaultNativeTools — OpenAI-style tool schemas for GSK's core file/system
     * tools. Injected into the request payload so the model emits structured
     * tool_calls natively (battle-tested format) instead of fragile inline JSON.
     */
    static defaultNativeTools() {
        return [
            {
                type: 'function',
                function: {
                    name: 'write_file',
                    description: 'Write or overwrite a file with the given content. For files over ~6KB, scaffold first then use append_file to add content in chunks.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Full absolute file path' },
                            content: { type: 'string', description: 'Complete file content to write' },
                        },
                        required: ['path', 'content'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'append_file',
                    description: 'Append content to the end of an existing file. Use for building large files incrementally.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Full absolute file path' },
                            content: { type: 'string', description: 'Content to append' },
                        },
                        required: ['path', 'content'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'edit_file',
                    description: 'Replace an exact string in a file with a new string (targeted patch, keeps file valid).',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Full absolute file path' },
                            old_string: { type: 'string', description: 'Exact text to find' },
                            new_string: { type: 'string', description: 'Replacement text' },
                        },
                        required: ['path', 'old_string', 'new_string'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'read_file',
                    description: 'Read the contents of a file. Use to verify a write succeeded.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Full absolute file path' },
                        },
                        required: ['path'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'verify_build',
                    description: 'ARCHITECT GATE. Verify a file you just wrote/edited before declaring done. Runs syntax check (node --check on inline JS), structural balance, contract check (baseUrl / required strings), and JS-to-HTML id consistency. Call this after every write_file/edit_file that produces code. Pass a contract object with baseUrl and requiredStrings describing the real environment (e.g. { baseUrl: "http://127.0.0.1:3001", requiredStrings: ["x-api-key"] }).',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Full absolute file path of the build to verify' },
                            contract: {
                                type: 'object',
                                description: 'Optional contract to verify against: { baseUrl, requiredStrings: [] }',
                                properties: {
                                    baseUrl: { type: 'string', description: 'The one true base URL the build should reference' },
                                    requiredStrings: { type: 'array', items: { type: 'string' }, description: 'Strings that MUST appear (endpoints, auth headers)' },
                                },
                            },
                        },
                        required: ['path'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'list_files',
                    description: 'List files and directories in a folder.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Full absolute directory path' },
                        },
                        required: ['path'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_code',
                    description: 'Search file contents for a text pattern within a directory.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Directory to search' },
                            query: { type: 'string', description: 'Text or regex pattern to find' },
                        },
                        required: ['path', 'query'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'shell_exec',
                    description: 'Run a shell command. Verify output before continuing.',
                    parameters: {
                        type: 'object',
                        properties: {
                            command: { type: 'string', description: 'Shell command to run' },
                        },
                        required: ['command'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'web_search',
                    description: 'Search the web for information, sprite packs, documentation, or reference code. Returns results with titles, URLs, and snippets.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Search query' },
                            max_results: { type: 'number', description: 'Max results (default 5)' },
                        },
                        required: ['query'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'web_fetch',
                    description: 'Fetch a web page by URL. Returns the raw content (first 5000 chars).',
                    parameters: {
                        type: 'object',
                        properties: {
                            url: { type: 'string', description: 'Full URL to fetch' },
                        },
                        required: ['url'],
                    },
                },
            },
        ];
    }

    /**
     * Wire both brains to the same fusion, memory, and prompt compiler.
     */
    setFusion(fusion) {
        this._sharedFusion = fusion;
        this.userBrain.setFusion(fusion);
        this.backgroundBrain.setFusion(fusion);
    }

    setSystemPromptCompiler(compiler) {
        this.userBrain.setSystemPromptCompiler(compiler);
        this.backgroundBrain.setSystemPromptCompiler(compiler);
    }

    setBibleConsultant(consultant) {
        this.userBrain.setBibleConsultant(consultant);
        this.backgroundBrain.setBibleConsultant(consultant);
    }

    /**
     * User chat — always goes to userBrain. Priority is always true.
     * This brain is NEVER blocked by background thoughts.
     */
    async thinkForUser(prompt, soul_context = '') {
        return this.userBrain.think(prompt, soul_context, true);
    }

    /**
     * Background thought — goes to backgroundBrain. Priority is always false.
     * If background brain is in cooldown, returns null immediately.
     * Does NOT affect user brain state.
     */
    async thinkForBackground(prompt, soul_context = '') {
        return this.backgroundBrain.think(prompt, soul_context, false);
    }

    /**
     * Generic think — delegates based on priority flag.
     * Backward compatible with code that calls brain.think(prompt, ctx, priority).
     */
    async think(prompt, soul_context = '', priority = false) {
        if (priority) {
            return this.thinkForUser(prompt, soul_context);
        }
        return this.thinkForBackground(prompt, soul_context);
    }

    /**
     * Compatibility: expose userBrain properties that callers expect.
     */
    get _thinkInProgress() { return this.userBrain._thinkInProgress; }
    set _thinkInProgress(v) { this.userBrain._thinkInProgress = v; }
    get _brainFailures() { return this.userBrain._brainFailures; }
    set _brainFailures(v) { this.userBrain._brainFailures = v; }
    get _brainCooldownUntil() { return this.userBrain._brainCooldownUntil; }
    set _brainCooldownUntil(v) { this.userBrain._brainCooldownUntil = v; }
    get _lastThinkUsedFallback() { return this.userBrain._lastThinkUsedFallback; }
    set _lastThinkUsedFallback(v) { this.userBrain._lastThinkUsedFallback = v; }
    get _modelHealth() { return this.userBrain._modelHealth; }
    get _lastGoodModel() { return this.userBrain._lastGoodModel; }

    /**
     * Availability gate — chatWithSoul/mcp gates check `brain._available`.
     * True when either brain has completed a generation successfully.
     */
    get _available() { return !!(this.userBrain?._available || this.backgroundBrain?._available); }

    /**
     * Summary of both brains for diagnostics.
     */
    summary() {
        return {
            user: {
                thinkInProgress: this.userBrain._thinkInProgress,
                failures: this.userBrain._brainFailures,
                cooldown: this.userBrain._brainCooldownUntil > Date.now(),
            },
            background: {
                thinkInProgress: this.backgroundBrain._thinkInProgress,
                failures: this.backgroundBrain._brainFailures,
                cooldown: this.backgroundBrain._brainCooldownUntil > Date.now(),
            },
        };
    }

    /**
     * Full routing + health snapshot for system.brain_status.
     */
    routingInfo() {
        return {
            brain: this.userBrain.routingInfo(),
            heart: this.backgroundBrain.routingInfo(),
        };
    }
}

module.exports = { BrainManager };
