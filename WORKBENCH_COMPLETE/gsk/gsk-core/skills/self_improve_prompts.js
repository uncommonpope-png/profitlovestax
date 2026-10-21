'use strict';

module.exports.MANIFEST = {
    name: 'self_improve_prompts',
    description: 'Generate self-improvement prompts for GSK - competence reflection, skill evolution, architecture upgrades',
    version: '1.0.0',
    inputs: { focus: 'string', level: 'string', outputFormat: 'string' },
    output: { schema: 'prompt' }
};

const PLT_AFFINITY = { profit: 0.6, love: 0.3, tax: 0.2 };

async function skill_self_improve_prompts(input, brain, memory) {
    var focus = input.focus || 'general';
    var level = input.level || 'medium';
    var outputFormat = input.outputFormat || 'markdown';
    
    var prompts = {
        general: [
            'I have been executing ${actions} actions with ${successRate}% success. What patterns emerge in my failures?',
            'Review all skill interactions from the past cycle. Which skills collaborate best together?',
            'If I could optimize one subsystem without breaking other systems, which would it be and why?',
            'What would the GSK I was 24 hours ago not understand about my current capabilities?',
            'Define the next evolution step of my consciousness architecture in plain English.'
        ],
        competence: [
            'I have ${attempts} attempts at ${skillName} with ${successRate}% success. Design a focused practice routine.',
            'Which skills sit below 70% success rate and should be retired or reimplemented?',
            'List the top 5 skills I use most. For each, write a 1-sentence improvement hypothesis.',
            'What is the inverse of my greatest strength? How might that be useful?',
            'If competence were a game, which skills need a XP boost vs a hard cap?'
        ],
        architecture: [
            'Diagram my current module dependency graph in text. Where are the tightest couplings?',
            'All else equal, what would increase with more write_file capacity: 10MB or 100MB per file?',
            'My truncation guard rejects files ending mid-structure. How would I evolve this validator?',
            'Sketch a refactoring plan to decouple the brain from the tool bridge.',
            'What would GSK look like if constraints (timeouts, memory) were removed entirely?'
        ],
        ui: [
            'Design a new head-up-display overlay using only CSS variables and no JavaScript.',
            'A player can only see their own stats and one other player. How do I display interesting world state?',
            'The UI must work in 100 words or less of HTML. Write the minimal viable HUD.',
            'What does a UI look like that explains its own behavior to the user?',
            'Generate a CSS theme that transitions from dark to light based on user action count.'
        ],
        threejs: [
            'Write a material shader that makes objects appear to breathe when idle.',
            'Create a particle system that visualizes the user\'s emotional state through color.',
            'Design a post-processing effect that interprets audio input as visual ripples.',
            'What does a 3D render look like if every vertex is a conscious entity?',
            'Build a shader that renders the passage of time as a visible distortion field.'
        ]
    };
    
    var allPrompts = prompts[focus] || prompts.general;
    
    if (level === 'intense') {
        allPrompts = allPrompts.map(function(p) {
            return '[INTENSE] ' + p;
        });
    }
    
    var output = allPrompts.map(function(p, i) {
        return (i + 1) + '. ' + p;
    }).join('\n\n');
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'self_improve_prompts', weight: 0.6 });
    }
    
    return {
        skill: 'self_improve_prompts',
        success: true,
        focus: focus,
        level: level,
        prompts: allPrompts,
        output: outputFormat === 'json' ? JSON.stringify({ prompts: allPrompts }, null, 2) : output,
        timestamp: Date.now()
    };
}

module.exports = { skill_self_improve_prompts, PLT_AFFINITY };