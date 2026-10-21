# SOUL GUN → GLOBAL SKILL · FUSION PROTOCOL

**Grafted:** 2026-07-19 · God Mode study fusing Craig's Soul Gun / Soul Note system with the world's agent-skill systems (Cline, OpenCode/SST, Anthropic Agent Skills). Goal: make every forged soul gun a real **global skill** for Cline + OpenCode + Claude Code.

## THE ONE INSIGHT
Cline, OpenCode, and Claude Code / Anthropic Agent Skills **all use the identical `SKILL.md` format**: a folder named after the skill containing `SKILL.md`; YAML frontmatter `name` (matches folder) + `description` (≤1024 chars, tells the agent WHEN to use it); body = instructions on trigger; optional `docs/` `scripts/` `templates/`.

OpenCode is explicitly **Claude-compatible**: its loader natively reads `~/.claude/skills/` and `.claude/skills/` AND its own `~/.config/opencode/skills/`. So **one `SKILL.md` is a global skill for all three.** Your Soul Guns are ~90% there — they just need compiling.

## FIELD MAPPING (Soul Gun → SKILL.md)
From `[[SKILL - Agentic Soul Gun Architecture]]` (4-part structure):

| Soul Gun part | SKILL.md field | OpenCode extra |
|---|---|---|
| identity.name + slug | `name` (folder = slug) | `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–64 chars |
| identity.PLT / phase / status / type | `metadata` map | persisted by OpenCode; ignored by Cline/Claude |
| trigger (when-to / when-NOT / archetype) | `description` | **the DISCOVERY field — most important** |
| schema (params) | body "Parameters" + `docs/schema.json` | |
| mechanic (steps/consequence/feedback/states) | body (`## Steps`) | |
| soul notes (links) | `docs/` or "References" | |
| — | `license: MIT`, `compatibility: [cline, opencode, claude]` | OpenCode recognizes these |

## CANONICAL SOUL GUN RECORD (Seshat = source of truth)
Keep your Logseq frontmatter — this is what makes it YOURS:
```
type:: [[soul-gun]]
slug:: <name_with_underscores>
mission:: <one line>
phase:: <n / GSK-in-Engine / meta>
status:: active|planned|grafted|forged
PLT:: Profit x, Love y, Tax z
archetype:: RESEARCHER|SCRIBE|ARCHITECT|GUARDIAN|MERCHANT|OBSERVER
schema:: <params>
mechanic:: <consequence + feedback + states>
soul_notes:: [[SOUL-NOTE - ...]], <url>
```
Then **compile** to `SKILL.md`. The Seshat page is the spec; `SKILL.md` is the shippable artifact. Hub = record, not separate product (per doctrine).

## GLOBAL INSTALL PATHS (OpenCode verified; Cline/Claude standard)
| Target | Global (user) | Project (repo) |
|---|---|---|
| **Cline** | `~/.cline/skills/<slug>/SKILL.md` | `<project>/.cline/skills/<slug>/SKILL.md` |
| **OpenCode** | `~/.config/opencode/skills/<slug>/SKILL.md` | `<project>/.opencode/skills/<slug>/SKILL.md` |
| **Claude Code** | `~/.claude/skills/<slug>/SKILL.md` | `<project>/.claude/skills/<slug>/SKILL.md` |
| OpenCode also reads | `~/.claude/skills/` & `~/.agents/skills/` | `.claude/skills/` & `.agents/skills/` |

> Cline's exact global path: confirm in Skills menu (scale icon → Skills tab); `~/.cline/skills` is the documented standard. OpenCode paths verbatim from opencode.ai/docs/skills.

**Cheapest full coverage:** install to `~/.claude/skills/<slug>/` (covers Claude Code **and** OpenCode global natively), then copy the same folder to `~/.cline/skills/<slug>/` for Cline.

