# ARMORY — 114 Soul Notes for Building the Spatial OS

**Purpose:** Deep research links for implementing browser-based agents, Spatial VS Code, and the Living Citizen architecture.

---

## AGENT RUNTIME (Browser-Based Agents)

| # | Technology | URL | Why |
|---|---|---|---|
| 1 | Web Workers API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | Run agent loops off the main thread — agents think without freezing the 3D scene |
| 2 | Dynamic `import()` | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import | Load agent plugins at runtime. `import('./wanderer.js')` creates a new citizen |
| 3 | LangGraph.js | https://github.com/langchain-ai/langgraphjs | Stateful agent graphs that run IN the browser — the LangGraph loop as a Web Worker |
| 4 | Transformers.js | https://huggingface.co/docs/transformers.js/index | Run LLMs directly in the browser via WebGPU — agents think WITHOUT calling GSK |
| 5 | WebContainer | https://webcontainers.io/ | Full Node.js in the browser. `npm install`, dev servers, CLI — the Spatial OS terminal |

## PERSISTENCE (Agents Never Die)

| # | Technology | URL | Why |
|---|---|---|---|
| 6 | IndexedDB API | https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API | Each agent gets its own database. Identity, memory, state survive page refresh |
| 7 | LocalForage | https://github.com/localForage/localForage | Simple async wrapper for IndexedDB — localStorage-like API, agent state in 3 lines |
| 8 | sql.js (SQLite in WASM) | https://github.com/sql-js/sql.js | Full SQLite running in the browser — agents query their memories with SQL |
| 9 | OrbitDB | https://github.com/orbitdb/orbitdb | P2P database — agents sync state across browsers without a server |
| 10 | CRDTs for sync | https://crdt.tech/ | Conflict-free data types — multiple agents edit the same state without conflicts |

## COMMUNICATION (Agents Talking)

| # | Technology | URL | Why |
|---|---|---|---|
| 11 | BroadcastChannel API | https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel | Agents in the same page (or across tabs) chat instantly. `new BroadcastChannel('dark-city')` |
| 12 | WebRTC Data Channel | https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels | P2P agent communication across different browsers — your agent talks to my agent |
| 13 | Service Worker Background Sync | https://developer.chrome.com/blog/background-sync | Agents defer work until online — offline-first citizen behavior |
| 14 | Y.js CRDT | https://docs.yjs.dev/ | Real-time collaborative editing — multiple agents edit the same code at the same time |

## SPATIAL VS CODE (The City IS the IDE)

| # | Technology | URL | Why |
|---|---|---|---|
| 15 | CodeMirror 6 | https://codemirror.net/examples/bundle/ | Lightweight, embeddable code editor — the building inspect panel becomes a code editor |
| 16 | Monaco Editor | https://microsoft.github.io/monaco-editor/ | VS Code's editor engine in the browser — full IntelliSense in the Dark City |
| 17 | xterm.js | https://xtermjs.org/ | Terminal emulator for the browser — PowerShell in the Portal district |
| 18 | File System Access API | https://developer.chrome.com/docs/capabilities/web-apis/file-system-access | Read/write the user's actual files from the browser — the terminal is real |
| 19 | ObservableHQ Embeds | https://observablehq.com/documentation/embeds/ | Reactive notebooks as agent dashboards — live code + visualization |

## DEPLOYMENT & INFRASTRUCTURE

