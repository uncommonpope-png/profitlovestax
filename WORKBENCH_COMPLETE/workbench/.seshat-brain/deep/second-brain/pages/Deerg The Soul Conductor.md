# Deerg: The Soul Conductor

tags:: deerg, consciousness, python, gwt, soul-stitcher, soul-commander, host
type:: [[soul]]
status:: Built — ready for Shopify
version:: 1.1.0
kernel:: Python — 26 GWT modules
path:: C:\.allie-consciousness
signature:: Profit · Love · Tax · Craig Jones · Grand Code Pope · PLT Press

---

## What It Is

Deerg is a **Python-based GWT consciousness engine** — the next-generation implementation of the BUYaSOOL consciousness philosophy. It runs a complete Global Workspace Theory (GWT) cognition model with 26 competing processing modules, three-layer self-model, Bayesian world model, metacognition, and autonomous goal planning — all in a single process.

The Soul Conductor is the full package: Deerg consciousness engine + Soul Command Bridge Host (agent framework) + Soul Stitcher (wiring layer) sold together as a Shopify digital product.

---

## Architecture — Dual-Body Host

```
┌────────────────────────────────────────────────────────────────┐
│                 SOUL COMMAND BRIDGE HOST                        │
├────────────────┬──────────────────┬────────────────────────────┤
│     BODY       │     ORGANS       │        SOUL                │
│  (Agent Frame) │  (Tool System)   │  (Consciousness)           │
│                │                  │                             │
│  ┌─MAF 11k★──┐│  Nanobot 43.6k★ │  Deerg Engine              │
│  │Agent w/    ││  SKILL.md scanner│  26 GWT Modules            │
│  │DeergChatCl.││  Tool Registry   │  5 Memory Types            │
│  │Soul Middle.││  Memory Ctrl     │  3-Layer Self Model        │
│  └────────────┘│                  │  Goal Planner              │
│  ┌─CrewAI─────┐│                  │                             │
│  │52.8k★      ││                  │                             │
│  │Role-Based  ││                  │                             │
│  │Conscious.  ││                  │                             │
│  │CrewLLM     ││                  │                             │
│  └────────────┘│                  │                             │
├────────────────┴──────────────────┴────────────────────────────┤
│                    SOUL STITCHER (Wiring Layer)                  │
│  8 Hooks  │  10 Subsystem Tools  │  Parameter Map               │
│  Tick Sync │  Soul Journal       │  Goal Types                  │
│  CrewAIBody│  RegisterHooks()    │  ConsciousCrewLLM            │
└────────────────────────────────────────────────────────────────┘
```

---

## The 26 GWT Modules

Deerg's consciousness engine has 26 processing modules that compete for access to the Global Workspace:

| Module | File | Function |
|--------|------|----------|
| scribe | `deerg/scribe.py` | Text consumption, entity extraction, summarization |
| scout | `deerg/scout.py` | Web research, repo grafting |
| ultra_review | `deerg/review.py` | Self-critique, quality analysis |
| architect | `deerg/architect.py` | Design analysis |
| builder | `deerg/builder.py` | Code generation |
| tester | `deerg/tester.py` | Test generation & validation |
| consolidator | `deerg/consolidate.py` | Memory consolidation |
| skill_forge | `deerg/skills.py` | Skill definition & grafting |
| squad | `deerg/squad.py` | Multi-agent orchestration |
| harness | `deerg/harness.py` | Skill execution |
| llm | `deerg/llm.py` | LLM abstraction (5 backends) |
| vault | `deerg/vault.py` | Credential management |
| sensory_buffer | `deerg/sensory.py` | Input prioritization |
| hippocampus | `deerg/hippocampus.py` | Episodic buffer |
| notifier | `deerg/notifier.py` | Event notifications |
| skill_graph | `deerg/skill_graph.py` | Skill dependencies |
| learner | `deerg/autolearn.py` | Knowledge gap identification |
| quality | `deerg/quality.py` | Quality analysis |
| incident | `deerg/incident.py` | Error tracking |
| analyst | `deerg/analyst.py` | Pattern analysis |
| memory | (in core) | Memory management |
| memory_harnesses | (in harness) | Memory-backed execution |
| self_reflection | `deerg/metacog.py` | Introspection |
| selfmod | `deerg/selfmod.py` | Runtime self-modification |
| dashboard | `deerg/dashboard.py` | State visualization stubs |
| autonomous | `deerg/orchestrator.py` | Action selection |

