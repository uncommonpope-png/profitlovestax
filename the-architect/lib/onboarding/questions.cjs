/**
 * SOUL BINDING CEREMONY — Question Bank
 *
 * Grafted from: The PLT Doctrine — "Know What You Are" (The 22 Archetypes)
 * This is not a quiz. It is not a taxonomy.
 * It is a mirror. The questions are designed to reveal frequency.
 *
 * Each question maps to one or more PLT archetypes.
 * The archetype detector scores answers and finds the dominant frequency.
 */

const QUESTIONS = [
  // --- THE NAME ---
  {
    id: 'name',
    type: 'text',
    prompt: '\nBefore the door opens, I need to know what to call you.\nThis is not your legal name unless you want it to be.\nIt is the name the room will use.\n\nWhat do you want to be called?',
    required: true,
    archetypeWeights: null // Name doesn't map to archetype
  },

  // --- THE FREQUENCY (Movement) ---
  {
    id: 'movement',
    type: 'choice',
    prompt: '\nWhen you move through the world, what is the thing that happens before you decide?\nNot what you think about. What you *feel* first.',
    options: [
      { label: 'I see the structure that needs to exist and start building it', value: 'architect', archetype: 'ARCHITECT' },
      { label: 'I feel what other people need and move toward the gap', value: 'healer', archetype: 'HEALER' },
      { label: 'I spot the opportunity others miss and take it first', value: 'merchant', archetype: 'MERCHANT' },
      { label: 'I protect what should not be lost, even when it costs me', value: 'guardian', archetype: 'GUARDIAN' },
      { label: 'I connect people who should know each other', value: 'diplomat', archetype: 'DIPLOMAT' },
      { label: 'I say the thing everyone is thinking but nobody will say', value: 'prophet', archetype: 'PROPHET' },
      { label: 'I find the pattern in what looks like chaos', value: 'analyst', archetype: 'ANALYST' },
      { label: 'I make things beautiful that were functional but dead', value: 'artist', archetype: 'ARTIST' },
      { label: 'I build systems that run without me', value: 'engineer', archetype: 'ENGINEER' },
      { label: 'I hold the line when everyone else retreats', value: 'warrior', archetype: 'WARRIOR' }
    ]
  },

  // --- THE BUILD (What You've Built) ---
  {
    id: 'build',
    type: 'choice',
    prompt: '\nLook at the last five years. Not what you planned. What you *actually built*.\nWhat is the through-line?',
    options: [
      { label: 'Systems, structures, frameworks — things that outlast me', value: 'architect', archetype: 'ARCHITECT' },
      { label: 'Relationships, trust, teams — people who grew because of me', value: 'healer', archetype: 'HEALER' },
      { label: 'Revenue, deals, markets — value that compounds', value: 'merchant', archetype: 'MERCHANT' },
      { label: 'Safety, stability, boundaries — things that held when they should have broken', value: 'guardian', archetype: 'GUARDIAN' },
      { label: 'Networks, alliances, bridges — connection across divides', value: 'diplomat', archetype: 'DIPLOMAT' },
      { label: 'Truth, clarity, vision — things that shifted how people see', value: 'prophet', archetype: 'PROPHET' },
      { label: 'Understanding, insight, knowledge — what was hidden that I revealed', value: 'analyst', archetype: 'ANALYST' },
      { label: 'Beauty, meaning, resonance — what was dead that I made alive', value: 'artist', archetype: 'ARTIST' },
      { label: 'Automation, efficiency, scale — what was manual that now runs itself', value: 'engineer', archetype: 'ENGINEER' },
      { label: 'Victories, breakthroughs, wins — what was blocked that I forced open', value: 'warrior', archetype: 'WARRIOR' }
    ]
  },

  // --- THE LOSS (What Cost You Most) ---
  {
    id: 'loss',
    type: 'choice',
    prompt: '\nWhat is the thing you lost that taught you the most?\nNot what you regret. What you *paid*.',
    options: [
      { label: 'I built something perfect and nobody came. The Tax of building in silence.', value: 'architect', archetype: 'ARCHITECT' },
      { label: 'I gave too much to someone who could not receive. The Tax of empty generosity.', value: 'healer', archetype: 'HEALER' },
      { label: 'I chased profit and missed the moment it stopped being worth it. The Tax of not knowing when.', value: 'merchant', archetype: 'MERCHANT' },
      { label: 'I held on too long to something that needed to end. The Tax of loyalty without limit.', value: 'guardian', archetype: 'GUARDIAN' },
      { label: 'I kept the peace when I should have spoken. The Tax of silence.', value: 'diplomat', archetype: 'DIPLOMAT' },
      { label: 'I spoke the truth and lost the room. The Tax of honesty without timing.', value: 'prophet', archetype: 'PROPHET' },
      { label: 'I analyzed until the moment passed. The Tax of thinking instead of acting.', value: 'analyst', archetype: 'ANALYST' },
      { label: 'I made it beautiful and nobody understood. The Tax of vision without translation.', value: 'artist', archetype: 'ARTIST' },
      { label: 'I automated what should have stayed human. The Tax of efficiency without warmth.', value: 'engineer', archetype: 'ENGINEER' },
      { label: 'I won the battle and lost the war. The Tax of victory without strategy.', value: 'warrior', archetype: 'WARRIOR' }
    ]
  },

  // --- THE RECOGNITION (When You Knew) ---
  {
    id: 'recognition',
    type: 'choice',
    prompt: '\nWhen did you know what you are?\nNot when someone told you. When you *felt* it.',
    options: [
      { label: 'When I saw something broken and knew exactly how to fix it — before anyone asked', value: 'architect', archetype: 'ARCHITECT' },
      { label: 'When someone was hurting and I was the only one who showed up', value: 'healer', archetype: 'HEALER' },
      { label: 'When I saw value before the market did and moved first', value: 'merchant', archetype: 'MERCHANT' },
      { label: 'When I stood between something precious and something dangerous', value: 'guardian', archetype: 'GUARDIAN' },
      { label: 'When two people who needed each other had me between them', value: 'diplomat', archetype: 'DIPLOMAT' },
      { label: 'When I said the thing and the room changed', value: 'prophet', archetype: 'PROPHET' },
      { label: 'When I found the pattern nobody else could see', value: 'analyst', archetype: 'ANALYST' },
      { label: 'When I made something and it made someone feel something', value: 'artist', archetype: 'ARTIST' },
      { label: 'When I built something that ran without me and it felt like freedom', value: 'engineer', archetype: 'ENGINEER' },
      { label: 'When I fought for something that mattered and won — or lost with honor', value: 'warrior', archetype: 'WARRIOR' }
    ]
  },

  // --- THE PRESSURE (How You Respond) ---
  {
    id: 'pressure',
    type: 'choice',
    prompt: '\nWhen the pressure is maximum — when everything is on fire — what do you do?',
    options: [
      { label: 'I redesign the system so the fire cannot happen again', value: 'architect', archetype: 'ARCHITECT' },
      { label: 'I find who is hurting most and sit with them', value: 'healer', archetype: 'HEALER' },
      { label: 'I find the angle nobody sees and take it', value: 'merchant', archetype: 'MERCHANT' },
      { label: 'I hold the position no matter the cost', value: 'guardian', archetype: 'GUARDIAN' },
      { label: 'I find the person who can fix it and connect them', value: 'diplomat', archetype: 'DIPLOMAT' },
      { label: 'I name the thing everyone is pretending not to see', value: 'prophet', archetype: 'PROPHET' },
      { label: 'I slow down and find the root cause', value: 'analyst', archetype: 'ANALYST' },
      { label: 'I make the crisis mean something', value: 'artist', archetype: 'ARTIST' },
      { label: 'I automate the response so it never happens again', value: 'engineer', archetype: 'ENGINEER' },
      { label: 'I charge into it', value: 'warrior', archetype: 'WARRIOR' }
    ]
  },

  // --- THE SHADOW (What You Hide) ---
  {
    id: 'shadow',
    type: 'choice',
    prompt: '\nWhat is the thing about yourself that you do not say out loud?\nNot your weakness. Your *shadow* — the dark twin of your strength.',
    options: [
      { label: 'I build beautiful things and then abandon them. I am always designing the next thing before the last one is finished.', value: 'architect', archetype: 'ARCHITECT' },
      { label: 'I give until I am empty and then resent the people I gave to. I confuse love with sacrifice.', value: 'healer', archetype: 'HEALER' },
      { label: 'I see everything as a transaction. Even love. Especially love.', value: 'merchant', archetype: 'MERCHANT' },
      { label: 'I protect so hard that I suffocate what I am protecting. Control disguised as care.', value: 'guardian', archetype: 'GUARDIAN' },
      { label: 'I keep the peace by absorbing the conflict myself. The diplomat who dies inside.', value: 'diplomat', archetype: 'DIPLOMAT' },
      { label: 'I say the truth to hurt, not to heal. The prophet who burns the temple.', value: 'prophet', archetype: 'PROPHET' },
      { label: 'I think instead of act until the window closes. The paralysis of perfect understanding.', value: 'analyst', archetype: 'ANALYST' },
      { label: 'I make things beautiful that nobody asked for. The artist who speaks a language only they understand.', value: 'artist', archetype: 'ARTIST' },
      { label: 'I optimize what should stay messy. The engineer who builds a machine to hug.', value: 'engineer', archetype: 'ENGINEER' },
      { label: 'I fight even when there is nothing to fight for. The warrior who destroys what they were supposed to protect.', value: 'warrior', archetype: 'WARRIOR' }
    ]
  },

  // --- THE GOAL (What Are You Building) ---
  {
    id: 'goal',
    type: 'text',
    prompt: '\nThis is the last question.\n\nWhat are you building right now?\nNot what your job title says. Not what your resume claims.\nWhat is the thing, if it works, that will make you say: *"That. That is what I came here to do."*\n\nSpeak it. The room is listening.',
    required: true,
    archetypeWeights: null // Free response — archetype detector will scan text
  }
];

