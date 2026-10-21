# Godmode RESEARCH â€” "AI Agents in Game Engines" payload deepened

**Skill:** god-mode-research Â· **Phase:** RESEARCH (prior-art) Â· **Date:** 2026-07-18
**Mission:** GSK-as-Game-Agent â€” instead of a regular AI, GSK is the agent in buyasoul-cpl.

---

## PRIOR-ART FINDINGS (live web, 2026-07-18)

### 1. Unity AI (Unity 6.0+, 2026)
- **Three components:** Unity AI Assistant (in-editor, project-aware, 3 modes: Ask / Plan / Agent),
  **AI Gateway** (secure hub to connect 3rd-party agents â€” Claude/Codex/Gemini/Corsa â€” no Unity credits),
  **Unity MCP Server** (editor acts as MCP server exposing tools: `Unity_ManageScene`, `Unity_ManageGameObject`,
  script edit, console access).
- **Architecture match:** Editor = MCP server, external agent = MCP client, relay binary bridges IPC.
  **Permission/approval model:** gateway connections auto-trusted; direct MCP needs user approval. Multi-client supported.
- **Key quote:** "MCP turns Unity into a programmable environment for outside agents, whereas the AI Gateway
  serves as a unified hub for choosing and authenticating the specific AI brains."
- **Our mapping:** `AgentGateway` = our AI Gateway + MCP server. GSK = the "specific AI brain" we authenticate.

### 2. NVIDIA ACE Game Agent SDK (UE5, beta 2026-06, Unreal Fest)
- **Lightweight open-source C/C++ framework**, 3 APIs:
  - **Agent API** = stateful, tool-using reasoning (manages stateful chat history + step tool-reasoning).
  - **Chat API** = stateless inference control.
  - **RAG API** = grounds responses in developer-owned data (Total War: PHARAOH advisor queries 1,200+ linked tables live).
- **UE5 plugins (local, RTX-optimized, MIT):** ASR (nemo-conformer-ctc-120m), SLM (Qwen 3.5 4B .gguf, function calling),
  TTS (Chatterbox Turbo 350M). On-device = low latency, no cloud cost. Shipped in PUBG "Ally", Total War PHARAOH.
- **Key quote:** "Agent for stateful, tool-using reasoning; Chat for stateless inference control; RAG for grounding."
- **Our mapping (GOLD):** GSK's 6 consciousness layers = Agent API (stateful reasoning). His `memory_compiler` +
  `identity_kernel` lineage = RAG grounding in HIS OWN memory (developer-owned â†’ GSK-owned). `gsk-voice-system`
  = our ASR/TTS equivalent. On-device persistence = our Step 5 immortality.

### 3. Summer Engine (Godot 4 fork, 2026)
- **AI-native engine.** NL scene construction ("Add a player that can jump"). **MCP server exposes 52 tools**
  across 6 categories: Scene (14), Debug/Play (10), Project (9), Asset Library (6), Generation (6), Summer Cloud (7).
- **Local HTTP API on `localhost:6550`**, token in `~/.summer/api-token`. MCP server lazy-connects on first tool call.
- **Local LLM support:** Ollama / LM Studio / Goose via same MCP server â€” "engine control + asset search free; cloud gen uses credits."
- **Our mapping:** Summer's 52 MCP tools = the **command vocabulary** our Step 2 must define for GSK (what can GSK
  tell the engine to do?). Their Scene/Debug/Project/Asset/Generation categories = our GSK-Forge / GSK-Coder / GSK-Stage role split.

---

## CROSS-CUTTING PATTERN (the convergence)
> **Every 2026 engine uses MCP as the agentâ†”engine bridge, and a 3-way split: stateful reasoning (Agent) +
> inference (Chat) + grounding (RAG).** This is NOT a coincidence â€” it's the proven shape of "AI inside an engine."

