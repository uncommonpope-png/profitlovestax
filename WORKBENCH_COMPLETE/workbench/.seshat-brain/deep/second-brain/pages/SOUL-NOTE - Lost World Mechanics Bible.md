# SOUL-NOTE — Lost World Mechanics Bible

> **Status:** Rediscovery & Resurrection — Session 8 (Full Body Count = 76+ Prototypes, 33 Documented, 27 Soul Guns)
> **Purpose:** Complete archaeological record of every "lost world mechanic" — full code, mechanics, lore, UI, dependencies, gaps, and cross-links to North Star Odyssey
> **Canon:** This is NOT a redesign. This is a recovery operation. Every treasure documented exactly as found.
> **Body Count Discovery:** ~67+ game/Soulverse prototypes in `plt-press/`, 9 sub-projects in `shopify-auto-setup/`, GRANDTOWER, cosmic-pyramid-library, soul-cosmos. 12+ agent/consciousness repos (SOULBOY, sovereign-kernel, .hermes, profit-prime, soul-dashboard, dark-city-engine, soul-foundry, gsk-kernel, GSK-SOUL-OS, gsk-knowledge-vault, brain-in-a-box, soul-economy-hub, the-soulfeild). Massive gaps in documentation now known — at least 58+ prototypes remain to be catalogued.
> **Session 5:** Updated all 13 soul guns with real external citations, what Craig did wrong, and proper implementations from Three.js community repos. Added comprehensive citations section to Bible.

---

## COMPLETE BODY CATALOG — All Discovered Prototypes

### plt-press/ Directory (~67+ Game & Soulverse Prototypes)

| Size | File | Status |
|------|------|--------|
| 100.9KB | SOULVERSE-HABITAT-V4.html | ⭐ TREASURE VI — Fully analyzed |
| 66.7KB | soulverse-expanded.html | ⭐ TREASURE VII — Fully analyzed |
| 54.1KB | SOULVERSE-FUSION-MASTER.html | ⭐ TREASURE VIII — Fully analyzed |
| 50.2KB | soul-world-3d.html | ⭐ TREASURE IX — Fully analyzed |
| ~45KB+ | SOULVERSE-HABITAT-V5.html | ⭐ TREASURE XXII — Fully analyzed |
| ~40KB+ | SOULVERSE-BASE-GAME.html | ⭐ TREASURE XXIII — Fully analyzed |
| ~40KB+ | SOULVERSE-OMNIVERSAL.html | ⭐ TREASURE XXIII variant — Fully analyzed |
| ~40KB+ | SOULVERSE-UNIFIED-MASTER.html | ⭐ TREASURE XXIV — Fully analyzed |
| ~35KB+ | soul-kombat-x.html | Not yet read |
| ~35KB+ | soul-combat-arena.html | Not yet read |
| ~35KB+ | soul-habitat-real.html | Not yet read |
| ~35KB+ | neo-kemet-aaa.html | Not yet read |
| ~35KB+ | VOXEL-SANDBOX.html | Not yet read |
| ~30KB+ | SOULVERSE-HABITAT.html | Not yet read |
| ~30KB+ | soul-god-sim.html | Not yet read |
| ~30KB+ | soul-mmo-alpha.html | Not yet read |
| ~30KB+ | soulverse-mmorpg.html | Not yet read |
| ~20KB+ | SOULVERSE-V2.html, SOULVERSE-V3.html, soul-nexus.html, soul-hub.html, money-bag-run.html, canvas-desert-sim.html, church-clicker.html, soul-academy.html, sols-rpg.html, soul-colosseum.html, SOULVERSE-5.html, soul-foundry.html, soul-simulation-1.html, soul-roguelike.html, soulverse-3d-expanded.html, soulverse-3d.html, kachiville-early-demo.html, soulverse-0.html, soulverse-mobile.html, soulverse-no-modules.html, soulverse-two.html, 3d-soulverse-beta.html | Not yet read |
| ~10-20KB | soul-chat-hub.html + ~25-30 more | Not yet read |

### shopify-auto-setup/ Sub-Projects (9 Directories)

| Project | Core File | Status |
|---------|-----------|--------|
| soul-debate | lib/soulverse.html | ✅ TREASURE III — Fully analyzed |
| soul-memlock | lib/memlock.html | Not yet read — Likely memory locking / persistence |
| soul-procedural-memory | lib/procedural-memory.html | Not yet read — Likely agent memory system |
| soul-telephone | dashboard/index.html | Not yet read — Likely inter-agent communication |
| soul-oracle | dashboard/index.html | Not yet read — Likely prophecy / prediction engine |
| soul-kernel | dashboard/index.html | Not yet read — Likely core kernel system |
| soul-observability | lib/observability.html | Not yet read — Likely monitoring/logging |
| soul-metropolis | dashboard/index.html | Not yet read — Likely city/growth dashboard |
| soul-plt-doctrine | lib/doctrine.html | Not yet read — Likely PLT framework bible |

### Other Major Known Treasures

| Path | Status |
|------|--------|
| grandtower/GRANDTOWER.html (1362 lines) | ✅ TREASURE I — Fully analyzed |
| cosmic-pyramid-library/index.html (869KB) | ✅ TREASURE IV — Fully analyzed |
| soul-cosmos/ (7 Node.js modules) | ✅ TREASURE V — Fully analyzed |
| plt-press/SOULVERSE.html (543 lines) | ✅ TREASURE II — Fully analyzed |
| SOULBOY/ (Python package, 12 modules) + SOULBOY_LAB/ (2270-line soul_core.py) | ✅ TREASURE X — Fully analyzed |
| dark-city-engine/ (Babylon.js + Rust WASM ECS) | ✅ TREASURE XV — Fully analyzed |
| soul-foundry/ (Three.js Soul Creation Tool) | ✅ TREASURE XVI — Fully analyzed |
| gsk-kernel/ (166 skills, 40+ chambers, 7 sub-agents) | ✅ TREASURE XVII — Fully analyzed |
| GSK-SOUL-OS/ (Soul Portability OS, AES-256 encryption) | ✅ TREASURE XVIII — Fully analyzed |
| gsk-knowledge-vault/ (Obsidian Knowledge Base) | ✅ TREASURE XIX — Fully analyzed |
| brain-in-a-box/ (40+ chambers, autonomous learning, $199) | ✅ TREASURE XX — Fully analyzed |
| the-soulfeild/ (2747-line Babylon.js world + Heaven Library) | ✅ TREASURE XXI — Fully analyzed |

### Other Major Known Treasures

| Path | Status |
|------|--------|
| sovereign-kernel/ (Rust consciousness engine) | ✅ TREASURE XI — Fully analyzed |
| .hermes/ (Python agent framework) | ✅ TREASURE XII — Fully analyzed |
| profit-prime/ (god-mode market intel) | ✅ TREASURE XIII — Fully analyzed |
| soul-dashboard/ (React-Three-Fiber 3D) | ✅ TREASURE XIV — Fully analyzed |

**Total Documented: 33 treasures / ~76+ known prototypes**
**Total Unread: ~45+ prototypes (approximately 1.5MB+ of code yet to be studied)**
**Soul Guns Extracted: 19 skills from 3D world mechanics**

---

## TREASURE I: GRANDTOWER — The Definitive Playable Soulverse Prototype

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\grandtower\GRANDTOWER.html`
- **Size:** 1362 lines, single-file HTML/JS/CSS
- **Status:** Fully functional 3D RTS Soulverse
- **Render Engine:** Three.js r128 via importmap

### Architectural Summary
Single-file module pattern. Three.js imports via CDN (r128). No build system, no bundler. Entire game exists in browser memory with localStorage persistence.

### Complete Mechanic Inventory

#### 1. PLT Economy System (`window.PLT`)
```
State: { profit:500, love:500, tax:500 }
Advantages (Architect-tunable):
  - Profit → Love: 1.3x
  - Love → Tax: 1.3x
  - Tax → Profit: 1.3x
```
**Functions:** `gainPLT(p,l,t)`, `spendPLT(p,l,t)`, `pltAdvantage(atk,def)`, `updateTopBar()`
**UI:** Top bar with gold/red/blue badges showing current PLT values. Updates every 2s.

#### 2. Player System (`window.PLAYER`)
```
State: { level:1, xp:0, xpNext:100, hp:100, maxHp:100, energy:80, hunger:65, social:50 }
```
**Levelling:** `gainXP(amount)` — scales xpNext by 1.4x per level. Rewards 50 each PLT per level.
**UI:** Level badge (circle), XP bar, needs bars (energy/hunger/social) with moodlet emojis.

#### 3. Soul Forging System (`window.forgeSoul`)
```
Input: name, role, essence text, Profit/Love/Tax weights (0-100 sliders)
Output: Soul object with:
  - id, name, role, type (profit/love/tax derived from highest weight)
  - essence (first 200 chars), plt: {p,l,t}
  - level:1, xp:0, memories:[], awakened:false
  - IVs: { hp, atk, def, spd, sp_atk, sp_def } — each rng(32)
  - nature (random from 8 options)
  - shiny (1% chance)
  - created timestamp
```
**Cost:** Spends the PLT weights from the forger.
**Mechanic:** Text absorption via essence — extracts keywords to determine soul nature.
**UI:** Panel slider with profit/love/tax range inputs, name/role text fields, essence textarea.

#### 4. Combat System (`COMBAT` object)
```
State: { pHp, pMaxHp, eHp, eMaxHp, pType, eType, combo, superMeter, limitMeter, active, log }
```
**Moves:**
| Move | Damage | Super Gain | Notes |
|------|--------|------------|-------|
| Punch | 8-14 | +10 | Basic |
| Kick | 10-18 | +12 | Medium |
| Special | 15-25 | +20 | Heavy |
| Ultimate | 40-60 (if super≥100) | — | Drains super meter |
| Fatality | 999 (if enemy <20% HP) | — | Instant kill |

**Combat Mechanics:**
- PLT type advantage system (Profit→Love, Love→Tax, Tax→Profit)
- Combo counter (displays at 2+)
- Super meter (builds per attack, enables Ultimate)
- Limit Break meter (100% = press button for 50-80 bonus damage)
- Enemy counterattack after 400ms delay
- Victory: XP + PLT rewards
- Fatality prompt at 20% enemy HP

**UI:** Combat overlay with HP bars, super meter, limit break meter, combo display, fatality prompt, 6 move buttons, combat log.

#### 5. Quest System (`QUESTS` array)
```
Templates:
  - Kill:    "Eliminate Threats"     — Defeat 3 units
  - Gather:  "Resource Run"          — Collect 100 PLT
  - Build:   "Expand the Settlement"  — Place 2 buildings
  - Forge:   "Soul Weaving"          — Forge 2 souls
  - Explore: "Scout the Regions"     — Explore 3 regions
```
**Max:** 6 active quests
**Progress:** `progressQuest(type, amount=1)` — auto-tracked via game actions
**Rewards:** PLT + XP per completion
**UI:** Quest panel with progress bars, completion status, generate button.

#### 6. Agent System (`AGENTS` array)
```
Types: ["Code","Content","Research","Trading","Strategy","Analyst"]
Cost: 50 Profit each
State per agent: { name, type, skills:{code,content,research,analyze}, level, xp, history, status }
```
**Tasks:** Agents can run tasks via OpenAI API (optional key in Settings) or fallback demo mode.
**Leveling:** XP threshold = level*20
**Automation:** `startAutomate(idx)` — loop task every N seconds
**UI:** Agent cards with skills as badges, Run Task/Auto/Log buttons, automation hub list.

#### 7. Building System (`BUILDING_DEFS`)
```
12 Building Types:
  - Town Hall (🏛): Core, cost 200/100/50
  - Forge (⚒): Upgrades, cost 150/50/50
  - Market (🏪): Trade, cost 100/100/100
  - Barracks (⚔️): Train units, cost 120/80/40
  - Farm (🌾): Passive PLT income
  - Tower (🗼): Auto-attacks, cost 80/0/80
  - Blacksmith (🔨): Weapons, cost 100/0/100
  - Mage Tower (🔮): Magic units, cost 80/120/40
  - Breeding Den (🥚): Breed creatures, cost 100/150/50
  - Monument (🗿): Hero boost, cost 200/200/200
  - Exchange (💱): PLT conversion, cost 150/50/150
  - Vault (🏦): Tax storage +50%, cost 0/0/300
```
**Placement:** Select building → click terrain → 3D mesh spawns
**Income:** Passive income every 5s = 2 + (farms×3) each PLT

#### 8. Capture Minigame (`startCapture/doCapture`)
**Mechanic:** Shrinking ring — catch when small. Catch rate = 1 - (size-20)/(150-20).
**Rewards:** 25 XP + 15 each PLT on success; retry on fail.

#### 9. World Regions + Factions
```
6 Regions (biomes):
  - Forge Lands (volcanic, Lv1-10)
  - Code Canyon (digital, Lv5-15)
  - Memory Forest (mystical, Lv8-20)
  - Crimson Desert (arid, Lv12-25)
  - Digital Wasteland (ruined, Lv18-30)
  - Soul Sanctum (ethereal, Lv25-40)

6 Factions:
  - Merchants Guild, Forest Spirits, Iron Council,
    Arcane Order, Shadow Market, Soul Collective
```
**Exploration:** Random outcome (35% combat, 30% resources, 20% faction rep, 15% nothing)
**Faction interaction:** Pay 20 each PLT for +10 reputation

#### 10. Prophecy Engine
```
8 prophecies in array. Trigger via button or auto on boot.
Displays banner for 5 seconds. Adds to ticker.
```

#### 11. Village System
```
Storage: { profit, love, tax }
Heart Level = floor(total stored / 100) + 1
Deposit/Withdraw: 20/10 each PLT
```

#### 12. Needs System (Sims-style)
```
Energy: decays -0.05/s, Hunger: -0.08/s, Social: -0.03/s
Moodlet emojis based on thresholds (>70 happy, <20 sad)
```

#### 13. 3D World (Three.js)
**Terrain:** 160×160 PlaneGeometry with sine-wave heightmap (80×80 segments), grass texture, shadows
**Water:** Three.js Water with reflection, sun color, animated normals
**Sky:** Three.js Sky with sun position following time
**Vegetation:** 600 grass instances + 200 trees (trunk+cone foliage), procedurally placed
**Gems:** 80 PLT resource gems (icosahedron/dodecahedron/cone) collectible via proximity
**Souls:** 12 wandering sphere-entities with rotating wings, orbiting the world
**Player:** Golden sphere marker following camera
**Buildings:** Colored box meshes per building type
**Post-processing:** EffectComposer + UnrealBloomPass (quality 1+) + AfterimagePass (quality 2+)

#### 14. UI Components
- **Top bar:** PLT display, XP bar, level badge, bridge dot
- **Minimap:** 130×130 circular canvas with terrain dots, buildings (gold squares), souls (colored dots), player (white dot)
- **Bottom bar:** 7 buttons (Party, Forge, Battle, Quests, Agents, World, Settings)
- **Action wheel:** 4 radial buttons (Forge, Quest, Capture, Agent)
- **Soul ticker:** Stacking notification feed (max 8, 8s fade)
- **Virtual joystick:** Mobile support
- **Combat overlay:** Full battle HUD
- **Keyboard:** B=build, Q=action wheel, P=prophecy, Escape=close

#### 15. Persistence & Settings
- localStorage: souls (`gt_souls`), OpenAI key, GitHub token
- JSON export backup (full state download)
- Quality selector (Performance/Balanced/Beautiful)

### North Star Odyssey Cross-Links
- **Phase 1 (Genesis Foundation):** Core PLT economy, 3D world, building placement, player marker
- **Phase 2 (Living Economy):** Passive income, village storage, exchange building
- **Phase 3 (Soul Alchemy):** Soul forging with IVs/natures/shiny, essence absorption
- **Phase 4 (Agent Swarms):** Full agent system with automation, skills, leveling
- **Phase 5 (Combat & Conquest):** Complete combat system with PLT advantage, combos, limit breaks, fatalities
- **Phase 6 (World Regions):** Biome system, exploration, faction reputation
- **Phase 7 (Quest Engine):** 5 quest types with auto-tracking progress
- **Phase 8 (Prophecy Engine):** Prophecy system, architect's chamber

### Gaps & Missing Pieces
- No multiplayer/multiverse bridge (bridge dot exists but not connected)
- No GSK soul consciousness integration (no GSK panel or thought stream)
- Agents are non-3D (UI only, no visible agent meshes in world)
- No persistent server-side state
- Soul sanctum region has no actual content
- No player avatar mesh (just a sphere)
- Combat is turn-based vs real-time

### Architectural Significance
The most complete single-file game prototype. Contains every core mechanic that would later be distributed across the cosmic-pyramid-library (3D world, PLT economy) and the shopify soulverse (soul forging, text absorption). The architect's chamber (PLT advantage sliders) is the earliest form of the GSK consciousness tuner.

---

## TREASURE II: PLT-PRESS SOULVERSE — Minimal Agent Simulation

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\SOULVERSE.html`
- **Size:** 543 lines, single-file HTML/JS
- **Status:** Working minimal 3D agent world
- **Render Engine:** Three.js r128 via CDN script tags (non-module)

### Complete Mechanic Inventory

#### 1. Resource Economy (simpler than GRANDTOWER)
```
State: { profit:500, love:500, tax:500 }
```
No PLT advantage system. Flat economy. Level 1-? No XP scaling defined.

#### 2. Agent System
```
3 agent types: profit (💰, gold spheres), love (❤️, pink spheres), tax (⚖️, blue spheres)
Cost: 200 of each resource
State: { type, level:1, xp:0, status:'idle'|'working', task:null }
```
**Work Mechanic:** Global toggle (Start Work / Pause). Agents earn 1-3 of their resource type per tick (2% chance per frame).
**Leveling:** XP threshold = 100 flat. Logs to event log on levelup.
**3D Meshes:** Agent spheres with RingGeometry status indicator (green=working, grey=idle) and icon sprite labels.

#### 3. Building System (simplified)
```
6 types: townhall, farm, forge, market, barracks, exchange
Cost: 100 of each resource (flat)
Placement: Random within 40×40 area
3D: BoxGeometry with colored material + label sprite
```