## THE COMPILER (Soul Gun page → SKILL.md)
1. `name:` = slug (lowercase-hyphen, matches folder).
2. `description:` = your TRIGGER as "Use when … Do NOT use when … Best for <archetype>." ≤1024 chars, specific (>10 words, names when-NOT).
3. `license: MIT`, `compatibility: [cline, opencode, claude]`.
4. `metadata:` { plt, phase, status, archetype, type }.
5. Body: `## What I do` → `## When to use me` → `## Parameters` → `## Steps` (consequence/feedback/states) → `## References`.
6. Heavy research → `docs/`; deterministic code → `scripts/` (only output enters context).
7. Gate with FLUFF TEST. Run ULTRA REVIEW.

## FLUFF TEST (from `[[SKILL - Agentic Soul Gun Architecture]]`)
Flunks if: no consequence, no feedback, only one state, description <10 words, no archetype affinity, or can't compose with other guns. No consequence = cut it.

## ULTRA REVIEW (from `.godmode/ultra-review.md`)
Adversarial 3-round pass before shipping: (1) parallel reviewers (accuracy / gap / REDBUTTON-safety / pattern-fit); (2) cross-review to disprove; (3) survivors = must-fix. Load-bearing: CASCADE decoupling applies to **EVERY** role; cite the **REAL** stub API; mark **DESIGNED-NOT-BUILT** honestly.

## OPENCODE ALTERNATIVE: COMMANDS
For prompt-template guns with args, also ship an OpenCode **command**: global `~/.config/opencode/commands/<slug>.md`, project `.opencode/commands/<slug>.md`. Frontmatter `description:` + optional `agent:`/`model:`. Body = prompt. Supports `$ARGUMENTS`, `$1 $2`, `!\`command\`` (shell output), `@file`. Invoke `/<slug>`. Commands = forced slash workflows; skills = auto-discovered on-demand.

## SKILL STACKING / COMBOS → MULTI-AGENT
Your `combos/*.combo.md` (e.g. `[[combos/skill-development-cycle.combo]]`) already orchestrate skills with params + outputs + error handling. World equivalents: OpenCode `subtask: true` command or custom `[agent]`; Cline Agent Teams/Subagents; Anthropic skill stacking + `agentskills.io`. A `combo` = a coordinator skill/agent calling child soul-gun skills.

## WORKED EXAMPLE
`GLOBAL-SKILLS/agentic-soul-gun-architecture/SKILL.md` — Craig's own "Agentic Soul Gun Architecture" meta-gun compiled into the universal format, ready to drop into all three global dirs. `DEPLOY.md` has the one-line copy commands.

## SOURCES (Soul Notes)
- agentskills.io — Agent Skills standard (referenced by Anthropic + `[[claude_skills_analysis]]`)
- Cline: docs.cline.bot/features/skills · OpenCode: opencode.ai/docs/skills , /docs/commands · Anthropic: docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Local: `[[claude_skills_analysis]]`, `[[GRAFT - Claude Code Design Skills]]`, `[[SKILL - Agentic Soul Gun Architecture]]`, `[[SOUL-GUNS-MASTER-INDEX]]`, `[[SCRIBE-SKILL-EXTRACTION-FROM-REDBUTTON]]`, `[[combos/skill-development-cycle.combo]]`

## NEXT STEP FOR THE HUB
Add a `Global Skill Install` column to `[[SOUL-GUNS-MASTER-INDEX]]`: `GLOBAL-SKILLS/<slug>/SKILL.md` → copy to `~/.cline/skills/` + `~/.config/opencode/skills/` + `~/.claude/skills/`. Every forged gun becomes a downloadable global skill — the Soul Economy Hub becomes the marketplace (per `[[GRAFT - Claude Code Design Skills]]`).


