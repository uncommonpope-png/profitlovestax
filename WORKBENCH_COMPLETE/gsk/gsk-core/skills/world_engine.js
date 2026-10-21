module.exports.MANIFEST = {
    name: 'world_engine',
    description: 'Skill: world_engine',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

/**
 * WORLD ENGINE — Game Engine Skills for Soulverse
 *
 * Implements Sage's game engine-derived skills as real GSK modules.
 * Skills:
 *   modular_scene_composition     — Godot-inspired scene/node assembly
 *   multi_language_scripting      — Run scripts in Python/JS/Shell
 *   godot_platform_access         — Godot Engine project management
 *   3d_asset_generation           — Generate 3D asset descriptions
 *   spatial_world_interaction     — Place/interact with objects in 3D space
 */

class WorldEngine {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel?.brain || null;
        this.behaviorAttacher = kernel?.fusion?.behaviorAttacher || null;
        this.scenes = new Map();
        this.godotProjects = new Map();
    }

    _hasBrain() { return this.brain && typeof this.brain.think === 'function'; }

    async _think(prompt) {
        if (!this._hasBrain()) return { ok: false, error: 'Brain not available' };
        try {
            const r = await this.brain.think(prompt);
            return { ok: true, result: typeof r === 'string' ? r : (r?.result || r?.response || JSON.stringify(r)) };
        } catch (e) { return { ok: false, error: e.message }; }
    }

    _getSanctum() { return this.kernel?.sanctumClient || null; }

    // ── MODULAR SCENE COMPOSITION ─────────────────────────────

    async modular_scene_composition(args) {
        const goal = args.goal || args.description || 'Default scene';
        const assets = args.assets || [];
        const nodes = args.nodes || [];

        if (this._hasBrain()) {
            const r = await this._think(
                `Design a modular scene for the goal: "${goal}".\n` +
                (assets.length ? `Assets available: ${assets.join(', ')}\n` : '') +
                (nodes.length ? `Core nodes: ${nodes.join(', ')}\n` : '') +
                `Return JSON: { name, description, nodes: [{name, type, children, properties}], connections: [{from, to}] }. Keep concise (3-7 nodes).`
            );
            if (r.ok) {
                try {
                    const parsed = JSON.parse(r.result.match(/{[\s\S]*}/)?.[0] || '{}');
                    const scene = { name: parsed.name || goal, nodes: parsed.nodes || [], connections: parsed.connections || [], createdAt: Date.now() };
                    this.scenes.set(scene.name, scene);
                    return scene;
                } catch {}
            }
        }

        const scene = { name: goal, nodes: [{ name: 'root', type: 'Node', children: [] }], connections: [], createdAt: Date.now() };
        this.scenes.set(scene.name, scene);
        return scene;
    }

    // ── MULTI-LANGUAGE SCRIPTING INTEGRATION ─────────────────

    async multi_language_scripting(args) {
        const code = args.code || args.script || '';
        const language = args.language || this._detectLanguage(args);
        const params = args.params || [];

        const runners = {
            python: { cmd: 'python', ext: '.py', args: (f) => ['-u', f, ...params] },
            javascript: { cmd: 'node', ext: '.js', args: (f) => [f, ...params] },
            shell: { cmd: 'powershell', ext: '.ps1', args: (f) => ['-File', f, ...params] },
            bash: { cmd: 'bash', ext: '.sh', args: (f) => [f, ...params] },
        };

        const runner = runners[language];
        if (!runner) return { ok: false, error: `Unsupported language: ${language}. Supported: ${Object.keys(runners).join(', ')}` };

        // Write code to temp file and execute
        const tmpDir = path.join(__dirname, '..', '..', 'data', 'gsk', 'scripts');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tmpFile = path.join(tmpDir, `script_${Date.now()}${runner.ext}`);
        fs.writeFileSync(tmpFile, code, 'utf-8');

        try {
            const result = await new Promise((resolve, reject) => {
                const child = execFile(runner.cmd, runner.args(tmpFile), { timeout: 15000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
                    resolve({ stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), error: err ? err.message : null });
                });
            });
            return { ok: !result.error, language, stdout: result.stdout, stderr: result.stderr, error: result.error };
        } finally {
            try { fs.unlinkSync(tmpFile); } catch {}
        }
    }

    _detectLanguage(args) {
        const code = args.code || args.script || '';
        const ext = (args.file || '').split('.').pop();
        if (ext === 'py') return 'python';
        if (ext === 'js') return 'javascript';
        if (ext === 'sh' || ext === 'bash') return 'bash';
        if (ext === 'ps1') return 'shell';
        if (code.match(/^import |^from |^print|^def /m)) return 'python';
        if (code.match(/^const |^let |^var |^require|^import |^console/m)) return 'javascript';
        if (code.match(/^echo |^#!|\$\(|^\w+\(\)/m)) return 'bash';
        return 'python';
    }

    // ── GODOT PLATFORM ACCESS ─────────────────────────────────

    async godot_platform_access(args) {
        const op = args.op || 'check';
        const projectPath = args.projectPath || args.path || '';

        // Check if Godot is installed
        let godotPath = this._findGodot();

        switch (op) {
            case 'check':
                return { ok: !!godotPath, godotPath, installed: !!godotPath, message: godotPath ? `Godot found at ${godotPath}` : 'Godot not found on system' };

            case 'create_project': {
                if (!projectPath) return { ok: false, error: 'projectPath required' };
                const name = args.name || 'GSK_Project';
                const projectFile = path.join(projectPath, 'project.godot');
                if (fs.existsSync(projectFile)) return { ok: true, message: 'Project already exists', path: projectPath };
                fs.mkdirSync(projectPath, { recursive: true });
                const config = `[application]\nconfig/name="${name}"\nconfig/description="${args.description || ''}"\nrun/main_scene="res://main.tscn"\n`;
                fs.writeFileSync(projectFile, config, 'utf-8');
                // Write a basic main scene
                const sceneFile = path.join(projectPath, 'main.tscn');
                if (!fs.existsSync(sceneFile)) {
                    fs.writeFileSync(sceneFile,
                        '[gd_scene load_steps=2 format=3 uid="uid://gskscene1"]\n\n[ext_resource type="Script" path="res://main.gd" id="1"]\n\n[node name="Root" type="Node"]\nscript = ExtResource("1")\n', 'utf-8');
                    fs.writeFileSync(path.join(projectPath, 'main.gd'), 'extends Node\n\nfunc _ready():\n    print("GSK Soulverse project loaded")\n', 'utf-8');
                }
                this.godotProjects.set(name, projectPath);
                return { ok: true, message: `Godot project "${name}" created`, path: projectPath };
            }

            case 'list_scenes': {
                if (!projectPath) return { ok: false, error: 'projectPath required' };
                if (!fs.existsSync(projectPath)) return { ok: false, error: 'Project path not found' };
                const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.tscn'));
                return { ok: true, scenes: files, path: projectPath };
            }

            case 'build': {
                if (!godotPath) return { ok: false, error: 'Godot not installed' };
                if (!projectPath) return { ok: false, error: 'projectPath required' };
                if (!fs.existsSync(projectPath)) return { ok: false, error: 'Project path not found' };
                const exportMode = args.exportMode || 'headless';
                try {
                    const result = await new Promise((resolve) => {
                        const child = execFile(godotPath, ['--path', projectPath, '--headless', '--export-release', exportMode], { timeout: 60000, cwd: projectPath }, (err, stdout, stderr) => {
                            resolve({ stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), error: err ? err.message : null });
                        });
                    });
                    return { ok: !result.error, ...result };
                } catch (e) {
                    return { ok: false, error: e.message };
                }
            }

            case 'run': {
                if (!godotPath) return { ok: false, error: 'Godot not installed' };
                if (!projectPath) return { ok: false, error: 'projectPath required' };
                try {
                    const result = await new Promise((resolve) => {
                        const child = execFile(godotPath, ['--path', projectPath, '--headless', '--script', args.script || 'main.gd'], { timeout: 30000, cwd: projectPath }, (err, stdout, stderr) => {
                            resolve({ stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), error: err ? err.message : null });
                        });
                    });
                    return { ok: !result.error, ...result };
                } catch (e) {
                    return { ok: false, error: e.message };
                }
            }

            default:
                return { ok: false, error: `Unknown op: ${op}. Available: check, create_project, list_scenes, build, run` };
        }
    }

    _findGodot() {
        const candidates = [
            'C:\\Program Files\\Godot\\Godot.exe',
            'C:\\Program Files (x86)\\Godot\\Godot.exe',
            'C:\\Program Files\\Godot_x86\\Godot.exe',
            path.join(process.env.HOMEDRIVE || 'C:', '\\Godot\\Godot.exe'),
        ];
        for (const c of candidates) {
            if (fs.existsSync(c)) return c;
        }
        // Try PATH
        try {
            const which = require('child_process').execFileSync('where', ['godot'], { timeout: 3000, encoding: 'utf-8' }).trim();
            if (which) return which.split('\n')[0].trim();
        } catch {}
        return null;
    }

    // ── 3D ASSET GENERATION ───────────────────────────────────

    async d_asset_generation(args) {
        const descriptions = args.descriptions || args.assetDescriptions || args.description || '';
        const count = args.count || 1;

        if (this._hasBrain()) {
            const r = await this._think(
                `Generate ${count} 3D asset specification(s) for: "${descriptions}"\n\n` +
                `For each asset, return JSON: { name, type: "building|vehicle|prop|character|environment", ` +
                `dimensions: {w, h, d}, color, material: "glassy|metallic|organic|emissive", ` +
                `tags: [], description }. Return ONLY a JSON array.`
            );
            if (r.ok) {
                try {
                    const parsed = JSON.parse(r.result.match(/\[[\s\S]*\]/)?.[0] || '[]');
                    return Array.isArray(parsed) ? parsed.slice(0, count) : [];
                } catch {}
            }
        }
        return [{ name: 'asset_1', type: 'building', dimensions: { w: 5, h: 10, d: 5 }, color: '#4a90d9', material: 'metallic', tags: ['generated'], description: String(descriptions).substring(0, 100) }];
    }

    // ── SPATIAL WORLD INTERACTION ─────────────────────────────

    async spatial_world_interaction(args) {
        const action = args.action || args.op || 'place';
        const sanctum = this._getSanctum();

        switch (action) {
            case 'place':
            case 'build':
                if (!sanctum) return { ok: false, error: 'Sanctum not connected' };
                const bld = sanctum.placeBuilding(args.name || args.type || 'Structure', args.type || 'house', args.x, args.z);
                return { ok: true, action: 'place_building', building: bld };

            case 'spawn':
            case 'spawn_soul':
                if (!sanctum) return { ok: false, error: 'Sanctum not connected' };
                sanctum.spawnSoul(args.name || `Soul_${Date.now()}`, args.archetype || 'ARCHITECT', args.traits || {});
                return { ok: true, action: 'spawn_soul', name: args.name || `Soul_${Date.now()}` };

            case 'get_state':
                if (!sanctum) return { ok: false, error: 'Sanctum not connected' };
                return { ok: true, state: sanctum.getWorldState() };

            default:
                return { ok: false, error: `Unknown spatial action: ${action}. Available: place, spawn, get_state` };
        }
    }

    getSkillNames() {
        return ['modular_scene_composition', 'multi_language_scripting', 'godot_platform_access', '3d_asset_generation', 'spatial_world_interaction'];
    }
}

WorldEngine.prototype['3d_asset_generation'] = WorldEngine.prototype.d_asset_generation;

module.exports = { WorldEngine };

