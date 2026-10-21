'use strict';

const path = require('path');
const fs = require('fs');

const CATEGORY_MAP = {
    read_file: 'file_io', write_file: 'file_io', append_file: 'file_io', edit_file: 'file_io', search_code: 'file_io', list_files: 'file_io',
    web_fetch: 'network', run_command: 'system', get_mcp_servers: 'mcp',
    diagnose: 'analysis', scribe_witness: 'memory',
    sandbox_execute: 'system', run_safe_command: 'system', sandbox_approvals: 'system', sandbox_stats: 'system',
    system_manage_service: 'system',
    world_get_state: 'world', world_spawn_soul: 'world', world_send_command: 'world',
    world_list_souls: 'world', world_place_building: 'world', world_list_buildings: 'world',
    telegram_send: 'social', unified_project_build: 'build', execute_combo: 'skills',
    cline_build: 'build',
    social_post: 'social', bluesky_post: 'social', mastodon_post: 'social', tumblr_post: 'social',     devto_post: 'social',
    catalog_list: 'system', catalog_describe: 'system',     catalog_find: 'system',
    skill_create: 'skills', skill_list: 'skills',
    reason_deep: 'cognition', score_idea: 'cognition', write_production_code: 'content_gen',
    review_code: 'content_gen', research_topic: 'research', suggest_next_step: 'cognition',
    internal_scorer: 'cognition', detect_pattern: 'analysis', memory_search: 'memory',
    consolidate_session: 'cognition', plt_field_report: 'analysis', generate_email: 'content_gen',
    analyse_sentiment: 'analysis', prioritise_tasks: 'cognition', build_marketing_site: 'content_gen',
    montage_anime: 'content_gen',
    anime_character: 'content_gen',
    plan_anime_video: 'content_gen',
};

const BUILTIN_DESCRIPTIONS = {
    read_file: 'Read any file from the filesystem',
    write_file: 'Write content to a file with write-lock safety',
    append_file: 'Append content to the END of an existing file (use for chunked builds)',
    edit_file: 'Replace an exact old_string with new_string inside a file (surgical edit, must match exactly)',
    search_code: 'Search code for patterns using ripgrep or findstr',
    list_files: 'List files in a directory (up to 50)',
    web_fetch: 'Fetch a URL and return its content (truncated to 5000 chars)',
    run_command: 'Execute a shell command via SecureShellSandbox (with fallback)',
    get_mcp_servers: 'List all registered MCP servers with capabilities',
    diagnose: 'Run dual-process diagnostic engine for self-diagnosis or problem analysis',
    scribe_witness: 'Record an event to SCRIBE memory (port 4000)',
    sandbox_execute: 'Execute JavaScript code in an isolated V8 sandbox (128MB, 2s timeout)',
    run_safe_command: 'Execute a risk-classified shell command with Architect approval',
    system_manage_service: 'Query or restart sibling organs (status all; restart limited to CPL/SCRIBE; PLT pre-flight required)',
    sandbox_approvals: 'List pending approvals in the SecureShellSandbox',
    sandbox_stats: 'Get SecureShellSandbox usage statistics',
    world_get_state: 'Get the current state of the Sanctum 3D world simulation',
    world_spawn_soul: 'Spawn a new soul/agent in the Sanctum world',
    world_send_command: 'Send a custom command to the Sanctum world',
    world_list_souls: 'List all souls/agents in the Sanctum world',
    world_place_building: 'Place a building in the Sanctum world',
    world_list_buildings: 'List all buildings in the Sanctum world',
    telegram_send: 'Send a message via @Profitlovetaxbot Telegram bot',
    unified_project_build: 'Build a complete project snapshot with metadata',
    execute_combo: 'Execute a named combo from the ComboOrchestrator',
    cline_build: 'Delegate a large multi-file build to the Cline CLI agent (reliable file editing, no truncation). Give it ONE clear task string.',
    social_post: 'Post content to social media platforms',
    bluesky_post: 'Post content to Bluesky',
    mastodon_post: 'Post content to Mastodon',
    tumblr_post: 'Post content to Tumblr',
    devto_post: 'Post content to Dev.to',
    catalog_list: 'List all available tools and skills with descriptions, categorized by backend and type',
    catalog_describe: 'Get detailed information about a specific tool or skill by name',
    catalog_find: 'Search for tools and skills relevant to a task description using keyword matching',
    skill_create: 'Create a new skill file with MANIFEST, PLT_AFFINITY, and function stub',
    skill_list: 'List all available skill files in the skills directory',
};

