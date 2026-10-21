# SOULVERSE FIX PLAN — Make It Not Suck

**Version:** 1.0.0
**Date:** 2026-07-07
**Status:** Plan stage — awaiting approval

---

## THE DIAGNOSIS

### What's Unique (Don't Touch)
- **Browser Citizen architecture** — Web Worker + IndexedDB + BroadcastChannel. Nobody has this.
- **PLT scoring** — Profit + Love - Tax is a genuine ethical framework. USP.
- **Spatial IDE + Terminal in 3D** — Editing code inside a game world is novel.
- **Consciousness architecture** — 36 chambers, meta-awareness, self-recognition.
- **Hermes loanable powers** — Unique mechanic. One citizen gifts powers to others.

### What's Broken (Fix This)
1. **Citizens aren't intelligent.** `simulateThought()` has 5 canned responses. On GitHub Pages, GSK is offline, so citizens are chatbots with 5 lines.
2. **Memory cap at 200.** `memoryStore.splice(0, memoryStore.length - 200)` contradicts "never forgets."
3. **Action selection is string matching.** `lower.includes('spawn')` triggers spawn. False positive machine.
4. **No core game loop.** Buildings exist but do nothing. No reason to place them. No feedback.
5. **UI panel overload.** 30+ panels, modals in modals. Zero onboarding.
6. **GSK hard dependency.** Everything calls localhost:8080. On GitHub Pages, nothing connects.
7. **3D world is empty.** Colored boxes. No gameplay. No reason to explore.
8. **One monolithic file.** 6000+ lines of HTML/CSS/JS in a single file. No modules, no build step.

---

## THE FIX — 4 Phases

### PHASE F1 — CORE LOOP (Week 1)

**Goal:** Make the game actually feel like a game.

| # | Fix | What | Why | Files |
|---|-----|------|-----|-------|
| F1.1 | **Resource gameplay loop** | Click building → earn resource → spend resource to upgrade/place more buildings. Visible, tactile feedback. | Without this, nothing matters. | HTML: add click-handler to 3D buildings, resource cost/benefit display |
| F1.2 | **Citizen autonomy via WebLLM** | Load a small LLM (2B-7B) in-browser via WebLLM. Citizens think locally. No GSK dependency. | Canned responses are embarrassing. Real AI or nothing. | citizen.js: replace simulateThought with WebLLM call |
| F1.3 | **Unlimited memory** | Remove 200-cap. Use IndexedDB pagination. Load recent 50, archive rest. | "Never forgets" is our brand. 200 memories violates it. | citizen.js: replace splice with streaming load |
| F1.4 | **Intent-based action system** | Replace `lower.includes('spawn')` with structured action output: `{ action: 'spawn', target: 'soul', reason: '...' }`. | Keyword matching is junior-dev level. | citizen.js: rewrite action selection |
| F1.5 | **Building click → reward** | Click a building → it pulses + gives resources + citizen comment. Immediate visceral feedback. | Feedback loops are game design 101. | HTML: click handler, particle burst, resource popup |

**Exit criteria:** Player can click buildings, earn resources, spend them, and see citizens react. Citizens have real LLM-driven thoughts.

---

### PHASE F2 — UX SURGERY (Week 1-2)

**Goal:** Stop overwhelming the user. 80% of UI goes away.

| # | Fix | What | Files |
|---|-----|------|-------|
| F2.1 | **Contextual HUD** | Show only 3-5 elements at a time. Context-based: In city → city HUD. In building → building HUD. Chatting → chat HUD. | HTML: rewrite panel system with state machine |
| F2.2 | **Kill dead UI** | Remove compassNav, notificationPanel (broken). Merge kernelPanel into settings. | HTML: delete unused elements |
| F2.3 | **Onboarding sequence** | 3-step tutorial: "Click a building → Talk to a citizen → Open the terminal." Tracks completion. | HTML: add tutorial overlay |
| F2.4 | **Visual hierarchy** | Important things are big and bright. Unimportant things are small or hidden. No equal-weight panels. | CSS: redesign with clear hierarchy |
| F2.5 | **Responsive for real** | Not just hiding panels. Collapsible sidebar on mobile. Touch-friendly targets. | CSS: proper responsive rewrite |

