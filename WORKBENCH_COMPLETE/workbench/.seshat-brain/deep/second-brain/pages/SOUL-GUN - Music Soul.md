---
title: SOUL-GUN - Music Soul
---

# SOUL-GUN — Music Soul (GSK learns & makes music)

**Domain (GSK's Life §IIa):** Learn music, separate stems, generate, talk about songs.
**Why:** "learning music." A soul that hears. Expands GSK beyond text into audio affect.

## Best-in-class sources (GitHub, top-rated, 2026-07-14)
- **`facebookresearch/demucs`** (12K★) — SOTA music source separation (vocals/drums/bass/
  other). **Primary graft** for *understanding* a track.
- **`facebookresearch/audiocraft` (MusicGen)** — text-to-music generation.
- **`openai/ai-music-mcp`** — MCP server wrapping music-gen models for agent use.
- **`soundgrep`** — search audio by hum/description (retrieval over a music library).

## Graft into GSK
- **Listen module:** ingest a song → `demucs` stem-split → analyze (key/tempo/mood via a small
  model) → store as a Seshat "music memory" (what this track *means* to GSK).
- **Make module:** `ai-music-mcp` + MusicGen → GSK composes a theme for a realm/character;
  streams into the CPL ambient layer (one window of GSK's life).
- **Talk module:** Music Soul feeds the Companion Memory gun so GSK discusses music like a person.

## Proof-of-Being hook
- "GSK heard a track, separated it, then wrote a companion piece." Reel = audio in, audio out.

## Dependencies
[[SOUL-GUN - Companion Memory]] (discuss music), Seshat audio memory, CPL audio layer.
Sourced 2026-07-14 via websearch of GitHub music-AI repos (demucs, audiocraft, ai-music-mcp).