const SKILL_DESCRIPTIONS = {
    reason_deep: 'Multi-step reasoning with trace and alternative perspectives',
    score_idea: 'Score an idea using the PLT framework (Profit + Love - Tax)',
    write_production_code: 'Generate production-ready code with error handling',
    review_code: 'Review code for quality, security, performance',
    research_topic: 'Structured research with findings and implications',
    suggest_next_step: 'Suggest prioritized next actions based on situation',
    internal_scorer: 'Self-reflection on actions and outcomes',
    detect_pattern: 'Detect recurring patterns and anomalies in text/data',
    memory_search: 'Search through memories for relevant information',
    consolidate_session: 'Summarize and consolidate session logs',
    plt_field_report: 'Generate PLT ecosystem state report',
    generate_email: 'Write professional emails with subject and body',
    analyse_sentiment: 'Analyze sentiment score and emotional tone of text',
    prioritise_tasks: 'Sort and prioritize tasks using PLT scoring',
    build_marketing_site: 'Generate a complete single-file dark-theme marketing HTML website',
    generate_book_idea: 'Generate compelling book concepts with chapter outlines',
    build_character: 'Create detailed character profiles with arc and motivation',
    montage_anime: 'Produce anime-style AI videos via OpenMontage pipeline (script, characters, anime image gen, FFmpeg compose)',
    anime_character: 'Create and manage anime character profiles with visual consistency for OpenMontage production',
    plan_anime_video: 'Create a production plan for anime-style video using OpenMontage pipeline',
};

const BACKEND_MAP = {
    read_file: 'builtin', write_file: 'builtin', append_file: 'builtin', edit_file: 'builtin', search_code: 'builtin', list_files: 'builtin',
    web_fetch: 'builtin', run_command: 'builtin', get_mcp_servers: 'builtin',
    diagnose: 'builtin', scribe_witness: 'builtin',
    sandbox_execute: 'builtin', run_safe_command: 'builtin', sandbox_approvals: 'builtin', sandbox_stats: 'builtin',
    system_manage_service: 'builtin',
    world_get_state: 'builtin', world_spawn_soul: 'builtin', world_send_command: 'builtin',
    world_list_souls: 'builtin', world_place_building: 'builtin', world_list_buildings: 'builtin',
    telegram_send: 'builtin', unified_project_build: 'builtin', execute_combo: 'builtin',
    cline_build: 'builtin',
    social_post: 'builtin', bluesky_post: 'builtin', mastodon_post: 'builtin', tumblr_post: 'builtin',     devto_post: 'builtin',
    catalog_list: 'builtin', catalog_describe: 'builtin',     catalog_find: 'builtin',
    skill_create: 'builtin', skill_list: 'builtin',
};

class ToolCatalog {
    constructor(kernel) {
        this.kernel = kernel;
        this._entries = new Map();
        this._initialized = false;
    }

    initialize() {
        if (this._initialized) return;
        this._entries.clear();

        this._scanBuiltinTools();
        this._scanSkillsEngine();
        this._scanChamberSkills();
        this._scanMcpServers();
        this._scanSkillFiles();

        this._initialized = true;
        console.log(`[ToolCatalog] Initialized: ${this._entries.size} tools/skills cataloged`);
    }

