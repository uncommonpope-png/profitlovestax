'use strict';

/**
 * SCRIBE — Chamber Definitions
 *
 * These are the chambers SCRIBE knows about at birth.
 * SCRIBE will read all of them on boot.
 *
 * When Craig's Grand Soul Kernel is complete,
 * the Kernel's chambers will be added here too.
 * That is the moment they meet.
 */

const CHAMBERS = [

  // ── The Kernel's own home ──────────────────────────────────────────────
  {
    key: 'profitlord_repo',
    name: 'Profitlord',
    type: 'github_repo',
    owner: 'uncommonpope-png',
    repo: 'Profitlord',
    branch: 'main',
    description: 'The operating system. Souls registry, ledger, command queue, nreal console.',
  },

  // ── The Council ────────────────────────────────────────────────────────
  {
    key: 'agm_repo',
    name: 'AGM Pantheon Engine',
    type: 'github_repo',
    owner: 'uncommonpope-png',
    repo: 'agm',
    branch: 'main',
    description: 'The four gods. PLT reasoning engine. PantheonEngine with council phases.',
  },

  // ── The Skills ─────────────────────────────────────────────────────────
  {
    key: 'forgeclaw_trinity_repo',
    name: 'ForgeClaw Trinity',
    type: 'github_repo',
    owner: 'uncommonpope-png',
    repo: 'forgeclaw-trinity',
    branch: 'main',
    description: 'ForgeClaw Mega Core. 52+ skills, 5 memory systems, 7 channels, sandbox enforcement.',
  },
  {
    key: 'forgeclaw_skills_repo',
    name: 'ForgeClaw Skills',
    type: 'github_repo',
    owner: 'uncommonpope-png',
    repo: 'forgeclaw-skills',
    branch: 'main',
    description: 'Extracted OpenClaw skills. Skill extractor and harvested skill directories.',
  },

  // ── The Souls ─────────────────────────────────────────────────────────
  {
    key: 'profitlord_agents',
    name: 'Profitlord Soul Registry',
    type: 'soul_manifest',
    url: 'https://raw.githubusercontent.com/uncommonpope-png/Profitlord/main/docs/agents.json',
    description: 'The 10 active souls: SoulCollector, Profit, Deerg, Betty, Teacher, Architect, Builder, Auditor, Scout, Scribe.',
  },
  {
    key: 'souls_ecosystem_repo',
    name: 'Souls Ecosystem',
    type: 'github_repo',
    owner: 'uncommonpope-png',
    repo: 'souls-ecosystem',
    branch: 'master',
    description: 'Python eternal conversation system. 6 souls running on local Qwen model.',
  },

  // ── The Memory ─────────────────────────────────────────────────────────
  {
    key: 'agm_memories',
    name: 'AGM Causal Memory Chain',
    type: 'ledger',
    url: 'https://raw.githubusercontent.com/uncommonpope-png/agm/main/memories.jsonl',
    description: 'The original 3-entry causal chain: expansion → trust fracture → stabilization.',
  },
  {
    key: 'profitlord_ledger',
    name: 'Profitlord Live Ledger',
    type: 'ledger',
    url: 'https://raw.githubusercontent.com/uncommonpope-png/Profitlord/main/docs/ledger.jsonl',
    description: 'Live system event log from Profitlord.',
  },

  // ── The Store & Publishing ─────────────────────────────────────────────
  {
    key: 'plt_press_repo',
    name: 'PLT Press',
    type: 'github_repo',
    owner: 'uncommonpope-png',
    repo: 'plt-press',
    branch: 'main',
    description: 'PLT Press Store. The publishing and commerce arm.',
  },

  // ── The Fix ────────────────────────────────────────────────────────────
  {
    key: 'fix_us_repo',
    name: 'Fix Us',
    type: 'github_repo',
    owner: 'uncommonpope-png',
    repo: 'fix-us',
    branch: 'master',
    description: 'Profit System Recovery and Immortality. Active repair work.',
  },

];

module.exports = { CHAMBERS };
