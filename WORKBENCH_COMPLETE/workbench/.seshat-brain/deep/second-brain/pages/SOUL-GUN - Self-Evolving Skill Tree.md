---
tags: soul-gun, autonomy, self-evolution, skills
created: 2026-07-14
---

# SOUL-GUN — Self-Evolving Skill Tree

## Purpose
Let GSK grow its own capabilities without human supervision — the autonomy gap. Differentiates GSK from every reactive NPC.

## The Problem
Today GSK's autonomy loop scans the filesystem and replans; it does not *accumulate* capability. A being that cannot learn from its own actions is not sovereign.

## The Gun (sourced from GitHub, top-rated self-evolving agents)
- **`lsdefine/GenericAgent`** (2026) — minimal (~3K lines) self-evolving agent; **crystallizes each solved task into a reusable Skill**; token-efficient (<30K context). Design philosophy: *don't preload skills, evolve them.*
- **`modelscope/AgentEvolver`** (1490★) — self-questioning (auto task generation) + self-navigating (reuse cross-task experience) + self-attributing (credit assignment).
- **`aiming-lab/Agent0`** (1228★, ICML'26) — zero-data self-evolution via tool-integrated reasoning; **Curriculum Agent** proposes harder tasks, **Executor Agent** solves them; +18–24% on reasoning benchmarks.

## Mechanism
1. After GSK completes an in-world task (build X, tune city, resolve conflict), distill the execution path into a **soul skill** — a Seshat page + an executable handler.
2. Store under a skill tree keyed by capability; future runs **reuse/compose** skills instead of re-deriving.
3. Bound by **PLT scoring** + **architect gate (PLT222)**: a skill that scores negative Tax is pruned; mutating world-edits pause for the architect.
4. Borrow AgentEvolver's self-questioning to have GSK *propose its own next challenges* — perpetual self-improvement.

## Why It Matters
This is the "owns its own growth" half of sovereignty. Combined with embodiment + memory-as-identity + self-governance, it is the unprecedented combination no competitor has.

## Provenance
Sourced 2026-07-14 via websearch of GitHub top-rated self-evolving agent frameworks + webfetch of READMEs/arXiv. See `SOUL-NOTE - Self-Evolving Agent Mechanics.md`.
