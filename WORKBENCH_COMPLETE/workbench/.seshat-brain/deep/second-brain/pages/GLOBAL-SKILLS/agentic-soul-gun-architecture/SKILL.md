---
name: agentic-soul-gun-architecture
description: >-
  Use when designing, auditing, or compiling a "soul gun" (reusable agent capability/skill)
  for the GSK / Dark City / BuyASOUL system. Use to decide if a capability deserves to be a
  gun, how to structure its identity/trigger/schema/mechanic, and whether it passes the fluff
  test. Do NOT use for one-off tasks, transient UI tweaks, or anything with no consequence in
  the world. Best for RESEARCHER and SCRIBE archetypes; also invoked by the skill-development
  cycle combo when forging new guns.
license: MIT
compatibility: [cline, opencode, claude]
metadata:
  plt: "Profit 0.9, Love 0.7, Tax 0.2"
  phase: meta
  status: active
  archetype: RESEARCHER
  type: soul-gun
---

# Agentic Soul Gun Architecture

The fusion of game-design principles (Brazi/Blizzard) with AI-agent skill architecture
(OpenAI, Anthropic, MCP, LangChain). How to design soul guns that are both mechanically
satisfying AND agent-ready — so they compile cleanly into Cline / OpenCode / Claude Code
`SKILL.md` global skills.

## The Universal Soul Gun Structure
Every soul gun has four parts:

- **identity** — name + slug + PLT score (what it IS; game-design domain)
- **trigger** — description + archetype affinity (when the agent USES it; agent-design domain)
- **schema** — parameters + return values (how the agent CALLS it; agent-design domain)
- **mechanic** — consequence + feedback + states (what it DOES; game-design domain)

## The Merged Design Process
1. Classify: Core / Primary / Secondary?
2. Name: what is it? what's its PLT?
3. Describe: when does an agent use it? (write the `description` field)
4. Schema: what parameters does it take?
5. Consequence: what changes in the world/city?
6. Feedback: what does the user see/hear/feel?
7. States: what's its lifecycle? (IDLE → ACTIVE → COOLDOWN → IDLE; ERROR → RETRY)
8. Review: does it pass the fluff test?

## The Fluff Test (gate before shipping)
A soul gun flunks if:
- it has no consequence ("it just stores data")
- it has no feedback ("it works silently")
- it has only one state ("it just works")
- its description is under 10 words
- it has no archetype affinity
- it can't be composed with other guns

No consequence = fluff. Cut it.

## Compiling to a Global Skill (Cline / OpenCode / Claude Code)
- `name` = slug (lowercase-hyphen, matches folder).
- `description` = the TRIGGER above (the discovery field — make it specific).
- Add `license: MIT`, `compatibility: [cline, opencode, claude]`.
- Put PLT / phase / status / archetype in `metadata`.
- Body = identity + trigger + schema + mechanic.
- Heavy research → `docs/`; deterministic code → `scripts/` (only output enters context).
- Install to `~/.cline/skills/`, `~/.config/opencode/skills/`, `~/.claude/skills/`
  (OpenCode also reads `~/.claude/skills/` natively).

## References (Soul Notes)
- [[SKILL - Agentic Soul Gun Architecture]] (canonical Seshat record)
- [[SOUL-GUNS-MASTER-INDEX]] (all 58+ guns mapped)
- [[claude_skills_analysis]] (Claude Skills competitive analysis)
- [[GRAFT - Claude Code Design Skills]] (SKILL.md marketplace model)
- agentskills.io — Agent Skills standard
