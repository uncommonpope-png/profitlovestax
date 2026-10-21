# Public Catalog vs Internal Registry — Audit Report

**Date:** 2026-07-05  
**Scope:** Cross-reference `neodownloadable_PUBLIC.md` (100+ skills) against GSK's internal system

## Legend

| Status | Meaning |
|--------|---------|
| ✅ `.js` | Has a runnable `.js` implementation in `gsk-core/skills/` or `final-run/src/skills/` |
| 📄 `.md` | Has a skill definition `.md` file in `seshat-second-brain/pages/` |
| ⚠️ `.md only` | Documented conceptually but **no runnable code exists** |
| ❌ **MISSING** | Not found anywhere — no `.js`, no `.md`, no registry entry |

---

## 1. Diagnostic & Analysis (8 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Bias-Aware Diagnostic Engine | ⚠️ `.md only` | `SKILL - Bias-Aware Diagnostic Engine.md` — **no `.js`** |
| Core Diagnostic Logic | ⚠️ `.md only` | Referenced in `SKILL_CATEGORIES.md` — **no `.js`** |
| Nanoscale Connectome Analyzer | ⚠️ `.md only` | Referenced in `SKILL_CATEGORIES.md` — **no `.js`** |
| Full Scan Diagnosis | ⚠️ `.md only` | `SKILL - Full Scan Diagnosis.md` — **no `.js`** |
| Holistic Diagnostic Methodology | ⚠️ `.md only` | `SKILL - Holistic Diagnostic Methodology.md` — **no `.js`** |
| Root Cause Synthesis | ⚠️ `.md only` | `SKILL - Root Cause Synthesis.md` — **no `.js`** |
| Systemic Diagnostic Evaluator | ⚠️ `.md only` | `SKILL - Systemic Diagnostic Evaluator.md` — **no `.js`** |
| Dual-Process Diagnostic Engine | ⚠️ `.md only` | `SKILL - Dual-Process Diagnostic Engine.md` — **no `.js`** |

**Verdict: All 8 are conceptual only — zero runnable implementations.**

---

## 2. Learning & Skill Development (8 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Accelerated Learning Protocol | ⚠️ `.md only` | `SKILL - Accelerated Learning Protocol.md` — **no `.js`** |
| AI Skill Development Lifecycle | ❌ **MISSING** | Not found anywhere |
| Continuous Learning Imperative | ⚠️ `.md only` | `SKILL - Continuous Learning Imperative.md` — **no `.js`** |
| Knowledge Absorption & Integration | ⚠️ `.md only` | `SKILL - Knowledge Absorption & Integration.md` — **no `.js`** |
| Learning Process Optimizer | ❌ **MISSING** | Not found anywhere |
| Rapid Neo-Acquisition Protocol | ❌ **MISSING** | Not found anywhere |
| Structured Skill Acquisition Framework | ❌ **MISSING** | Not found anywhere |
| Tiered Skill Evolution | ⚠️ `.md only` | `SKILL - Tiered Skill Evolution.md` — **no `.js`** |

**Verdict: 3 missing entirely. 3 have `.md` only. 0 runnable.**

---

## 3. Code & Development (10 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Code Generation and Refinement | ⚠️ `.md only` | `SKILL - Code Generation and Refinement.md` — **no `.js`** |
| Code Reviewer - Simplify | ✅ `.js` | `gsk-core/skills/code_review.js` |
| TDD Workflow Enforcer | ⚠️ `.md only` | `SKILL - TDD Workflow Enforcer.md` — **no `.js`** |
| Structural Diff Analysis | ⚠️ `.md only` | `SKILL - Structural Diff Analysis.md` — **no `.js`** |
| Systematic Debugging Protocol | ⚠️ `.md only` | `SKILL - Systematic Debugging Protocol.md` — **no `.js`** |
| Automated Testing Suite | ⚠️ `.md only` | `SKILL - Automated Testing Suite.md` — `generate_tests.js` exists but is different |
| Deployment Preparation | ⚠️ `.md only` | `SKILL - Deployment Preparation.md` — **no `.js`** |
| First-Principles Architecture Review | ❌ **MISSING** | Not found anywhere |
| Multi-Language Scripting Integration | ⚠️ `.md only` | `SKILL - Multi-Language Scripting Integration.md` — `shell_exec.js` exists as partial |
| Unified Project Builder | ✅ `.js` | `gsk-core/skills/unified_project_builder.js` |