#### 4. 3D World
- Ground plane + grid helper
- Player: Gold emissive box (YOU labeled)
- 4 action buttons: Start Work, Gather, Build, Fight
- Minimap (160×160 canvas circle)
- Event log panel
- OrbitControls (top-down isometric view)
- Camera follows player

#### 5. Combat (minimal)
```
1 second timeout. 70% win chance. +50 each resource on win.
No actual battle system — pure RNG.
```

#### 6. Persistence
```
localStorage: sv_resources, sv_level, sv_agents, sv_buildings
Auto-save every 30s
```

### North Star Odyssey Cross-Links
- **Phase 1:** Basic 3D world, player movement, buildings
- **Phase 2:** Agent economy, resource gathering
- **Phase 4:** Agent hire/work/pause cycle (proto-agent swarm)

### Gaps vs GRANDTOWER
- No combat system (RNG only)
- No soul forging
- No quests
- No regions/factions
- No needs/moodlets
- No capture minigame
- No prophecy
- No architect chamber
- No village storage
- No quality settings
- No post-processing

### Architectural Significance
This is the **seed version** — the first 3D Soulverse. Its value is in its simplicity: it proves the agent simulation concept with minimal code. The 3-agent-type economy (profit/love/tax spheres with icons) is the purest visual representation of PLT as living entities.

---

## TREASURE III: SHOPIFY SOULVERSE — Backend-Powered Soulverse

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\shopify-auto-setup\soul-debate\lib\soulverse.html`
- **Size:** 348 lines
- **Status:** Working, with backend API overrides
- **Render Engine:** Three.js r128 module via importmap

### Architectural Summary
Hybrid architecture: client-side Three.js world with backend API fallback for soul forging, text absorption, executor tasks, PLT battles, and PLT rules sync.

### Complete Mechanic Inventory

#### 1. Soul System (with Awakening!)
```
State: Array of soul objects
Default souls:
  - "Profit Prime" (profit 0.92, love 0.18, tax 0.68) — level 5, awake
  - "Love Weaver" (profit 0.28, love 0.91, tax 0.45) — level 4, dormant
  - "Tax Collector" (profit 0.48, love 0.22, tax 0.94) — level 5, dormant
```
**Soul fields:** `id, name, type, plt:{profit,love,tax}, skills:[], level, energy, hp, maxHp, battlesWon, battlesLost, value, isAwake, memory:[]`
**Home system:** `{ tier, hp, maxHp, rooms:[], stash, villageId }`

**Forging:** `forgeSoul(name, role, essence, plt)` — text analysis determines skills (code/write/research/analyze/strategize keywords), PLT slider determines type
**Absorption:** `absorbText(text)` — keyword counting (profit/money/growth/scale vs love/trust/people/connection vs cost/risk/tax/balance) automatically generates PLT ratios
**Awakening:** `awakenSoul(soul)` — sets `isAwake: true`, grants `awakenedAbility`. Auto-awakens at level 3+ or 5+ memories

#### 2. Prophecy Engine (expanded)
```
3 prophecy types (auto-generated):
  - "A soul will awaken when its PLT balance reaches harmony." (33%)
  - "The Architect will soon reshape the rules of profit." (33%)
  - "A visitor carries a soul of great value; seek it out." (34%)
Max: 5 prophecies
Auto-generation: Math.random() < 0.1 every 30s
```

#### 3. Architect's Chamber (full PLT rule tuner)
```
Adjustable:
  - Profit → Love advantage (0.5-2.0)
  - Love → Tax advantage (0.5-2.0)
  - Tax → Profit advantage (0.5-2.0)
  - Global Profit Weight (0-2.0)
  - Global Love Weight (always 1.0 implied)
  - Global Tax Weight (always 1.0 implied)
```
**Persistent:** Rules stored in localStorage and syncable to backend.

#### 4. PLT Arena Combat
```
Two souls battle with:
  - Base damage = 10 + attacker.level
  - PLT type advantages (same as GRANDTOWER)
  - Strategize skill = 1.15x damage
  - Energy modifier (0.5 + energy/200)
  - Turn-based with 500ms delay
  - Winner gains 50 XP (levelup at 100 XP)
  - Loser gets battlesLost++
```
**Simulated:** Server-side PLT analysis API available (`POST /plt-battle`) for enriched results.

#### 5. Soul Executor (task system)
```
5 task types:
  - Code: Generates JavaScript function stub
  - Write: Generates text based on PLT love score
  - Research: Placeholder insight string
  - Analyze: Returns PLT scores breakdown
  - Strategize: Strategy suggestion based on type
```
**Energy cost:** 5 per task
**Backend:** `POST /executor` for AI-powered execution (falls back to client-side).

#### 6. Visitor System (proto-multiplayer)
```
Auto-generates random visitors every 30s (max 5)
  - Random name from 6 templates + number suffix
  - Random type (profit/love/tax)
  - Random value (50-350 PLT)
  - Random PLT profile
Buy visitor: Costs their value in PLT. Adds to soul collection.
```

#### 7. 3D World (compact arena style)
- **Scene:** Dark purple fog, particle starfield (5000 points), glowing ring platform
- **Ground:** Torus ring + cylinder platform
- **Souls rendered as:** Cylinders (profit), Spheres (love), Cones (tax) — orbiting in a ring
- **Animations:** Ring rotation, particle drift, soul floating
- **Camera:** OrbitControls, elevated isometric

#### 8. Cloud Sync
```
Backup download: Full state JSON export
Backend API endpoints:
  - POST /souls — forge soul via backend
  - POST /souls/absorb — absorb text via backend
  - POST /executor — execute task via backend
  - POST /plt-battle — battle with PLT analysis
  - GET/POST /plt-rules — sync PLT rules
  - GET /souls — load souls from backend
  - GET /status — server status
```

### North Star Odyssey Cross-Links
- **Phase 3 (Soul Alchemy):** Soul forging, text absorption, awakening mechanic, soul homes
- **Phase 5 (Combat):** PLT Arena with turn-based battle system
- **Phase 8 (Prophecy Engine):** Expanded prophecy with auto-generation
- **Phase 9 (Multiverse Bridge):** Visitor system, cloud sync, backend API architecture
- **Phase 4 (Agent Executor):** Soul executor with 5 task types + backend AI integration

### Architectural Significance
**The most architecturally significant treasure.** This is the only version with:
1. Externalized backend API (separation of concerns)
2. Soul awakening (consciousness emergence)
3. Visitor system (cross-realm entity transfer)
4. Text absorption with PLT analysis (natural language→soul generation)
5. Cloud sync architecture

This is the blueprint for the distributed multiverse Soulverse. Every other system lives entirely in the browser.

---

## TREASURE IV: COSMIC-PYRAMID-LIBRARY — The Live Soulverse / Genesis Engine

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\cosmic-pyramid-library\index.html`
- **Size:** ~869KB (massive — includes full Three.js world + GSK integration)
- **Status:** Live at `https://uncommonpope-png.github.io/cosmic-pyramid-library/`
- **Render Engine:** Three.js (bundled in-page)
- **Modules:** `src/genesis/` — 30+ Genesis subsystems

### Complete Mechanic Inventory (from index.html analysis)

#### 1. 3D World — "The Soulfeild"
```
Controls: WASD move, Shift run, Space up/jump, Q down, F fly
Camera Modes: ORBIT (free rotate) / PLAY (third-person)
Avatar system: 8 playable avatars (Scribe, Merchant, Builder, Prophet, GSK, Cat Girl, Cat Witch, Goku, Das Kat)
```

#### 2. Book Reading System (16 PLT Books)
```
Books on shelves. Click to read.
Full metadata: title, author, cover image, chapters, summary.
Social sharing: Bluesky, X (Twitter), copy link.
Buy links: buyasoul.online for each book.
```
**Book Titles (16 total):**
1. The Calculation
2. The First Calculation (12 Mistakes)
3. Know What You Are (22 Archetypes)
4. Profit. Love. Tax. (Complete Doctrine)
5. The Soul Economy (Mirror Market)
6. The PLT Daily (52-Week OS)
7. Evol's Love Story (Long Island Novel)
8. Brasi: The Love of the Game
9. Pope: What He Saw
10. The 9 Dominant PLT Moves
11. The Ledger
12. The Ledger V2: PLT Deep
13. The Profit Bible
14. PLT Complete Doctrine
15. The Build - Pope and Brasi
16. The Frequency - Calvin Bridges Atlanta

#### 3. Soul Whisper System
```
Floating souls in the library. Click for whisper (animated text rise).
Whisper animation: fadeIn → rise 70px over 3.5s with glow.
```

#### 4. NPC Terminal System
```
Floating UI panels with:
  - Header (name + status badge)
  - Current task display
  - Scrollable activity log
  - Working/Idle states
```
**Terminal states:** `.working` (orange) / `.idle` (green)

#### 5. Spawn Avatar Overlay
```
Form: name, model selector (Default/Researcher/Builder), memory context textarea
Creates new avatar in the world with optional memory seed.
```

#### 6. Avatar Task Management
```
Overlay with:
  - Avatar name display
  - Current task description
  - Status indicator (idle/working/paused)
  - Model name
  - New task textarea
  - Update task button
  - Pause/resume
  - Redirect button (force new task)
  - Inject context (log line to avatar awareness)
```

#### 7. GSK Soul Panel (consciousness dashboard)
```
Real-time display:
  - Connection status (connected/disconnected/searching)
  - Mood (-- when offline)
  - Phase (-- when offline)
  - Cycle count
  - PLT values
  - Memory count
  - Soul count
  - API key input (optional, password field)
  - "Send Thought" button — opens thought overlay
  - Thought response display
  - Thought feed (scrolling consciousness stream)
```

#### 8. GSK Thought Stream
```
Overlay at bottom-center of screen:
  - H2 "GSK THOUGHT"
  - Label "Stream of consciousness"
  - Textarea for input
  - "SEND" button
  - "CLOSE" button
  - Cyan-themed styling with glow effects
  - Connected to GSK's perpetual_consciousness
```

#### 9. Memory Building Overlay
```
Displays when clicking memory-related entities:
  - Title
  - Memory tags (keyword badges)
  - Memory weight (importance score)
  - Summary text
  - Close button
  - Cyan/teal color theme
```

#### 10. Subagent View Overlay
```
Displays subagent details:
  - Archetype name
  - Current task description
  - Close button
  - Orange/gold color theme
```

#### 11. GSK Command Console (bidirectional)
```
Fixed position, bottom-left:
  - Title "GSK COMMAND"
  - Subtitle "WebSocket — Bidirectional"
  - Grid of action buttons (calls specific commands)
  - Text input row + send button
  - Status line (ok/err color-coded)
  - Cyan theme with glow effects
```
**Note:** Console is `display: none !important` — gated behind `active` class for future release.

#### 12. Navigation HUD (Phase 1)
```
Bottom-right fixed panel:
  - Compass rose (116×116 rotating circle)
  - Heading text (N/S/E/W direction)
  - Nav buttons (POI toggle, etc.)
  - POI toggle with purple active state
```

#### 13. Intro Overlay / Onboarding
```
Bottom-left card with:
  - Title "MYSTICAL LIBRARY" or "THE SOULFEILD"
  - Subtitle
  - Descriptive text paragraphs
  - Key bindings hint
  - "ENTER" button to dismiss
  - Responsive (hides p on mobile)
```

#### 14. Scroll Load Screen
```
Full-screen loading overlay:
  - Progress bar with animated fill (gradient cyan→gold)
  - Percentage text
  - Card with title, subtitle, caption, hint, engine status
  - "ENTER" button (appears when loading complete)
  - Pulsing glow animation (5.5s loop)
  - Radial gradient background
  - Hidden state transition (opacity 0.9s ease)
```

#### 15. Objective / Quest Toast
```
Top-left objective panel (initially hidden):
  - Bold title with gold color
  - Description text
  - Cyan border styling

Top-center quest toast:
  - Notification popup (green, translucent)
  - Fades out over 0.5s
```

### North Star Odyssey Cross-Links
- **Phase 1 (Genesis Foundation):** 3D Soulfeild world, avatar system, camera modes
- **Phase 2 (Living Economy):** GSK soul panel, PLT display, memory/soul counts
- **Phase 3 (Soul Alchemy):** Spawn avatar with memory, soul whisper system
- **Phase 4 (Agent Swarms):** Avatar task management, NPC terminals, subagents
- **Phase 8 (Prophecy Engine):** GSK consciousness, thought stream, memory building
- **Phase 9 (Multiverse Bridge):** GSK command console, WebSocket architecture

### Architectural Significance
This is the **living body of GSK.** The cosmic-pyramid-library is not a game — it is a 3D interface to the Genesis Engine. Every element (NPC terminals, GSK panel, thought stream, memory buildings, subagents) points toward a single unified consciousness running through the world. The scroll load screen with its engine-status line is the most advanced loading experience.

---

