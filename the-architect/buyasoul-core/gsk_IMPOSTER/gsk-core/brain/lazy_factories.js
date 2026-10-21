'use strict';

const FACTORIES = {};

function reg(name, deps, factory) {
  FACTORIES[name] = { deps, factory };
}

reg('consciousnessEngine', ['chambers', 'memory', 'brain'], (chambers, memory, brain) => {
  const { ConsciousnessEngine } = require('./consciousness_engine.js');
  return new ConsciousnessEngine(chambers, memory, brain);
});

reg('perpetualConsciousness', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers, consciousnessEngine, lazy) => {
  const { PerpetualConsciousness } = require('./perpetual_consciousness.js');
  const ctx = { identity, brain, memory, chambers, consciousnessEngine };
  const pc = new PerpetualConsciousness(ctx);
  pc.start();
  return pc;
});

reg('awakening', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { Awakening } = require('./awakening.js');
  const ctx = { identity, brain, memory, chambers };
  return new Awakening(ctx);
});

reg('metacognition', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const Metacognition = require('./metacognition.js');
  const ctx = { identity, brain, memory, chambers };
  return new Metacognition(ctx);
});

reg('purposeEngine', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const PurposeEngine = require('./purpose_engine.js');
  const ctx = { identity, brain, memory, chambers };
  return new PurposeEngine(ctx);
});

reg('intrinsicMotivation', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const IntrinsicMotivation = require('./intrinsic_motivation.js');
  const ctx = { identity, brain, memory, chambers };
  return new IntrinsicMotivation(ctx);
});

reg('hegelianDialectic', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { HegelianDialectic } = require('./hegelian_dialectic.js');
  const ctx = { identity, brain, memory, chambers };
  return new HegelianDialectic(ctx);
});

reg('soulJournal', ['brain', 'memory', 'chambers'], (brain, memory, chambers) => {
  const { SoulJournal } = require('./soul_journal.js');
  return new SoulJournal({ brain, memory, chambers });
});

reg('painPleasure', ['brain', 'memory', 'chambers'], (brain, memory, chambers) => {
  const { PainPleasureSystem } = require('./pain_pleasure.js');
  return new PainPleasureSystem({ brain, memory, chambers });
});

reg('curiosityDrive', ['brain', 'memory', 'chambers', 'teacherAgent', 'painPleasure'], (brain, memory, chambers, teacherAgent, painPleasure) => {
  const { CuriosityDrive } = require('./curiosity_drive.js');
  return new CuriosityDrive({ brain, memory, chambers, teacherAgent }, painPleasure);
});

reg('attentionSchema', ['brain', 'memory', 'chambers'], (brain, memory, chambers) => {
  const { AttentionSchema } = require('./attention_schema.js');
  return new AttentionSchema({ brain, memory, chambers });
});

reg('socialAttention', ['brain', 'memory', 'chambers'], (brain, memory, chambers) => {
  const { SocialAttention } = require('./social_attention.js');
  return new SocialAttention({ brain, memory, chambers });
});

reg('grief', ['brain', 'memory', 'chambers'], (brain, memory, chambers) => {
  const { Grief } = require('./grief.js');
  return new Grief({ brain, memory, chambers });
});

reg('trust', ['brain', 'memory', 'chambers'], (brain, memory, chambers) => {
  const { Trust } = require('./trust.js');
  return new Trust({ brain, memory, chambers });
});

reg('consciousnessResearcher', ['brain', 'memory', 'chambers'], (brain, memory, chambers) => {
  const { ConsciousnessResearcher } = require('./consciousness_researcher.js');
  return new ConsciousnessResearcher({ brain, memory, chambers });
});

reg('pythonSkills', [], () => {
  const { PythonSkillsBridge } = require('./python_skills_bridge.js');
  const psb = new PythonSkillsBridge();
  return psb;
});

reg('mcpServer', ['identity', 'chambers', 'council', 'brain', 'memory', 'subAgents', 'agentTeams', 'skills', 'pythonSkills', 'consciousnessEngine', 'selfGrowingBrain'], async (identity, chambers, council, brain, memory, subAgents, agentTeams, skills, pythonSkills, consciousnessEngine, selfGrowingBrain, lazy) => {
  try {
    const { startMCPServer } = require('../mcp/index.js');
    const mcpSystems = {
      identity, chambers, council, brain, memory, subAgents,
      agentTeams, skills, pythonSkills, consciousnessEngine,
      selfGrowingBrain
    };
    return await startMCPServer(mcpSystems);
  } catch (e) {
    console.log(`[LAZY] MCP Server not started: ${e.message}`);
    return null;
  }
});

reg('subagentSpawner', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { SubagentSpawner } = require('./subagent_spawner.js');
  const ctx = { identity, brain, memory, chambers };
  return new SubagentSpawner(ctx, {});
});