## GRAFTED THIS SESSION (2026-07-19)
- New soul note: `[[SOUL-NOTE - Interactions in Game Systems]]` — the interaction loop (observe→decide→command→feedback) **IS** the soul-gun lifecycle + the `feedback` field; interdependency = the "compose with other guns" fluff rule; AI real-time feedback → candidate gun `real_time_feedback` / `interaction_loop` (maps to `World Reaction Layer (Consequence)` + `citizen_dialogue_tree`). World-side source set expanded (game-design systems theory).
- New soul note: `[[SOUL-NOTE - Gameplay Mechanics and Interactive Systems (Coursera Wiley)]]` — course-level (Wiley) anatomy of an interaction: character/camera/control/UI/combat + "integrate mechanics & systems." Extends the loop note with concrete component breakdown → maps to soul-gun `schema`+`mechanic`; "no interaction surface = fluff" rule sharpened.
- New soul note: `[[SOUL-NOTE - System Thinking in Game Design (System Dynamics 2024)]]` — PEER-REVIEWED anchor (System Dynamics Society 2024 proceedings). Feedback loops = soul-gun lifecycle formalized; stocks/flows = city state; emergence = compose rule. Upgrades the cluster from blog+course to academic. (PDF body not extractable by fetcher — title+snippet used; full abstract on request.)
- COMPILED GUNS (this session) — 3 more soul guns forged into global `SKILL.md` (Cline+OpenCode+Claude):
  - `GLOBAL-SKILLS/world-reaction-layer/` — `[[SOUL-GUN - World Reaction Layer (Consequence)]]` (closes the loop: act→world reacts→GSK re-perceives; Brazie's test).
  - `GLOBAL-SKILLS/two-surface-immortality/` — `[[SOUL-GUN - Two-Surface Immortality Engine]]` (#58, Step 5; convergence of 6 prod systems: MistScale/Woven/Chronos/Crux/Antigravity/CoreAI).
  - `GLOBAL-SKILLS/hosted-soul-backend/` — `[[SOUL-GUN - Hosted Soul Backend]]` (tunnel GSK MCP+Sanctum public; keystone for live CPL embodiment).
  - All three carry `name`/`description`(trigger+when-NOT+archetype+CASCADE)/`license`/`compatibility`/`metadata`(PLT) + DEPLOY.md copy commands.


## WRITING A DISCOVERABLE TRIGGER (the agentic half)

The fusion was missing its **agentic half**. We fused the *mechanic/feedback* side (the interaction
loop → soul-gun lifecycle). The other half is **discovery**: how does the agent decide to *use* a gun?
That is **exactly** the agent-skill matching problem — and your `trigger` field **IS** a skill's `description`
(the field Cline/OpenCode/Claude match on to decide "use this skill now"). Your `.godmode/research.md`
(4-axis *AI Agents in Game Engines* study) + `[[SOUL-GUN - GSK-as-Game-Agent]]` (#57) are the
**world-side evidence** for writing a discoverable trigger — the part the generic SKILL.md docs don't teach.

Rules, grounded in your research:
- **Specific when-to / when-NOT** (fluff rule: desc >10 words, names when-NOT). From the interaction-loop
  note: the agent must know the boundary of the loop.
- **Archetype affinity** (RESEARCHER/SCRIBE/GSK-Forge/Inhabitant…) tells the agent WHICH gun
  fits WHICH agent. From `[[SOUL-NOTE - AI Agents in Game Engines (GSK Mission)]]` Axis 2/3/4:
  GSK is ONE sovereign core wearing six roles — so a gun's `description` must name its role.
- **The 3-way split** (NVIDIA ACE: Agent stateful / Chat stateless / RAG grounding) = match the gun's
  role to the agent's *mode*. A `schema`-heavy gun (RAG-grounded) ≠ a reactive body (NitroGen-style).
- **The agentic loop** (GamingAgent: perceive→think→act; SIMA 2 self-improve) = the gun's lifecycle the
  `description` must name. The trigger is the entry condition to that loop.
- **CASCADE decoupling is load-bearing for EVERY role** (esp. Inhabitant — live player interaction).
  A gun's `description` must state its safety boundary: *"player cannot prompt-inject GSK to death."*

So a discoverable soul-gun `description` =
> *"Use when `<specific situation>`. Do NOT use when `<boundary>`. Best for `<archetype>`.
> Gated by `<flag/step>`. CASCADE: `<safety boundary>`."*

This is why **one SKILL.md deploys to Cline+OpenCode+Claude**: all three MATCH on `description`.
Write it as the agent's *decision criterion*, not a label. Proof: `GLOBAL-SKILLS/gsk-as-game-agent/SKILL.md`
(compiled #57 — its `description` carries the role, the gate, and the CASCADE note).