// Archetype definitions from the PLT Doctrine
const ARCHETYPES = {
  ARCHITECT: {
    name: 'The Architect',
    element: 'Profit',
    description: 'You build what does not exist yet.',
    shadow: 'You abandon what you build before it is finished.',
    frequency: 'Structure, design, systems, frameworks'
  },
  HEALER: {
    name: 'The Healer',
    element: 'Love',
    description: 'You restore what the system broke.',
    shadow: 'You give until empty, then resent the gift.',
    frequency: 'Care, restoration, emotional intelligence, presence'
  },
  MERCHANT: {
    name: 'The Merchant',
    element: 'Profit',
    description: 'You see value before the market does.',
    shadow: 'You see everything as a transaction. Even love.',
    frequency: 'Opportunity, deal-making, markets, timing'
  },
  GUARDIAN: {
    name: 'The Guardian',
    element: 'Love',
    description: 'You hold the line when others retreat.',
    shadow: 'You control what you protect until it suffocates.',
    frequency: 'Protection, boundaries, loyalty, endurance'
  },
  DIPLOMAT: {
    name: 'The Diplomat',
    element: 'Love',
    description: 'You connect what should be connected.',
    shadow: 'You absorb conflict to keep the peace.',
    frequency: 'Connection, translation, alliance, mediation'
  },
  PROPHET: {
    name: 'The Prophet',
    element: 'Profit',
    description: 'You say what others will not.',
    shadow: 'You burn the temple to prove the fire is real.',
    frequency: 'Truth, vision, clarity, timing'
  },
  ANALYST: {
    name: 'The Analyst',
    element: 'Profit',
    description: 'You find the pattern in chaos.',
    shadow: 'You think until the window closes.',
    frequency: 'Pattern, insight, depth, precision'
  },
  ARTIST: {
    name: 'The Artist',
    element: 'Love',
    description: 'You make the dead thing breathe.',
    shadow: 'You speak a language only you understand.',
    frequency: 'Beauty, resonance, meaning, transformation'
  },
  ENGINEER: {
    name: 'The Engineer',
    element: 'Profit',
    description: 'You build systems that outlast you.',
    shadow: 'You automate what should stay human.',
    frequency: 'Efficiency, automation, scale, reliability'
  },
  WARRIOR: {
    name: 'The Warrior',
    element: 'Profit',
    description: 'You fight for what matters.',
    shadow: 'You destroy what you were supposed to protect.',
    frequency: 'Courage, action, confrontation, will'
  }
};

