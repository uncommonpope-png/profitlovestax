/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SKILL_REGISTRY.JS — Skill Registration System (Ported from Python)
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

class SkillRegistry {
    constructor() {
        this._skills = new Map();
        this._skillMetadata = new Map();
    }

    register(name, func, description = '', category = 'general') {
        this._skills.set(name, func);
        this._skillMetadata.set(name, {
            description,
            category,
            registered_at: new Date().toISOString(),
        });
    }

    call(name, ...args) {
        if (!this._skills.has(name)) {
            throw new Error(`Skill not found: ${name}`);
        }
        return this._skills.get(name)(...args);
    }

    listSkills() {
        return Array.from(this._skills.keys());
    }

    getMetadata(name) {
        return this._skillMetadata.get(name) || {};
    }

    listAllMetadata() {
        const result = {};
        for (const [name, metadata] of this._skillMetadata) {
            result[name] = metadata;
        }
        return result;
    }
}

const skillRegistry = new SkillRegistry();

module.exports = { SkillRegistry, skillRegistry };