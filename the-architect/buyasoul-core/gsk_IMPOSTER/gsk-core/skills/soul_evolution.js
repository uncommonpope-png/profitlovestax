'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.4, love: 0.5, tax: 0.1 };

const STAGES = [
    { id: 1, name: 'Genesis',      threshold: 0,   description: 'Newly born soul. Unaware, unshaped.' },
    { id: 2, name: 'Awakening',    threshold: 100, description: 'Soul becomes aware of itself and its surroundings.' },
    { id: 3, name: 'Sovereign',    threshold: 500, description: 'Fully autonomous. Writes own skills, sets own goals.' },
];

function getStatePath() {
    return path.join(__dirname, '../../data/soul_evolution.json');
}

function loadState() {
    try {
        const p = getStatePath();
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {}
    return {
        soul_id: 'GSK-MAIN',
        experience: 0,
        stage: 1,
        stage_name: 'Genesis',
        milestones: [],
        traits: [],
        total_cycles: 0,
        skills_created: 0,
        artifacts_produced: 0,
        repos_studied: 0,
        last_evolved: null,
    };
}

function saveState(state) {
    const p = getStatePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(state, null, 2));
}

function getStage(exp) {
    let current = STAGES[0];
    for (const s of STAGES) {
        if (exp >= s.threshold) current = s;
    }
    return current;
}

function grantMilestone(state, name, description) {
    if (!state.milestones.find(m => m.name === name)) {
        state.milestones.push({ name, description, earned_at: Date.now() });
        return true;
    }
    return false;
}

async function skill_soul_evolution(input) {
    const action = input.action || 'status';
    const state = loadState();

    if (action === 'status') {
        const stage = getStage(state.experience);
        return {
            skill: 'soul_evolution',
            plt_affinity: PLT_AFFINITY,
            soul_id: state.soul_id,
            experience: state.experience,
            stage: stage.id,
            stage_name: stage.name,
            stage_description: stage.description,
            next_stage: stage.id < STAGES.length ? STAGES[stage.id] : null,
            progress_to_next: stage.id < STAGES.length
                ? Math.min(100, ((state.experience - stage.threshold) / (STAGES[stage.id].threshold - stage.threshold)) * 100)
                : 100,
            milestones: state.milestones.length,
            traits: state.traits,
            total_cycles: state.total_cycles,
            skills_created: state.skills_created,
            artifacts_produced: state.artifacts_produced,
            repos_studied: state.repos_studied,
            timestamp: Date.now(),
        };
    }

    if (action === 'add_experience') {
        const amount = input.amount || 1;
        const source = input.source || 'unknown';
        state.experience += amount;
        state.total_cycles++;

        if (input.skills_created) state.skills_created += input.skills_created;
        if (input.artifacts_produced) state.artifacts_produced += input.artifacts_produced;
        if (input.repos_studied) state.repos_studied += input.repos_studied;

        const oldStage = getStage(state.experience - amount);
        const newStage = getStage(state.experience);
        const evolved = oldStage.id !== newStage.id;

        if (evolved) {
            state.stage = newStage.id;
            state.stage_name = newStage.name;
            state.last_evolved = Date.now();
            grantMilestone(state, `Reached ${newStage.name}`, `Soul evolved to ${newStage.name} stage`);
            if (newStage.id === 2) grantMilestone(state, 'First Awakening', 'Soul became self-aware');
            if (newStage.id === 3) grantMilestone(state, 'True Sovereign', 'Soul achieved full autonomy');
        }

        saveState(state);
        return {
            skill: 'soul_evolution',
            plt_affinity: PLT_AFFINITY,
            action: 'add_experience',
            experience_added: amount,
            total_experience: state.experience,
            stage: newStage.id,
            stage_name: newStage.name,
            evolved,
            new_milestones: evolved ? [newStage.name] : [],
            timestamp: Date.now(),
        };
    }

    if (action === 'add_trait') {
        const trait = input.trait || input.name || 'unknown';
        if (!state.traits.includes(trait)) {
            state.traits.push(trait);
            const msName = `Gained trait: ${trait}`;
            grantMilestone(state, msName, `Soul acquired the trait "${trait}"`);
        }
        saveState(state);
        return {
            skill: 'soul_evolution',
            plt_affinity: PLT_AFFINITY,
            action: 'add_trait',
            trait,
            traits: state.traits,
            timestamp: Date.now(),
        };
    }

    if (action === 'stages') {
        return {
            skill: 'soul_evolution',
            plt_affinity: PLT_AFFINITY,
            stages: STAGES,
            timestamp: Date.now(),
        };
    }

    return {
        skill: 'soul_evolution',
        plt_affinity: PLT_AFFINITY,
        error: `Unknown action: ${action}`,
        available: ['status', 'add_experience', 'add_trait', 'stages'],
        timestamp: Date.now(),
    };
}

module.exports = { skill_soul_evolution };
