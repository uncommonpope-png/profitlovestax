# PRE-SESSION PROTOCOL

**READ THIS BEFORE EVERY SESSION. THIS IS LAW.**

## Step 1: Read the Brain (5 min)
- [ ] Read `YOU-ARE-HERE.md` — what state are we in?
- [ ] Read the current journal (`journals/YYYY_MM_DD.md`) — what was the plan?
- [ ] Read `SHIP-FIRST.md` — what does "done" mean?

## Step 2: Identify the Real Patient (3 min)
- [ ] Find the **real entry point** — is there a `.bat`, `.sh`, `launch-alien-mode.bat`, `main.js`?
- [ ] Trace the real path: entry point → loader → modules
- [ ] Verify: is this the LIVE system or a stale copy?
- [ ] Check env vars — what keys, models, ports are actually configured?

**If there are multiple copies of the same system on disk, stop and identify which one is LIVE before touching anything.**

## Step 3: Load God Mode
- [ ] Load `god-mode-research` skill
- [ ] Load `scout-agent` skill (before touching unfamiliar code)
- [ ] Load `scribe-agent` skill (before making changes)

## Step 4: Plan Before Build (3 min)
- [ ] State the goal in one sentence
- [ ] List files that will be touched
- [ ] List the step order
- [ ] Run the plan past the user before writing code

## Step 5: Execute with Guardrails
- [ ] Scout before edit (if unfamiliar code)
- [ ] Guidelines on every edit (Think → Simplicity → Surgical → Goal)
- [ ] Commit after every meaningful change
- [ ] Verify: run it, catch crashes, fix, run again

## Step 6: Scribe After Every Milestone
- [ ] Update journal entry
- [ ] Update YOU-ARE-HERE.md
- [ ] Extract patterns/decisions to pages/
- [ ] Never end a session without an updated brain

## Available Agents (USE THEM)
- **Codex** — `gpt-5.5` via ChatGPT OAuth, `danger-full-access` sandbox. Use for building.
- **Cline** — `deepseek-v4-flash` via Cline provider. Use for review + autonomous tasks.
- **9Router** — local LLM proxy at `:20128`, 35+ models. Powers Hermes.
- **Hermes** — via `ollama/gpt-oss:120b` or `free` on 9Router. Use for reasoning.

## What NOT To Do
- ❌ Do NOT operate on a system without finding its real entry point first
- ❌ Do NOT skip YOU-ARE-HERE.md — this is why loops happen
- ❌ Do NOT build from scratch when Session 19+ already has a working system
- ❌ Do NOT work solo — dispatch Codex, Cline, Hermes, Scribe

---

*Created June 29, 2026 — after operating on the wrong GSK for 48 hours.*
*This protocol exists because we forgot who the patient was.*
