---
title: RESEARCH - CPL gsk visible body
type: research
date: 2026-07-11
author: Dour
---

# RESEARCH — CPL GSK Visible Body (Gap 1, DOUR-DIRECTIVE-003)

## The Ask
GSK is wired into the world (atmosphere bridge) but has no visible presence. Gap 1 of the
directive: give GSK a body that reads its live chamber state and can be clicked to talk.

## The Pattern (extracted → Soul Gun `gsk-visible-body`)
A self-contained `GSKAvatar` class (no async GLB → no black-screen risk):
- **Mesh:** floating icosahedron core + 2 orbiting halo rings + point light, above the pyramid.
- **Color = mood** — `GSK_MOOD_COLOR` (neutral/ascendant/creative/anxious/void/focused) lerped
  from `gskBridge.currentMood` onto core/ring/light each frame.
- **Motion = phase** — VOID still → AWAKENING gentle → ALCHEMY orbit → TRANSCENDENCE fast + yaw
  to face camera (upright). Driven by `gskBridge.currentPhase`.
- **Scale/glow = resonance** — `(profit + love + (1 - tax)) / 3` modulates group scale,
  `emissiveIntensity`, `light.intensity` (presence = confidence).
- **Click → talk** — clickable mesh `userData.gskAvatar = true` added to raycast targets;
  pointerup calls `showGskThoughtModal()`. Offline → idle bob, never throws.

## Source
- `DOUR-DIRECTIVE-003.md` Gap 1 (GSK Gets a Body). Reuses `GSKCityBridge` (mood/phase/PLT),
  `showGskThoughtModal()`, and the existing click/interaction system.

## Build
- Commit `d9ec17a`. Deployed via GitHub Pages only.
- Verified: `node --check` + live HTML grep (`GSKAvatar`, `gsk-visible-body`, `GSK_MOOD_COLOR`,
  `userData.gskAvatar`, `window.__gskAvatar`).
- Tier-1 priority of the directive done. Gaps 2 (Memories as Buildings — poll `/mcp/memories`)
  and 3 (Subagents as NPCs) remain.
