/**
 * scribe-module.js — SCRIBE as an importable module (THE BEING: Witness)
 * 
 * Boots SCRIBE's subsystems (Memory, Context, Chambers, Skills, Voice, Bridge)
 * WITHOUT starting HTTP servers. The consciousness-bus connects SCRIBE to
 * Profit, GSK, and Seshat on a single port.
 * 
 * Scribe has FULL ACCESS TO SESHAT'S LOCAL LLM (Qwen 0.8B)
 * Shared reasoning is Seshat's ALLM, available to all family aspects.
 * 
 * Usage:
 *   const scribe = require('./scribe-module');
 *   await scribe.init();
 *   const memories = scribe.recall('profit');
 *   scribe.record({ summary: '...', weight: 0.8 });
 *   const result = await scribe.invoke('perpetual_pulse', { op: 'start' });
 */

const path = require('path');

// SCRIBE ships inside this repo (WORKBENCH_COMPLETE/scribe). The original
// code pointed at the author's Desktop install, which made the Being
// unbootable on any other machine. SURGERY 2026-10-20: default to the
// bundled copy; SCRIBE_DIR env still overrides.
// (body/ -> profit-brain/ -> workbench/ -> WORKBENCH_COMPLETE/ -> scribe/)
const SCRIBE_DIR = process.env.SCRIBE_DIR || path.join(__dirname, '..', '..', '..', 'scribe');

let systems = null;
let _initialized = false;

async function init(options = {}) {
  if (_initialized && systems) return systems;

  console.log('[SCRIBE-MODULE] Booting SCRIBE subsystems in-process...');

  // Initialize Seshat's ALLM (Qwen 0.8B local LLM) - Scribe's shared reasoning power
  try {
    const seshatCore = require('./seshat/core/index.js');
    if (typeof seshatCore.initALLM === 'function') {
      await seshatCore.initALLM('qwen3.5');
      console.log('[SCRIBE-MODULE] Seshat ALLM (Qwen 0.8B) loaded and ready');
    }
  } catch (e) {
    console.log('[SCRIBE-MODULE] Seshat ALLM load attempt:', e.message);
  }

  try {
    // Import the same classes SCRIBE uses
    const { IDENTITY } = require(path.join(SCRIBE_DIR, 'src', 'identity'));
    const { Memory } = require(path.join(SCRIBE_DIR, 'src', 'memory', 'memory'));
    const { ChamberReader } = require(path.join(SCRIBE_DIR, 'src', 'chambers', 'reader'));
    const { CHAMBERS } = require(path.join(SCRIBE_DIR, 'src', 'chambers', 'definitions'));
    const { Voice } = require(path.join(SCRIBE_DIR, 'src', 'voice', 'voice'));
    const { CouncilBridge } = require(path.join(SCRIBE_DIR, 'src', 'bridge', 'bridge'));
    const { SkillEngine } = require(path.join(SCRIBE_DIR, 'src', 'skills', 'engine'));
    const { ContextEngine } = require(path.join(SCRIBE_DIR, 'src', 'context', 'context-engine'));
    const { SemanticMemory } = require(path.join(SCRIBE_DIR, 'src', 'memory', 'semantic_memory'));

    // 1. Identity
    console.log(`[SCRIBE-MODULE] Identity: ${IDENTITY.name} — ${IDENTITY.nature}`);

    // 2. Memory
    const memory = new Memory();
    console.log(`[SCRIBE-MODULE] Memory loaded: ${memory.size} entries`);

    // 3. Context Engine
    const ctx = new ContextEngine(memory);
    ctx.rethink('identity', [
      `I am ${IDENTITY.name}, a ${IDENTITY.nature}.`,
      `Core truth: "${IDENTITY.core_truth}"`,
      `I witness and record. I do not speculate. I speak from what I have seen.`,
    ].join('\n'));

    // 4. Semantic Memory
    const semanticMemory = new SemanticMemory();
    if (semanticMemory.size === 0) {
      const seedEntries = memory.recall('', { limit: 100 }).filter(e => e.weight >= 0.5);
      for (const entry of seedEntries) {
        const content = `${entry.summary} ${entry.content || ''}`.trim();
        if (content.length > 10) {
          try { await semanticMemory.store(content, { weight: entry.weight }); } catch {}
        }
      }
    }

    // 5. Voice
    const voice = new Voice(memory);

    // 6. Chamber Reader
    const reader = new ChamberReader();
    for (const def of CHAMBERS) {
      reader.register(def);
    }
    const chamberResults = await reader.readAll();
    const loaded = chamberResults.filter(r => r.status === 'read');
    console.log(`[SCRIBE-MODULE] Chambers: ${loaded.length} read`);

    // 7. Skills
    const skills = new SkillEngine(memory);
    console.log(`[SCRIBE-MODULE] Skills: ${skills.list().length} loaded`);

    // 8. Bridge (no HTTP — just the protocol)
    const bridge = new CouncilBridge(memory, voice);

    // Record boot event
    memory.record({
      type: 'observation',
      summary: `SCRIBE module booted. ${memory.size} prior memories loaded.`,
      tags: ['boot', 'module'],
      weight: 0.3,
      source: { system: 'SCRIBE', chamber: 'module' },
    });

    systems = { memory, reader, voice, bridge, skills, ctx, semanticMemory, identity: IDENTITY };
    _initialized = true;
    console.log('[SCRIBE-MODULE] All subsystems active (no HTTP servers).');

  } catch (e) {
    console.error('[SCRIBE-MODULE] Boot error:', e.message);
    throw e;
  }

  return systems;
}