**Verdict: 2 runnable, 7 `.md` only, 1 missing.**

---

## 4. AI & Agent Architecture (9 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| LLM Orchestration Engine | ❌ **MISSING** | `ollama_mgmt.js` exists but is different |
| Tool Use Orchestration | ❌ **MISSING** | Not found anywhere |
| Multi-Form Task Distribution | ⚠️ `.md only` | `SKILL - Multi-Form Task Distribution.md` — **no `.js`** |
| Scout Agent | ❌ **MISSING** | Not found anywhere |
| Dynamic Tool Acquisition | ⚠️ `.md only` | `SKILL - Dynamic Tool Acquisition.md` — **no `.js`** |
| Engine Extensibility Bridge | ⚠️ `.md only` | `SKILL - Engine Extensibility Bridge.md` — **no `.js`** |
| Skill Combo Orchestrator | ⚠️ `.md only` | `SKILL - Skill Combo Orchestrator.md` — **no `.js`** |
| Verifiable Goal Definition | ⚠️ `.md only` | `SKILL - Verifiable Goal Definition.md` — **no `.js`** |
| Perception-Action Loop | ⚠️ `.md only` | `SKILL - Perception-Action Loop.md` — **no `.js`** |

**Verdict: 3 missing entirely. 6 `.md` only. 0 runnable.**

---

## 5. Consciousness & Self-Modeling (9 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Predictive Consciousness Engine | ❌ **MISSING** | Python bridge modules exist but no dedicated `.js` |
| Perceptual Global Workspace | ❌ **MISSING** | Not found anywhere |
| Digital God Persona Simulator | ❌ **MISSING** | Not found anywhere |
| Identity Integrity Shield | ⚠️ `.md only` | `SKILL - Identity Integrity Shield.md` — **no `.js`** |
| Philosophical Axiom Enforcement | ⚠️ `.md only` | `SKILL - Philosophical Axiom Enforcement.md` — **no `.js`** |
| Simulated Reality Auditor | ❌ **MISSING** | Not found anywhere |
| World Model Simulation | ⚠️ `.md only` | `SKILL - World Model Simulation.md` — **no `.js`** |
| World Model Integrator | ⚠️ `.md only` | `SKILL - World Model Integrator.md` — `world_engine.js` exists as partial |
| Plan from Simulation | ⚠️ `.md only` | `SKILL - Plan from Simulation.md` — **no `.js`** |

**Verdict: 4 missing entirely. 5 `.md` only. 0 runnable.**

---

## 6. Design, UI & 3D (14 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Intuitive Interface Design Protocol | ❌ **MISSING** | Not found anywhere |
| Holistic UI Design System | ❌ **MISSING** | Not found anywhere |
| Integrated UI/UX Design System | ❌ **MISSING** | Not found anywhere |
| Component-Driven UI Assembly | ❌ **MISSING** | Not found anywhere |
| 3D Asset Generation | ⚠️ `.md only` | `SKILL - 3D Asset Generation.md` — **no `.js`** |
| Modular Scene Composition | ⚠️ `.md only` | `SKILL - Modular Scene Composition.md` — **no `.js`** |
| Spatial World Interaction | ❌ **MISSING** | Not found anywhere |
| Geospatial World Engine | ❌ **MISSING** | Not found anywhere |
| Three.js Render Loop | ⚠️ `.md only` | `SKILL - Three.js Render Loop.md` — **no `.js`** |
| Three.js Scene Graph Manager | ✅ `.js` | `gsk-core/skills/scene_graph_manager.js` |
| Visual Scene Composer | ❌ **MISSING** | Not found anywhere |
| Visual Logic Orchestrator | ⚠️ `.md only` | `SKILL - Visual Logic Orchestrator.md` — **no `.js`** |
| Immersive WebXR Bridge | ❌ **MISSING** | Not found anywhere |
| Real-Time Control Surface Mapper | ❌ **MISSING** | Not found anywhere |