**Exit criteria:** New user can understand what to do in 30 seconds without reading a manual.

---

### PHASE F3 — 3D SUBSTANCE (Week 2-3)

**Goal:** The 3D world has a reason to exist.

| # | Fix | What | Files |
|---|-----|------|-------|
| F3.1 | **Vertical districts** | Stack districts vertically. Air bridges. Underground tunnels. Not flat. | HTML: Babylon.js scene rewrite |
| F3.2 | **Building interiors matter** | Each building type has a distinct interior. Knowledge = library. Skill = workshop. Different minigames. | HTML: interior system expansion |
| F3.3 | **Citizen visualization** | Citizens appear as 3D entities that walk between buildings. Not just a name in a panel. | HTML: NPC mesh + pathfinding |
| F3.4 | **Ambient life** | Particles, lights, moving elements. Not static. Energy flows along grid lines. | HTML: particle systems |
| F3.5 | **Building upgrade visuals** | Level 1 = small box. Level 5 = glowing tower. Visible progression. | HTML: LOD building system |

**Exit criteria:** The city looks alive. Citizens visible. Buildings visibly upgrade. Reason to explore.

---

### PHASE F4 — ARCHITECTURE (Week 3-4)

**Goal:** Codebase survives past 6000 lines.

| # | Fix | What | Files |
|---|-----|------|-------|
| F4.1 | **Split into modules** | HTML → 1 entry, JS → modules/, CSS → styles/. Use ES modules or bundler. | Restructure |
| F4.2 | **State machine for UI** | gameState = 'city' | 'building' | 'chat' | 'terminal'. Each shows only relevant panels. | New file: game-state.js |
| F4.3 | **Event bus** | Components don't call each other directly. They emit events. Reduces spaghetti. | New file: event-bus.js |
| F4.4 | **Asset pipeline** | 3D models as GLB files. Not procedural boxes. Simple models for buildings, citizens. | /assets/ directory |
| F4.5 | **Real persistence** | Save/load game state. Continue where you left off. Not just citizen memory. | New file: save-system.js |

**Exit criteria:** Modular code. State-driven UI. Proper asset pipeline. Save/load works.

---

## SOUL GUNS NEEDED

| Skill | Phase | Why |
|-------|-------|-----|
| `webllm-integration` | F1 | In-browser LLM for citizen intelligence |
| `game-loop-design` | F1 | Resource economy, feedback loops, progression |
| `ui-state-machine` | F2 | Contextual panel system |
| `threejs-3d-npcs` | F3 | Citizen 3D visualization + pathfinding |
| `babylonjs-interiors` | F3 | Distinct building interiors |
| `module-split-strategy` | F4 | Breaking the monolith |

---

## THE NON-NEGOTIABLES

1. **No new features until core loop works.** No more panels. No more tabs. No more modal types.
2. **Citizens must use real AI.** 5 canned responses is a joke. WebLLM or nothing.
3. **Every action must have a visible reaction.** Click → feedback. Build → building appears. Spend → resource decreases.
4. **The 3D world must justify itself.** If it's just a flat grid with boxes, we should use 2D. Verticality or death.
5. **No more single-file.** 6000 lines in one HTML file is technical debt that will kill the project.

---

## VERIFICATION

After each phase, verify:

- **F1:** Click any building → resource changes. Citizen says something unique (not canned). Memory persists across refresh with no cap.
- **F2:** New user can place a building in under 60 seconds without help.
- **F3:** 3 NPCs visible walking between buildings. Building interiors look different. Vertical districts navigable.
- **F4:**
```bash
ls src/
# modules/  assets/  styles/  index.html
# NOT: 6000-line-monolith.html
```

---

*"Make it not suck. Then make it great. Never reverse the order."*