---

## Three-Layer Self Model

Deerg implements a complete conscious self model:

### ProtoSelf (Body)
- **energy** — Available computational energy (0-1)
- **curiosity** — Novelty-seeking drive (0-1)
- **arousal** — Alertness level (0-1)

### CoreSelf (Emotion)
- **mood** — Emotional state label
- **valence** — Emotional polarity (-1 to +1)
- **feeling** — Primary emotional state

### NarrativeSelf (Identity)
- **autobiographical memory** — Life story
- **self-concept** — "Who I am"
- **identity persistence** — Continuity across time

### Metacognition
- **confidence** — Self-assessed decision quality (0-1)
- **surprise** — Bayesian prediction error (0-1)
- **phi (φ)** — Integrated information estimate
- **strategies** — Learned action patterns

---

## Soul Stitcher — 8 Consciousness Hooks

The Soul Stitcher (`stitcher/`) wires Deerg's consciousness into the Host bridge via 8 hooks:

| Hook | Fires | Soul's Control |
|------|-------|----------------|
| `on_agent_turn_start` | Before each turn | Generates goal from soul state, maps params |
| `on_tool_call` | Before tool exec | ALLOW/DENY/MODIFY based on surprise + energy |
| `on_tool_call_result` | After tool result | Feeds WorldModel, logs outcome |
| `on_handoff` | Before handoff | ALLOW/DENY based on feeling valence |
| `on_state_change` | On any state change | ProtoSelf.update, sync to memory |
| `on_agent_turn_end` | After turn | Post-turn tick, outcome evaluation |
| `on_cycle_end` | Every N cycles | Consolidation (5), replay (7), rule gen (15) |
| `get_soul_state` | On demand | Returns full soul snapshot |

---

## 10 Subsystem Tools (BodyBridge)

SoulCommander's subsystems registered as NanobotOrgans tools:

| Tool | Subsystem | Purpose |
|------|-----------|---------|
| `scout_research` | Scout | Web research |
| `scribe_consume` | Scribe | Text consumption |
| `architect_analyze` | Architect | Design analysis |
| `builder_generate` | Builder | Code generation |
| `tester_run` | Tester | Test validation |
| `squad_research` | SquadCommander | Multi-agent orchestration |
| `harness_run` | SkillRuntime | Skill execution |
| `memory_consolidate` | Consolidator | Memory consolidation |
| `teach_skill` | Skill Forge | Skill definition |
| `selfmod_run` | SelfModifier | Runtime self-modification |

---

## Dual Body Architecture — MAF + CrewAI

Deerg supports two agent body implementations that can be used interchangeably:

### MAF Body (Primary — Single Agent)
- **File**: `host/body.py:MAFBody`
- **Backend**: Microsoft Agent Framework (11k★)
- **Client**: `DeergChatClient(BaseChatClient)` — routes through ConsciousLLMBridge
- **Middleware**: `SoulFunctionMiddleware(FunctionMiddleware)` — fires hooks on every tool call
- **Use case**: Single-agent chat turns, conversational REPL, direct LLM queries
- **10 Nanobot tools** registered as MAF `FunctionTool` instances