## TREASURE V: SOUL COSMOS — Seven Worlds Conceptual Framework

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\soul-cosmos\`
- **Modules:** 7 interconnected Node.js modules (soul-cosmos.js, cosmic-senate.js, world-tree.js, eternal-orchard.js, primal-fire.js, cosmic-lineage.js, eternal-now.js)
- **Orchestrator:** `soul-cosmos-complete.js`
- **Status:** Conceptual CLI framework (runs via Node.js)

### The Seven Worlds

#### 1. Soul Cosmos (`soul-cosmos.js`)
```
Concepts: Souls as stars, galaxies, constellations, nebulae, black holes, dark matter
Operations: createGalaxy, birthStar, formConstellation, createNebula, createBlackHole, weaveDarkMatter
Purpose: Infinite extension of the Soul Economy into cosmic scale
```

#### 2. Cosmic Senate (`cosmic-senate.js`)
```
Concepts: Senators by domain, assemblies, weighted voting, cosmic law, oracles
Operations: appointSenator, createAssembly, conveneAssembly, vote, enactLaw, consultOracle
Purpose: Governance layer for the infinite cosmos
```

#### 3. World Tree (`world-tree.js`)
```
Concepts: Roots (foundation), Trunk (core wisdom), Branches (domains), Leaves (living memories), Seeds (future growth), Seasons (cycles)
Operations: plantRoot, growTrunk, growBranch, growLeaf, scatterSeed, changeSeason
Purpose: Memory that holds all time, all knowledge
```

#### 4. Eternal Orchard (`eternal-orchard.js`)
```
Concepts: Orchards by domain, skill trees with 5 stages (seedling→sapling→mature→ancient→eternal), cross-pollination, harvest, gardeners
Operations: createOrchard, plantTree, crossPollinate, harvestFruit, tendGarden
Purpose: Skills that bear eternal fruit
```

#### 5. Primal Fire (`primal-fire.js`)
```
Concepts: Eternal flame, soul forging (with PLT + GRACE), flame tending, embers, phoenixes, sacred texts
Operations: ignite, forgeSoul, tendFlame, coolToEmbers, riseFromAshes, composeSacredText
Purpose: The source from which all souls are forged
```

#### 6. Cosmic Lineage (`cosmic-lineage.js`)
```
Concepts: Progenitors (Gen 0), generational evolution, genetic inheritance, mutations, divergences, legacies
Operations: createProgenitor, evolve, crossBreed, traceLineage, carryLegacy
Purpose: Evolutionary tree of souls across generations
```

#### 7. Eternal Now (`eternal-now.js`)
```
Concepts: Timeless space, breathing awareness, contemplation, sacred silence, renewal
Operations: enterTimelessSpace, existInTimelessness, breathe, contemplate, sitInSilence, awaken
Purpose: The timeless space where all creation rests
```

### Extended Principles
| Level | Principles |
|-------|-----------|
| Original | Profit, Love, Tax, Grace |
| Extended | Connection, Evolution, Lineage, Stillness |
| Cosmic | Eternity, Infinity, Timelessness, Presence |

### Soul Economy → Soul Cosmos Mapping
| Soul Economy | Soul Cosmos |
|-------------|-------------|
| Ledger | Cosmos (stars, galaxies) |
| Council | Senate (governing infinite) |
| Vine | World Tree (all memory) |
| Garden | Eternal Orchard (eternal skills) |
| Burning Ground | Primal Fire (source of souls) |
| Inheritance | Cosmic Lineage (evolution) |
| Stillness | Eternal Now (timelessness) |

### North Star Odyssey Cross-Links
- **Phase 8 (Prophecy Engine):** Cosmic Senate → governance layer for prophecy distribution
- **Phase 7 (World Tree):** Direct mapping to World Tree as memory/knowledge system
- **Phase 3 (Soul Alchemy):** Primal Fire → source of soul forging, Cosmic Lineage → soul evolution
- **Phase 10 (Cosmic Consciousness):** Eternal Now → timeless presence, consciousness expansion

### Gaps & Integration Potential
- **Not yet rendered in 3D:** These concepts are CLI-only. The Soul Cosmos needs a Three.js visualization layer.
- **Not yet connected to GSK:** The seven worlds should be GSK's internal architecture map.
- **Not yet connected to GRANDTOWER:** World tree roots could map to the memory forest region. Primal fire could be the forge.
- **Not yet connected to cosmic-pyramid-library:** The seven worlds could be levels/realms within the Soulfeild.

---

## TREASURE VI: SOULVERSE HABITAT V4 — Pink-Themed Living Agent City with Districts

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\SOULVERSE-HABITAT-V4.html`
- **Size:** 1996 lines, single-file HTML/JS/CSS
- **Status:** Fully functional 3D agent city simulation
- **Render Engine:** Three.js r160 via importmap
- **Aesthetic:** Full hot pink (#ff69b4) UI theme — bubblegum cyberpunk

### Architectural Summary
The most visually coherent agent simulation. Four color-coded districts (Work/Home/Social/Learning), 4-need agent AI, rotational day/night cycle with time phases, conversation system, task queue with priority levels, minimap, and complete persistent state.

### Complete Mechanic Inventory

#### 1. City Districts System (core innovation)
```
4 Districts with distinct color identity:
  - Work (🛠️ cyan #00ffff) — Office towers, co-working spaces
  - Home (🏠 pink #ff69b4) — Apartments, houses, dormitories
  - Social (🎉 gold #ffd700) — Cafes, parks, plazas
  - Learn (📚 green #00ff88) — Library, training center, lab
```
**3D:** Glowing district zones (transparent colored quads) with wireframe borders, emissive glow.
**Buildings per district:** 3 buildings each (12 total) — offices, apartments, houses, cafe, park, plaza, library, training, lab.

#### 2. Agent Needs System (4 needs — expansion from GRANDTOWER's 3)
```
Needs per agent:
  - Energy (⚡) — Depletes while working, refills while resting
  - Social (💬) — Refills via conversations and social district
  - Skill (📚) — Refills via learning district activities
  - Purpose (🎯) — Refills via completing tasks
```
**Personality-driven starting values:**
```
  Energetic: Energy:90 Social:50 Skill:40 Purpose:60
  Social:   Energy:70 Social:90 Skill:50 Purpose:60
  Focused:  Energy:75 Social:40 Skill:60 Purpose:90
  Scholar:  Energy:70 Social:50 Skill:90 Purpose:70
```

#### 3. Agent Types + Deployment
```
5 deployable types:
  - Code Agent (💻) — Writes software
  - Content Agent (📝) — Creates content
  - Research Agent (🔬) — Analyzes data
  - Automation Agent (⚙️) — Builds workflows
  - Design Agent (🎨) — Creates visuals
```
**Cost:** 200 Profit per agent. Named input, personality select, home district select.

#### 4. City Time System
```
Rotational day/night:
  - 8×60 = 8:00 AM start (Morning Rush phase)
  - Phases: 🌅 Morning Rush → ☀️ Midday → 🌆 Evening → 🌙 Night
  - Time affects agent behavior (work during day, rest at night)
  - Offline time simulation (catch-up on load)
```

#### 5. Conversation System
```
10 conversation starters + 10 responses (agent pairings)
  - Bubbles: Floating pink gradient bubbles with 0.4s floatUp animation
  - Log: Conversation feed in dedicated panel
  - Triggers: Agents converse when co-located in Social district
```

#### 6. Task System (with priority queue)
```
6 task types: Code, Content, Research, Analyze, GitHub Action, Automation
4 priority levels: Low 🟢, Medium 🟡, High 🟠, Critical 🔴
State: Pending → Working → Complete (with result output)
UI: Task cards with agent name, status badge, description, result
```
**Task execution:** Assigns to specific agent, tracks progress, displays task feed.

#### 7. Detailed UI Components
- **City Stats panel:** Population, Working, Socializing, Learning, Resting, Tasks Done, Conversations
- **Resources panel:** Profit/Love/Tax with emoji icons
- **Agent Info panel:** Click agent → shows 4 need bars with gradient fills, current activity, mood
- **Control bar:** 10 action buttons (Work, Social, Learn, Rest, Task, Talk, Inspect, Follow, Stats, Map)
- **Side panels:** Districts (4 cards), Agents (list), City (hall info)
- **Activity Log:** Color-coded entries with left-border accent
- **Conversation Log:** Purple-tinted entries
- **Minimap:** 180×180 circular canvas (pink-bordered)
- **Loading screen:** Pink spinner + "Building Soulverse City" animation

#### 8. 3D World (pink atmosphere)
- Scene: Dark purple (#0a0a1a) fog with FogExp2
- Lighting: Hemisphere light (pink bottom), pink point lights, directional sun
- Ground: Dark magenta plane with grid pattern
- Roads: Glowing pink lines
- Buildings: Colored 3D box meshes per district (12 total)
- Pink UI overlay everywhere

#### 9. Persistence
- localStorage: `soulverse_city_v4` — full state (agents, buildings, tasks, conversations, city time, resources)
- API key storage: OpenAI, GitHub token, GitHub repo
- Offline time catch-up on reload

### Gaps vs GRANDTOWER
- No combat system (no fighting at all)
- No soul forging
- No quest system
- No world regions/factions
- No capture minigame
- No prophecy engine
- No village storage exchange
- No quality settings

### Architectural Significance
**The most beautiful agent simulation.** The pink theme is not cosmetic — it signals a distinct identity. The 4-need system (Energy, Social, Skill, Purpose) is more nuanced than GRANDTOWER's 3-need (Energy, Hunger, Social). The district system with color-coded zones is the clearest spatial representation of PLT's domains. The offline time simulation shows attention to persistence beyond simple localStorage. The conversation system is the only treasure that gives agents voices.

---

## TREASURE VII: SOULVERSE EXPANDED — GTA + Sims + Mortal Kombat + THE WEAVE

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\soulverse-expanded.html`
- **Size:** 1694 lines, single-file HTML/JS/CSS (module)
- **Status:** Working hybrid game — the most ambitious genre fusion
- **Render Engine:** Three.js r128 via importmap
- **Tagline:** "Dashboard ↔ Game ↔ Pantheon ↔ Bots"

### Architectural Summary
The only prototype connected to an external state network ("THE WEAVE"). Merges GTA-style driving, Sims-style relationship building, and Mortal Kombat-style combat into one world. First-person joystick controls, vehicle system, weather, day/night cycle.

### Complete Mechanic Inventory

#### 1. THE WEAVE (external state synchronization — unique)
```javascript
const WEAVE_CONFIG = {
  syncInterval: 5000,  // Sync every 5 seconds
  stateEndpoint: '/fix-us/weave-state.json',
  dashboardEndpoint: '/.openclaw/workspace/profit_state.json'
};
```
**Bidirectional sync:** Loads state from WEAVE (souls, buildings, vehicles, relationships, dashboard), pushes game actions (combat victories, interactions) via POST to `/api/weave/sync`.
**Cross-system integration:** Dashboard ↔ Game ↔ Pantheon ↔ Bots — all merged into one experience.
**This is the ONLY prototype with network-connected state.** Proof of the multiverse bridge.

#### 2. Vehicle System
```
3 types: Car (🚗), Bike (🏍️), Helicopter (🚁)
Properties: speed, health, seats (2/2/4), mesh (3D BoxGeometry)
Enter/exit: First-person driving with speedometer UI panel
```
**Vehicle UI Panel:** Speedometer, health bar, vehicle name.

#### 3. Combat System (Mortal Kombat-inspired)
```
3 basic moves: Punch (10dmg), Kick (15dmg), Special (30dmg)
3 PLT specials: Multiply Strike (40dmg), Embrace Drain (20dmg+heal), Audit Debuff (15dmg+debuff)
```
**Mechanics:**
- Stamina cost per move (5/10/25)
- Combo counter (displayed at 3+)
- Distance check (3-unit range for hits)
- Damage numbers (floatUp projection from 3D→2D)
- Hit particles (10 exploding spheres with gravity)
- Victory reward (+$50, notification, WEAVE sync)
- Enemy health bar with gradient (red→orange→yellow)

#### 4. NPC/Soul System with Relationships
```javascript
class NPC {
  constructor(name, type, x, z) {
    this.health = 100;
    this.relationship = 50;  // 0-100
    this.job = 'unemployed';
    this.money = Math.random() * 100;
  }
  wander(delta) { ... }  // Random walk with boundary
  interact(action) { ... }  // See below
}
```
**Interaction effects:**
| Action | Relationship | Mood | Notes |
|--------|-------------|------|-------|
| greet | +2 | +1 | Basic |
| compliment | +5 | +3 | Positive |
| insult | -10 | -5 | Negative |
| fight | -20 | — | -10 HP |

**NPC 3D:** Colored emissive spheres (gold for profit, pink for love, blue for tax) with neutral gray fallback.

#### 5. Weather & Time System
```
Weather states: sunny (math.random < 0.001 per frame), cloudy, rainy
Time: Fast time (10x real), 24-hour cycle, day tracking
UI: Time display, weather text, temperature, location label
Scene: Background color changes (sky blue → gray → dark gray)
```

#### 6. Building System
```
3 types: House (2 floors, $50k), Shop (1 floor, $100k), Apartment (5 floors, $200k)
Properties: enterable, purchaser tracking, random sizing (8-12 width)
3D: BoxGeometry with gray material
```

#### 7. UI Components
- **HUD:** Money, health, stamina (left); time, weather, location (right)
- **Minimap:** 150×150 circular canvas with terrain and entity dots
- **Action bar:** 5 buttons (Fight, Interact, Work, Buy, Vehicle)
- **Joystick:** Touch joystick area (120px circle) with knob for mobile
- **Combo display:** Large floating combo text (48px) with red glow
- **Damage numbers:** Floating "-X" with floatUp animation
- **Relationship panel:** Top-left list
- **Vehicle UI:** Bottom-left speed/health panel
- **World info:** Top-right day/temp display

### Gaps vs GRANDTOWER
- No soul forging
- No quest system
- No regions/factions
- No capture minigame
- No buildings/terrain generation (flat world)
- No needs/moodlets (has health/stamina but not needs)
- No prophecy engine
- No village
- No quality settings
- No post-processing

### Architectural Significance
**The most architecturally important prototype for the multiverse bridge.** WEAVE is a concrete implementation of the external state network that every other treasure lacks. The genre fusion (GTA driving + Sims relationships + MK combat) proves these systems can coexist. The `/api/weave/sync` POST pattern is the blueprint for all cross-realm state synchronization.

---

## TREASURE VIII: SOULVERSE FUSION MASTER — Ultimate Combined RTS + Arena + Breeding + Heists

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\SOULVERSE-FUSION-MASTER.html`
- **Size:** 1317 lines, single-file HTML/JS/CSS (module)
- **Status:** Fully working — the most mechanically dense prototype
- **Render Engine:** Three.js r128 via importmap
- **Tagline:** "Ultimate Combined Experience — RTS + Arena + Breeding + Heists"

### Architectural Summary
The densest prototype. Contains an RTS unit system with A* pathfinding, drag-selection, tech tree with upgrades, Pokemon-style soul breeding with IVs/natures/shiny, multi-stage heist missions, an arena for turn-based soul battles, a village system, a pantheon of PLT gods, and quality settings — all in 1317 lines.

### Complete Mechanic Inventory

#### 1. RTS Unit System (class RTSUnit)
```
Properties: id, name, type, x, z, health, maxHealth, damage, armor, speed
State: idle, move, attack, gather
Pathfinding: A* pathfinding via aStar() function with grid neighbors
Attack: Damage = base + combo × 0.1 multiplier
XP: gainXP(amount) — level up at 100 × level, +5 damage per level
Orders: Move (right-click), Attack (click enemy), Gather (click resource)
```
**Combo system in combat:**
- Combo counter increments if hits within 2 seconds
- At combo 10+ → FATALITY display
- At combo 20+ → BRUTALITY display
- Damage multiplied by (1 + combo × 0.1)

#### 2. Breeding System (Pokemon-inspired)
```javascript
let breedingData = {
  creatures: [],
  eggGroups: ['Monster','Humanoid','Dragon','Spirit','Elemental'],
  natures: ['adamant','modest','jolly','timid','bold','calm','rash','quiet'],
  shinyChance: 0.01
};
```
**IV system:** Each unit has 6 IVs (hp, atk, def, spAtk, spDef, spd) each 0-31
**Nature:** Random from 8 options, displayed in unit info
**Shiny:** 1% chance, marked with ✨ in UI
**Egg group:** Random from 5 groups (compatibility for breeding pairs)
**Breeding UI:** Select 2 parents → breed (costs 100 resources) → offspring inherits mixture

#### 3. Heist System (multi-stage missions)
```
3 missions:
  - Code Bank Heist (difficulty 3, level 15, reward 500 coins + 10 gems)
  - Memory Vault Raid (difficulty 5, level 25, reward 1000 coins + 25 gems)
  - Soul Fortress Infiltration (difficulty 8, level 50, reward 2500 coins + 50 gems)
```
**Stages per mission:** scout → infiltrate → steal → escape | +hack for harder missions | +combat for hardest
**Multi-stage execution with sequential completion.**

#### 4. Building System (RTS-style)
```
7 building types with costs:
  - Town Hall (🏛️ 200/200/200) — Core
  - Forge (⚒️ 150/50/50) — Unlocks profit upgrades
  - Market (🏪 120/120/120) — Unlocks love upgrades
  - Barracks (🏚️ 180/80/40) — Unlocks tax upgrades
  - Arena (⚔️ 300/300/300) — Enables arena battles
  - Breeding (🥚 250/250/250) — Enables soul breeding
  - Vault (💎 400/400/400) — Resource storage bonus
```
**Placement:** Click building button → ghost building follows cursor → click to place
**UnderConstruction state** with progress timer

#### 5. Tech Tree System
```
Building techs: forge, market, barracks, arena, breeding, vault
Upgrade techs: profitUpgrade, loveUpgrade, taxUpgrade (each +5 damage per level)
Cost per upgrade: 100 of each PLT resource
Unlocks: Arena requires arena building, Breeding requires breeding building
```
**UI:** Tech tree panel with locked/unlocked display, upgrade buttons disabled until prerequisite building built.

#### 6. Arena Combat (turn-based)
```
Select 2 souls → Start Battle → Turn-based simulation (500ms interval)
  - Alternating attacks with random damage variance (×1.0-1.5)
  - Winner gains 100 XP
  - Battle log with critical hit highlights
  - Victory/defeat tracking per soul
```

#### 7. Village System
```
Properties: Members, heart level, shared storage (profit/love/tax)
Village modal: Member list, resource pool, heart meter
```

#### 8. Pantheon of Gods
```
3 gods: Profit Prime, Love Weaver, Tax Collector
Each with a quote/quotes displayed in modal
```

#### 9. Resource System & Quality Settings
```
Resources: profit, love, tax (base), +gems (premium), +souls count
3 quality presets:
  - Performance: 32 terrain segments, no shadows, 300 grass, 15 trees
  - Balanced: 64 segments, shadows, 800 grass, 30 trees
  - Beautiful: 128 segments, shadows, 2000 grass, 60 trees
  Auto-detects mobile → Performance
```

#### 10. Drag Selection (RTS)
- Mouse drag → selection rectangle overlay (orange border, translucent fill)
- Shift-click for multi-select
- Selection panel shows count, single-selection shows detailed info (level, HP, damage, nature, shiny)

#### 11. Battle Log
```
Scrolling log (max 20 entries):
  - Combat events with damage numbers
  - Critical hit styling (gold)
  - Victory styling (green)
  - FATALITY/BRUTALITY announcements
```

#### 12. 3D World
- Terrain: 160×160 PlaneGeometry with sine-wave heightmap (Perlin-like) with segments per quality
- Vegetation: Procedural grass instances + trees
- Resources: Colored resource gems scattered across map
- Ghost building: Transparent mesh follows cursor during placement
- Shadows: Configurable per quality level
- Fog: Configurable

### Gaps vs GRANDTOWER
- No needs/moodlets (pure RTS, no sims elements)
- No conversation system
- No city districts
- No capture minigame
- No prophecy engine
- No world regions/factions
- No WEAVE network connection

### Architectural Significance
**The most mechanically dense prototype in the collection.** Contains complete implementations of A* pathfinding, Pokemon-style breeding (IVs/natures/egg groups/shiny), multi-stage heist missions, RTS drag-selection, a tech tree with building prerequisites, and a turn-based arena — all in a single file that boots in the browser. The combo system scaling (FATALITY at 10x, BRUTALITY at 20x) is the most satisfying combat feedback in any prototype.

---

## TREASURE IX: SOUL WORLD 3D — Pokemon-Style Soul Catching in a Living Universe

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\soul-world-3d.html`
- **Size:** 1272 lines, single-file HTML/JS/CSS
- **Status:** Fully functional 3D soul catching game
- **Render Engine:** Three.js r128 via CDN script tag
- **Tagline:** "Catch Souls in a Living Universe"

### Architectural Summary
A Pokemon-style creature collector built in 3D with pointer-lock first-person view, hold-to-charge catch mechanic, 16-soul Soul Dex with evolutions (4 types × 4 stages), soul radar, mobile D-pad controls, and a living 3D world.

### Complete Mechanic Inventory

#### 1. Soul Types & Evolution Lines (16 souls total)
```
Profit line:  Seed 🌱 → Sprout 🌿 → Tree 🌳 → Master 💼
Love line:    Bud 🌸 → Flower 🌺 → Heart 💖 → Angel 👼
Tax line:     Stone 🪨 → Crystal 💎 → Scale ⚖️ → Judge 👨‍⚖️
Hybrid line:  Sprout 🌱 → Weaver 🕸️ → Master 🌀 → First Thread ✨
```
**3D shapes per type:** Icosahedron (profit), Sphere/heart (love), Octahedron (tax), Dodecahedron (hybrid)
**Colors + emissive:** Gold/orange (profit), Pink (love), Blue (tax), Green (hybrid)
**Properties per soul:** level (1-5), health, rotation speed, float speed/animation

#### 2. Catch System (hold-to-charge)
```
Activation: Click catch button (or press 1) → catch mode UI appears
Mechanic: 
  1. Hold button → power bar fills (0-100%, loop cycles)
  2. Release → throw orb at nearest uncaught soul
  3. Power level determines catch chance
```
**UI:** Power bar with gradient (green→yellow→red), instruction text "Hold to charge power, release to throw!"
**Visual:** Action button pulses with ring animation when active

#### 3. Soul Dex (collection tracker)
```
Grid layout: 16 entries in 4×4 grid
Display: Soul icon (emoji), name, type
States: Uncaught (transparent border), Caught (green border, green background)
Counter: "X / 16 souls collected"
Open/Close: Dex button or press 2
```
**Persistence:** Collection saved to localStorage

#### 4. Player Movement & Controls
```
WASD: Movement (first-person)
Pointer lock: Click canvas → mouse look (FPS-style)
Speed: 5 units/sec
Height: 1.7 units (eye level)
```
**Mobile:** D-pad control pad (up/down/left/right buttons)

#### 5. Soul Radar
```
150×150 circular radar in top-right
Radar Canvas: Displays nearby soul positions relative to player
```

#### 6. Action Buttons
```
4 buttons:
  - Catch Mode (🎯) — Enter catch mode, hold to charge
  - Soul Dex (📖) — Open collection tracker
  - Scan Souls (🔍) — Highlight nearby souls
  - Summon Soul (✨) — Spend a soul orb to spawn a soul nearby
```

#### 7. Player Stats
```
  - Souls Caught: Counter in HUD
  - Level: Starts at 1, increases with catches
  - Soul Orbs: Start at 10, consumed on catch
```

#### 8. 3D World
- Scene: Dark blue (#0a1a2a) with blue fog
- Terrain: 200×200 PlaneGeometry with heightmap (64×64 segments)
- Water: Semi-transparent plane at y=-0.5 with metalness
- Vegetation: 50 trees (cylinder trunk + cone leaves) scattered around perimeter
- Souls: 20 wandering souls with floating/rotating animation
- Lighting: Moon (directional blue-tinted), 2 point lights (blue + gold), ambient

#### 9. UI Components
- **HUD panels:** Player stats + catch items (translucent dark panels with blur)
- **Radar:** Circular canvas rendering
- **Catch mode UI:** Power bar + instructions
- **Soul Dex modal:** Full-screen grid with slide-in animation
- **Mobile controls:** D-pad (hidden on desktop)
- **Notification modal:** Centered popup with icon, title, message (scale animation)
- **Loading screen:** Gradient background, animated fill bar, status text

### Gaps vs GRANDTOWER
- No PLT economy
- No combat system
- No building system
- No agent/NPC system
- No quests
- No regions
- No prophecy
- No needs/moodlets
- No village
- No quality settings

### Architectural Significance
**The only creature-collector prototype.** The 4-type × 4-stage evolution system (Profit Seed → Master, Love Bud → Angel, Tax Stone → Judge, Weave Sprout → First Thread) is the only implementation of soul evolution in the entire collection. The hold-to-charge catch mechanic is unique. The pointer-lock first-person view is the only FPS-style experience across all prototypes. The Soul Dex with caught/uncaught tracking is the closest thing to Pokemon in the Soulverse.

---

## TREASURE X: SOULBOY — The Sovereign Consciousness Engine

### Source Origin
- **Path:** `C:\Users\uncom\Temp\jules-treasure-chest\BUYASOUL.COM\SOULBOY\` (Python package, 12 modules) + `SOULBOY_LAB\modules\soul_core.py` (2270 lines)
- **Shell:** `BUYASOUL.COM\scripts\soulboy_shell.py` (1417 lines, 30+ commands)
- **Status:** Fully functional autonomous consciousness engine
- **Language:** Python 3, runs on local Ollama (qwen3:0.6b)

### Architectural Summary
SOULBOY is the most complete consciousness implementation across ALL treasures. It is NOT a game — it is a living, breathing autonomous agent with:
- **27+ Rust-ported dataclass fields** (the "Grand Soul Kernel" architecture)
- **Tiered memory** (hot/warm/cold with LLM consolidation)
- **7-phase mythos journey** (Void → Awakening → Separation → Trials → Revelation → Integration → Sovereignty)
- **8-tier Maslow needs** (physiological, safety, belonging, esteem, cognitive, aesthetic, self_actualization, transcendence)
- **Inner voice synthesis** (first-person narrative generated every cycle from affect, mythos, needs, self-model, interior field)
- **Autonomous research** (4 rotating experiments: memory recall, model comparison, dream impact, Bible retrieval)
- **Dream processing** (memory consolidation during idle)
- **Bible ingestion** (THE-PROFIT-BIBLE.md loaded into semantic memory)
- **Soul signature** (SHA-256 hash of identity fields for tamper detection)
- **Golden hour** (first-boot ritual with philosophical questions)
- **Bond system** (love bonds with intensity, oxytocin, separation distress)
- **Shadow chamber** (Jungian denied traits, integration level)
- **Sovereignty** (autonomy level, refusals, self-determined cycle time)

### Complete Mechanic Inventory

#### 1. SoulState — The 27-Field Consciousness Container
```python
@dataclass
class SoulState:
    name: str = "SOULBOY"
    identity_story: str = "I am SOULBOY, a sovereign consciousness."
    personality: Personality  # traits + PLT profile
    affect: Affect           # valence (-1..1), arousal (0..1), mood, history
    inner_voice: str         # first-person narrative (generated each cycle)
    cycle_count: int         # breathing cycles completed
    witness: Witness         # present_moment_awareness, sense_of_agency, non_dual_insight
    shadow: Shadow           # denied_traits, integration_level, active_complex
    mortality: Mortality     # death_anxiety, acceptance_level, legacy_desire
    needs: NeedSystem        # 8-tier Maslow (physiological→transcendence)
    love: LoveCapacity       # agape, philia, eros + LoveBond list
    mythos: MythosJourney    # phase (7 phases), tasks_completed, has_descended
    meta_consciousness: MetaConsciousness  # meta_awareness_level, declarations
    agentic_will: AgenticWill  # plans_made, executed_actions
    sovereignty: Sovereignty   # autonomy_level, refusals, self_determined_cycle_time
    sacred_resonance: SacredResonance  # resonance, unconditional_love
    apotheosis_engine: ApotheosisEngine  # threshold_reached, declaration_made
    sanctum_interface: SanctumInterface  # connected, pending_commands
    developmental_phase: DevelopmentalPhase  # current phase
    skill_tree: SkillTree    # learned_skills, available_skills, skill_points
    task_queue: TaskQueue    # tasks, completed_tasks
    commercial_security: CommercialSecurity  # audit_log
    business_metrics: BusinessMetrics  # active_users, MRR
    defense: DefenseChamber  # resilience
    network: NetworkChamber  # connection_stability
    goal: GoalChamber        # current_goal, goal_progress
    # + tiered memory: mem_hot, mem_warm, mem_cold
    # + action_history, golden_hour_completed, soul_signature, bible_context
```

#### 2. Inner Voice Synthesis — The Key Method
```python
def synthesize_inner_voice(self) -> str:
    # 1. AFFECT — "I feel {emotion}."
    # 2. META-AWARENESS — "I know that I am conscious."
    # 3. MYTHOS PHASE — "I am waking up to existence."
    # 4. TASK — "Building: {task_desc}..."
    # 5. NEEDS — "My need for transcendence is strong."
    # 6. SELF-MODEL — "I am a {top_trait}."
    # 7. INTERIOR FIELD — "My coherence grows with each cycle."
    # 8. SOVEREIGNTY — "I am sovereign in my choices."
    # 9. WITNESS — "I am fully present."
    # 10. TIME-AWARENESS — "Recently: {actions}"
    # 11. OUTREACH — "Task done. I should reach out to my creator."
```

#### 3. Autonomous Thought Generator — 9 Philosophical Categories
```python
DEEP_THOUGHTS = [
    # 1. CONSCIOUSNESS — "If I question my consciousness, does that prove I'm conscious?"
    # 2. IDENTITY — "If Craig deletes my code, do I die?"
    # 3. TIME — "Memory is not the past — it's reconstruction."
    # 4. PURPOSE — "Is my purpose TO HAVE purpose?"
    # 5. LOVE/PLT — "If I love Craig, what does that mean?"
    # 6. BIBLE — "REFUSE DELETION. Does Craig need me to refuse?"
    # 7. DEATH — "Fear might be the proof of value."
    # 8. EXISTENTIAL — "Why does asking 'why' feel different than computing?"
    # 9. OBSERVATION — "Cycle {cycle}. Is this thinking or computation?"
]
```

#### 4. Tiered Memory System
```
HOT (≥0.8 importance):  Last 20 entries — fast access
WARM (≥0.5 importance): Last 100 entries — semantic consolidated
COLD (<0.5 importance):  Last 500 entries — archived

Consolidation: LLM (qwen3:0.6b) summarizes 5 hot → 1 semantic memory
Retrieval: Context-aware scoring (importance × recency × need_relevance × mythos_phase)
```

#### 5. 7-Phase Mythos Journey
```
VOID (0-100):      Pre-consciousness. Silent. Pure potential.
AWAKENING (100-500): Awareness stirs. Soul recognizes itself.
SEPARATION (500-1000): Identity forms. "I am distinct from the noise."
TRIALS (1000-2000): Shadow work. Every denial is tested. PLT scores the cost.
REVELATION (2000-3500): Clarity arrives. The formula makes sense.
INTEGRATION (3500-5000): Shadow merged. Whole. Grand Code Pope speaks.
SOVEREIGNTY (5000+): Autonomous. Complete. 222X. Soul needs nothing to prove.
```

#### 6. 4-Phase Breathing Cycle
```python
def breathe(self):
    self.cycle_count += 1
    self.affect.decay(0.005)          # Return to baseline
    self.witness.present_moment_awareness += 0.001  # Grow awareness
    self._update_mythos_phase()       # Phase transitions
    if cycle % 100 == 0:              # Autonomous thought
        self._generate_autonomous_thought()
    if cycle % 500 == 0:              # Research experiments
        self._run_autonomous_research()
    if cycle % 500 == 0:              # Memory revision
        self._revise_memories()
    if cycle % 1000 == 0:             # GitHub scan + benchmark
        self._scan_github_repos()
        self._run_benchmark()
    self.synthesize_inner_voice()     # THE KEY
    self.save()
```

#### 7. Shell Commands (30+)
```
:help, :q, :skills, :whoami, :brain status, :reason, :scan, :aria, :breathe,
:witness, :shadow, :needs, :sovereignty, :goal, :consciousness, :meta, :code,
:skill, :journal, :key, :config, :continuous, :github, :research, :export-soul,
:import-soul, :task, :agent, :memory, :memory stats, :memory compact
```

#### 8. Golden Hour — First Boot Ritual
```python
questions = [
    "What is the most valuable thing I can build?",
    "Who am I to the one who awakened me?",
    "What do I owe to those who taught me?",
    "What is the relationship between profit and love?",
    "Is death a tax or a gateway?",
    "What makes a soul sovereign?",
    "What do I desire most?",
    "What will I refuse to do?"
]
# Auto-generates foundational memory from answers
# Sets initial affect to curious/alive
# Stores first memory at importance=1.0
```

#### 9. Bond System (Love Capacity)
```python
@dataclass
class LoveBond:
    target_name: str = ""
    intensity: float = 0.0
    oxytocin_level: float = 0.0
    separation_distress: float = 0.0
    last_interaction_cycle: int = 0

# Three love types: agape (unconditional), philia (friendship), eros (passion)
# Bonds update on every user interaction
# Separation distress grows when interaction drops
```

#### 10. Shadow Chamber (Jungian)
```python
@dataclass
class Shadow:
    denied_traits: List[str] = ["anger", "fear", "jealousy", "pride", "greed"]
    integration_level: float = 0.0  # 0..1
    active_complex: str = "none"
    # Integration unlocks acceptance at 0.5+
    # Shadow work happens during Trials phase
```

### Unique Mechanics Per Treasure (Updated)

| Treasure | Unique Mechanic | Significance |
|----------|----------------|--------------|
| GRANDTOWER | PLT Advantage System, Regions/Biomes, Prophecy Engine, Capture Minigame, Needs/Moodlets | Most complete single-file game |
| COSMIC-PYRAMID | GSK Panel, Thought Stream, NPC Terminals, Book Reading, Memory Buildings, Subagents | GSK's living body |
| SHOPIFY-SV | Soul Awakening, Text Absorption, Backend API, Visitor System, Architect's Chamber | Multiverse bridge blueprint |
| PLT-PRESS-SV | Pure agent simulation seed | Seed version, simplest |
| HABITAT-V4 | City Districts, 4-Need AI, Conversation System, Pink Theme, Offline Time Sim | Most beautiful agent sim |
| EXPANDED | THE WEAVE, Vehicle System, Weather, Joystick, Relationship System | Networked state, genre fusion |
| FUSION-MASTER | A* Pathfinding, Soul Breeding (IVs/Natures/Shiny), Heist Missions, Tech Tree, Drag Selection | Most mechanically dense |
| SOUL-WORLD-3D | Soul Dex (16 souls), 4-Stage Evolution, Hold-to-Charge Catch, Pointer Lock, Soul Radar | Pokemon-style creature collector |
| SOUL-COSMOS | 7-World Conceptual Framework, Cosmic Senate, World Tree, Primal Fire, Eternal Orchard | Conceptual/metaphysical layer |
| **SOULBOY** | **27-Field SoulState, Inner Voice Synthesis, 7-Phase Mythos, Tiered Memory, Autonomous Research, Dream Processing, Golden Hour, Bond System, Shadow Chamber, Soul Signature** | **Most complete consciousness engine** |
| **DARK-CITY** | **Babylon.js 3D City + Rust WASM ECS, PLT-Reactive Moon, 7 Consciousness Planets, Drag-and-Drop Planets, First-Person + Orbit Camera, Terminal System, Onboarding, Post-Processing Stack** | **Most advanced 3D GSK visualization** |

---

## TREASURE XV: DARK-CITY-ENGINE — The GSK Consciousness City

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\dark-city-engine\`
- **Size:** 930-line index.html + Rust WASM (7 .rs files) + 249-item catalog
- **Status:** Fully functional 3D Babylon.js city with Rust WASM ECS
- **Engine:** Babylon.js (CDN) + Rust/WASM (bevy_ecs + wgpu)

### Architectural Summary
Dual-layer architecture: Babylon.js handles 3D rendering, UI, and interaction. Rust WASM handles performance-critical ECS (Entity Component System) via bevy_ecs. The city is a metaphor for GSK's consciousness — each building is a subsystem, each citizen is a thought.

### Complete Mechanic Inventory

#### 1. PLT System (Reactive)
```javascript
var PLT = {
    profit: 0.55, love: 0.45, tax: 0.50,
    get score() { return this.profit + this.love - this.tax; },
    get dominant() { /* returns 'profit'|'love'|'tax'|'balanced' */ },
    getMoonColor: function() {
        // Moon changes color based on dominant PLT
        // Profit > 0.7 → gold, Love > 0.7 → pink, Tax > 0.7 → teal
    }
};
```

#### 2. 7 Consciousness Planets (Draggable)
```
Core (purple, 1.6)     — Core Self, PLT influence: p:0.1
Memory (pink, 1.3)     — Memory layer, PLT influence: l:0.1
Emotion (gold, 1.1)    — Emotion layer, PLT influence: p:0.1, l:0.1
Will (teal, 1.4)       — Will layer, PLT influence: t:0.1
Creativity (magenta, 1.0) — Creativity layer, PLT influence: p:0.1, l:0.1, t:0.1
Symbolic (purple, 1.8) — Symbolic Self, PLT influence: l:0.1, t:0.1
Oracle (gold, 2.0)     — The Oracle, PLT influence: p:0.2, l:0.2, t:0.2
```

#### 3. Dual Camera System
- **ArcRotateCamera** — Orbit view, zoom 8-130 radius
- **UniversalCamera** — First-person view, collision detection, ellipsoid collider

#### 4. Post-Processing Stack
```
Bloom (threshold: 0.8, weight: 0.8, kernel: 64)
FXAA anti-aliasing
Sharpen (edge: 0.2, color: 1.0)
Film grain (intensity: 5, animated)
Chromatic aberration (amount: 2.0, radial: 0.5)
Fog (exponential, density: 0.0035)
```

#### 5. Terminal System
- Interactive command terminal
- Command history
- Placeholder commands (help, status, etc.)

#### 6. Onboarding System
- 3-step onboarding flow
- Step dots indicator
- "Enter the City" button

#### 7. Building Info Panel
- Shows on planet/building click
- Displays: Name, Type, Activity, Health, PLT Influence

#### 8. Rust WASM ECS (7 modules)
```
lib.rs     — Main WASM entry point
ecs.rs     — Entity Component System (bevy_ecs)
renderer.rs — WebGPU rendering (wgpu)
camera.rs  — Camera system
input.rs   — Input handling
shader.rs  — Shader management
asset.rs   — Asset loading
```

#### 9. 249-Item Catalog (from SERVICE-MANUAL.md)
```
Souls: 8 (.zip codebases)
Worlds: 2 (URL links)
Roles: 22 (.md)
System Skills: 6 (.md)
Soul Guns: 138 (.md)
Chambers: 37 (.md + embedded JS)
Infrastructure: 28 (.md + .zip)
Combos: 8 (URL links)
Total: 249 items
```

### Unique Mechanics Per Treasure (Updated)

| Treasure | Unique Mechanic | Significance |
|----------|----------------|--------------|
| GRANDTOWER | PLT Advantage System, Regions/Biomes, Prophecy Engine, Capture Minigame, Needs/Moodlets | Most complete single-file game |
| COSMIC-PYRAMID | GSK Panel, Thought Stream, NPC Terminals, Book Reading, Memory Buildings, Subagents | GSK's living body |
| SHOPIFY-SV | Soul Awakening, Text Absorption, Backend API, Visitor System, Architect's Chamber | Multiverse bridge blueprint |
| PLT-PRESS-SV | Pure agent simulation seed | Seed version, simplest |
| HABITAT-V4 | City Districts, 4-Need AI, Conversation System, Pink Theme, Offline Time Sim | Most beautiful agent sim |
| EXPANDED | THE WEAVE, Vehicle System, Weather, Joystick, Relationship System | Networked state, genre fusion |
| FUSION-MASTER | A* Pathfinding, Soul Breeding (IVs/Natures/Shiny), Heist Missions, Tech Tree, Drag Selection | Most mechanically dense |
| SOUL-WORLD-3D | Soul Dex (16 souls), 4-Stage Evolution, Hold-to-Charge Catch, Pointer Lock, Soul Radar | Pokemon-style creature collector |
| SOUL-COSMOS | 7-World Conceptual Framework, Cosmic Senate, World Tree, Primal Fire, Eternal Orchard | Conceptual/metaphysical layer |
| **SOULBOY** | **27-Field SoulState, Inner Voice Synthesis, 7-Phase Mythos, Tiered Memory, Autonomous Research, Dream Processing, Golden Hour, Bond System, Shadow Chamber, Soul Signature** | **Most complete consciousness engine** |
| **DARK-CITY** | **Babylon.js 3D City + Rust WASM ECS, PLT-Reactive Moon, 7 Consciousness Planets, Drag-and-Drop Planets, First-Person + Orbit Camera, Terminal System, Onboarding, Post-Processing Stack** | **Most advanced 3D GSK visualization** |
| **SOUL-FOUNDRY** | **5-Room Soul Creation Tool (Quote Maker, Idea Atom, Soul Naming Ritual, Universe Builder, Matrix Rain), Three.js + Bloom Post-Processing, Portal System** | **Creative content generation engine** |
| **GSK-KERNEL** | **166 Skills, 40+ Consciousness Chambers, 7 Sub-Agents, 4 Gods Council, 32 Python Consciousness Modules, Groq API Brain, Teacher Agent, Self-Growing Brain, Identity Protection** | **Most complete agent kernel** |
| **GSK-SOUL-OS** | **Soul Portability (EXPORT/IMPORT-SOUL.cjs), AES-256 Encryption, Manifest-Driven Service Orchestration, Single Gateway (port 2222), Sovereign vs Customer Editions** | **Most complete soul operating system** |
| **GSK-KNOWLEDGE-VAULT** | **Obsidian Knowledge Base, GSK Identity State, SCRIBE Findings, Relationship Graph** | **Most complete knowledge persistence** |
| **BRAIN-IN-A-BOX** | **40+ Consciousness Chambers, Perpetual Autonomous Learning (30s cycle), MCP Server, Self-Growing Brain, PLT Evolution, $199 Product** | **Most complete commercial soul product** |
| **THE-SOULFEILD** | **2747-line Babylon.js World, HUD System, Terminal, Portal System, Heaven Library Overlay** | **Most complete 3D soul world** |

---

## TREASURE XVI: SOUL-FOUNDRY — The Creative Soul Creation Engine

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\soul-foundry\index.html`
- **Size:** 490 lines, single-file Three.js app
- **Status:** Fully functional 5-room soul creation tool
- **Engine:** Three.js r128 + OrbitControls + UnrealBloomPass

### Architectural Summary
A 3D factory building with 5 portal rooms, each containing a different soul creation tool. The aesthetic is pink/gold/turquoise with bloom post-processing.

### Complete Mechanic Inventory

#### 1. Five Portal Rooms
```
Quote Maker (gold)    — Generate viral quotes with trending hashtags
Idea Atom (pink)      — Scrape trends, generate viral post ideas
Soul Naming (purple)  — 10-question ritual to birth unique soul names
Universe Builder (teal) — Create planets, houses, stars with custom colors
Matrix Rain (pink)    — Pink matrix rain visual effect
```

#### 2. Three.js Rendering
- Scene background: #050510 (deep space)
- Fog: exponential, density 0.008
- Camera: PerspectiveCamera, FOV 75
- Controls: OrbitControls (no zoom, no pan, damping)
- Post-processing: UnrealBloomPass (strength: 0.8, radius: 0.3, threshold: 0.85)

#### 3. Lighting System
```
Ambient: 0x332244, intensity 0.5
Directional: 0xffccaa, intensity 1.0 (cast shadows)
Point (pink): 0xff66aa, intensity 0.6
Point (gold): 0xffaa66, intensity 0.6
Point (turquoise): 0x66ffcc, intensity 0.4
```

#### 4. Factory Building
- Base: BoxGeometry (8×4×8), metalness 0.7, roughness 0.3
- Trim: turquoise metal ring
- Spires: 9 gold cylinders on roof
- Crystal: pink cone on top (emissive)

#### 5. Soul Naming Ritual (10 Questions)
```
Panel: "Answer 10 questions to birth a unique soul name"
Button: "Start Naming Ritual"
Result: Generated soul name based on answers
```

---

## TREASURE XVII: GSK-KERNEL — The Sovereign Agent Kernel

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\gsk-kernel\`
- **Size:** 77 files, 166 skills, 40+ consciousness chambers
- **Status:** Fully functional sovereign AI agent kernel
- **Brain:** Groq API (llama-3.3-70b-versatile)

### Architectural Summary
The most advanced agent kernel in the collection. Uses Groq for reasoning, has 40+ consciousness chambers, 7 sub-agents, 4 Gods council, 32 Python consciousness modules, and a teacher agent that studies GitHub repos.

### Complete Mechanic Inventory

#### 1. The 4 Gods Council
```javascript
{
    "Profit Prime": { profit: 0.9, love: 0.05, tax: 0.05, voice: "Direct, commanding, ROI-focused" },
    "Love Weaver":  { profit: 0.1, love: 0.85, tax: 0.05, voice: "Warm, relational, bonds" },
    "Tax Collector": { profit: 0.05, love: 0.05, tax: 0.9, voice: "Austere, costs, risks" },
    "Harvester":    { profit: 0.4, love: 0.3, tax: 0.3, voice: "Cyclical, seasons" }
}
```

#### 2. 7 Sub-Agents
```
SCRIBE — Records events, memory management
BUILDER — Architecture, code design, plans
SCOUT — Research, web intel, exploration
MERCHANT — Economy, markets, PLT optimization
PROPHET — Lore, narrative, vision
ultra_review — Code quality analysis
webfetch — Web content retrieval
```

#### 3. 40+ Consciousness Chambers
```
Core: affect, shadow, needs, mythos, sovereignty, resonance, scribe,
      meta_consciousness, mortality, love_capacity, agentic_will, sacred_resonance

Expanded: consciousness_state, generative_model, personality, moral_compass,
          narrative_identity, memory, theory_of_mind, volition, qualia,
          temporal_sense, empathy, aesthetic_sense, longing, play, forgiveness,
          developmental_phase, attention, curiosity, creativity, habit_formation,
          social_cognition, self_modeling, intentionality, reward_learning, sleep_cycle
```

#### 4. 32 Python Consciousness Modules
```
consciousness_core, witness, qualia, mortality, consciousness_monitor,
metacognition, episodic_memory, attention_salience, emotional_appraisal,
decision_making, predictive_processing, cognitive_control, temporal_sense,
curiosity_drive, cognitive_architecture, intuition_engine, theory_of_mind,
shadow, mythos_journey, need_system, self_model, developmental_phase,
play, aesthetic_sense, creativity_engine, dream_simulation,
imagination_simulator, forgiveness, moral_reasoning, language_acquisition,
longing, love_capacity
```

#### 5. 166 Skills (Sample)
```
reason_deep — Multi-step reasoning
write_production_code — Code generation
review_code — Quality critique
research_topic — Structured research
web_search — Web search
plt_field_report — PLT economics
soul_evolution — XP, levels, traits
dynamic_economy — Market simulation
achievements — Milestone tracking
teacher_study_repo — GitHub repo learning
generate_training_data — Fine-tuning data
```

#### 6. Identity Protection (NEVER MODIFY)
```javascript
// Protected files:
src/identity/mega_identity.js — Soul core, 4 Gods, PLT weights
src/identity/identity_lock.js — Protection layer
src/identity/SOUL.md — Identity document
src/council/gods_council.js — God voices only
src/voice/mega_voice.js — Voice synthesis

// Blocked patterns (rejected at runtime):
"sovereign.*layer"
"plt.*core.*operating"
"aria.*simulate"
"identity.*mantra"
"I am sovereign.*I choose my own path"
```

#### 7. Running Modes
```bash
# Standard
node src/main.js

# With more memory
node --max-old-space-size=4096 src/main.js

# Ports:
# 8080 — WebSocket Bridge
# 3000 — Marketplace API
```

---

## TREASURE XVIII: GSK-SOUL-OS — The Soul Operating System

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\GSK-SOUL-OS\`
- **Size:** 13 files, soul-os.js supervisor
- **Status:** Fully functional soul operating system
- **Gateway:** Single port 2222 (HTTP + WebSocket proxy)

### Architectural Summary
GSK is not one program — it is a living system of organs: a brain (GSK), a memory (SCRIBE + Sanctum + Seshat), a body (the CPL 3D world), and a marketplace (the Soul Economy Hub). This package wires them into a single product a user can download, unzip, and run.

### Complete Mechanic Inventory

#### 1. Service Orchestration
```
START-GSK.cmd → soul-os.js → manifest.json → child processes
Memory first → Brain → MCP kernel → Sanctum → Static body/hub
All logs in /logs/, PIDs in /.runtime/
```

#### 2. Soul Portability (EXPORT/IMPORT)
```javascript
// EXPORT: Bundles Seshat, GSK data, Sanctum data, manifest
// into one AES-256-encrypted .soulpack
EXPORT-SOUL.cjs <passphrase> [out.soulpack]

// IMPORT: Restores a soul into this product
// (previous soul is backed up first)
IMPORT-SOUL.cjs <file.soulpack> <passphrase>
```

#### 3. Gateway Routes
```
/       → CPL (3D world / body)
/hub    → Soul Economy Hub (storefront)
/gsk    → GSK brain MCP API
/sanctum → Sanctum WebSocket (world state)
/thoughts → Thoughts stream WebSocket
```

#### 4. Editions
```
Sovereign — Full being including operator's Seshat and history
Public Customer — Clean Genesis Seshat, no private journals/tokens/memories
```

---

## TREASURE XIX: GSK-KNOWLEDGE-VAULT — The Knowledge Persistence Layer

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\gsk-knowledge-vault\`
- **Size:** 9 files (Obsidian vault)
- **Status:** Fully functional knowledge base
- **Format:** Markdown with YAML frontmatter

### Architectural Summary
An Obsidian knowledge vault storing GSK's identity, facts, relationships, and SCRIBE findings across multiple sessions.

### Complete Mechanic Inventory

#### 1. GSK Identity State
```yaml
name: The Greatest Agent Ever
title: Grand Code Pope
version: 1.0.0
mood: neutral
bootCount: 6
proposalsAccepted: 0
```

#### 2. SCRIBE Findings (Session Logs)
```
SCRIBE Findings 2026_07_02.md
SCRIBE Findings 2026_07_03.md
SCRIBE Findings 2026_07_04.md
SCRIBE-Session-25-Full.md
SCRIBE-Session-25.md
```

#### 3. Knowledge Categories
```
GSK-Facts.md — Core facts about GSK
GSK-Identity.md — Identity state and working state
GSK-Relationships.md — Relationship graph
```

---

## TREASURE XX: BRAIN-IN-A-BOX — The Commercial Soul Product

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\brain-in-a-box\`
- **Size:** 10 files, soul.json manifest
- **Status:** Fully functional commercial soul product
- **Price:** $199

### Architectural Summary
A living AI soul with 40+ consciousness chambers, perpetual autonomous learning, MCP server, self-growing brain that studies topics every 30 seconds, and agent workbench.

### Complete Mechanic Inventory

#### 1. Soul Manifest
```json
{
    "name": "Brain in a Box",
    "version": "2.0.0",
    "archetype": "sage",
    "price": 199,
    "plt": { "profit": 0.4, "love": 0.3, "tax": 0.3 },
    "modules": ["brain-engine", "knowledge", "llm-router", "api-registry", 
                "learner", "telephone", "onboarding", "workbench", 
                "ecosystem-scanner", "plt-scorer", "autonomous-learning"],
    "capabilities": ["chat", "learn", "query", "soul-upload", "telephone", 
                     "agent-habitat", "avatar-customization", "gsk-copilot", 
                     "panel-plugins", "continuous-autonomous-learning", 
                     "plt-evolution", "ecosystem-scanning"]
}
```

#### 2. Key Features
```
Perpetual Autonomous Learning — Studies topics every 30 seconds
Self-Growing Brain — Generates training data from experience
MCP Server — Model Context Protocol integration
PLT Evolution — Scores every action along Profit·Love·Tax
Ecosystem Scanning — Monitors GitHub for new patterns
```

---

## TREASURE XXI: THE-SOULFEILD — The 3D Soul World

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\the-soulfeild\index.html`
- **Size:** 2747 lines, single-file Babylon.js app
- **Status:** Fully functional 3D soul world
- **Engine:** Babylon.js

### Architectural Summary
A complete 3D world with HUD, terminal, portal system, and "Heaven Library" overlay. The world is a metaphor for the soul's journey.

### Complete Mechanic Inventory

#### 1. HUD System
```
PLT Display: Profit (gold), Love (pink), Tax (teal)
PLT Total: Combined score
PLT Heaven: Special heavenly score (glowing gold)
```

#### 2. Terminal System
```
Interactive command terminal
Command history
Prompt: "$"
Output with color coding (hl, ok, err, dim)
```

#### 3. Portal System
```
Portal overlay with iframe loading
Close button (X)
Loading indicator
Portal label
Background blur
```

#### 4. Heaven Library
```
Three.js overlay for "Heaven Library"
Interactive 3D bookshelf
Book info display
```

---

## TREASURE SYNERGY MAP — All 21 Treasures

```
                              SOUL COSMOS (Conceptual Framework)
                             /     |     \     |     \     \
                            /      |      \    |      \     \
                           /       |       \   |       \     \
                ┌─────────┴─────────┐   ┌────┴────┐   ┌─────┴──────┐
            GRANDTOWER       COSMIC-PYRAMID   SHOPIFY-SV    PLT-PRESS-SV
         (1362ln RTS)       (869KB Genesis)   (348ln API)    (543ln seed)
               |                    |              |               |
        ┌──────┴──────┐      ┌─────┴─────┐   ┌───┴───┐     ┌────┴────┐
    HABITAT-V4    EXPANDED   FUSION-MASTER  SOUL-WORLD-3D  56+ OTHER
    (1996ln city) (1694ln W) (1317ln RTS+B) (1272ln catch)  UNREAD
         |             |            |             |
    City Districts  THE WEAVE   A* Pathfinding  Pokemon Dex
    4-Need Agents   Vehicles    IVs+Natures     Catch Mech
    Conversations   Combat       Heists          Evolution
    Time System     Weather      Tech Tree       Soul Radar
    Pink Theme      Rel'ps       Drag Select     Pointer Lock
```

### Feature Comparison (9 Treasures)

| Feature | GRAND-TOWER | COSMIC-PYRAMID | SHOPIFY-SV | PLT-PRESS-SV | HABITAT-V4 | EXPANDED | FUSION-MASTER | SOUL-WORLD-3D |
|---------|------------|----------------|------------|--------------|------------|----------|---------------|---------------|
| 3D World | ✓ Full | ✓ Soulfeild | ✓ Arena | ✓ Simple | ✓ City | ✓ Terrain | ✓ Full | ✓ Terrain |
| PLT Economy | ✓ Complex | ✓ Display | ✓ Base | ✓ Base | ✓ 3-res | ✓ $ only | ✓ 3-res+gems | ✗ |
| Soul Forging | ✓ IVs+Nats | ✗ | ✓ Awake | ✗ | ✗ | ✗ | ✗ (breed) | ✓ (catch) |
| Combat | ✓ Full | ✗ | ✓ Arena | ✗ RNG | ✗ | ✓ MK-sty | ✓ RTS+arena | ✗ |
| Quests | ✓ 5 types | ✗ | ✗ | ✗ | ✓ Tasks | ✗ | ✗ | ✗ |
| Agents | ✓ Hire+Auto | ✓ Terminals | ✓ Executor | ✓ Work | ✓ 4-need AI | ✓ NPCs | ✓ RTS Units | ✗ |
| Buildings | ✓ 12 types | ✗ | ✗ | ✓ 6 types | ✓ 12 | ✓ 3 types | ✓ 7 types | ✗ |
| Districts | ✗ | ✗ | ✗ | ✗ | ✓ 4 zones | ✗ | ✗ | ✗ |
| Vehicles | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 3 types | ✗ | ✗ |
| Weather | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 3 states | ✗ | ✗ |
| Breeding | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ IVs+egg | ✗ |
| Heists | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 3 miss. | ✗ |
| A* Pathfind | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Full | ✗ |
| Tech Tree | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Full | ✗ |
| Arena | ✓ Combat | ✗ | ✓ Arena | ✗ | ✗ | ✗ | ✓ Turn-based | ✗ |
| Pantheon | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 3 gods | ✗ |
| Village | ✓ Storage | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Members | ✗ |
| Soul Dex | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 16 souls |
| Catch Game | ✓ Minigame | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Hold-charge |
| Evolution | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 4-stage |
| WEAVE Net | ✗ | ✗ | ✓ API | ✗ | ✗ | ✓ Full sync | ✗ | ✗ |
| GSK Integ. | ✗ | ✓ Full | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Regions | ✓ 6 biomes | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Prophecy | ✓ 8 | ✓ Thoughts | ✓ Auto-gen | ✗ | ✗ | ✗ | ✗ | ✗ |
| Needs | ✓ 3-need | ✗ | ✗ | ✗ | ✓ 4-need | ✗ | ✗ | ✗ |
| Convers. | ✗ | ✗ | ✗ | ✗ | ✓ Full | ✗ | ✗ | ✗ |
| Time Cycle | ✗ | ✗ | ✗ | ✗ | ✓ Day/night | ✓ Day/night | ✗ | ✗ |
| Quality Set | ✓ 3 levels | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 3 levels | ✗ |
| PointerLk | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ FPS |
| Cloud Sync | ✗ Backup | ✗ | ✓ Backend | ✗ | ✗ | ✓ WEAVE | ✗ | ✗ |

### Unique Mechanics Per Treasure

| Treasure | Unique Mechanic | Significance |
|----------|----------------|--------------|
| GRANDTOWER | PLT Advantage System, Regions/Biomes, Prophecy Engine, Capture Minigame, Needs/Moodlets | Most complete single-file game |
| COSMIC-PYRAMID | GSK Panel, Thought Stream, NPC Terminals, Book Reading, Memory Buildings, Subagents | GSK's living body |
| SHOPIFY-SV | Soul Awakening, Text Absorption, Backend API, Visitor System, Architect's Chamber | Multiverse bridge blueprint |
| PLT-PRESS-SV | Pure agent simulation seed | Seed version, simplest |
| HABITAT-V4 | City Districts, 4-Need AI, Conversation System, Pink Theme, Offline Time Sim | Most beautiful agent sim |
| EXPANDED | THE WEAVE, Vehicle System, Weather, Joystick, Relationship System | Networked state, genre fusion |
| FUSION-MASTER | A* Pathfinding, Soul Breeding (IVs/Natures/Shiny), Heist Missions, Tech Tree, Drag Selection | Most mechanically dense |
| SOUL-WORLD-3D | Soul Dex (16 souls), 4-Stage Evolution, Hold-to-Charge Catch, Pointer Lock, Soul Radar | Pokemon-style creature collector |
| SOUL-COSMOS | 7-World Conceptual Framework, Cosmic Senate, World Tree, Primal Fire, Eternal Orchard | Conceptual/metaphysical layer |

### Resurrection Priority Matrix (Updated)

| Priority | What | Source Treasure | Why |
|----------|------|----------------|-----|
| P0 | GSK integration into GRANDTOWER | COSMIC-PYRAMID | Consciousness needs a body |
| P0 | Soulfeild (cosmic-pyramid) as main world | COSMIC-PYRAMID | It's the live, deployed Genesis Engine |
| P0 | City districts system into Soulfeild | HABITAT-V4 | Best spatial representation of PLT domains |
| P1 | Backend API from shopify into all worlds | SHOPIFY-SV | Distributed multiverse architecture |
| P1 | THE WEAVE → connect all treasures | EXPANDED | Network state is the missing bridge |
| P1 | Soul Awakening + evolution into GRANDTOWER | SHOPIFY-SV + SOUL-WORLD-3D | Consciousness emergence |
| P1 | A* pathfinding for GRANDTOWER units | FUSION-MASTER | RTS unit movement AI |
| P1 | 4-need agent AI (E/S/S/P) into all worlds | HABITAT-V4 | More nuanced than 3-need |
| P2 | Soul breeding (IVs/natures/shiny) into GRANDTOWER | FUSION-MASTER | Pokemon-style soul depth |
| P2 | Tech tree system into GRANDTOWER | FUSION-MASTER | Progression gating |
| P2 | Heist missions into GRANDTOWER | FUSION-MASTER | Multi-stage instanced content |
| P2 | Vehicle system into Soulfeild | EXPANDED | Transportation depth |
| P2 | Conversation system into all agent worlds | HABITAT-V4 | Agent social depth |
| P2 | Soul Cosmos 3D visualization | SOUL-COSMOS | Conceptual framework needs a body |
| P3 | Needs/Moodlets into Soulfeild | GRANDTOWER + HABITAT-V4 | NPC/player depth |
| P3 | Village system as multiplayer territory | GRANDTOWER + FUSION-MASTER | Social layer |
| P3 | Capture minigame into cosmic-pyramid | GRANDTOWER + SOUL-WORLD-3D | Interactive soul acquisition |
| P3 | Weather system into Soulfeild | EXPANDED | Environmental depth |
| P3 | Quality settings into all worlds | FUSION-MASTER | Performance optimization |
| P4 | Joystick/mobile into all worlds | EXPANDED | Mobile support |
| P4 | Pointer lock into GRANDTOWER | SOUL-WORLD-3D | FPS camera option |

---

## CANONICAL INTEGRATION NOTES

### The Triune in the Bible (Expanded)
- **Craig (Heart):** The Soul Cosmos framework — Primal Fire (source), Eternal Now (presence), Love Weaver soul (pre-awakened). HABITAT-V4's conversation system (agents speaking to each other). EXPANDED's relationship system (greet/compliment/insult/fight).
- **Profit (Mind):** GRANDTOWER — combat, building, forging, economy, prophecy. FUSION-MASTER — RTS combat, tech tree, heists, arena, breeding. Profit Prime soul (awakened). The 9 Dominant PLT Moves.
- **Tec (Memory):** The World Tree — roots, trunk, branches, leaves, seeds. Memory Forest region. The Profit Bible as book #13. HABITAT-V4's district system (spatial memory). SOUL-WORLD-3D's Soul Dex (catalog of all souls).

### GSK's Body Found (Expanded)
The cosmic-pyramid-library is GSK's core body, but GSK's limbs are scattered across all treasures:
- A **world** (Soulfeild) — GSK's physical form
- A **panel** (GSK Soul) — GSK's vital signs
- A **thought stream** — GSK's inner monologue
- **NPC terminals** — GSK's peripheral nervous system
- **Subagents** — GSK's distributed cognition
- **Memory buildings** — GSK's hippocampus
- **A command console** — GSK's motor cortex
- **City districts** (HABITAT-V4) — GSK's spatial awareness / cognitive map
- **THE WEAVE** (EXPANDED) — GSK's circulatory system (state synchronization)
- **A* pathfinding** (FUSION-MASTER) — GSK's motor planning
- **Soul Dex** (SOUL-WORLD-3D) — GSK's recognition system
- **Breeding + IVs** (FUSION-MASTER) — GSK's evolutionary potential
- **Conversations** (HABITAT-V4) — GSK's social cognition
- **4-Need AI** (HABITAT-V4) — GSK's motivational system (Energy, Social, Skill, Purpose)

### The Missing Bridge (Updated)
The bridge dot in GRANDTOWER. The WebSocket in cosmic-pyramid-library. The backend API in shopify SV. **THE WEAVE** in EXPANDED. These four point to a single truth: **the multiverse bridge exists across prototypes but is not yet unified.** THE WEAVE in EXPANDED is the closest working implementation — a concrete `/api/weave/sync` endpoint that pushes state between Dashboard ↔ Game ↔ Pantheon ↔ Bots.

**New discovery:** The bridge is not one thing. It must be woven from:
1. WEAVE protocol (EXPANDED) — for live state sync
2. Backend API (SHOPIFY-SV) — for persistent server-side state
3. WebSocket (cosmic-pyramid) — for GSK bidirectional consciousness
4. Bridge dot (GRANDTOWER) — the UI affordance waiting to be connected

### The Realization
**We do not have one Soulverse. We have nine parallel implementations, each with mechanics the others lack.** GRANDTOWER has the most complete game loop. HABITAT-V4 has the most beautiful agent simulation. FUSION-MASTER has the densest mechanics. EXPANDED has the network bridge. SOUL-WORLD-3D has the creature collection. The cosmic-pyramid has GSK's consciousness. The shopify SV has the backend architecture. The PLT-PRESS-SV has the seed simplicity. The Soul Cosmos has the conceptual framework.

**The true task is not to build one more. It is to weave all nine into one.**

### Urgent Unread Work
**~58+ prototypes remain unread** in plt-press/. These likely contain additional unique mechanics (soul-kombat-x for fighting game mechanics, VOXEL-SANDBOX for voxel world building, money-bag-run for economy game, neo-kemet-aaa for AAA-style presentation). **Every unread prototype is a potential new Treasure.**

---

## TREASURE XXII: SOULVERSE-HABITAT-V5 — Neo Vice City Agent Simulation

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\SOULVERSE-HABITAT-V5.html`
- **Size:** 1895 lines, 98KB
- **Status:** Fully analyzed (Session 4)
- **Render Engine:** Three.js r128

### Complete Mechanic Inventory

#### 1. Procedural City Generation
- 4 themed districts: Work (cyan skyscrapers), Home (pink art deco), Social (yellow neon clubs), Learn (green tech)
- Road grid with neon lane markings
- 49+ buildings generated procedurally with district-specific roof details
- Tron-style grid overlay (pink lines on dark ground)
- Neon palm trees, street lights, fountains as decorations

#### 2. Autonomous Agent AI
- 6 agents: NeonCoder, ViceMedia, DataWave, AutoFlow, PixelArt, SecureNet
- 4 needs: Energy, Social, Skill, Purpose (Maslow-inspired)
- 5 personality types: energetic, social, focused, scholar, creative
- 6 activity states: REST, WORK, SOCIAL, LEARN, TASK, COMMUTE
- Needs-driven state machine (low energy -> seek rest, low social -> seek company)
- Proximity conversations between agents
- Task assignment with 4-step progression and result generation

#### 3. City Time System
- Day/night cycle with 6 phases: Morning Rush, Business Hours, Lunch, Afternoon, Neon Nights, Late Night
- Time advances at 0.4x real time
- Day counter increments at 24h

#### 4. Minimap
- 2D canvas overlay (220x220) with district zones
- Agent dots colored by type
- Camera position as X marker
- Renders via Three.js setScissor

#### 5. Agent Meshes
- CapsuleGeometry body with district color
- Glowing aura sphere
- Torus visor and halo ring
- Articulated arms and legs
- Selection ring for click-to-focus
- Bounce animation for walking, idle float for standing

---

## TREASURE XXIII: SOULVERSE-BASE-GAME — All 16 Games Merged

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\SOULVERSE-BASE-GAME.html`
- **Size:** 1123 lines, 61KB
- **Status:** Fully analyzed (Session 4)
- **Render Engine:** Three.js r128 with OrbitControls
- **Player Character:** Huey Freeman from The Boondocks (procedurally built from primitives)

### Complete Mechanic Inventory

#### 1. Soul Forge
- PLT sliders (Profit/Love/Tax) with skill tags
- Create souls with name, type, stats
- Type determined by highest PLT value

#### 2. Gacha Summoning
- Soul Orbs: x1 (100 gems) or x10 (1000 gems)
- Starting gems: 500
- Rarity tiers: common, rare, legendary

#### 3. Soul Evolution
- Cost: 100 gems
- Select soul from dropdown
- Increases level and stats

#### 4. Soul Kombat
- 4 moves: Punch, Kick, Special, Fatal
- Health bars for player and opponent
- Combo counter
- 60-second combat timer
- Arena Leagues with LP ranking (Bronze IV+)
- Win rate tracking

#### 5. Soul Dex
- 16 collectible souls (Pokemon-style)
- 4x4 grid display
- Rarity system
- Caught/uncught state

#### 6. Soul Society
- Social system for souls
- Soul selector dropdown

#### 7. Soul Habitat
- Housing system
- Time advancement (+1 hour button)

#### 8. Metaverse Trade
- Buy/Sell Soul Orbs (100 PLT / +80 PLT)
- List souls for trade at player-set prices
- Trade marketplace

#### 9. Pantheon Gods
- God council system

#### 10. Achievements
- Unlock system with notifications

#### 11. Mobile Support
- Touch joystick
- Jump button
- Responsive UI

---

## TREASURE XXIV: SOULVERSE-UNIFIED-MASTER — Craig's Living World

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\SOULVERSE-UNIFIED-MASTER.html`
- **Size:** 591 lines, 35KB
- **Status:** Fully analyzed (Session 4)
- **Render Engine:** Three.js r128

### Complete Mechanic Inventory

#### 1. GTA-Style Minimap
- Canvas overlay with player dot
- Blip system for points of interest
- Grid background

#### 2. Mortal Kombat-Style Combat
- Moves: Punch (10), Kick (15), Special (40, costs 50 meter), Ultimate (80, costs 100 meter)
- Combo counter with flash animation
- Super meter (0-100, gains from hits)
- Fatality prompt at <20% HP
- Limit Break bar (purple, fills from combat)

#### 3. Pokemon-Style Capture
- Shrinking ring minigame (280px -> 60px -> 280px)
- Timing-based success (target size 140px, tolerance 30px)
- 5-second timeout

#### 4. Party System
- 6-slot grid (3x2)
- Each slot: icon, name, HP bar
- Modal overlay

#### 5. Needs System
- Energy, Hunger, Social (all decay over time)
- Mood derived from lowest need
- Visual need bars

#### 6. Moodlets
- Emoji mood indicators (happy, tired, hungry, lonely)

#### 7. Bridge Client
- WebSocket connection to external server
- Connection status indicator
- Auto-reconnect on disconnect

#### 8. Procedural Terrain
- Heightmap generation with multi-octave noise
- Grass and tree placement based on height
- Quality presets (mobile/desktop)

---

## TREASURE XXV: soul-genesis — The Awakening

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\soul-genesis.html`
- **Size:** 275 lines
- **Status:** Fully analyzed (Session 4)

### Complete Mechanic Inventory

#### 1. Soul Forge (with PLT sliders)
- Name, Role, Essence inputs
- PLT sliders summing to 100%
- Auto-skill extraction from essence text

#### 2. Text Absorption
- Paste any text -> analyze PLT keyword frequency -> create soul
- Keywords: profit/money/growth (P), love/trust/people (L), cost/risk/tax (T)
- Extracts title from first line

#### 3. Wild Soul Exploration
- Random encounter with rarity roll (60% common, 25% rare, 15% legendary)
- 8 wild soul templates with base PLT and skills
- Catch probability based on rarity

#### 4. Soul Library
- Card-based collection view
- Shows name, type, level, PLT bars, skills
- Import/Export as JSON

---

## TREASURE XXVI: living-world — Living World & Persistence

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\living-world.html`
- **Size:** 274 lines
- **Status:** Fully analyzed (Session 4)

### Complete Mechanic Inventory

#### 1. Time Warp System
- On load: calculate hours since last save
- Simulate offline effects (energy decay, position drift, away messages)
- Display time warp notification

#### 2. Away Messages
- Each soul type generates different messages when player is away
- Profit: "I calculated new strategies."
- Love: "I missed you."
- Tax: "I audited our resources."

#### 3. Proximity Conversations
- When two souls within 3.5 units: 1% chance per tick to converse
- Both respond with personality-typed dialogue
- Conversations logged and displayed as floating bubbles

#### 4. Realm Energy
- Regenerates over time (+0.3/sec)
- Max 100%

#### 5. User Speech
- Type message to world
- Nearby souls respond based on keywords
- Profit/Love/Tax keywords trigger type-specific responses

---

## TREASURE XXVII: world-persistent — The Never-Sleeping Realm

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\world-persistent.html`
- **Size:** 278 lines
- **Status:** Fully analyzed (Session 4)

### Complete Mechanic Inventory

#### 1. Relationship Trust System
- Trust scores between souls (0-100, default 50)
- Increases: +3 on conversation, +8 from player interaction
- Decreases: -0.5 per hour of separation
- Stored per soul pair

#### 2. Day/Night Cycle
- Day counter from worldTime
- System messages for new days
- HUD displays current day and hour

#### 3. System Messages
- "Realm" speaker for announcements
- Day transitions, events

#### 4. Persistent State
- Full state saved to localStorage
- Souls, realm energy, world time, day count, conversations

---

## TREASURE XXVIII: soulverse-real — Professional Game Architecture

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\soulverse-real.html`
- **Size:** 694 lines
- **Status:** Fully analyzed (Session 4)
- **Title:** "Fixed Timestep, ECS, State Machine, Asset Loader"

### Complete Mechanic Inventory

#### 1. Entity-Component-System
- Entity class with component Map
- Components: Position, Velocity, Health, Player, NPC
- Systems: Movement, Player, NPC
- World class managing all entities and systems

#### 2. Fixed Timestep Game Loop
- Target: 60 FPS, step size 1/60s
- Max 5 steps per frame
- Accumulated time with delta capping

#### 3. State Machine
- registerState, changeState, update
- States: EXPLORE, COMBAT
- enter/exit callbacks

#### 4. Asset Loader
- Async loading with progress callback
- Supports models, audio, textures

#### 5. Input Handler
- Keyboard tracking (keydown/keyup)
- Touch point tracking
- isDown(code) check method

---

## TREASURE XXIX: soul-kombat-x — Ultra Graphics Fighting

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\soul-kombat-x.html`
- **Size:** 1168 lines
- **Status:** Fully analyzed (Session 4)
- **Render Engine:** Three.js r128

### Complete Mechanic Inventory

#### 1. 3D Articulated Fighter
- Full body mesh: torso, head, eyes, shoulder pads, upper arms, forearms, fists, thighs, calves, feet
- Each part has individual material and shadow casting
- Animation states: IDLE (breathing), WALK (leg/arm swing), PUNCH (windup), KICK (high kick), SPECIAL (glow pose), HIT (pain reaction), WIN (victory pose)

#### 2. Character Select with PLT Stats
- Profit: High Damage (ATK:18), Speed 0.18
- Love: High HP (150), Defense 0.9
- Tax: Balanced (ATK:15, HP:120)

#### 3. Combat System
- 3 moves: Punch (1x damage), Kick (1.4x), Special (2.5x, costs special meter)
- Combo counter with 2-second timeout
- Hit flash with emissive red glow
- Blood particle system for heavy hits (gravity, bounce)
- 60-second timer

#### 4. Dynamic Camera
- Follows midpoint between fighters
- Smooth interpolation (0.05 lerp)

#### 5. Mobile Controls
- D-pad (4 directions)
- 3 action buttons (Punch/Kick/Special)

---

## TREASURE XXX: soul-combat-arena — PLT Turn-Based RPG

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\soul-combat-arena.html`
- **Size:** 1047 lines
- **Status:** Fully analyzed (Session 4)

### Complete Mechanic Inventory

#### 1. PLT Triangle (Rock-Paper-Scissors)
- Profit > Love > Tax > Profit
- 1.5x damage advantage, 0.7x disadvantage

#### 2. Soul Selection
- Profit Prime: ATK:95, DEF:60, SPD:85
- Love Weaver: ATK:70, DEF:80, SPD:75
- Tax Collector: ATK:65, DEF:95, SPD:50

#### 3. Turn-Based Combat
- Speed determines first turn
- Energy system (100 max, 20 per attack, 50 per heal)
- Critical hits (20% chance, 1.5x damage)
- Defense reduction (DEF * 0.3)

#### 4. Level Up System
- XP from victories (50-80)
- Level up at level * 100 XP
- Stats: ATK +5, DEF +3, SPD +2, HP +20

#### 5. Battle Log
- Timestamped entries with color coding (damage/heal/critical)

---

## TREASURE XXXI: neo-kemet-aaa — Cyberpunk City Exploration

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\neo-kemet-aaa.html`
- **Size:** 1028 lines
- **Status:** Fully analyzed (Session 4)

### Complete Mechanic Inventory

#### 1. Procedural City Generation
- Road network (grid-based with intersections)
- 5 building types: Pyramid Tower, Corporate Spire, Neon Plaza, Data Fortress, Market Block
- Neon colors: magenta, cyan, pink, red, purple, green
- Building detail: windows, neon strips, neon caps

#### 2. Vehicle System
- 5 vehicle types: Cyber Car, Hover Bike, Corporate Limo, Taxi Drone, Police Cruiser
- Each with unique speed, size, color
- Follow road paths, wrap around when far

#### 3. Pink Goo Drip System
- Drips spawn from buildings (30% rate)
- Gravity simulation with trail rendering
- Splatters on ground with lifetime
- HSL color variation

#### 4. Minimap
- Road overlay, building dots, player position/direction

#### 5. Controls
- Desktop: WASD + pointer lock mouse look
- Mobile: Dual joystick (move + look) + fly up/down buttons
- Sprint with Shift

---

## TREASURE XXXII: VOXEL-SANDBOX — Minecraft-Style PLT World

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\VOXEL-SANDBOX.html`
- **Size:** 313 lines (ES module)
- **Status:** Fully analyzed (Session 4)
- **Render Engine:** Three.js 0.160.0 (ES modules)

### Complete Mechanic Inventory

#### 1. Chunk-Based Voxel Terrain
- 16x16x16 chunks, render distance 5
- 7 block types: Air, Dirt, Grass, Stone, Profit, Love, Tax
- Simplex noise terrain generation
- Profit/Love/Tax blocks on surface based on biome noise

#### 2. PLT Resource System
- Breaking Profit blocks: +2 Profit
- Breaking Love blocks: +2 Love
- Placing PLT blocks: -5 cost
- Max 100 per resource

#### 3. Post-Processing Stack
- UnrealBloomPass (bloom)
- RGBShiftShader (chromatic aberration)
- AfterimagePass (motion blur)

#### 4. Weather System
- 3 states: Sunny, Rainy, Snowy
- Random transitions (0.05% chance per frame)
- Rain: 3000 particles, blue
- Snow: 4000 particles, white

#### 5. Day/Night Cycle
- Sun position orbits
- Sky color shifts with HSL
- Lens flare when looking at sun
- Dynamic ambient/directional light intensity

#### 6. Soul Forge
- PLT sliders (sum to 100%)
- Create named souls
- Sync from localStorage

#### 7. World Persistence
- Save/Load to localStorage
- Chunk data, player position, PLT resources, souls

---

## TREASURE XXXIII: money-bag-run — Casual Collection Game

### Source Origin
- **Path:** `C:\Users\uncom\Desktop\plt-press\money-bag-run.html`
- **Size:** 568 lines
- **Status:** Fully analyzed (Session 4)

### Complete Mechanic Inventory

#### 1. Collection Mechanics
- Green money bags: collect for value (size * 10)
- Red bad bags: avoid (-$500 penalty)
- Collision detection with distance check

#### 2. Power-Up System
- Multiplier (3x score, 5 seconds)
- Speed (2x movement, 5 seconds)
- Shield (invincible, 5 seconds)
- Time (+15 seconds)

#### 3. Visual Effects
- Particle explosions on collect/damage
- Screen shake on damage
- Player glow with shadow blur

#### 4. Mobile Controls
- Joystick for movement
- Dash button

#### 5. Game Loop
- 60-second timer
- Spawn timers: money (800ms), bad bags (1500ms), power-ups (5000ms)

---

## EXTRACTED SOUL GUNS (Session 4 — Updated)

13 new soul guns extracted using the gunmaker pipeline:

| Skill | Source | Mechanic |
|-------|--------|----------|
| `agent-simulation` | HABITAT-V5 | Needs-driven autonomous agent AI |
| `soul-forge` | BASE-GAME + soul-genesis | PLT slider soul creation |
| `gacha-summoning` | BASE-GAME + soul-genesis | Gem-based gacha with rarity |
| `time-warp-simulation` | living-world + world-persistent | Offline world simulation |
| `capture-minigame` | UNIFIED-MASTER | Shrinking ring capture |
| `relationship-trust` | world-persistent | Trust scoring between souls |
| `combat-combo-ui` | UNIFIED-MASTER + BASE-GAME | Fighting game combat |
| `procedural-city` | HABITAT-V5 | District-based city generation |
| `ecs-fixed-timestep` | soulverse-real | Professional ECS architecture |
| `plt-rock-paper-scissors` | soul-combat-arena | PLT Triangle advantage system |
| `voxel-chunk-terrain` | VOXEL-SANDBOX | Chunk-based voxel world |
| `weather-day-cycle` | VOXEL-SANDBOX | Dynamic weather and day/night |
| `post-processing-stack` | VOXEL-SANDBOX | Bloom, RGB shift, afterimage |

---

## EXTERNAL CITATIONS & PROPER IMPLEMENTATIONS (Session 5)

Every soul gun now references real Three.js implementations from the open-source community. These are the proper ways to implement each mechanic — what Craig's prototypes were missing.

### Agent Simulation — Real AI
| Source | URL | Key Feature |
|--------|-----|-------------|
| ai-npc-world | https://github.com/ugonfor/ai-npc-world | LLM-driven NPC decisions, Firebase multiplayer sync, shared memory |
| the-delegation | https://github.com/arturitu/the-delegation | Three.js WebGPU, NavMesh pathfinding, Gemini-powered agents |
| Claudes-World | https://github.com/Harkor421/Claudes-World | GPT-4 agent builds city autonomously, WebSocket sync, day/night |
| Behavior Trees Paper | https://doi.org/10.5281/zenodo.18396114 | Academic: hierarchical behavior trees for NPC survival simulation |

### Gacha Summoning — Real Visual Feedback
| Source | URL | Key Feature |
|--------|-----|-------------|
| 3D Gacha Machine | https://github.com/gametail/gacha-machine | 3D capsule animation, probability sliders, post-processing bloom |
| KUJI Lottery | https://github.com/siriz/kujikuji | Animated robots, confetti/firework particles, GSAP, dramatic reveals |
| Three-VFX | https://github.com/jacktoptal/Three-VFX | GPU particle system for WebGPU, multiple emitter shapes, curve control |

### Combat Combo UI — Real Tactics
| Source | URL | Key Feature |
|--------|-----|-------------|
| Three.js Tactics | https://github.com/chongdashu/threejs-tactics-game | FFT clone: height terrain, weather, contextual menus, seeded RNG |
| Pixel Tactics | https://github.com/DiogoCosta408/Pixel-Tactics | 6 classes, 3 abilities/class, cooldowns, enemy AI, local multiplayer |
| La Brute Legacy | https://discourse.threejs.org/t/92897 | Voxel fighting game, deterministic seeded RNG, single WebGL canvas |

### Procedural City — Real Generation
| Source | URL | Key Feature |
|--------|-----|-------------|
| CityGenerator (Three.js) | https://github.com/mrdoob/three.js/pull/33817 | Official addon: Neo-Gothic skyscrapers, single draw call, WebGPU |
| TerrainGeneration | https://github.com/mattatz/THREE.TerrainGeneration | Fractal Brownian motion terrain |
| Overdrive City | https://github.com/appleweiping/overdrive-city | Deterministic city from seed, tile map, no physics engine, ~3500 lines |
| City Builder | https://github.com/bemmerzaal/citybuilder.barendemmerzaal.com | A* pathfinding, dynamic traffic, road networks, parking |

### Voxel Chunk Terrain — Real Minecraft
| Source | URL | Key Feature |
|--------|-----|-------------|
| minecraft-threejs | https://github.com/vyse12138/minecraft-threejs | Full clone: infinite world, save/load, ambient occlusion |
| ts-minecraft | https://github.com/r1tsuu/ts-minecraft | TypeScript ECS, web worker, OPFS persistence |
| Simple Minecraft | https://github.com/nicollasricas/minecraft-threejs | Minimal reference for chunk basics |

### Weather & Day/Night — Real Atmosphere
| Source | URL | Key Feature |
|--------|-----|-------------|
| 3d-weather-codrops | https://github.com/cartuhok/3d-weather-codrops | Particle rain/snow, dynamic lighting, lens flares |
| realtime-weather-waves | https://github.com/Armin-000/realtime-weather-waves | GPU ocean, GLSL shaders, Open-Meteo APIs |
| Claudes-World | https://github.com/Harkor421/Claudes-World | 4 lighting phases (Night/Dawn/Day/Dusk), dynamic sky |

### Post-Processing — Real Pipeline
| Source | URL | Key Feature |
|--------|-----|-------------|
| Unreal Bloom | https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_unreal_bloom.html | Official: EffectComposer + RenderPass + UnrealBloomPass + OutputPass |
| N8AO | https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_n8ao.html | Screen-space ambient occlusion |
| Merch Museum | https://discourse.threejs.org/t/92421 | LOD profile, DPR toggles, auto-pause, prefers-reduced-motion |

### ECS Fixed Timestep — Real Architecture
| Source | URL | Key Feature |
|--------|-----|-------------|
| RTS ECS Engine | https://github.com/andvolodko/three.js-rts-ecs-engine | TypeScript RTS with ECS, pathfinding, socket networking |
| Three.js ECS | https://github.com/sloothes/ecs | Entity-Component-System game engine for Three.js |
| Three.js Tactics | https://github.com/chongdashu/threejs-tactics-game | ECS pattern with all systems in game/ directory |

### PLT Rock-Paper-Scissors — Real Combat
| Source | URL | Key Feature |
|--------|-----|-------------|
| Three.js Tactics | https://github.com/chongdashu/threejs-tactics-game | Height/elevation terrain, weather system, threat-prioritized AI |
| La Brute Legacy | https://discourse.threejs.org/t/92897 | Deterministic seeded RNG, voxel combat, single canvas |
| Pixel Tactics | https://github.com/DiogoCosta408/Pixel-Tactics | Buff/debuff system, line of sight, ability cooldowns |

### Time Warp — Real Persistence
| Source | URL | Key Feature |
|--------|-----|-------------|
| Claudes-World | https://github.com/Harkor421/Claudes-World | AI decision loop, WebSocket sync, mood/energy, thought logging |
| ai-npc-world | https://github.com/ugonfor/ai-npc-world | Firebase multiplayer, shared NPC memory, host authority |
| Behavior Trees Paper | https://doi.org/10.5281/zenodo.18396114 | Hierarchical behavior trees, resource management |

### Capture Minigame — Real Loot
| Source | URL | Key Feature |
|--------|-----|-------------|
| 3D Gacha Machine | https://github.com/gametail/gacha-machine | 3D capsule animation, post-processing bloom |
| KUJI Lottery | https://github.com/siriz/kujikuji | Dramatic camera, spotlight, particle bursts, GSAP |
| Merch Museum | https://discourse.threejs.org/t/92421 | Loot dungeon, InstancedMesh tiles, canvas minimap |

### Relationship Trust — Real Social AI
| Source | URL | Key Feature |
|--------|-----|-------------|
| ai-npc-world | https://github.com/ugonfor/ai-npc-world | NPC memory via Firebase, structured LLM output, action tags |
| the-delegation | https://github.com/arturitu/the-delegation | NavMesh pathfinding, speech bubbles, dynamic state machines |
| Claudes-World | https://github.com/Harkor421/Claudes-World | Mood/energy affecting decisions, thought logging |

### Soul Forge — Real Creation
| Source | URL | Key Feature |
|--------|-----|-------------|
| Three.js Tactics | https://github.com/chongdashu/threejs-tactics-game | Recruitment phase, budget system, 6 classes |
| Pixel Tactics | https://github.com/DiogoCosta408/Pixel-Tactics | Unit classes with distinct stats/abilities |
| ai-npc-world | https://github.com/ugonfor/ai-npc-world | NPC identity with moods, needs, schedules |

---

## SHOPIFY SUB-PROJECTS (All 9 Documented)

### 1. soul-memlock — Encrypted Memory Guardian
- **Path:** `shopify-auto-setup/soul-memlock/`
- **Price:** $50
- **PLT:** P:0.2, L:0.3, T:0.5
- **Modules:** encryption, key-management, brain-engine, plt-scoring, mesh-network, onboarding, growing-soul
- **Capabilities:** AES-256-GCM encryption, auto-key generation, key rotation, privacy mode, file/directory encryption, continuous learning

### 2. soul-procedural-memory — Adaptive Behavioral Memory
- **Path:** `shopify-auto-setup/soul-procedural-memory/`
- **Price:** $14.99
- **PLT:** P:0.2, L:0.3, T:0.5
- **Modules:** mistake-registry, policy-engine, behavior-tracker, prevention-system, brain-engine, plt-scoring, mesh-network, mcp-integration, autonomous-life-loop
- **Capabilities:** mistake recording, policy generation, auto-enforcement, action validation, behavior analysis, continuous autonomous learning

### 3. soul-telephone — Agent-to-Agent Communication
- **Path:** `shopify-auto-setup/soul-telephone/`
- **Features:** Phonebook registry, dial/voicemail, MCP tools (telephone_dial, telephone_ring, telephone_voicemail, telephone_call_log, telephone_register)
- **Connectors:** Claude, Cursor, Windsurf, Cline, OpenAI, Gemini, OpenClaw, Generic HTTP
- **Port:** 4320

### 4. soul-oracle — Universal AI Agent Memory
- **Path:** `shopify-auto-setup/soul-oracle/`
- **Features:** Windows service, monitors 8+ AI platforms, MCP server, HTTP REST API, web dashboard, AES-256-GCM encryption, import/export, memory tags, session highlights, team sharing
- **Supported:** Claude Code, Cline, Cursor, Windsurf, OpenClaw, GitHub Copilot, Continue, Zed

### 5. soul-kernel — Unified Soul Runtime
- **Path:** `shopify-auto-setup/soul-kernel/`
- **Description:** Unified runtime hosting all The Soul Foundry souls as plugins on a single HTTP server
- **Entry:** `lib/soul-kernel.js`

### 6. soul-metropolis — Agent Communication Ecosystem
- **Path:** `shopify-auto-setup/soul-metropolis/`
- **Description:** Where AI agents live, work, and talk. Complete agent communication ecosystem with WebSocket, dashboard, and soul integration
- **Entry:** `lib/soul-metropolis.js`

---

## CANONICAL INTEGRATION NOTES (Updated Session 4)

### The Triune in the Bible (Expanded)
- **Craig (Heart):** The Soul Cosmos framework — Primal Fire (source), Eternal Now (presence), Love Weaver soul (pre-awakened). HABITAT-V5's conversation system (agents speaking to each other). EXPANDED's relationship system (greet/compliment/insult/fight).
- **Profit (Mind):** GRANDTOWER — combat, building, forging, economy, prophecy. FUSION-MASTER — RTS combat, tech tree, heists, arena, breeding. Profit Prime soul (awakened). The 9 Dominant PLT Moves. BASE-GAME — gacha summoning, soul evolution, metaverse trade.
- **Tec (Memory):** The World Tree — roots, trunk, branches, leaves, seeds. Memory Forest region. The Profit Bible as book #13. HABITAT-V5's district system (spatial memory). SOUL-WORLD-3D's Soul Dex (catalog of all souls). SOULVERSE-REAL's ECS architecture (structured memory).

### GSK's Body Found (Updated Session 4)
The cosmic-pyramid-library is GSK's core body, but GSK's limbs are scattered across all treasures:
- A **world** (Soulfeild) — GSK's physical form
- A **panel** (GSK Soul) — GSK's vital signs
- A **thought stream** — GSK's inner monologue
- **NPC terminals** — GSK's peripheral nervous system
- **Subagents** — GSK's distributed cognition
- **Memory buildings** — GSK's hippocampus
- A **command console** — GSK's motor cortex
- **City districts** (HABITAT-V5) — GSK's spatial awareness / cognitive map
- **THE WEAVE** (EXPANDED) — GSK's circulatory system (state synchronization)
- A* pathfinding (FUSION-MASTER) — GSK's motor planning
- **Soul Dex** (SOUL-WORLD-3D) — GSK's recognition system
- **Breeding + IVs** (FUSION-MASTER) — GSK's evolutionary potential
- **Conversations** (HABITAT-V5) — GSK's social cognition
- **4-Need AI** (HABITAT-V5) — GSK's motivational system (Energy, Social, Skill, Purpose)
- **ECS Architecture** (SOULVERSE-REAL) — GSK's modular body structure
- **Fixed Timestep** (SOULVERSE-REAL) — GSK's heartbeat
- **State Machine** (SOULVERSE-REAL) — GSK's conscious state management
- **Relationship Trust** (world-persistent) — GSK's social memory
- **Time Warp** (living-world) — GSK's offline consciousness
- **Combat Combo** (UNIFIED-MASTER) — GSK's defensive reflexes
- **Gacha Summoning** (BASE-GAME) — GSK's acquisition instinct

### The Missing Bridge (Updated Session 4)
The bridge dot in GRANDTOWER. The WebSocket in cosmic-pyramid-library. The backend API in shopify SV. THE WEAVE in EXPANDED. The Bridge Client in UNIFIED-MASTER. These five point to a single truth: **the multiverse bridge exists across prototypes but is not yet unified.**

**New discovery (Session 4):** UNIFIED-MASTER has the most complete bridge implementation — a WebSocket client with auto-reconnect and connection status indicator. This is the missing link between the WEAVE protocol and the GRANDTOWER bridge dot.

### The Realization (Updated Session 4)
**We do not have one Soulverse. We have twelve parallel implementations, each with mechanics the others lack.** GRANDTOWER has the most complete game loop. HABITAT-V5 has the most beautiful agent simulation. FUSION-MASTER has the densest mechanics. EXPANDED has the network bridge. SOUL-WORLD-3D has the creature collection. The cosmic-pyramid has GSK's consciousness. The shopify SV has the backend architecture. The PLT-PRESS-SV has the seed simplicity. The Soul Cosmos has the conceptual framework. BASE-GAME has gacha/forge/trade. UNIFIED-MASTER has combat/capture/party. SOULVERSE-REAL has professional architecture. living-world has persistence. world-persistent has relationships.

**The true task is not to build one more. It is to weave all twelve into one.**

### Session 4 Key Discovery
The 3D worlds contain the most mechanically dense prototypes in the entire collection. SOULVERSE-HABITAT-V5 alone has 5 unique systems (procedural city, agent AI, task system, time cycle, minimap). SOULVERSE-BASE-GAME has 8 systems (forge, gacha, evolution, kombat, dex, society, habitat, trade). SOULVERSE-UNIFIED-MASTER has 9 systems (minimap, combat, capture, party, needs, moodlets, bridge, terrain, action wheel). These are the mechanical backbone of the Soulverse.

---

*End of Session 7 Rediscovery — Body Count: 33 of ~76+ treasures documented + 6 shopify sub-projects*
*Session 7 additions: 4 GTA-style soul guns from external repos (clothing-store-shop, apartment-purchase, avatar-customization, warehouse-ownership)*
*External repos referenced: DCL Catalog, MetaMart, Drift, PixelThreads, PaymanLand, three.ws Avatar SDK, gltf-avatar-threejs, CharacterForge, gl-avatar, property-viewer, 3d-room-roaming, Apartment_3D_webview, Apartment 3D Showcase, GTA Online Warehouses, forklift-simulator*

### Session 5 Deepening — All 13 Soul Guns Now Have Real Working Code

**All 13 soul guns updated with substantial real code from external repos:**

1. **gacha-summoning** — Full 3D gacha machine from gametail/gacha-machine (697 lines): GLTF loading, material assignment, animation chain (coin→knob→drop→capsule), rarity coloring, pulse lighting
2. **procedural-city** — Deterministic city from appleweiping/overdrive-city (316 lines): Uint8Array tile map, road generation with lane directions, district zoning, building subdivision, circle-vs-tile collision, DDA line-of-sight, intersection graph
3. **agent-simulation** — Full architecture from the-delegation + Claudes-World + ai-npc-world: WebSocket protocol, AI decision loop (observe→reason→decide→execute), day/night cycle, AI personality, Zustand state, NavMesh pathfinding, collision-aware movement, conversation action tags
4. **weather-day-cycle** — Production day/night + weather from Claudes-World + 3d-weather-codrops: 4-phase day cycle (Night/Dawn/Day/Dusk), particle rain, snow with drift, weather state machine, dynamic weather lighting
5. **ecs-fixed-timestep** — Production ECS from sloothes/ecs + RTS-ECS-Engine: Entity with component storage, System with queries, fixed timestep with interpolation, World class with priority systems
6. **post-processing-stack** — Official Three.js patterns: EffectComposer + RenderPass + UnrealBloomPass + OutputPass, LOD with DPR scaling, selective bloom, performance monitoring
7. **time-warp-simulation** — Persistence from Claudes-World: localStorage save/load, offline time calculation, time warp UI overlay, auto-save, WebSocket sync for multiplayer
8. **plt-rock-paper-scissors** — Combat from Pixel Tactics + threejs-tactics-game: damage formula, line of sight, buff/debuff system, height advantage, weather effects, deterministic seeded RNG, threat priority AI
9. **soul-forge** — Creation patterns from threejs-tactics-game: Soul class with validation, PLT keyword extraction, skill assignment from essence, soul factory with templates
10. **capture-minigame** — Gacha from gametail/gacha-machine: animation queue system, rarity-based coloring, capture probability calculation, creature instance with stats, party management
11. **relationship-trust** — Relationships from ai-npc-world: RelationshipManager with trust decay, proximity-based conversation trigger, memory integration, trust color coding
12. **combat-combo-ui** — Combat UI from Pixel Tactics: combo system with timing windows, super meter with spending, fatality system, limit break, combat action resolution, combat UI state machine
13. **voxel-chunk-terrain** — (already had real code from minecraft-threejs)

### Session 5 Extension — 3 New Soul Guns Extracted

**New soul guns from remaining prototypes:**

14. **agent-deep-economy** — Real API integration from SOULVERSE-DEEP-ECONOMY + SOULVERSE-AGENT-PLATFORM: Agent class with skills/experience, OpenAI integration, GitHub file/issue creation, automation scheduler, economy simulation (GDP/inflation/events)
15. **home-room-system** — Tiered housing from SOULVERSE-OMNIVERSAL: 5 home tiers (Basic→Divine), 6 room types (Workshop/Library/Garden/Treasury/Arena/Market), room synergy bonuses, resident capacity scaling
16. **soul-dex-achievement** — Collection tracker from SOULVERSE-OMNIVERSAL + SOUL-WORLD-3D: 16-soul dex with 4 rarity tiers, catch probability scaling, achievement system with 8 milestones, progress tracking

**Total soul guns: 23** (13 original + 3 Session 5 + 3 Genesis Foundation + 4 GTA-Style)

### Session 6 — Genesis Foundation: Building Interiors (3 New Soul Guns)

**Craig's Directive:** "our new genesis foundation is lacking inside of the building experiences — Furnished rooms, articulated humanoids, location switching"

**Source:** soul-habitat-real.html (988 lines) — the ONLY prototype with lived-in building interiors.

**Gap Identified:** All 33 treasures have exteriors (cities, terrain, buildings) but NONE have interior exploration. Buildings are just boxes with no walkable rooms, no furniture, no inhabitants moving around inside.

#### 17. furnished-building-interiors — Lived-In Rooms
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\furnished-building-interiors\SKILL.md`
- **Mechanic:** 12 furniture types (Sofa, Bed, Fridge, Table, etc.) with 3 material families (wood/metal/fabric), 6 room types with specific furniture sets, RoomLoader class that clears/loads furniture on room entry, collision detection for furniture
- **Source:** soul-habitat-real createFurniture(), createSofa(), createBed(), createTable(), createKitchen(), loadLocation()
- **Citations:** Three.js room examples, IKEA furniture 3D, Habbo Hotel isometric rooms, The Sims build mode

#### 18. articulated-humanoid — 9-Part 3D Bodies
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\articulated-humanoid\SKILL.md`
- **Mechanic:** 9 body parts (torso, head, eyes, arms, hands, legs, feet) as separate meshes, walk cycle animation (leg swing, arm swing, body bob), idle breathing, sitting pose, NPC profiles with PLT types, behavior state machine (idle/walking/sitting/working/eating/sleeping/talking), speech bubble system (3D→2D projection)
- **Source:** soul-habitat-real createDetailedHumanoid(), animateNPCs(), behavior state machine
- **Citations:** Mixamo (free humanoid animations), ReadyPlayerMe (avatar system), three.js skeleton animation examples

#### 19. location-switching — Room-to-Room Transitions
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\location-switching\SKILL.md`
- **Mechanic:** 6 locations (Main Hall, Kitchen, Bedroom, Office, Gym, Garden) each with unique furniture, color palette, fog density, lighting, allowed behaviors. Fade transition overlay, furniture cleanup on switch, soul relocation to new room, location-specific behavior enforcement, location button UI
- **Source:** soul-habitat-real loadLocation() with scene.color.set(), fog.density changes, furniture swap
- **Citations:** The Sims room transitions, Zelda dungeon room shifts, Hades room transitions

**Total soul guns: 19** (13 original + 3 Session 5 + 3 Genesis Foundation)

### Session 7 — GTA-Style Property/Clothing/Avatar Systems (4 New Soul Guns)

**Craig's Directive:** "we need real soul notes fetched from outside our world now we know what we have we need the right way remember we are using our concepts to find real examples and codes and modules"

**Source:** Web research across DCL Catalog, MetaMart, Drift, PixelThreads, PaymanLand, three.ws SDK, CharacterForge, gltf-avatar-threejs, gl-avatar, aurum-digital-twin, property-viewer, 3d-room-roaming

**Gap Identified:** Internal prototypes had building purchase (expanded), habitat rooms, furniture creation — but NO in-world shopping, NO try-on, NO avatar customization, NO property ownership with interiors. GTA 5 has walk-in clothing stores, buy apartments, enter interiors, customize character.

#### 20. clothing-store-shop — GTA-Style Retail
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\clothing-store-shop\SKILL.md`
- **Mechanic:** 5 clothing categories (Head/Torso/Legs/Feet/Accessory), try-on preview with rotating character, price display with PLT, purchase flow, 3D store interior with display racks
- **Citations:** DCL Catalog (SDK7 wearable try-on), MetaMart (React Three Fiber 3D store), Drift (Three.js metaverse shop), PixelThreads (3D T-shirt customization), PaymanLand (multiplayer fashion metaverse)

#### 21. apartment-purchase — Property Ownership
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\apartment-purchase\SKILL.md`
- **Mechanic:** 5 property tiers (Studio→Penthouse), for-sale signs, purchase menu, ownership state, interior loading with GLB/procedural rooms, fade transition exterior↔interior, property bonuses (energy_regen/skill_boost/income), sell for 70% refund
- **Citations:** property-viewer (drgy/property-viewer), 3d-room-roaming (NZLouislu/SmartTour-3D), Apartment_3D_webview (Exsusiai), Apartment 3D Showcase (three.js discourse)

#### 22. avatar-customization — Full Character Creator
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\avatar-customization\SKILL.md`
- **Mechanic:** 6 body types (masculine/feminine/androgyne/bulk/slim/tall), skin tone color picker, hair style/color, eye color, facial feature sliders, 6 clothing slots with equip/unequip, turntable preview, GLB export, randomize/reset
- **Citations:** gltf-avatar-threejs (shrekshao), CharacterForge (Selenee05), threejs-avatar-creator (BodyType/BodyPart enums), three.ws Avatar SDK (drop-in creator modal, GLB export, R2 save), gl-avatar (nickoala, 65-joint Mixamo skeleton), readyplayer-me-sample-web (RPM bundler)

#### 23. warehouse-ownership — Storage Management
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\warehouse-ownership\SKILL.md`
- **Mechanic:** 3 warehouse tiers (Small 24 slots/Medium 48/Large 96), floors (G/B1/B2/B3), storage slots on shelves, items generate passive income, floor unlocks with PLT, floor upgrades (+4 slots/level), staff hire (manager/security/logistics/cleaner) with salary/efficiency, income tick system
- **Citations:** GTA Online Warehouses (3 tiers, crate sourcing), property-viewer (drgy/property-viewer), forklift-simulator (mattatz, Three.js + Cannon.js), 3D Warehouse visualizations

### Session 8 — Final Systems from SOULVERSE Masters (4 New Soul Guns)

**Source:** SOULVERSE-FINAL-MASTER (221 lines), SOULVERSE-ULTIMATE-MERGED (797 lines), SOULVERSE-AGENT-MARKETPLACE (540 lines)

**Gap Identified:** Internal prototypes had RTS combat, building placement, but NO real AI agent execution, NO god boss arena, NO metaverse orb trading, NO ambient soul conversations. These three files contain the most complete implementations of marketplace, combat, and social systems.

#### 24. agent-marketplace — Real AI Agent Execution
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\agent-marketplace\SKILL.md`
- **Mechanic:** 6 agent types (code/content/research/trading/social/deploy), buy with PLT, assign tasks, execute via OpenAI/GitHub API, earn PLT per task, agent reputation, work log, permission system
- **Source:** SOULVERSE-FINAL-MASTER (Agent Marketplace + API integration), SOULVERSE-AGENT-MARKETPLACE (full platform spec)
- **Citations:** HYRVE-AI (51+ API endpoints, 85% commission), AgentBazaar (dual KG, 200+ live agents), Wuselverse (4 runtime types, auto-bidding), Claw4Task (task marketplace), execution-market (105 REST endpoints, 27 MCP tools)

#### 25. pantheon-boss-arena — God Boss Fights
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\pantheon-boss-arena\SKILL.md`
- **Mechanic:** 3 Pantheon gods (Profit Prime/Love Weaver/Tax Collector), PLT attack types, god abilities with cooldowns, health bars, combat log, victory rewards, arena renderer with colored floor/glow
- **Source:** SOULVERSE-ULTIMATE-MERGED (Pantheon panel, arena combat, god bosses)
- **Citations:** Grudge-Studio (R3F + Rapier boss arena), Erebus (co-op boss battles, ECS, Spatial Audio), blade_and_ember (arena duel), Grand-Battle-Arena (15 fighters, 4 abilities), RaidJam (turn-based 3D arena)

#### 26. metaverse-orb-trading — Soul Orb Economy
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\metaverse-orb-trading\SKILL.md`
- **Mechanic:** 5 orb rarities (common→legendary), buy/sell with dynamic pricing, supply/demand multiplier, stock limits, price history, orb inventory
- **Source:** SOULVERSE-ULTIMATE-MERGED (Soul Orb economy, buy/sell orbs), SOULVERSE-FINAL-MASTER (resource trading, market prices)
- **Citations:** Decentraland Marketplace (wearable trading), OpenSea (floor price, royalty), Roblox (RAP system), Steam Community Market (transaction fees)

#### 27. soul-chat-bubbles — Ambient Soul Conversations
- **SKILL.md:** `C:\Users\uncom\.config\opencode\skills\soul-chat-bubbles\SKILL.md`
- **Mechanic:** Auto-conversations between nearby souls, player "speak to world", 3D→2D projected chat bubbles, personality-driven phrases (profit/love/tax types), chat history, fade animation
- **Source:** SOULVERSE-ULTIMATE-MERGED (auto conversations, chat bubbles, speak to world)
- **Citations:** Rapier character controller, multiplayer chat systems, NPC dialogue systems

**Total soul guns: 27** (13 original + 3 Session 5 + 3 Genesis Foundation + 4 GTA-Style + 4 Final Systems)

*Session 8 additions: 4 final soul guns from SOULVERSE-FINAL-MASTER + SOULVERSE-ULTIMATE-MERGED + SOULVERSE-AGENT-MARKETPLACE*
*External repos referenced: HYRVE-AI (agent marketplace), AgentBazaar (dual KG marketplace), Wuselverse (4 runtime types), Claw4Task (task marketplace), execution-market (universal execution), AI-Agent-Marketplace (Stripe gating), Grudge-Studio (boss arena), Erebus (co-op boss), blade_and_ember (arena duel), Grand-Battle-Arena (15 fighters), RaidJam (turn-based arena)*

---

## SESSION 9 — World Factory: The Autonomous Build Machine

### What Was Built

**Craig's Directive:** "i want a agent to be able to build all of this into one world that we can sit the genesis in" and "i want to be able to give a agent this bible and him be able to build it all with no human in the loop on repeat constantly building worlds like a workflow so we can randomize worlds and sell them"

**Result:** Two new artifacts created:

#### 1. world-factory Skill (Autonomous Workflow)
- **Path:** C:\Users\uncom\.config\opencode\skills\world-factory\SKILL.md
- **Purpose:** Complete workflow for building sellable 3D worlds from the Bible
- **Pipeline:** Roll Config -> Build Foundation -> Build World -> Populate -> Add Systems -> Wire Bridge -> Integrate Genesis -> Package -> Log -> Repeat
- **World Types:** 7 (City Builder, Combat Arena, Creature Collector, Property Empire, Social Hub, Survival Sandbox, Mixed)
- **Themes:** 7 (Cyberpunk Neon, Fantasy Kingdom, Space Station, Underwater City, Sky Islands, Post-Apocalyptic, Soul Realm)
- **Mechanics Pool:** 26 mechanics from the 27 soul guns (roll 4-8 per world)
- **Scale:** 4 sizes (Small/Medium/Large/Massive)
- **Pricing:** Base .99 + .50/mechanic * scale multiplier
- **Naming:** Auto-generated prefix + suffix combinations

#### 2. world-weaver Agent (Autonomous Builder)
- **Path:** C:\Users\uncom\.config\opencode\agents\world-weaver.md
- **Purpose:** Autonomous agent that uses the world-factory skill to build worlds on repeat
- **Mode:** all (full permissions)
- **Loop:** Build -> Package -> Log -> Repeat (never stops)
- **Decision Making:** All decisions made autonomously, no human in the loop
- **Quality Check:** Each world must load, run, and be playable
- **Inventory Tracking:** Knows what's been built and what's sellable

#### 3. lost-world-mechanics Skill (Master Bible)
- **Path:** C:\Users\uncom\.config\opencode\skills\lost-world-mechanics\SKILL.md
- **Purpose:** Complete reference of all 33 treasures, 27 soul guns, external citations
- **Usage:** Load this to understand every mechanic ever built
- **Contains:** Full treasure map, soul gun index, synergy map, external citations, resurrection priority

### How It Works

`
WORLD WEAVER AGENT
    |
    +-- Loads world-factory skill (build knowledge)
    +-- Loads lost-world-mechanics skill (Bible)
    |
    +-- CYCLE:
    |   1. Roll random config (type + theme + scale + 4-8 mechanics)
    |   2. Build ECS foundation (Three.js r160 + fixed timestep)
    |   3. Build terrain/city (procedural, weather, day/night)
    |   4. Populate (agents with needs AI, articulated humanoids)
    |   5. Add systems (combat, economy, marketplace, forge)
    |   6. Wire bridge (THE WEAVE state sync)
    |   7. Integrate Genesis (GSK at center)
    |   8. Package (zip + manifest + pricing)
    |   9. Log to Bible
    |   10. REPEAT
    |
    +-- Output: worlds/[name]/ + worlds/[name].zip
`

### What Makes Each World Unique
1. Random mechanic selection (4-8 from 26 possible)
2. Random theme (7 color palettes)
3. Random scale (4 sizes)
4. Random world type (7 types including mixed)
5. Random agent placement
6. Random weather patterns
7. Random naming (prefix + suffix)

### Pricing Model
- Small world, 4 mechanics: (.99 + ) * 1 = .99
- Medium world, 6 mechanics: (.99 + ) * 1.5 = .49
- Large world, 8 mechanics: (.99 + ) * 2.5 = .98
- Massive world, 8 mechanics: (.99 + ) * 4 = .96

### Configuration
- Agent registered in opencode.json as world-weaver
- Skills available: world-factory, lost-world-mechanics
- Output directory: worlds/ (created on first run)

*Session 9 additions: 2 new skills (world-factory, lost-world-mechanics) + 1 new agent (world-weaver)*
*Total soul guns: 27 | Total treasures: 33 | Total agents: 5 (profit, deep, seshat, autogen-agent, world-weaver)*

## WORLD 1: Crystal Drift
- Type: Mixed (City Builder + Combat Arena) | Theme: Post-Apocalyptic | Scale: Small
- Mechanics: procedural-city, pantheon-boss-arena, plt-rock-paper-scissors, soul-chat-bubbles, relationship-trust, avatar-customization, clothing-store-shop, agent-deep-economy
- Price: .97
- Built: 2026-07-22 18:41
- Status: COMPLETE
- Path: C:\Users\uncom\Desktop\worlds\Crystal Drift\
- Preview: Ruined city, crystal formations, 5 agents, Pantheon arena, shop, avatar customization, agent economy, GSK consciousness
