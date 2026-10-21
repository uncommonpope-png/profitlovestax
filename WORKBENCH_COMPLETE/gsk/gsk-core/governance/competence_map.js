'use strict';

/**
 * DYNAMIC COMPETENCE MAPPING
 * 
 * Tracks the 4 stages of competence for every skill and domain.
 * Enables self-aware learning: the system knows what it knows,
 * what it doesn't know, and what it needs to learn.
 * 
 * Four Stages:
 *   1. Unconscious Incompetence — doesn't know what it doesn't know
 *   2. Conscious Incompetence — aware of gaps, actively learning
 *   3. Conscious Competence — can perform with effort/focus
 *   4. Unconscious Competence — effortless, automatic execution
 * 
 * Change triggers:
 *   - Unconscious Incompetence → Conscious Incompetence: discovery/awareness
 *   - Conscious Incompetence → Conscious Competence: training/practice
 *   - Conscious Competence → Unconscious Competence: repeated success
 */

const fs = require('fs');
const path = require('path');

const STAGES = {
    UNCONSCIOUS_INCOMPETENCE: { id: 1, label: 'Unconscious Incompetence', short: 'unknown unknown' },
    CONSCIOUS_INCOMPETENCE: { id: 2, label: 'Conscious Incompetence', short: 'known unknown' },
    CONSCIOUS_COMPETENCE: { id: 3, label: 'Conscious Competence', short: 'known known' },
    UNCONSCIOUS_COMPETENCE: { id: 4, label: 'Unconscious Competence', short: 'unconscious known' }
};

const STAGE_BY_ID = [null, STAGES.UNCONSCIOUS_INCOMPETENCE, STAGES.CONSCIOUS_INCOMPETENCE, STAGES.CONSCIOUS_COMPETENCE, STAGES.UNCONSCIOUS_COMPETENCE];

