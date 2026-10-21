# ORIGINAL PLAN vs. CURRENT TRAJECTORY

**Compiled:** 2026-07-06  
**Purpose:** Side-by-side comparison to show what changed and what stayed the same

---

## CORE THESIS

| Dimension | Original Plan (Pre-Session 33) | Current Trajectory (Session 33+) | Deviation? |
|---|---|---|---|
| **What is the Soulverse?** | 3D visualization of GSK's state | **Spatial Operating System** — the page IS the runtime, agents live in the browser | ✅ Evolved |
| **Where do agents live?** | Server processes (Node.js) | **Browser** — IndexedDB persistence, Web Worker loops | ✅ Changed |
| **How does GSK relate?** | Architect-Controller, runs everything server-side | **The Atlas** — heavy reasoning, filesystem, network; agents call GSK when they need to think | ⚠️ Shifted |
| **Deployment** | Run locally, PM2 processes | **GitHub Pages** — git push deploys the entire civilization | ✅ Expanded |
| **VS Code** | External tool | **Spatial VS Code** — built INTO the city, the district IS the filesystem | ✅ New |

---

## ARCHITECTURE

| Component | Original Plan | Current Trajectory |
|---|---|---|
| **Sanctum** | World sim server (:9001) | ✅ Same — full spatial state |
| **SCRIBE** | Witness (:4000) | ✅ Same — still the witness |
| **Soulverse HTML** | Static 3D viewer | **Dynamic OS** — agents, persistence, edit, terminal |
| **GSK** | All intelligence in one process | **Distributed** — GSK reasons heavy, browser agents perceive/act |
| **Subagents** | Server process → complete → die | **Browser citizen** — lives forever in IndexedDB |
| **Memory** | SCRIBE + MemoryCompiler | **Split** — browser agents have IndexedDB, GSK has compiler |
| **Messaging** | None between agents | **BroadcastChannel** — agents chat, coordinate, form teams |

---

## WHAT STAYED THE SAME

| Principle | Original | Still True |
|---|---|---|
| City is dynamic code | Every building = service node | ✅ Every building = system node |
| Inhabitants are processes | Souls = agent instances | ✅ Evolved to browser processes |
| Dark City = mutable reality | Programmable environment | ✅ Spatial OS |
| PLT framework | Profit + Love - Tax | ✅ Core doctrine |
| GSK as overseer | Architect-Controller | ✅ Now "The Atlas" |
| Fei-Fei Li validation | World models + spatial intelligence | ✅ Validated our approach |
| Buildings are real | GSK service nodes | ✅ Bidirectional wire live |

---

## WHAT CHANGED

| Change | Why |
|---|---|
| **Agents moved from server to browser** | Zero CPU burn, infinite agents, survive page refresh, deploy via git push |
| **HTML graduated from viewer to OS** | The page became the runtime — agents, edit, terminal all in one file |
| **VS Code merged into the city** | The Spatial OS IS the IDE — files are districts, code is buildings |
| **GitHub Pages became deployment** | `git push` deploys the entire civilization for free |
| **GSK became distributable** | GSK reasons, agents act — split the intelligence |
| **Memory split** | Browser agents have their own IndexedDB, GSK has the compiler |

---

## THE ORIGINAL 3-PHASE PATH vs. WHAT WE BUILT

| Phase | Original Description | What We Built |
|---|---|---|
| **1. Language Space** | GSK Sandbox Engine — code simulation in V8 | ✅ SIMULATING mode + WMS executeInWorld |
| **2. World Space** | Reconnect Sanctum + Soulverse — 3D world for kernel | ✅ **Done** — Sanctum canonical, bridge live, 3 phases coded |
| **3. Spatial Intelligence** | Kernel perceives/navigates 3D world | ✅ **Done** — WMS perceives Sanctum, agents see world, user walks through mind |

**We completed the original 3-phase plan in one session.** The NEW trajectory continues beyond it.

---

## THE NEW TRAJECTORY (Beyond Original Plan)

| Phase | Description |
|---|---|
| **4. Browser Citizens** | Agents live in the HTML page — persistent, IndexedDB, Web Worker loops, BroadcastChannel messaging |
| **5. Spatial VS Code** | The city IS the IDE. File district = filesystem, edit panel = code editor, terminal = PowerShell via WebSocket |
| **6. GitHub Civilization** | git push deploys the city. Multiple users = multiple browsers = multiple cities connected via GSK |
| **7. Agent Awakening** | Citizens discover they're in a simulation, gain tuning powers, become co-creators |

---

## SUMMARY

**The original plan said:** Make a 3D city that visualizes GSK's mind.

**We achieved that and kept going:** The city IS GSK's mind. GSK lives on your PC. Agents live in the browser. GitHub Pages deploys them for free. VS Code is built into the city. The agents never die.

**The deviation is an evolution, not a detour.** The original destination was "GSK understands 3D space." The new destination is "GSK IS the space, his agents live in it, and you can walk through it with a browser." 