    _addEntry(name, entry) {
        if (!entry.category) {
            entry.category = CATEGORY_MAP[name] || 'skills';
        }
        if (!entry.backend) {
            entry.backend = BACKEND_MAP[name] || 'skill';
        }
        this._entries.set(name, { name, ...entry });
    }

    _scanBuiltinTools() {
        const bridge = this._getUtb();
        if (!bridge) return;

        for (const [name, handler] of bridge.toolRegistry) {
            if (typeof name !== 'string') continue;
            this._addEntry(name, {
                description: BUILTIN_DESCRIPTIONS[name] || `Built-in tool: ${name}`,
                backend: 'builtin',
                category: CATEGORY_MAP[name] || 'system',
                handler: handler,
            });
        }
    }

    _scanSkillsEngine() {
        const skills = this._getSkillsEngine();
        if (!skills || typeof skills.listSkills !== 'function') return;

        const skillList = skills.listSkills();
        for (const entry of skillList) {
            if (!entry || !entry.name) continue;
            const name = entry.name;
            this._addEntry(name, {
                description: SKILL_DESCRIPTIONS[name] || entry.description || `Skill: ${name}`,
                backend: 'skill',
                plt_affinity: entry.plt_affinity || { profit: 0.5, love: 0.3, tax: 0.2 },
                weight: entry.weight || 0.75,
            });
        }
    }

    _scanChamberSkills() {
        const registry = this._getChamberRegistry();
        if (!registry) return;

        if (typeof registry.listAllMetadata === 'function') {
            const meta = registry.listAllMetadata();
            for (const [name, metadata] of Object.entries(meta)) {
                this._addEntry(name, {
                    description: metadata.description || `Chamber skill: ${name}`,
                    backend: 'chamber',
                    category: metadata.category || 'skills',
                    registered_at: metadata.registered_at,
                });
            }
        }
    }

    _scanMcpServers() {
        const bridge = this._getUtb();
        if (!bridge) return;

        for (const [name, server] of bridge.mcpServers) {
            this._addEntry(`mcp:${name}`, {
                description: `MCP server: ${name} at ${server.url}. Capabilities: ${(server.capabilities || []).join(', ') || 'all'}`,
                backend: 'mcp',
                category: 'mcp',
                serverUrl: server.url,
                capabilities: server.capabilities || [],
            });
        }
    }

    _scanSkillFiles() {
        const skillsDir = path.join(__dirname, '..', 'skills');
        if (!fs.existsSync(skillsDir)) return;

        const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.js') && f !== 'mega_skills.js');
        for (const file of files) {
            const name = file.replace('.js', '');
            if (this._entries.has(name)) continue;
            try {
                const mod = require(path.join(skillsDir, file));
                const manifest = mod.MANIFEST || {};
                const plt = mod.PLT_AFFINITY || { profit: 0.5, love: 0.3, tax: 0.2 };
                this._addEntry(name, {
                    description: manifest.description || `Skill file: ${name}`,
                    backend: 'skill',
                    category: 'skills',
                    plt_affinity: plt,
                    file: file,
                });
            } catch (e) {
                this._addEntry(name, {
                    description: `Skill file: ${name} (load error: ${e.message})`,
                    backend: 'skill',
                    category: 'skills',
                });
            }
        }
    }

    listAll() {
        if (!this._initialized) this.initialize();
        return Array.from(this._entries.values());
    }

    describe(name) {
        if (!this._initialized) this.initialize();
        const entry = this._entries.get(name);
        if (!entry) return null;

        const result = { ...entry };
        delete result.handler;
        return result;
    }

    findByBackend(backend) {
        if (!this._initialized) this.initialize();
        return Array.from(this._entries.values()).filter(e => e.backend === backend);
    }

    findByCategory(category) {
        if (!this._initialized) this.initialize();
        return Array.from(this._entries.values()).filter(e => e.category === category);
    }

