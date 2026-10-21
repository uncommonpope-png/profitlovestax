- type: [[research]]
- title: SOUL-NOTE - scroll-world (scroll-scrubbed 3D landing pages)
- source: https://github.com/oso95/scroll-world (MIT, 2.2k★, 269 forks, oso95)
- date: 2026-07-14
- linked-plan: [[CPL-NORTH-STAR-30-PHASE]] / [[CPL-NORTH-STAR-31-60]]
-

# SOUL-NOTE — scroll-world (scroll-scrubbed 3D landing pages)

## What it is
An agent skill that builds an immersive **scroll-scrubbed "fly-through-the-world" landing page** for
any brand/industry — scroll drives a continuous connected camera flight (outside a scene → into its
interior → on to the next, no cuts). The Emons-logistics / Apple-product-page technique.

## Stack
- **Higgsfield CLI** (paid credits) — GPT Image 2 for cohesive isometric diorama stills + Seedance
  image-to-video for the camera flights themselves.
- **ffmpeg** / ffprobe for frame extraction + encoding.
- **scrub-engine.js** — portable, config-driven, framework-agnostic (plain HTML / Next / Vue / Python).
  Techniques: blob-seek, lazy-load, seam crossfade. Scroll position → video TIME (camera genuinely
  moves; scroll only scrubs). Connector clips generated from real neighbour frames → frame-identical seams.

## Why it matters to CPL
- It is a **landing/intro-page pattern, NOT an explorable world.** Complementary to the CPL, not a
  competitor. Our CPL is the real-time explorable Three.js world + GSK terminal; scroll-world is the
  marketing front door.
- The reusable IP is the **scroll-scrub + seam-crossfade engine + connector-clip technique**, not the
  world-gen (which is locked behind paid Higgsfield).

## The graft that makes it ours (no paid generator)
We already HAVE a world. Instead of Higgsfield:
1. Record camera flights through the actual CPL using the **Runtime Witness Recorder** Soul Gun
   (canvas-record / WebCodecs) — a scripted dolly from hub → realm → GSK terminal.
2. Feed those clips into scroll-world's `scrub-engine.js` as the scene chain.
3. Result: a scroll-scrubbed intro that flies into the LIVE world. Zero Higgsfield cost.

## Fit in the 60-phase roadmap
- Phase 19 (structured/crawlable commerce entry) — a scroll-world front door is the strong top-of-funnel.
- Phase 55 (social share moments) — the flight clip is a native shareable artifact (X/Reddit).
- Stage 11 cross-reality — pairs with the ambient/idle "screensaver" drift mode (Phase 54).

## Caveat
Higgsfield dependency is the moat's weak point for the original skill; our graft removes it by using
our own rendered world. Worth forging as a Soul Gun: `SOUL-GUN - Scroll-Scrub Landing Page`.