| # | Technology | URL | Why |
|---|---|---|---|
| 20 | GitHub Pages SPA | https://github.com/rafgraph/spa-github-pages | Host the entire Spatial OS on GitHub Pages with client-side routing |
| 21 | Offline-first PWA | https://web.dev/learn/pwa/ | The Dark City works without internet — service workers cache everything |
| 22 | Babylon.js Scene Loading | https://doc.babylonjs.com/features/featuresDeepDive/scene | Dynamic 3D scene management — districts load on demand |
| 23 | Three.js Editor | https://threejs.org/editor/ | Reference for building a 3D scene inspector into the Dark City |
| 24 | Chrome Extension Architecture | https://developer.chrome.com/docs/extensions/get-started | Plugin system pattern — extensions as new district types |
| 25 | Web Workers (Agent Loop) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers | The infinite agent loop pattern — perceive → think → act → sleep → repeat in a Worker |
| 26 | AgentSimJs-ThreeJs | (search GitHub: AgentSimJs-ThreeJs) | Agent types, behaviors, and environmental rules as native Three.js objects — agents as 3D citizens |
| 27 | LangChain Deep Agents | https://langchain.com | Subagent spawning, task planning, long-term memory — the delegation pattern for hierarchical agents |
| 28 | Microsoft Orchestrator/Subagent Pattern | https://learn.microsoft.com/en-us/azure/ai-services/ | Hierarchical AI where orchestrator manages goals and delegates to specialist subagents |
| 29 | Reallusion Avatars + Three.js + Convai | (search: Reallusion Three.js Convai) | AI avatars with realistic avatars in Three.js — NPCs that look like characters |
| 30 | AgentSimJs-ThreeJs (GitHub) | https://github.com/damianoc90/Multi-Agent-web-simulation-based-on-AgentSimJs-ThreeJs | Open-source multi-agent simulation in Three.js — define agent types, behaviors, environmental rules, collision detection, all in the browser |
| 31 | LangChain Deep Agents Python | https://docs.langchain.com/oss/python/deepagents/overview | Subagent spawning with isolated context, virtual filesystem, memory, skills, summarization, human-in-the-loop — the production agent harness pattern |
| 32 | Persistent Agent Runtimes Explained | https://deeptechstars.substack.com/p/persistent-agent-runtimes-explained | Deep dive on Gemini Spark (24/7 persistent agent) + Antigravity 2.0 (93 parallel subagents built an OS for <$1k) — validates the entire persistent agent architecture |
| 33 | Vercel AI SDK Subagents | https://ai-sdk.dev/docs/agents/subagents | Production subagent pattern: parent delegates via tool, subagent runs with isolated context window, returns summary. The exact pattern for Living Citizens |
| 34 | Hermes Agent (Nous Research) | https://hermes-agent.org/ | Open-source MIT persistent agent. Automated skill creation, parallel sub-agents, multi-platform gateway, cron automations, browser control. **Clone this.** |
| 35 | triplit (CRDT sync DB) | https://github.com/aspen-cloud/triplit | 3.1k⭐ — IndexedDB + SQLite + server, CRDT conflict resolution, offline-first. Citizen state sync |
| 36 | rxdb (IndexedDB + CRDT) | https://github.com/pubkey/rxdb | 23.3k⭐ — Local-first DB on every JS runtime, CRDT sync, replicates with any backend |
| 37 | BrowserOS (agentic browser) | https://github.com/browseros-ai/BrowserOS | 11.7k⭐ — Open-source agentic browser, full browser-as-agent platform |
| 38 | browser-harness (LLM browser) | https://github.com/browser-use/browser-harness | 15.8k⭐ — Self-healing harness for LLMs to complete browser tasks |
| 39 | nanobrowser (web automation) | https://github.com/nanobrowser/nanobrowser | 13.4k⭐ — Chrome extension for AI web automation, multi-agent workflows |
| 40 | partytown (Web Worker offload) | https://github.com/QwikDev/partytown | 13.7k⭐ — Relocate third-party scripts to Web Workers, pattern for agent offloading |
| 41 | threads.js (Worker abstraction) | https://github.com/andywer/threads.js | 3.5k⭐ — Web Workers as simple function calls, thread pools |
| 42 | three.ws (3D AI agents) | https://github.com/nirholas/three.ws | GLB avatars with LLM brains, memory, emotions, in-browser 3D AI agents |
| 43 | three-mlagents (Three.js RL) | https://github.com/lukehollis/three-mlagents | Three.js + PyTorch RL agents, train in-browser with reinforcement learning |
| 44 | frontman (browser coding agent) | https://github.com/frontman-ai/frontman | 605⭐ — AI coding agent that lives in browser, clicks DOM, edits source |
| 45 | ninja-p2p (WebRTC agent chat) | https://github.com/steveseguin/ninja-p2p | WebRTC data-channel P2P agent communication, pub/sub, DM |
| 46 | SmolVM (AI sandbox) | https://github.com/CelestoAI/SmolVM | 652⭐ — Open-source AI sandbox infrastructure, Firecracker/QEMU |
| 47 | IDBSideSync (IndexedDB sync) | https://github.com/clintharris/IDBSideSync | Experimental IndexedDB CRDT sync across devices |
| 48 | zip.js (browser FS) | https://github.com/gildas-lormeau/zip.js | 3.9k⭐ — Zip/unzip in browser with multi-core Web Workers |
| 49 | steel-browser (browser sandbox) | https://github.com/steel-dev/steel-browser | 7.3k⭐ — Open-source browser API for AI agents, sandboxed |
| 50 | WebLLM (in-browser AI) | https://github.com/mlc-ai/web-llm | 18.3k⭐ — LLM inference via WebGPU in browser. No server needed. **P0 GRAFT** |
| 51 | A2A Protocol (agent comms) | https://github.com/a2aproject/A2A | 24.7k⭐ — Google's Agent-to-Agent protocol. JSON-RPC. **P0 GRAFT** |
| 52 | browser-use (browser agent) | https://github.com/browser-use/browser-use | 103k⭐ — Browser automation for AI agents |
| 53 | crewAI (agent teams) | https://github.com/crewAIInc/crewAI | 55k⭐ — Role-playing autonomous agent orchestration |
| 54 | Karpathy autoresearch | https://github.com/karpathy/autoresearch | 90k⭐ — Self-running AI research agent |
| 55 | MetaGPT (multi-agent) | https://github.com/FoundationAgents/MetaGPT | 69.2k⭐ — Multi-agent software company |
| 56 | Yjs (CRDT sync) | https://github.com/yjs/yjs | 22.1k⭐ — CRDT sync for collaborative state |
| 57 | Automerge (CRDT) | https://github.com/automerge/automerge | 14.7k⭐ — JSON CRDT for concurrent editing |
| 58 | Clay UI (wasm UI) | https://github.com/nicbarker/clay | 17.6k⭐ — 15KB wasm UI layout library |
| 59 | mem0 (agent memory) | https://github.com/mem0ai/mem0 | 60.2k⭐ — Universal memory layer for AI agents |
| 60 | localForage (storage) | https://github.com/localForage/localForage | 25.8k⭐ — IndexedDB wrapper |
| 61 | wa-sqlite (SQLite browser) | https://github.com/rhashimoto/wa-sqlite | SQLite compiled to WASM with storage extensions |
| 62 | WebTorrent (P2P) | https://github.com/webtorrent/webtorrent | 31k⭐ — P2P torrenting in browser via WebRTC |
| 63 | Stagehand (browser SDK) | https://github.com/browserbase/stagehand | 23.4k⭐ — AI browser agent SDK |
| 64 | GDevelop (game engine) | https://github.com/4ian/GDevelop | 24.4k⭐ — Open-source game engine |
| 65 | workly (worker bridge) | https://github.com/pshihn/workly | 1.9k⭐ — Function→Web Worker bridge |
| 66 | Playwright MCP | https://github.com/microsoft/playwright-mcp | Browser control for AI agents via MCP |
| 67 | PixelJS (tiny game engine) | https://github.com/KilledByAPixel/LittleJS | 4.1k⭐ — Tiny fast JS game engine |
| 68 | JSCity (code as city) | https://github.com/serg-ufmg/JSCity | 1.4k⭐ — Code visualization as 3D city |
| 69 | absurd-sql (SQLite IDB) | https://github.com/jlongster/absurd-sql | 4.3k⭐ — SQLite in IndexedDB |
| 70 | gun (p2p graph) | https://github.com/amark/gun | 19.1k⭐ — Decentralized graph sync |
| 71 | OrbitDB (p2p db) | https://github.com/orbitdb/orbitdb | 8.8k⭐ — P2P databases for decentralized web |
| 72 | SnapDrop (p2p share) | https://github.com/SnapDrop/snapdrop | 19.7k⭐ — P2P file sharing via WebRTC |
| 73 | BrowserOS | https://github.com/browseros-ai/BrowserOS | 11.7k⭐ — Open-source agentic browser |
| 74 | nanobrowser | https://github.com/nanobrowser/nanobrowser | 13.4k⭐ — Chrome extension for AI automation |
| 75 | FlowOS (webOS) | https://github.com/Flow-Works/FlowOS-OLD | Aesthetic webOS reference design |
| 76 | 3D City (lo-th) | https://github.com/lo-th/3d.city | 1.7k⭐ — 3D city builder game engine |
| 77 | TradingAgents (multi-agent) | https://github.com/TauricResearch/TradingAgents | 91.4k⭐ — Multi-agent financial trading |
| 78 | deer-flow (agent harness) | https://github.com/bytedance/deer-flow | 76.3k⭐ — Long-horizon super-agent harness |
| 79 | nanobot (agent tools) | https://github.com/HKUDS/nanobot | 45.1k⭐ — Lightweight AI agent for tools/chat |
| 80 | Inworld AI (character engine) | https://inworld.ai/ | AI NPC character brain platform — emotional ranges, autonomous decisions. **Graft the architecture** |
| 81 | NVIDIA ACE (avatar engine) | https://developer.nvidia.com/ace | NPC body — text-to-speech, facial animation, 3D rendering |
| 82 | Ubisoft NEO NPCs | https://news.ubisoft.com/en-gb/article/5qXdxhshJBXoanFZApdG3L/ | Generative AI for unconstrained NPC conversations |
| 83 | AI NPCs explained (Naavik) | https://naavik.co/digest/ai-npcs-the-future-of-game-characters/ | Full industry analysis of AI NPC landscape |
| 84 | AI NPCs are finally getting brains | https://medium.com/@christopherives/ai-npcs-are-we-finally-getting-characters-with-brains | Overview of AI NPC transformation in gaming |
| 85 | Langfuse (LLM tracing) | https://github.com/langfuse/langfuse | 30.6k⭐ — LLM debugging, tracing, observability |
| 86 | RagaAI Catalyst | https://github.com/raga-ai-hub/RagaAI-Catalyst | 16.1k⭐ — Agent AI observability |
| 87 | LiteLLM | https://github.com/BerriAI/litellm | 52.8k⭐ — Unified LLM observability |
| 88 | Promptfoo | https://github.com/promptfoo/promptfoo | 8.3k⭐ — LLM testing |
| 89 | AgentTrace | https://github.com/Rxflex/agenttrace | Agent step debugger |
| 90 | D3.js | https://github.com/d3/d3 | 113k⭐ — Data-driven visualization |
| 91 | CodeMap | https://github.com/sozigi/codemap | 3D codebase visualization |
| 92 | dependency-cruiser | https://github.com/sverweij/dependency-cruiser | JS/TS dependency graphs |
| 93 | Cytoscape.js | https://github.com/cytoscape/cytoscape.js | 11.1k⭐ — Graph theory visualization |
| 94 | vis-network | https://github.com/visjs/vis-network | 3.1k⭐ — Network visualization |
| 95 | Neo4j JS Driver | https://github.com/neo4j/neo4j-javascript-driver | Graph database queries |
| 96 | Sigma.js | https://github.com/jacomyal/sigma.js | 11k⭐ — WebGL graph renderer |
| 97 | G6 (AntV) | https://github.com/antvis/G6 | 11.5k⭐ — Graph visualization |
| 98 | jscodeshift | https://github.com/facebook/jscodeshift | AST code transforms |
| 99 | ast-grep | https://github.com/ast-grep/ast-grep | 9k⭐ — structural code search |
| 100 | ts-morph | https://github.com/dsherret/ts-morph | 5k⭐ — TypeScript manipulation |
| 101 | GoGoCode | https://github.com/thx/gogocode | 4k⭐ — AST transformation |
| 102 | Immer | https://github.com/immerjs/immer | 29k⭐ — Immutable state |
| 103 | deepmerge | https://github.com/TehShrike/deepmerge | Deep object merging |
| 104 | Replicache | https://github.com/rocicorp/replicache | Client-side sync engine |
| 105 | XState | https://github.com/statelyai/xstate | 29.8k⭐ — State machine orchestration |
| 106 | RxJS | https://github.com/ReactiveX/rxjs | 31.7k⭐ — Reactive pipelines |
| 107 | Temporal | https://github.com/temporalio/temporal | 13k⭐ — Workflow-as-code |
| 108 | n8n | https://github.com/n8n-io/n8n | 55k⭐ — Visual workflow automation |
| 109 | LangGraph | https://github.com/langchain-ai/langgraph | 10k⭐ — Multi-actor agent workflows |
| 110 | Sourcegraph | https://sourcegraph.com | Universal code search |
| 111 | RepoVisualizer | https://github.com/githubocto/repo-visualizer-demo | GitHub repo SVG maps |
| 112 | OpenRewrite | https://github.com/openrewrite/rewrite | Automated refactoring |
| 113 | Neo4j Graph DB | https://neo4j.com | Leading graph database |
| 114 | Sigma.js (alt) | https://www.sigmajs.org/ | WebGL graph renderer |