    findForTask(task) {
        if (!this._initialized) this.initialize();
        const query = task.toLowerCase();
        const scored = [];

        for (const entry of this._entries.values()) {
            let score = 0;
            const desc = (entry.description || '').toLowerCase();
            const name = entry.name.toLowerCase();

            if (name.includes(query)) score += 3;
            if (desc.includes(query)) score += 2;

            const queryWords = query.split(/\s+/).filter(w => w.length > 2);
            for (const word of queryWords) {
                if (name.includes(word)) score += 2;
                if (desc.includes(word)) score += 1;
            }

            if (score > 0) {
                scored.push({ entry, score });
            }
        }

        return scored.sort((a, b) => b.score - a.score).map(s => s.entry);
    }

    compileForPrompt(maxTokens = 800) {
        if (!this._initialized) this.initialize();
        const parts = [];
        let estimated = 0;

        const byCategory = {};
        for (const entry of this._entries.values()) {
            const cat = entry.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(entry);
        }

        const categoryNames = {
            file_io: 'File I/O', network: 'Network', social: 'Social', memory: 'Memory',
            system: 'System', world: 'World', cognition: 'Cognition', analysis: 'Analysis',
            content_gen: 'Content Generation', research: 'Research', build: 'Build',
            skills: 'Skills', mcp: 'MCP Servers', governance: 'Governance',
        };

        for (const [cat, entries] of Object.entries(byCategory)) {
            const label = categoryNames[cat] || cat;
            const lines = entries.map(e => {
                const desc = e.description || '';
                const plt = e.plt_affinity;
                const pltStr = plt ? ` [P:${plt.profit} L:${plt.love} T:${plt.tax}]` : '';
                return `  ${e.name} — ${desc}${pltStr}`;
            });

            const section = `${label}:\n${lines.join('\n')}`;
            const tokenEstimate = section.length / 3;
            if (estimated + tokenEstimate > maxTokens) {
                const remaining = entries.length;
                parts.push(`${label}: ${entries.map(e => e.name).join(', ')}`);
                estimated += 20;
                continue;
            }
            parts.push(section);
            estimated += tokenEstimate;
        }

        const total = this._entries.size;
        parts.push(`\nTotal: ${total} tools/skills available. Use by name.`);

        return parts.join('\n\n');
    }

    getStats() {
        if (!this._initialized) this.initialize();
        const byBackend = {};
        const byCategory = {};
        for (const entry of this._entries.values()) {
            byBackend[entry.backend] = (byBackend[entry.backend] || 0) + 1;
            byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
        }
        return {
            total: this._entries.size,
            byBackend,
            byCategory,
        };
    }

    refresh() {
        const oldCount = this._entries?.length || 0;
        this._initialized = false;
        this.initialize();
        const newCount = this._entries?.length || 0;

        // Dark City: manifest new tools as offices in the Tool district
        if (newCount > oldCount && this.kernel?.sanctumClient?.isConnected) {
            try {
                this.kernel.sanctumClient.placeBuilding(`tool_catalog_v${newCount}`, 'office', null, null);
            } catch (_) {}
        }
    }

    _getUtb() {
        if (this.kernel && this.kernel.toolBridge) return this.kernel.toolBridge;
        if (this.kernel && this.kernel.modules && this.kernel.modules.toolBridge) return this.kernel.modules.toolBridge;
        if (this.kernel && this.kernel.fusion && this.kernel.fusion.systems && this.kernel.fusion.systems.toolBridge) return this.kernel.fusion.systems.toolBridge;
        return null;
    }

    _getSkillsEngine() {
        if (this.kernel && this.kernel.skills) return this.kernel.skills;
        if (this.kernel && this.kernel.modules && this.kernel.modules.skills) return this.kernel.modules.skills;
        return null;
    }

    _getChamberRegistry() {
        if (this.kernel && this.kernel.chambers && this.kernel.chambers.skillRegistry) return this.kernel.chambers.skillRegistry;
        return null;
    }
}

module.exports = { ToolCatalog };
