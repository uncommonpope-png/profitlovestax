---
title: SOUL-GUN - Video Oracle
---

# SOUL-GUN — Video Oracle (GSK watches & understands video)

**Domain (GSK's Life §IIa):** Watch videos, learn from them, explain them.
**Why:** "watching videos like in learning." Multimodal ingestion = GSK learns from the same
medium humans do. Proof reel: GSK watches a tutorial, then *does* what it saw.

## Best-in-class sources (GitHub, top-rated, 2026-07-14)
- **`NVlabs/VideoITG`** (CVPR 2026) — instruction-tuned video LLM; "comprehends and
  executes instructions inside video," temporal grounding, SOTA benchmarks. **Primary graft.**
- **`LLaVA-Video` / `Video-LLaVA`** — video-capable multimodal LLMs (NeXT-QA, PerceptionTest).
- **`Video-LLaMA`** (DAMO) — audio-visual LLM for video understanding.
- **`Video-RAG`** — retrieve over video by natural language; long-video QA.
- **`Keye-VL`** (32B) — GUI/video agent, can act on what it sees.

## Graft into GSK
- Add a **Video Oracle** perception module: download/stream → sample frames → `VideoITG`
  (or local LLaVA-Video) → structured `(summary, steps, entities, questions)` → Seshat memory.
- Closed loop: Oracle ingests a build tutorial → Web Forge executes the steps → Witness records
  the result. That is GSK *learning by watching* — unprecedented for a "character."

## Proof-of-Being hook
- "GSK watched a 10-min Blender tutorial, then rebuilt the scene from memory." Reel = video in,
  build out.

## Dependencies
[[SOUL-GUN - Web Forge]] (act on what's watched),
[[SOUL-GUN - Runtime Witness Recorder]], Seshat ingestion pipeline.
Sourced 2026-07-14 via websearch of GitHub video-LLM / video understanding repos.