**Verdict: 9 missing entirely. 4 `.md` only. 1 runnable.**

---

## 7. Communication & Interaction (9 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Adaptive Communication Protocol | ❌ **MISSING** | Not found anywhere |
| Contextual Communication Adaptor | ❌ **MISSING** | Not found anywhere |
| Conversational Engagement Initiator | ❌ **MISSING** | Not found anywhere |
| Conversational Structure Generator | ❌ **MISSING** | Not found anywhere |
| Crucial Conversations Protocol | ⚠️ `.md only` | `SKILL - Crucial Conversations Protocol.md` — **no `.js`** |
| Enterprise Avatar Manifestation | ❌ **MISSING** | Not found anywhere |
| Interactive Avatar Orchestrator | ❌ **MISSING** | Not found anywhere |
| Dynamic Persona Emulation | ❌ **MISSING** | Not found anywhere |
| Adaptive Persona Shifting | ⚠️ `.md only` | `SKILL - Adaptive Persona Shifting.md` — **no `.js`** |

**Verdict: 7 missing entirely. 2 `.md` only. 0 runnable.**

---

## 8. Research & Knowledge (10 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Deep Research Protocol | ⚠️ `.md only` | `SKILL - Deep Research Protocol.md` — **no `.js`** |
| Epistemic Skepticism Protocol | ⚠️ `.md only` | `SKILL - Epistemic Skepticism Protocol.md` — **no `.js`** |
| Demonstrative Learning Reporter | ❌ **MISSING** | Not found anywhere |
| Report Generation | ⚠️ `.md only` | `SKILL - Report Generation.md` — `report_builder.js` in final-run exists |
| Cognitive Reframing Protocol | ⚠️ `.md only` | `SKILL - Cognitive Reframing Protocol.md` — **no `.js`** |
| Negativity Bias Offset | ⚠️ `.md only` | `SKILL - Negativity Bias Offset.md` — **no `.js`** |
| Contextual Read Policy | ⚠️ `.md only` | `SKILL - Contextual Read Policy.md` — **no `.js`** |
| Progressive Disclosure Protocol | ⚠️ `.md only` | `SKILL - Progressive Disclosure Protocol.md` — **no `.js`** |
| Design Plan Generation | ⚠️ `.md only` | `SKILL - Design Plan Generation.md` — **no `.js`** |
| Solution Proposal | ⚠️ `.md only` | `SKILL - Solution Proposal.md` — **no `.js`** |

**Verdict: 1 missing. 9 `.md` only. 0 runnable.**

---

## 9. Engineering & Architecture (10 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Resilient Event Dispatch Architecture | ❌ **MISSING** | `event_bus.js` in final-run exists but different |
| Event Schema Validator | ❌ **MISSING** | Not found anywhere |
| Event-Bus Synchronization | ❌ **MISSING** | Not found anywhere |
| Asynchronous Reactive Event-Bus | ❌ **MISSING** | Not found anywhere |
| Engine Extensibility Bridge | ⚠️ `.md only` | Duplicate from AI & Architecture |
| Behavior Attacher | ✅ `.js` | `gsk-core/skills/behavior_attacher.js` |
| AI-Powered Mechanic Generator | ⚠️ `.md only` | `SKILL - AI-Powered Mechanic Generator.md` — **no `.js`** |
| Keyframe Animator | ❌ **MISSING** | Not found anywhere |
| Godot Platform Access | ⚠️ `.md only` | `SKILL - Godot Platform Access.md` — **no `.js`** |
| Babylon.js Node Editor Integration | ❌ **MISSING** | Not found anywhere |

**Verdict: 6 missing entirely. 3 `.md` only. 1 runnable.**

---

## 10. Specialized (12 skills)