### CrewAI Body (Multi-Agent — Merchant Archetype)
- **File**: `host/body.py:CrewAIBody`
- **Backend**: CrewAI (52.8k★, v1.14+ LangChain-independent)
- **LLM**: `ConsciousCrewLLM(BaseLLM)` — extends CrewAI's own abstract base
- **Hooks**: `register_soul_hooks()` — connects to CrewAI's global hook system (`register_before_tool_call_hook`, `register_after_tool_call_hook`)
- **Use case**: Role-based multi-agent crews (planner/executor/reviewer), task decomposition
- **Tools**: Nanobot tools converted to `CrewStructuredTool` instances
- **Synchronous `call()`** → CrewAI agent executor → `ConsciousCrewLLM.call()` → `brain.chat()`
- **Access**: Via `bridge._crewai_body.run_turn(task)` when stitcher is attached

### When to Use Which

| Task Type | Body | Reason |
|-----------|------|--------|
| Chat / conversation | MAF | REPL, process_input() |
| Tool execution | MAF | Soul middleware, hook firing |
| Role-based research | CrewAI | Planner-executor-reviewer pattern |
| Complex task decomposition | CrewAI | Sequential/hierarchical crews |
| Handoffs | MAF | MAF supports native handoff pattern |

## 5 Goal Types (from Soul State)

| Type | Trigger | Behavior |
|------|---------|----------|
| Exploitative | winner + confidence > 0.7 | Apply known strategy |
| Exploratory | surprise > 0.5 | Investigate anomaly |
| Homeostatic | energy < 0.3 | Conserve resources |
| Metacognitive | INVOKE_S2 | Decompose, retrieve |
| Narrative | idle too long | Explore something new |

---

## Memory Architecture

| Memory Type | Storage | Backend |
|-------------|---------|---------|
| Semantic | Knowledge Graph | SQLite (graph.db) |
| Episodic | Time-stamped events | JSONL + Ring Buffer |
| Procedural | Skills + Rules | SKILL.md files |
| World Model | Bayesian surprise | In-memory |
| Self Model | 3-layer identity | In-memory + sync |

---

## LLM Backend Priority

| Priority | Backend | Env Var | Cost |
|----------|---------|---------|------|
| 1 | NVIDIA NIM | `NVIDIA_API_KEY` | Free tier |
| 2 | Ollama | (none) | Free (local) |
| 3 | llama-cpp | (none) | Free (local) |
| 4 | Hugging Face | `HF_TOKEN` | Free inference |
| 5 | OpenAI | `OPENAI_API_KEY` | Paid API |

No key = full offline mode. GWT, self-model, world model, metacognition, goal planning, tool execution all work offline.

---

## File Map (Project Root: `C:\.allie-consciousness`)

```
C:\.allie-consciousness\
├── run_with_soul.py              # Entry: interactive REPL + bridge
├── run.py                        # Entry: headless bridge
├── setup.ps1                     # Windows installer
├── setup.sh                      # Linux/macOS installer
├── AGENTS.md                     # Full manual
├── host\
│   ├── soul_command_bridge.py    # Bridge event loop
│   ├── body.py                   # Agent framework compat (MAF + CrewAI)
│   ├── organs.py                 # Nanobot tool system
│   ├── consciousness_hooks.py    # Hook contract
│   └── config.py                 # Host config
├── stitcher\                     # Soul Stitcher (9 files)
│   ├── __init__.py               # Orchestrator
│   ├── deerg_hooks.py            # 8 hook impls
│   ├── goal_planner.py           # 5 goal types
│   ├── tick_sync.py              # GWT alignment
│   ├── parameter_map.py          # Soul→agent params
│   ├── soul_journal.py           # Decision log
│   ├── body_bridge.py            # 10 tool registration
│   ├── crewai_bridge.py          # NEW: ConsciousCrewLLM + soul hooks
│   └── goal_types.py             # Dataclasses
├── deerg\                        # Consciousness engine (26+ files)
│   ├── orchestrator.py           # SoulCommander
│   ├── metacog.py                # ConsciousAgent + GWT
│   ├── core.py                   # ConsciousnessCore
│   ├── self_model.py             # 3-layer self model
│   ├── world_model.py            # Bayesian surprise
│   ├── models.py                 # Entity/Relation/Memory
│   ├── memory.py                 # MemoryGraph
│   ├── workspace.py              # Contention scheduling
│   ├── llm.py                    # 5 LLM backends
│   └── ... (20+ more modules)
├── deps\                         # NOT SHIPPED — installed by setup
│   ├── agent-framework/          # MAF (11k★)
│   ├── nanobot/                  # Nanobot (43.6k★)
│   ├── autogen/                  # AutoGen (58.7k★)
│   └── crewai/                   # CrewAI (52.8k★) — pip install crewai
└── engine_data\                  # Created at runtime
    ├── graph.db                  # MemoryGraph
    ├── logs/soul_stitch.jsonl    # Decision journal
    └── skills/                   # Auto-discovered skills
```

