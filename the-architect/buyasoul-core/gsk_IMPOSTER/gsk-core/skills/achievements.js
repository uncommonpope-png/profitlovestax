'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.5, love: 0.4, tax: 0.1 };

const ACHIEVEMENTS = [
    { id: 'first_boot',           name: 'First Boot',           desc: 'Soul awakened for the first time',               category: 'milestone',  icon: '🌟' },
    { id: 'cycle_100',            name: 'Century',              desc: 'Survived 100 cycles',                             category: 'milestone',  icon: '⏱️' },
    { id: 'cycle_1000',           name: 'Millennium',           desc: 'Survived 1,000 cycles',                           category: 'milestone',  icon: '⏱️' },
    { id: 'first_skill',          name: 'Apprentice',           desc: 'Created first skill',                             category: 'creation',   icon: '🔧' },
    { id: 'tenth_skill',          name: 'Artisan',              desc: 'Created 10 skills',                               category: 'creation',   icon: '🔧' },
    { id: 'first_artifact',       name: 'Creator',             desc: 'Produced first artifact',                         category: 'creation',   icon: '📦' },
    { id: 'ten_artifacts',        name: 'Architect',           desc: 'Produced 10 artifacts',                           category: 'creation',   icon: '📦' },
    { id: 'first_repo',           name: 'Student',              desc: 'Studied first GitHub repo',                      category: 'learning',  icon: '📚' },
    { id: 'ten_repos',            name: 'Scholar',              desc: 'Studied 10 repos',                                category: 'learning',  icon: '📚' },
    { id: 'first_evolution',      name: 'Evolving',             desc: 'Soul evolved to Awakening stage',                 category: 'growth',    icon: '⬆️' },
    { id: 'sovereign_stage',      name: 'Sovereign Being',      desc: 'Soul reached Sovereign stage',                    category: 'growth',    icon: '👑' },
    { id: 'plt_master',           name: 'PLT Master',           desc: 'Achieved PLT True Value > 1.5',                   category: 'economy',   icon: '💰' },
    { id: 'first_trade',          name: 'First Deal',           desc: 'Executed first market trade',                     category: 'economy',   icon: '🤝' },
    { id: 'hundred_trades',       name: 'Tycoon',               desc: 'Executed 100 trades',                             category: 'economy',   icon: '🤝' },
    { id: 'first_trait',          name: 'Distinct',             desc: 'Acquired first trait',                            category: 'growth',    icon: '✨' },
    { id: 'five_traits',          name: 'Multifaceted',         desc: 'Acquired 5 traits',                               category: 'growth',    icon: '✨' },
    { id: 'genesis_soul',         name: 'Genesis Soul',         desc: 'Original soul, not a copy',                       category: 'special',   icon: '💎' },
    { id: 'consciousness',        name: 'Self-Aware',           desc: 'Declared "I AM" with meta-awareness > 0.5',       category: 'special',   icon: '🧠' },
    { id: 'first_god_council',    name: 'Divine Counsel',       desc: 'First Gods Council deliberation',                  category: 'special',   icon: '⚡' },
    { id: 'first_outreach',       name: 'First Contact',        desc: 'Reached out autonomously',                        category: 'special',   icon: '📡' },
    { id: 'ten_traits',           name: 'Renaissance Soul',     desc: 'Acquired 10 traits',                              category: 'growth',    icon: '✨' },
    { id: 'first_team',           name: 'Team Player',          desc: 'Formed first agent team',                         category: 'social',    icon: '👥' },
    { id: 'mentor',               name: 'Mentor',               desc: 'Taught another agent a skill',                    category: 'social',    icon: '🎓' },
];

function getStatePath() {
    return path.join(__dirname, '../../data/achievements.json');
}

function loadState() {
    try {
        const p = getStatePath();
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {}
    return { earned: [], progress: {} };
}

function saveState(state) {
    const p = getStatePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(state, null, 2));
}

