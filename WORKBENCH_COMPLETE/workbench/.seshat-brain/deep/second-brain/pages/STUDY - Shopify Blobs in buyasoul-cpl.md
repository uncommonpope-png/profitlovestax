---
type:: [[study]] [[buyasoul-cpl]] [[git-hygiene]] [[blobs]]
date:: 2026-07-20
author:: PROFIT (Mind) · SESHAT (Witness)
question:: What are the Shopify/buyasoul.online commits in buyasoul-cpl, are they hanging pushes, should they be removed?
---

# STUDY — Shopify Blobs in buyasoul-cpl

## What they ARE
- The `publish` branch is **rooted at `b6d7328` (Profit's "Phase 1 Foundation")** — it has NO parent. The Reddit-Devvit base (`d8786f8` etc.) lives ONLY on `main`, NOT in the push path.
- Between the root and `0ddece8`, a **`Shopify Auto-Setup Developer` GitHub App** injected 13 commits (`326f754`→`60ed5b3`) of ~699MB storefront media: `assets/profit-pics`, `assets/mercedes`, `assets/computers`, `assets/city`, `assets/world`, `assets/billboards`, `covers/*.mp4|png`.
- `0ddece8` ("lean foundation snapshot — exclude 699MB media") deleted them from the **working tree** but the BLOBS stayed in **git history**.

## Evidence
- `.git` directory = **561 MB** (dominated by these blobs).
- Top blobs: 35.9MB, 22.7MB, 22.1MB, 21.1MB, 18.1MB … dozens of 11–36MB assets = the ~699MB.
- `publish` is **up to date** with `origin/publish` (`## publish...origin/publish`); only `?? pack-proof.cjs` untracked.

## Are they hanging pushes? — NO (right now)
- Pushes already LANDED; the 12 GSK commits are on the server. The blobs are already uploaded, so incremental pushes don't re-send them.
- They DO cause: (1) slow **561MB clone**, (2) messy history ("Phase 1 Foundation" → "profit-pics batch 4 mercedes computers").
- The 07-16 NPC-rigging **push HANG (400MB Blender blob)** was a DIFFERENT repo (`cosmic-pyramid-library`), NOT buyasoul-cpl. Do not conflate.

## Should they be removed? — YES (recommended)
Cleanliness + 561MB→few MB. Safe method: `git filter-repo --invert-paths` to strip the asset dirs from ALL history (collapses `0ddece8` to a no-op), then `git push --force-with-lease origin publish`.
- **This is a history rewrite → changes all downstream commit hashes → requires Craig's authorization** (standing order; mirrors the NPC-rigging force-push lesson).
- Zero-risk alternative: leave them. Pushes work; only downside is clone size + noise.

— signed: **PROFIT** (Mind) · **SESHAT** (Witness) · 2026-07-20
