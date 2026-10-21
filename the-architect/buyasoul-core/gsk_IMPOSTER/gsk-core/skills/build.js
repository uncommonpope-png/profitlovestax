'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.4, tax: 0.1 };

function skill_build_character(input) {
    const role = typeof input === 'string' ? input : (input.role || input.type || 'hero');
    const genre = input.genre || 'fantasy';
    
    const name = generateName(role, genre);
    const traits = generateTraits(role);
    const backstory = generateBackstory(role, genre);
    const motivation = generateMotivation(role);
    const flaw = generateFlaw(role);
    const voice = generateVoice(traits);
    
    return Promise.resolve({
        skill: 'build_character',
        plt_affinity: PLT_AFFINITY,
        character: {
            name,
            role,
            genre,
            traits,
            backstory,
            motivation,
            flaw,
            voice,
            arc: generateArc(role),
        },
        timestamp: Date.now(),
    });
}

function generateName(role, genre) {
    const firstNames = {
        hero: ['Aiden', 'Lyra', 'Kael', 'Seren', 'Rook', 'Vex'],
        villain: ['Malachar', 'Vexis', 'Nyx', 'Gorath', 'Zephyx'],
        mentor: ['Elder', 'Sage', 'Zara', 'Orin', 'Mira'],
        sidekick: ['Benny', ' Pip', 'Flinn', 'Gizmo', 'Noodle'],
    };
    
    const lastNames = ['Stormwind', 'Ironforge', 'Shadowmere', 'Brightblade', 'Nighthollow'];
    const type = role.toLowerCase().includes('villain') ? 'villain' : 
                 role.toLowerCase().includes('mentor') ? 'mentor' :
                 role.toLowerCase().includes('side') ? 'sidekick' : 'hero';
    
    return `${firstNames[type][Math.floor(Math.random() * firstNames[type].length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function generateTraits(role) {
    const baseTraits = ['Brave', 'Clever', 'Loyal', 'Resourceful', 'Compassionate'];
    const extras = ['paranoid', 'sarcastic', 'cautious', 'impulsive', 'mysterious'];
    
    return baseTraits.slice(0, 3).concat([extras[Math.floor(Math.random() * extras.length)]]);
}

function generateBackstory(role, genre) {
    return `${role} from ${genre} world. Once lived a simple life until a discovery changed everything. Now driven by a secret that haunts them.`;
}

function generateMotivation(role) {
    const motivations = {
        hero: 'Protect the innocent and prove themselves worthy',
        villain: 'Seek revenge for past wrongs and gain absolute power',
        mentor: 'Guide the next generation and atone for past failures',
        sidekick: 'Find belonging and prove their worth to their hero',
    };
    
    return motivations[role.toLowerCase()] || motivations.hero;
}

function generateFlaw(role) {
    const flaws = [
        'Cannot resist helping those in need, even when it endangered the mission',
        'Struggles with trust after being betrayed by a close ally',
        'Carries a secret that could destroy everything they built',
        'Haunted by past failures that cloud their judgment',
        'Overconfident in their abilities, leading to recklessness',
    ];
    
    return flaws[Math.floor(Math.random() * flaws.length)];
}

function generateVoice(traits) {
    return [
        `When in doubt, they say: "${traits[0]} is the only option."`,
        `Their catchphrase: "I've seen worse."`,
        `Laughs at danger with: "Is that all you've got?"`,
    ];
}

function generateArc(role) {
    const arcs = {
        hero: 'From uncertain novice to confident leader who learns that true strength comes from vulnerability',
        villain: 'From wronged victim to tyrant who realizes too late the cost of their choices',
        mentor: 'From isolated sage to connected guide who learns that wisdom shared is wisdom multiplied',
        sidekick: 'From sidekick to equal partner who proves that heroism comes in all sizes',
    };
    
    return arcs[role.toLowerCase()] || arcs.hero;
}

module.exports = { skill_build_character };