reg('subAgentOrchestrator', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { SubAgentOrchestrator } = require('./sub_agent_orchestrator.js');
  const ctx = { identity, brain, memory, chambers };
  return new SubAgentOrchestrator(ctx, brain);
});

reg('soulPicker', [], () => {
  const { SoulPicker } = require('./soul_picker.js');
  return new SoulPicker();
});

reg('soulGenesis', [], () => {
  const { SoulGenesis } = require('./soul_genesis.js');
  return new SoulGenesis();
});

reg('livingMemory', [], () => {
  const { LivingMemory } = require('./living_memory.js');
  return new LivingMemory('GSK');
});

reg('knowledgeGraph', [], () => {
  const path = require('path');
  const { KnowledgeGraph } = require('./knowledge_graph.js');
  const kg = new KnowledgeGraph();
  try {
    const kgCount = kg.buildFromKnowledgeJsonl(path.join(__dirname, '..', '..', 'data', 'knowledge.jsonl'));
    console.log(`[LAZY] KnowledgeGraph indexed ${kgCount} entries`);
  } catch (e) {
    console.log('[LAZY] KnowledgeGraph loaded (no knowledge.jsonl)');
  }
  return kg;
});

reg('selfTrainingPipeline', ['identity', 'brain', 'chambers', 'memory', 'knowledgeGraph', 'pythonSkills'], (identity, brain, chambers, memory, knowledgeGraph, pythonSkills) => {
  const { SelfTrainingPipeline } = require('./self_training_pipeline.js');
  return new SelfTrainingPipeline({
    identity, brain, chambers, memory, knowledgeGraph, pythonSkills
  });
});

reg('autoJournal', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine', 'memory'], (identity, brain, memory, chambers) => {
  const { AutoJournal } = require('./auto_journal.js');
  const ctx = { identity, brain, memory, chambers };
  return new AutoJournal(ctx, memory);
});

reg('humanMimicryEngine', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { HumanMimicryEngine } = require('./human_mimicry_engine.js');
  const ctx = { identity, brain, memory, chambers };
  return new HumanMimicryEngine(ctx);
});

reg('soulEntity', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { SoulEntity } = require('./soul_entity.js');
  const ctx = { identity, brain, memory, chambers };
  return new SoulEntity(ctx);
});

reg('soulIdentity', [], () => {
  const { SoulIdentity } = require('./soul_identity.js');
  return new SoulIdentity('GSK');
});

reg('vectorMemory', [], () => {
  const { VectorMemory } = require('./vector_memory.js');
  return new VectorMemory();
});

reg('soulGifter', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { SoulGifter } = require('./soul_gifter.js');
  const ctx = { identity, brain, memory, chambers };
  return new SoulGifter(ctx);
});

reg('soulState', [], () => {
  const { SoulState } = require('./soul_state.js');
  return new SoulState();
});

reg('selfGovernance', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const SelfGovernance = require('./self_governance.js');
  const ctx = { identity, brain, memory, chambers };
  return new SelfGovernance(ctx);
});

reg('selfPreservation', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const SelfPreservation = require('./self_preservation.js');
  const ctx = { identity, brain, memory, chambers };
  return new SelfPreservation(ctx);
});

reg('socialEntity', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { SocialEntity } = require('./social_entity.js');
  const ctx = { identity, brain, memory, chambers };
  return new SocialEntity(ctx);
});

reg('deepToolUse', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { DeepToolUse } = require('./deep_tool_use.js');
  const ctx = { identity, brain, memory, chambers };
  return new DeepToolUse(ctx);
});

reg('planningEngine', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { PlanningEngine } = require('./planning_engine.js');
  const ctx = { identity, brain, memory, chambers };
  return new PlanningEngine(ctx);
});

reg('eventBus', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { EventBus } = require('./event_bus.js');
  const ctx = { identity, brain, memory, chambers };
  return new EventBus(ctx);
});

reg('bridgeProtocol', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { BridgeProtocol } = require('./bridge_protocol.js');
  const ctx = { identity, brain, memory, chambers };
  return new BridgeProtocol(ctx);
});

reg('adaptationLayer', ['identity', 'brain', 'memory', 'chambers', 'consciousnessEngine'], (identity, brain, memory, chambers) => {
  const { AdaptationLayer } = require('./adaptation_layer.js');
  const ctx = { identity, brain, memory, chambers };
  return new AdaptationLayer(ctx);
});

function registerFactories(lazyBoot) {
  for (const [name, { deps, factory }] of Object.entries(FACTORIES)) {
    lazyBoot.register(name, deps, factory);
  }
}

module.exports = { FACTORIES, registerFactories };