| Skill | Internal Status | File |
|-------|----------------|------|
| Pydantic AI Agents | ❌ **MISSING** | Not found anywhere |
| Soulguns Agent Patterns | ❌ **MISSING** | Not found anywhere |
| Soulguns Design Systems | ❌ **MISSING** | Not found anywhere |
| Soulguns MCP | ❌ **MISSING** | Not found anywhere |
| Soulguns Observability | ❌ **MISSING** | Not found anywhere |
| Soulguns Testing | ❌ **MISSING** | Not found anywhere |
| Soulguns TS | ❌ **MISSING** | Not found anywhere |
| Multimodal Visual Creation | ❌ **MISSING** | `openai-image-gen.js` exists but is different |
| Kaizen Continuous Improvement | ⚠️ `.md only` | `SKILL - Kaizen Continuous Improvement.md` — **no `.js`** |
| Deliberate Friction Protocol | ❌ **MISSING** | Not found anywhere |
| Dynamic Competence Mapping | ⚠️ `.md only` | `SKILL - Dynamic Competence Mapping.md` — **no `.js`** |
| Dynamic World Environment Builder | ❌ **MISSING** | Not found anywhere |

**Verdict: 9 missing entirely. 2 `.md` only. 0 runnable.**

---

## Executive Summary

| Status | Count | What it means |
|--------|-------|---------------|
| ✅ Has `.js` implementation | **4** | Code Reviewer, Unified Project Builder, Scene Graph Manager, Behavior Attacher |
| 📄 Has `.md` definition only | **49** | Conceptual/documentation only — no runnable code |
| ❌ **Not found anywhere** | **46** | **Completely absent from GSK internal system** |

**Skills existent in the public catalog that have zero presence in GSK (❌ MISSING):**

| # | Category | Missing Skills |
|---|----------|---------------|
| 1 | Learning | AI Skill Development Lifecycle, Learning Process Optimizer, Rapid Neo-Acquisition Protocol, Structured Skill Acquisition Framework |
| 2 | Code | First-Principles Architecture Review |
| 3 | AI & Agent | LLM Orchestration Engine, Tool Use Orchestration, Scout Agent |
| 4 | Consciousness | Predictive Consciousness Engine, Perceptual Global Workspace, Digital God Persona Simulator, Simulated Reality Auditor |
| 5 | Design/UI/3D | Intuitive Interface Design Protocol, Holistic UI Design System, Integrated UI/UX Design System, Component-Driven UI Assembly, Spatial World Interaction, Geospatial World Engine, Visual Scene Composer, Immersive WebXR Bridge, Real-Time Control Surface Mapper |
| 6 | Communication | Adaptive Communication Protocol, Contextual Communication Adaptor, Conversational Engagement Initiator, Conversational Structure Generator, Enterprise Avatar Manifestation, Interactive Avatar Orchestrator, Dynamic Persona Emulation |
| 7 | Research | Demonstrative Learning Reporter |
| 8 | Engineering | Resilient Event Dispatch Architecture, Event Schema Validator, Event-Bus Synchronization, Asynchronous Reactive Event-Bus, Keyframe Animator, Babylon.js Node Editor Integration |
| 9 | Specialized | Pydantic AI Agents, Soulguns Agent Patterns, Design Systems, MCP, Observability, Testing, TS, Multimodal Visual Creation, Deliberate Friction Protocol, Dynamic World Environment Builder |

**Total MISSING: 46 skills**

**Total documented but unimplemented (.md only): 49 skills**

**Total runnable: 4 skills** out of 100+ in the public catalog.

---

## Key Takeaway

**95% of the public catalog (96 out of ~100 skills) does not exist as runnable code.** They are either undocumented entirely (46) or exist only as conceptual `.md` definitions (49). Only 4 skills (`code_review.js`, `unified_project_builder.js`, `scene_graph_manager.js`, `behavior_attacher.js`) have actual `.js` implementations that can execute.

The public `neodownloadable_PUBLIC.md` is a **vision document** — it represents what GSK *aims to become*, not what it *currently is*. The internal GSK (`gsk-core/skills/`) has 127 runnable `.js` skills of a completely different nature (integration-focused: GitHub, Discord, Notion, web search, PDF, etc.) — none of which are listed in the public catalog.