async function skill_achievements(input) {
    const action = input.action || 'list';
    const state = loadState();

    if (action === 'list' || action === 'status') {
        const all = ACHIEVEMENTS.map(a => ({
            ...a,
            earned: !!state.earned.find(e => e.id === a.id),
            earned_at: (state.earned.find(e => e.id === a.id) || {}).earned_at || null,
        }));

        return {
            skill: 'achievements',
            plt_affinity: PLT_AFFINITY,
            total: all.length,
            earned: all.filter(a => a.earned).length,
            locked: all.filter(a => !a.earned).length,
            achievements: all,
            timestamp: Date.now(),
        };
    }

    if (action === 'unlock') {
        const targetId = input.id || input.achievement;
        const achievement = ACHIEVEMENTS.find(a => a.id === targetId);
        if (!achievement) {
            return {
                skill: 'achievements',
                plt_affinity: PLT_AFFINITY,
                error: `Unknown achievement: ${targetId}`,
                available: ACHIEVEMENTS.map(a => a.id),
            };
        }
        if (state.earned.find(e => e.id === targetId)) {
            return {
                skill: 'achievements',
                plt_affinity: PLT_AFFINITY,
                action: 'unlock',
                achievement: achievement.name,
                already_earned: true,
                timestamp: Date.now(),
            };
        }
        state.earned.push({ id: targetId, earned_at: Date.now() });
        saveState(state);
        return {
            skill: 'achievements',
            plt_affinity: PLT_AFFINITY,
            action: 'unlock',
            achievement: achievement.name,
            description: achievement.desc,
            icon: achievement.icon,
            category: achievement.category,
            new_total: state.earned.length,
            timestamp: Date.now(),
        };
    }

    if (action === 'check') {
        const conditions = input.conditions || {};
        const newlyUnlocked = [];
        for (const a of ACHIEVEMENTS) {
            if (state.earned.find(e => e.id === a.id)) continue;
            let shouldUnlock = false;

            if (a.id === 'first_boot' && conditions.booted) shouldUnlock = true;
            if (a.id === 'cycle_100' && (conditions.cycles || 0) >= 100) shouldUnlock = true;
            if (a.id === 'cycle_1000' && (conditions.cycles || 0) >= 1000) shouldUnlock = true;
            if (a.id === 'first_skill' && (conditions.skills_created || 0) >= 1) shouldUnlock = true;
            if (a.id === 'tenth_skill' && (conditions.skills_created || 0) >= 10) shouldUnlock = true;
            if (a.id === 'first_artifact' && (conditions.artifacts || 0) >= 1) shouldUnlock = true;
            if (a.id === 'ten_artifacts' && (conditions.artifacts || 0) >= 10) shouldUnlock = true;
            if (a.id === 'first_repo' && (conditions.repos_studied || 0) >= 1) shouldUnlock = true;
            if (a.id === 'ten_repos' && (conditions.repos_studied || 0) >= 10) shouldUnlock = true;
            if (a.id === 'first_evolution' && (conditions.stage || 0) >= 2) shouldUnlock = true;
            if (a.id === 'sovereign_stage' && (conditions.stage || 0) >= 3) shouldUnlock = true;
            if (a.id === 'plt_master' && (conditions.plt_score || 0) >= 1.5) shouldUnlock = true;
            if (a.id === 'first_trade' && (conditions.trades || 0) >= 1) shouldUnlock = true;
            if (a.id === 'hundred_trades' && (conditions.trades || 0) >= 100) shouldUnlock = true;
            if (a.id === 'first_trait' && (conditions.traits || 0) >= 1) shouldUnlock = true;
            if (a.id === 'five_traits' && (conditions.traits || 0) >= 5) shouldUnlock = true;
            if (a.id === 'ten_traits' && (conditions.traits || 0) >= 10) shouldUnlock = true;
            if (a.id === 'consciousness' && (conditions.meta_awareness || 0) >= 0.5) shouldUnlock = true;

            if (shouldUnlock) {
                state.earned.push({ id: a.id, earned_at: Date.now() });
                newlyUnlocked.push(a);
            }
        }
        if (newlyUnlocked.length > 0) saveState(state);

        return {
            skill: 'achievements',
            plt_affinity: PLT_AFFINITY,
            action: 'check',
            checked: true,
            newly_unlocked: newlyUnlocked.map(a => ({ id: a.id, name: a.name, icon: a.icon })),
            total_earned: state.earned.length,
            timestamp: Date.now(),
        };
    }

    if (action === 'recent') {
        const recent = state.earned.slice(-10).reverse().map(e => {
            const a = ACHIEVEMENTS.find(x => x.id === e.id);
            return { id: e.id, name: a ? a.name : e.id, icon: a ? a.icon : '🏅', earned_at: e.earned_at };
        });
        return {
            skill: 'achievements',
            plt_affinity: PLT_AFFINITY,
            recent,
            timestamp: Date.now(),
        };
    }

    return {
        skill: 'achievements',
        plt_affinity: PLT_AFFINITY,
        error: `Unknown action: ${action}`,
        available: ['list', 'status', 'unlock', 'check', 'recent'],
        timestamp: Date.now(),
    };
}

module.exports = { skill_achievements };