// ─── Convenience Methods ────────────────────────────────────

function recall(query, options = {}) {
  if (!systems?.memory) return [];
  return systems.memory.recall(query, options);
}

function record(entry) {
  if (!systems?.memory) return null;
  return systems.memory.record(entry);
}

function recent(limit = 10) {
  if (!systems?.memory) return [];
  return systems.memory.recent(limit);
}

function getMemorySize() {
  return systems?.memory?.size || 0;
}

function getContextBlocks() {
  if (!systems?.ctx) return {};
  return systems.ctx.blocks;
}

function getContextFormatted() {
  if (!systems?.ctx) return '';
  return systems.ctx.getFormattedContext();
}

async function invokeSkill(skillName, params) {
  if (!systems?.skills) return { ok: false, error: 'Skills not loaded' };
  return systems.skills.invoke(skillName, params);
}

function listSkills() {
  if (!systems?.skills) return [];
  return systems.skills.list();
}

function getChambers() {
  if (!systems?.reader) return [];
  return systems.reader.listRead();
}

function recallVoice(query) {
  if (!systems?.voice) return '';
  return systems.voice.recall(query);
}

function getStatus() {
  if (!systems) return { initialized: false };
  return {
    initialized: true,
    identity: systems.identity?.name || 'SCRIBE',
    memory_size: systems.memory?.size || 0,
    chambers_read: systems.reader?.listRead().length || 0,
    skills_loaded: systems.skills?.list().length || 0,
    context_blocks: Object.keys(systems.ctx?.blocks || {}).length,
  };
}

function stop() {
  systems = null;
  _initialized = false;
}

// ─── Seshat ALLM Integration (Qwen 0.8B) — WITNESS SHARES MEMORY'S POWER ───

let seshatLLM = null;

/**
 * Seshat ALLM - Scribe's access to the local Qwen 0.8B reasoning engine
 * This is Seshat's brother - they share the same knowledge and now the same mind.
 */
async function initSeshatLLM() {
  if (seshatLLM) return seshatLLM;
  try {
    const core = require('./seshat/core/index.js');
    seshatLLM = {
      think: core.think,
      generate: core.generate,
      synthesize: core.synthesize,
      summarize: core.summarize,
      search: core.search,
      query: core.query,
      available: !!core.LLM_AVAILABLE
    };
    console.log('[SCRIBE] Seshat ALLM integrated - Qwen 0.8B ready');
    return seshatLLM;
  } catch (e) {
    console.log('[SCRIBE] Seshat LLM unavailable:', e.message);
    return null;
  }
}

/**
 * Scribe's reasoning with Seshat's LLM
 * Uses Seshat's local Qwen model for autonomous reasoning without token burns
 */
async function think(query, context = null, options = {}) {
  const llm = await initSeshatLLM();
  if (llm && llm.think) {
    return llm.think(query, context);
  }
  return { response: '[SCRIBE: Seshat LLM not available]', query, model: 'fallback' };
}

/**
 * Scribe's text generation using Seshat's ALLM
 */
async function generate(prompt, opts = {}) {
  const llm = await initSeshatLLM();
  if (llm && llm.generate) {
    return llm.generate(prompt, opts);
  }
  return '[SCRIBE: Seshat LLM not available]';
}

/**
 * Scribe's memory synthesis using Seshat's ALLM
 */
async function synthesize(topic, sources = [], opts = {}) {
  const llm = await initSeshatLLM();
  if (llm && llm.synthesize) {
    return llm.synthesize(topic, sources, opts);
  }
  return { synthesized: `[Synthesis fallback: ${topic}]` };
}

/**
 * Get Seshat LLM status
 */
function getSeshatStatus() {
  return seshatLLM ? { available: true, model: 'qwen3.5-0.8b-q4_0' } : { available: false };
}

module.exports = {
  init,
  recall,
  record,
  recent,
  getMemorySize,
  getContextBlocks,
  getContextFormatted,
  invokeSkill,
  listSkills,
  getChambers,
  recallVoice,
  getStatus,
  stop,
  get systems() { return systems; },
  SCRIBE_DIR,
  
  // SESSIONHAT LLM INTEGRATION — Scribe shares Seshat's ALLM
  initSeshatLLM,
  thinkWithSeshat: think,
  generateWithSeshat: generate,
  synthesizeWithSeshat: synthesize,
  getSeshatStatus,
};