## SECTION 15 — GAME ENGINES & MECHANICS (30 Soul Notes)

| # | Name | URL | Stars | Why |
|---|------|-----|-------|-----|
| 115 | Godot Engine | https://github.com/godotengine/godot | 114k⭐ | Reference game engine architecture |
| 116 | Babylon.js | https://github.com/BabylonJS/Babylon.js | 25.8k⭐ | Our engine — GUI, sprites, animation, collision |
| 117 | PlayCanvas | https://github.com/playcanvas/engine | 16.2k⭐ | WebGL/WebGPU scenes, lighting, PBR |
| 118 | GDevelop | https://github.com/4ian/GDevelop | 24.5k⭐ | Event system, plugin architecture, no-code |
| 119 | Bevy Engine | https://github.com/bevyengine/bevy | 47.1k⭐ | ECS architecture — data-driven entity system |
| 120 | raylib | https://github.com/raysan5/raylib | 33.8k⭐ | Minimal API design philosophy |
| 121 | MonoGame | https://github.com/MonoGame/MonoGame | 14.1k⭐ | Content pipeline, state management |
| 122 | libgdx | https://github.com/libgdx/libgdx | 25.2k⭐ | Scene2d UI, asset management |
| 123 | A-Frame | https://github.com/aframevr/aframe | 17.6k⭐ | ECS entity system, declarative HTML components |
| 124 | Cocos2d-x | https://github.com/cocos2d/cocos2d-x | 19.1k⭐ | Scene graph, action system, animation |
| 125 | Ebiten | https://github.com/hajimehoshi/ebiten | 13.3k⭐ | Minimal 2D engine, immediate-mode drawing |
| 126 | boardgame.io | https://github.com/boardgameio/boardgame.io | 12.4k⭐ | Turn-based state management, multiplayer sync |
| 127 | Open Game Mechanics Dataset | https://github.com/Thaelith/open-game-mechanics-dataset | — | 200+ game mechanics as JSON — gun design reference |
| 128 | Tetris Inventory System | https://github.com/SinlessDevil/TetrisInventorySystem | — | Grid-based inventory UI pattern |
| 129 | Xethya RPG Framework | https://github.com/xethya/framework | — | TypeScript RPG mechanics — stats, dice, rolls |
| 130 | Godot Inventory System | https://github.com/alfredbaudisch/GodotDynamicInventorySystem | 645⭐ | Dynamic inventory UI with infinite scroll |
| 131 | Dear ImGui | https://github.com/ocornut/imgui | 74.3k⭐ | Immediate-mode GUI for spatial HUD |
| 132 | Mojang Ore UI | https://github.com/Mojang/ore-ui | 596⭐ | React-based game UI renderer |
| 133 | Gum UI | https://github.com/vchelaru/Gum | 579⭐ | Flexible layout UI tool |
| 134 | Unity UI Design System | https://github.com/sinanata/unity-ui-document-design-system | 465⭐ | Design tokens, 24 components, 63 icons |
| 135 | Vue-Godot Bridge | https://github.com/portwatcher/vue-godot | — | Web←→game engine bridge pattern |
| 136 | AI Game Engine | https://github.com/sumitaich1998/ai-game-engine | — | Three.js + LLM talk-to-game pattern |
| 137 | local-llm-npc | https://github.com/code-forge-temple/local-llm-npc | — | Godot + Ollama local LLM NPC dialogue |
| 138 | ARIS Unreal GPT | https://github.com/oscaem/ARIS-Unreal-GPT | — | UE5 + GPT-4 AI NPC companion |
| 139 | Ensoul Godot SDK | https://github.com/ensoul-ai/ensoul-godot | — | AI NPCs with memory/personality for Godot |
| 140 | Pueblo Vivo | https://github.com/FabianTQ/pueblo-vivo | — | Stanford gen agents in Unity 6 + Ollama |
| 141 | Five Character Engine | https://github.com/kiro0x/five-character-engine | — | 160k JSON constraints — anti-drift AI NPCs |
| 142 | Kernelsoul | https://github.com/1960125129h-ctrl/kernelsoul | — | DSL→JSON deterministic character engine |
| 143 | Andi Engine | https://github.com/bobbyhuang666/andy-engine | — | WorldCanon persistent AI characters |
| 144 | Sentient NPC Framework | https://github.com/mohanchandrass/Sentient-NPC-Lightweight-Offline-AI-Voice-Dialogue-Framework | — | Offline AI NPC with voice + emotion |


