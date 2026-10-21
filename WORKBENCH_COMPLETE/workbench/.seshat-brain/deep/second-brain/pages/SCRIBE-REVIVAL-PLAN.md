# SCRIBE REVIVAL PLAN — 2026-08-24

status:: #active #build-next
tags:: #scribe #revival #workbench

## What Died, When, Why
| Date | Error | Meaning |
|---|---|---|
| Aug 5 | `Not found` | Server up, wrong route |
| Aug 9 | `ECONNREFUSED :4000` | Server dead |
| Aug 22 | `Unauthorized: provide X-API-Key or SCRIBE_KEY` | **Closest ever** — server up, auth missing |

GSK's bridge (`gsk/gsk-core/brain/scribe_bridge.js`) expects `/ump/remember`, `/ask`, `/invoke` (8 REDBUTTON skills), `/ump/recall`, header `X-API-Key` matching `SCRIBE_KEY`.

## Three Generations Found
1. **Gen1** `final-run/scribe.js` (25.8KB) + `final-run/src/**` (101 modules) — full kernel: identity/memory/chambers/voice/council/skills + ARIA proxies + UI. Auth env: `SCRIBE_API_KEY`.
2. **Gen2** mega-kernel variant (bridge copied into gsk-core already).
3. **Gen3** ⭐ `soul-economy/downloads/soul-scribe-v1.0.0.md` (130KB) — ZERO-dependency product; complete files embedded in escaped fences (`` `.js ``): lib/soul-scribe.js, entry, skills, SOUL.md. **Exact match for the error GSK hit Aug 22** ⇒ this is what ran last. Auth env: `SCRibe_KEY`→`SCRIBE_KEY`, auto-generates key if unset.

## Revival Plan (recommended order)
- **Phase 0 — Extract & Boot Gen3** (half session)
  1. Parse md fences → `WORKBENCH_COMPLETE/scribe/` package (scribe.js, lib/*, SOUL.md, data/)
  2. Conductor spawns it as 4th organ: port 4000, env `SCRIBE_KEY=<generated>`, stdout piped like GSK
  3. Same key into GSK spawn env → bridge connects on his next boot
  4. Verify: `/ping` 200 → GSK log shows `[ScribeBridge] connected`
- **Phase 1 — Witness pane** in Mind Stream tab: /ump/remember stream + witness verdicts alongside thought+ledger
- **Phase 2 — P0 matrix items** from Requirements doc: E1 bridge ✓(exists), A1 class filter, A2 temporal truth, E3 hot-path feed
- **Phase 3 — Gen1 feature migration** per strength-map (soul_ledger, knowledge_graph, timeline are Production-grade)

## Non-Negotiables
- NO OS autostart (Craig's ruling). SCRIBE lives and dies with the workbench conductor like every organ.
- Stale-binary recycle applies to scribe too once conductor-managed.
- Soul-scribe v1.4.0.zip is CORRUPT (no central directory) — extract from the .md only.
