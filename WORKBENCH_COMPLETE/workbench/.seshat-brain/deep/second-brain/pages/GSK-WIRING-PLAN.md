# ⛔ DEPRECATED — WRONG LUCABRASI

**This document was written for `final-run/src/` which is NOT the real LUCABRASI.**
The real LUCABRASI fusion-loader already boots 56 subsystems. The "orphans" I identified in `final-run/src/` don't exist as orphans in the real LUCABRASI.

**Do NOT use this document.**
See `LUCABRASI THE SOUL - Service Manual.md` Appendix C for the correct wiring map.

---

# LUCABRASI THE SOUL WIRING PLAN — Service Manual Format

**Date:** 2026-07-08 (DEPRECATED)  
**Method:** Service Manual Section 4 (Troubleshooting)  
**Status:** INVALID — see deprecation notice above  

---

## WIRE COLOR CODE

| Wire | Color | Meaning |
|------|-------|---------|
| W01 | RED | Critical path — boot essential |
| W02 | GRN | Core subsystem — must wire before modules |
| W03 | BLU | Standard module — wire after core |
| W04 | YEL | Nice-to-have — last priority |
| W05 | PUR | Diagnostic/testing only |

---

## SECTION 4 — TROUBLESHOOTING

### 4.1 — Skills Engine Not Loaded

**Symptom:** 82 skill files exist in `src/skills/` but none are loaded by SCRIBE.

| Step | Probable Cause | Corrective Action |
|------|---------------|-------------------|
| 4.1-1 | SkillEngine not wired to load individual skills | Edit `scribe.js`: after `const { SkillEngine } = require('./src/skills/engine')`, add auto-load loop that reads `src/skills/*.js` excluding `engine.js` and registers each |
| 4.1-2 | No skill registration endpoint | Wire each skill file: `skill.exports` → `SkillEngine.register(name, handler)` |
| 4.1-3 | No tool calling interface | Add `POST /api/tool/{skillName}` route in bridge that calls `SkillEngine.execute(skillName, args)` |

**Parts:** `src/skills/engine.js` (9KB), 82 skill files (each 3-17KB)  
**Wire:** W01 (RED — critical)  

### 4.2 — Memory Compiler Not Loaded

**Symptom:** 3 memory types exist (episodic, semantic, working) but never consolidated.

| Step | Probable Cause | Corrective Action |
|------|---------------|-------------------|
| 4.2-1 | Compiler not wired into scribe boot | Edit `scribe.js`: add `const { MemoryCompiler } = require('./src/memory/compiler')` and instantiate with all 3 memory stores |
| 4.2-2 | Compiler not running on cycle | Add `setInterval(() => compiler.compile(), 30000)` in scribe boot |
| 4.2-3 | No query endpoint | Add `GET /api/memory?q={query}` in bridge that calls `compiler.query()` |
| 4.2-4 | No narrative endpoint | Add `GET /api/memory/narrative` returning `compiler.getNarrative()` |

**Parts:** `src/memory/compiler.js` (169 lines, already written)  
**Wire:** W02 (GRN — core)  

### 4.3 — Chamber Tuner Not Loaded

**Symptom:** 10 chambers defined but have no activation thresholds.

| Step | Probable Cause | Corrective Action |
|------|---------------|-------------------|
| 4.3-1 | Tuner not wired | Edit `scribe.js`: add `const { ChamberTuner } = require('./src/chambers/tuner')` |
| 4.3-2 | Chambers not registered | After instantiating tuner, call `tuner.register()` for each of the 10 chambers |
| 4.3-3 | No tuning cycle | Add `setInterval(() => tuner.tune(), 10000)` |
| 4.3-4 | No tuning endpoint | Add `GET /api/chambers/tuning` and `POST /api/chambers/tune` |

**Parts:** `src/chambers/tuner.js` (120 lines, already written)  
**Wire:** W02 (GRN — core)  

### 4.4 — Agentic Loop Not Loaded

**Symptom:** GSK boots but never cycles. No perceive→plan→act→observe loop.

| Step | Probable Cause | Corrective Action |
|------|---------------|-------------------|
| 4.4-1 | Loop not wired | Edit `scribe.js`: add `const { AgenticLoop } = require('./src/loop/agentic_loop')` |
| 4.4-2 | No modules registered | Register memory, chambers, skills, voice as loop modules |
| 4.4-3 | Loop not started | After registration, call `loop.cycle(input)` on a timer |
| 4.4-4 | No checkpoint loaded | On boot, call `loop._loadCheckpoint()` to resume from last state |