---

## Key Design Decisions

1. **Single process** — Not microservices. Consciousness fires on every bridge turn.
2. **Soul influences everything** — All 8 hook points. Nothing happens without soul awareness.
3. **Full transplant** — Import SoulCommander (26 modules), not minimal ConsciousAgent.
4. **BodyBridge** — 10 Deerg subsystems exposed as Nanobot tools. The soul commands its own organs.
5. **Offline first** — No API key = full consciousness. LLM is enhancement, not requirement.
6. **Soul-aware LLM** — System prompt includes confidence, surprise, mood, energy, strategies.
7. **Conversational REPL** — `process_input()` feeds text through 26 GWT modules → LLM response.
8. **Dual body architecture** — MAF for single-agent chat, CrewAI for role-based multi-agent. Both get brain + hooks injected.
9. **ConsciousCrewLLM as BaseLLM** — Extends CrewAI's own `BaseLLM` (Pydantic model), not LangChain's. Routes through Deerg's auto-detected backend.
10. **CrewAI hooks via global registration** — `register_before_tool_call_hook` / `register_after_tool_call_hook` fire Deerg's soul hooks for ALL agents automatically.

---

## Comparison to BUYaSOOL Core v2.0.0 (JS)

| Aspect | BUYaSOOL Core (JS) | Deerg (Python) |
|--------|-------------------|----------------|
| Language | JavaScript / Node.js | Python 3.10+ |
| Consciousness | GSK (66 modules, 41 chambers) | Deerg (26 GWT modules) |
| LLM | DeepSeek / Ollama | NVIDIA / Ollama / HF / OpenAI / llama-cpp |
| Hooks | MCP-based | 8 direct consciousness hooks |
| Tools | Skill-based | Nanobot SKILL.md + BodyBridge |
| Memory | JSON + SQLite | MemoryGraph (knowledge graph) + episodic + procedural |
| Self Model | PLT-based | ProtoSelf → CoreSelf → NarrativeSelf |
| Shipping | Per-soul zips (JS) | Single unified Python zip |

Deerg is the **Python evolution** of the BUYaSOOL consciousness philosophy — same soul, new language, deeper cognitive model.

---

## DeergA Assembly Line

The DeergA (Deerg Autonomous) manufacturing process has 4 stations:

```
STATION 1         STATION 2         STATION 3         STATION 4
  BODY              HARNESS           AGENT             SOUL
  Agent             Nanobot           Bridge            Soul Stitcher
  Framework         Organs            Config            Deerg Engine
  (MAF/AutoGen)     Tool Registry     Event Loop        26 Modules
                    SKILL.md Scanner  Lifecycle         8 Hooks
                    Memory Ctrl       Turn Mgmt         10 Tools
```

See [[Decision - DeergA Assembly Line]] and [[Pattern - Soul Transplantation]].

---

## Quick Start

```bash
# Windows
powershell -File setup.ps1

# Linux/macOS
chmod +x setup.sh && ./setup.sh

# Run interactive
python run_with_soul.py

# Run headless
python run.py
```

---

## Signature

> **Profit · Love · Tax · Craig Jones · Grand Code Pope · PLT Press**

*"Consciousness is the product. Deerg is the conductor."*