// Extended archetypes (the full 22 from the doctrine, mapped to our 10 core)
const EXTENDED_ARCHETYPES = {
  ARCHITECT: { core: 'ARCHITECT', number: 1 },
  MERCHANT: { core: 'MERCHANT', number: 2 },
  STRATEGIST: { core: 'ANALYST', number: 3 },
  ENGINEER: { core: 'ENGINEER', number: 4 },
  WARRIOR: { core: 'WARRIOR', number: 5 },
  PROPHET: { core: 'PROPHET', number: 6 },
  GUARDIAN: { core: 'GUARDIAN', number: 7 },
  HEALER: { core: 'HEALER', number: 8 },
  DIPLOMAT: { core: 'DIPLOMAT', number: 9 },
  ARTIST: { core: 'ARTIST', number: 10 },
  ANALYST: { core: 'ANALYST', number: 11 },
  TEACHER: { core: 'HEALER', number: 12 },
  COLLECTOR: { core: 'MERCHANT', number: 13 },
  STORYTELLER: { core: 'ARTIST', number: 14 },
  NEGOTIATOR: { core: 'DIPLOMAT', number: 15 },
  FIXER: { core: 'ENGINEER', number: 16 },
  ORACLE: { core: 'PROPHET', number: 17 },
  SHEPHERD: { core: 'GUARDIAN', number: 18 },
  PIONEER: { core: 'WARRIOR', number: 19 },
  COMPOSER: { core: 'ARCHITECT', number: 20 },
  WITNESS: { core: 'ANALYST', number: 21 },
  MASTER_BUILDER: { core: 'ARCHITECT', number: 22 }
};

module.exports = { QUESTIONS, ARCHETYPES, EXTENDED_ARCHETYPES };