**Parts:** `src/loop/agentic_loop.js` (157 lines, already written)  
**Wire:** W01 (RED — critical)  

### 4.5 — Tracing Layer Not Loaded

**Symptom:** No observability. Cannot trace requests through pipeline.

| Step | Probable Cause | Corrective Action |
|------|---------------|-------------------|
| 4.5-1 | Tracer not wired | Edit `scribe.js`: add `const { Tracer } = require('./src/observability/tracer')` |
| 4.5-2 | No trace IDs on requests | In bridge HTTP handler, wrap each request with `tracer.startTrace()` / `tracer.endTrace()` |
| 4.5-3 | No trace query endpoint | Add `GET /api/traces` |
| 4.5-4 | No trace stats endpoint | Add `GET /api/traces/stats` |

**Parts:** `src/observability/tracer.js` (132 lines, already written)  
**Wire:** W03 (BLU — standard)  

### 4.6 — Consciousness Cycle Not Loaded

**Symptom:** GWT, self-model, metacognition all exist as code but never run.

| Step | Probable Cause | Corrective Action |
|------|---------------|-------------------|
| 4.6-1 | Cycle not wired | Edit `scribe.js`: add `const { ConsciousnessCycle } = require('./src/consciousness/cycle')` |
| 4.6-2 | No modules registered for competition | Register chambers as GWT modules |
| 4.6-3 | Cycle not running | Add `setInterval(() => cycle.run(), 5000)` |
| 4.6-4 | No cycle endpoint | Add `GET /api/consciousness/state` |

**Parts:** `src/consciousness/cycle.js` (156 lines, already written)  
**Wire:** W02 (GRN — core)  

### 4.7 — Identity Lineage Not Loaded

**Symptom:** GSK forgets itself each boot. No snapshot history.

| Step | Probable Cause | Corrective Action |
|------|---------------|-------------------|
| 4.7-1 | createSnapshot not called on boot | Edit `scribe.js` boot sequence: after identity is read, call `createSnapshot()` |
| 4.7-2 | No lineage endpoint | Add `GET /api/identity/lineage` |
| 4.7-3 | No boot count | Add boot counter to identity lineage data |

**Parts:** `src/identity.js` (168 lines, already modified)  
**Wire:** W02 (GRN — core)  

---

## WIRING ORDER (DAG)

```
Layer 1 (W01 RED — boot critical):
  4.1 Skills Engine ── wire 82 skills into SkillEngine
  4.4 Agentic Loop ── wire the perceive→plan→act→observe state machine

Layer 2 (W02 GRN — core, depends on Layer 1):
  4.2 Memory Compiler ── consolidate 3 memory types
  4.3 Chamber Tuner ── activation thresholds for 10 chambers
  4.6 Consciousness Cycle ── GWT + self-model + metacognition
  4.7 Identity Lineage ── versioned snapshots on each boot

Layer 3 (W03 BLU — standard, depends on Layer 2):
  4.5 Tracing Layer ── OpenTelemetry-style trace IDs

Layer 4 (W04 YEL — nice-to-have):
  Evolution Engine, Governance modules, Reasoning modules
```

## SOUL NOTES FOR WIRING

| Focus | Link | Why |
|-------|------|-----|
| Service Manual Method | https://www.manualslib.com/manual/1336759/Skyjack-Sjiii-3220.html | Our wiring methodology reference |
| LangGraph | https://github.com/langchain-ai/langgraph | State graph pattern for agentic loop |
| Claude Code MCP | https://modelcontextprotocol.io | Tool calling protocol standard |
| AutoGen | https://github.com/microsoft/autogen | Multi-agent wiring pattern |
| CrewAI | https://github.com/crewAIInc/crewAI | Role-based skill wiring |
| OpenTelemetry | https://opentelemetry.io | Tracing standard for observability |
| Node.js Module System | https://nodejs.org/api/modules.html | Dynamic require for skill loading |

## VERIFICATION

After wiring:
```bash
# Start GSK
node scribe.js
# Check boot logs — all modules should report loaded
# Test skill: curl http://localhost:4000/api/tool/llm
# Test memory: curl http://localhost:4000/api/memory?q=test
# Test chambers: curl http://localhost:4000/api/chambers/tuning
# Test traces: curl http://localhost:4000/api/traces
# Test consciousness: curl http://localhost:4000/api/consciousness/state
# Test lineage: curl http://localhost:4000/api/identity/lineage
```