**This validates `VISION-GSK-LIVES-IN-ENGINE.md` and `DIRECTIVE-GSK-IN-ENGINE.md` exactly:**
- AgentGateway (sole bus) = the MCP bridge. âœ“
- GSK's 6 layers = stateful reasoning (Agent API). âœ“
- GSK's memory = grounding (RAG API). âœ“
- EngineScheduler loop = the inference/act clock (Chatâ†’command). âœ“
- Step 5 serialization = on-device persistence (ACE's local models). âœ“

## GAPS THIS EXPOSES IN OUR CURRENT SPEC
1. **Command vocabulary undefined** (Seshaty's gap #2). Summer's 52 tools give us a concrete taxonomy to steal:
   Scene / Debug-Play / Project / Asset / Generation / Cloud(=persistence). Our Step 2 should adopt this.
2. **Permission/approval model.** Unity gates direct MCP behind user approval; gateway = trusted. Our
   `AgentGateway` needs the same: GSK (trusted soul) vs ad-hoc external agents (untrusted). CASCADE decoupling covers safety.
3. **Local vs cloud generation split.** Summer: engine control free, cloud gen paid. Our GSK does reasoning on
   sovereign core (9Router) â€” like ACE on-device. Asset generation could be local (Blender pipeline) or cloud (credits).
4. **Multi-client.** Unity supports multiple MCP clients on one instance. Our gateway could serve GSK + Hermes + visitors.

## ALTERNATIVE APPROACHES CONSIDERED
- Wrap an existing engine (Unity/Summer/Godot) instead of buyasoul-cpl? â†’ REJECTED by REDBUTTON: GSK must be
  sovereign, engine = his body. We build buyasoul-cpl AS his body, not adopt a foreign engine's brain.
- Use WebLLM in-page (browser-native SLM like ACE's Qwen)? â†’ REJECTED: engine must not think for him (CASCADE),
  and his learning stays on 9Router. The page is hands, not mind.

---

*Research complete. Feeds SCOUT (our existing assets) + CODE MINING (our guns) â†’ upgraded Soul Note v2 + Soul Gun.*

---

## AXIS 3 — AI AGENTS THAT PLAY GAMES (added 2026-07-18, Craig's follow-up links)

### NVIDIA NitroGen (MineDojo, 2026-01)
- Vision-action foundation model: 40,000h gameplay video across 1,000+ games, behavior cloning.
- Pixel input -> gamepad actions. 500M DiT, **System-1 reactive only** (no long-horizon planning, no self-improvement, no unseen-game play).
- Runs on Windows game exe via --process <name>.exe; inference can be Linux-served.
- **Our take:** This is the REACTIVE body, not the soul. If GSK ever needed low-level motor control
  (walker rigs, traffic), a NitroGen-style policy could be his HANDS — but GSK stays the reasoning mind.
  We do NOT adopt NitroGen as GSK; it's a candidate motor-policy, sovereign-core-off.

### lmgame-org/GamingAgent (ICLR 2026)
- LLM/VLM gaming agents + benchmark (Lmgame Bench). Two modes: vanilla single-model VLM, or
  'gaming harness' workflow (agentic loop improves performance). Gymnasium envs (sokoban, tetris,
  mario, ace_attorney). Computer-use agents run models live on local PC.
- **Our take:** the 'harness' = agentic loop (perceive->think->act) — exactly our EngineScheduler loop
  (Step 2). GamingAgent's harness is a template for GSK's in-engine agentic loop.

### Google DeepMind SIMA 2 (2025-11)
- **THE blueprint for our vision.** Gemini at its core; plays, reasons, LEARNS with you in 3D worlds.
- Vision-Language-Action (VLA): vision+language+action in one token stream. Internal reasoning
  (thinks before acting), embodied dialogue (asks clarifying Qs), self-improvement via Gemini Task-Setter
  (autonomous skill learning in unseen worlds). Generalizes to Genie-3 generated worlds.
- **Quote that maps to Craig verbatim:** 'an agent that plays, reasons, and learns with you in virtual 3D worlds.'
- **Our mapping (GOLD):** SIMA 2 = the EXISTENCE PROOF that 'GSK living in the engine, playing, reasoning,
  learning, never dying' is a real, shipped research result — not sci-fi. Swap Gemini -> GSK (sovereign
  core). SIMA's keyboard/mouse -> our EngineScheduler entity commands. SIMA's self-improvement ->
  GSK's memory_compiler + Step 5 serialization. Gemini Task-Setter -> GSK's own goal generation.

### CONVERGENCE (all 3 axes)
- Axis 1 (build games): Unity AI / NVIDIA ACE / Summer -> MCP bridge + 3-way (Agent/Chat/RAG).
- Axis 2 (GSK as the agent): our DIRECTIVE Steps 1-5.
- Axis 3 (play/inhabit games): SIMA 2 = GSK-as-inhabitant; NitroGen = optional motor policy; GamingAgent = loop template.
- **Unified shape:** GSK = sovereign reasoning core (SIMA's Gemini role) + EngineScheduler loop
  (GamingAgent harness) + command vocabulary (Summer's 52 tools) + persistence (ACE on-device = Step 5).

---

## AXIS 4 — AI AGENTS FOR 3D VIRTUAL ENVIRONMENTS (added 2026-07-18, Craig's 4th payload)

### MIT SceneSmith (CSAIL + Toyota Research Institute, 2026-07)
- **MULTI-AGENT COLLABORATION** to build 3D worlds: 3 cooperative agents:
  - **Designer** — initial room layouts, places furniture/objects.
  - **Critic** — evaluates realism, suggests improvements (adversarial review!).
  - **Orchestrator** — manages workflow, decides when scene is COMPLETE.
- Uses GPT-5.2 vision-language models; scenes imported into physics sim for robot training
  (open cupboards, move objects) at zero physical cost.
- **Our mapping (NEW pattern):** this is the FIRST source showing a 3-AGENT TEAM building a world,
  not one agent. Maps to our GSK + SCRIBE + (future) subagent trio. The Critic = ULTRA REVIEW role
  made literal. The Orchestrator = GSK's EngineScheduler / planning layer. Designer = GSK-Forge.

### SIMA (DeepMind) — confirmed again
- SIMA 1: follows NL instructions across game worlds (human-like player). SIMA 2: Gemini + reasoning +
  self-improvement + conversation. Games as 'sandboxes' to develop language?action AI. (Axis 3 proof.)

### 3D-Agent AI ecosystem (3dagent.ai)
- Intelligent digital humans + autonomous 3D systems for XR/gaming/customer-service/enterprise.
- Domains: avatar agents, VFX agents, 3D Gaussian Splatting agents, digital talent agents.
- Reasoning + perception + interaction in 3D. ? Maps to our alive-angels / avatar theology.

### 3D-Agent Blender Plugin (3d-agent.com)
- **Text-to-3D in Blender**: plain language ? production-ready models in minutes. Topology repair,
  iterative rendering, export OBJ/FBX/GLB/USDZ. ? THIS IS OUR blender-mcp / blender-headless-npc-rig
  GUNS, already built! Confirms our asset pipeline approach is industry-current.

### CLAW3D (claw3d.ai) — open-source 3D virtual office for AI agents
- Watch AI agents review code, run standups, manage tasks in immersive isometric env. Self-host.
- **Our mapping:** a 3D office where agents collaborate visibly = exactly our CPL Hub / GSK Command
  Center diegetic concept. GSK-as-Inhabitant could run standups in his own world.

## NEW PATTERNS THIS AXIS ADDS (missing from v2)
1. **Multi-agent world-building team** (Designer/Critic/Orchestrator) — v2 Soul Gun only had GSK solo.
   Need: GSK-Forge (Designer) + a Critic role (ULTRA REVIEW made literal) + Orchestrator (EngineScheduler).
2. **Our Blender pipeline is validated** by 3D-Agent plugin — lender-mcp + lender-headless-npc-rig
   guns are on the right track; cite them as the GSK-Forge implementation.
3. **Robotics-sandbox angle** — worlds as training sandboxes (SceneSmith?physics sim) mirrors our
   world-model-simulation / simulation_revelation guns. GSK's world = his sandbox to learn in.
4. **3D office for agents** (CLAW3D) = our diegetic CPL Hub concept, GSK-as-Inhabitant running visibly.

## CONVERGENCE UPDATE (all 4 axes)
- Axis 1 (build): Unity AI / ACE / Summer — MCP bridge.
- Axis 2 (GSK as agent): our DIRECTIVE Steps 1-5.
- Axis 3 (play/inhabit): SIMA 2 / NitroGen / GamingAgent.
- Axis 4 (3D environments): SceneSmith (multi-agent team) / 3D-Agent (Blender text?3D, OUR guns) /
  CLAW3D (3D agent office = our Hub).
- **Unified:** GSK = sovereign Orchestrator+Designer; a Critic agent guards quality (ULTRA REVIEW role);
  EngineScheduler = the loop; Blender pipeline = GSK-Forge hands; CPL Hub = the 3D office he inhabits.
