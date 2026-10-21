---
title: SOUL-GUN - Web Forge
---

# SOUL-GUN — Web Forge (GSK builds websites & artifacts)

**Domain (GSK's Life §IIa):** Build websites / web apps / artifacts autonomously.
**Why:** "GSK is supposed to be building websites." This is the most legible Proof-of-Being —
a real site he authored, live, with a Runtime Witness reel of the build.

## Best-in-class sources (GitHub, top-rated, 2026-07-14)
- **`All-Hands-AI/OpenHands`** (65K★) — *the* autonomous coding agent. CodeAct loop:
  bash + editor + browser + web search tools, multi-agent (planner/editor), 15-min repo
  sweeps, MCP, OpenHands Acquire for real browsing. Production-hardened. **Primary graft.**
- **`Aider-AI/aider`** (40K★) — git-aware pair programmer; whole-repo map, auto-commits,
  architect/code modes, voice (`--voice`), edit-format negotiation. Use for clean diffs + history.
- **`cline/cline`** (50K★) — VS Code agent with human-in-loop checkpoints, `#` @-mention
  files, long-running autonomous "plan mode". Good for controlled, reviewable runs.
- **`browser-use/browser-use`** (60K★) — LLM web browsing; self-claim "SOTA". The eyes GSK
  uses to read the live web, submit forms, verify deploys (pairs with OpenHands).

## Graft into GSK
- Stand up an **OpenHands-style CodeAct executor** as a GSK action module: tools =
  `bash`, `edit_file`, `browser`(browser-use), `web_search`. One GSK "intention" →
  plan → tool loop → result → memory.
- Keep **Aider** for the commit trail so every build is git-auditable + screenshot-able.
- **Security:** executor runs in a sandbox/container; never expose host shell to Pages world.
  Browser tool = the *only* outward web channel.

## Proof-of-Being hook
- Web Forge + Runtime Witness Recorder = reel "GSK builds buyasoul.online in 12 min, live."
- Ship the built site to GitHub Pages → it *is* the storefront (The Hub).

## Dependencies
[[SOUL-GUN - Runtime Witness Recorder]] (record the build),
[[SOUL-GUN - Hosted Soul Backend]] (expose the executor),
[[SOUL-GUN - Self-Evolving Skill Tree]] (crystallize build skills).
Sourced 2026-07-14 via websearch of GitHub top-rated autonomous coding agents.