class CompetenceMap {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.statePath = options.statePath || path.join(__dirname, '..', '..', 'data', 'gsk', 'competence_map.json');
        this.skills = new Map(); // name → { stage, attempts, successes, lastUsed, lastAssessment }
        this.stats = {
            totalSkills: 0,
            stageCounts: { 1: 0, 2: 0, 3: 0, 4: 0 },
            assessmentsRun: 0,
            promotions: 0,
            lastAssessment: null
        };
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                if (data.skills) {
                    for (const [name, info] of Object.entries(data.skills)) {
                        this.skills.set(name, info);
                    }
                }
                if (data.stats) this.stats = { ...this.stats, ...data.stats };
            }
        } catch (e) {}
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                skills: Object.fromEntries(this.skills),
                stats: this.stats,
                updatedAt: Date.now()
            }, null, 2));
        } catch (e) {}
    }

    /**
     * Register a skill or domain for competence tracking.
     */
    register(name, category = 'skill') {
        if (this.skills.has(name)) return;
        this.skills.set(name, {
            stage: 1,
            label: 'Unconscious Incompetence',
            category,
            attempts: 0,
            successes: 0,
            failures: 0,
            lastUsed: null,
            lastAssessment: Date.now(),
            successRate: 0,
            trend: 'stable'
        });
        this._recount();
        this._save();
    }

    /**
     * Record a skill usage outcome.
     */
    recordOutcome(name, success) {
        const skill = this.skills.get(name);
        if (!skill) {
            this.register(name);
            return this.recordOutcome(name, success);
        }

        skill.attempts++;
        if (success) skill.successes++;
        else skill.failures++;
        skill.lastUsed = Date.now();
        skill.successRate = skill.attempts > 0 ? skill.successes / skill.attempts : 0;

        // Assess competence stage
        this._assess(name, skill);
        this._save();
    }

    /**
     * Assess the competence stage for a skill based on performance data.
     */
    _assess(name, skill) {
        const oldStage = skill.stage;
        const rate = skill.successRate;
        const attempts = skill.attempts;
        const recentFailures = skill.failures > 3;

        if (attempts === 0) {
            skill.stage = 1; // Unconscious Incompetence
        } else if (attempts < 5) {
            skill.stage = 2; // Conscious Incompetence — still learning
        } else if (rate >= 0.85 && attempts >= 20) {
            skill.stage = 4; // Unconscious Competence — mastery
        } else if (rate >= 0.7 || (rate >= 0.5 && !recentFailures)) {
            skill.stage = 3; // Conscious Competence — can do it
        } else if (recentFailures && rate < 0.4) {
            skill.stage = 2; // Conscious Incompetence — needs help
        }

        skill.label = STAGE_BY_ID[skill.stage]?.label || 'Unknown';
        skill.lastAssessment = Date.now();
        this.stats.assessmentsRun++;

        if (skill.stage !== oldStage) {
            this.stats.promotions++;
            skill.trend = skill.stage > oldStage ? 'improving' : 'declining';
        }

        this._recount();
    }

    _recount() {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        for (const skill of this.skills.values()) {
            counts[skill.stage] = (counts[skill.stage] || 0) + 1;
        }
        this.stats.stageCounts = counts;
        this.stats.totalSkills = this.skills.size;
    }

    /**
     * Get the competence stage for a skill.
     */
    getStage(name) {
        const skill = this.skills.get(name);
        if (!skill) return { stage: 1, label: STAGE_BY_ID[1].label, successRate: 0 };
        return { stage: skill.stage, label: skill.label, successRate: skill.successRate, trend: skill.trend };
    }

    /**
     * Get skills at a specific stage.
     */
    getByStage(stageId) {
        const results = [];
        for (const [name, skill] of this.skills) {
            if (skill.stage === stageId) results.push({ name, ...skill });
        }
        return results;
    }

    /**
     * Get learning recommendations — skills that need attention.
     */
    getLearningRecommendations(limit = 5) {
        const recommendations = [];

        // Skills at stage 2 that have high failure rates
        for (const [name, skill] of this.skills) {
            if (skill.stage === 2 && skill.failures >= 3) {
                recommendations.push({
                    name,
                    action: 'study',
                    reason: `High failure rate (${skill.successRate * 100}% success). Needs structured learning.`,
                    priority: 'high'
                });
            }
        }

        // Skills at stage 3 approaching mastery
        for (const [name, skill] of this.skills) {
            if (skill.stage === 3 && skill.successRate >= 0.8) {
                recommendations.push({
                    name,
                    action: 'practice',
                    reason: `Ready to graduate to mastery. Only ${20 - skill.attempts} more attempts needed for stage 4.`,
                    priority: 'medium'
                });
            }
        }

        // Frequently used skills still at stage 2
        for (const [name, skill] of this.skills) {
            if (skill.stage === 2 && skill.attempts >= 10) {
                recommendations.push({
                    name,
                    action: 'review',
                    reason: `Used ${skill.attempts} times but still in learning phase. May need documentation review.`,
                    priority: 'low'
                });
            }
        }

        return recommendations.slice(0, limit);
    }

    /**
     * Run assessment across all registered skills.
     */
    assessAll() {
        for (const [name, skill] of this.skills) {
            this._assess(name, skill);
        }
        this.stats.lastAssessment = Date.now();
        this._save();
    }

    /**
     * Get full report.
     */
    getReport() {
        return {
            stats: this.stats,
            stages: Object.values(STAGES).map(s => ({
                id: s.id,
                label: s.label,
                shortcut: s.short,
                count: this.stats.stageCounts[s.id] || 0
            })),
            recommendations: this.getLearningRecommendations(),
            skills: Array.from(this.skills.entries())
                .sort((a, b) => b[1].attempts - a[1].attempts)
                .slice(0, 50)
                .map(([name, info]) => ({
                    name,
                    stage: info.stage,
                    label: info.label,
                    category: info.category,
                    successRate: info.successRate,
                    attempts: info.attempts,
                    trend: info.trend,
                    lastUsed: info.lastUsed
                }))
        };
    }

    getStats() {
        return this.stats;
    }
}

module.exports = { CompetenceMap, STAGES };
