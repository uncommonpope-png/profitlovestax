# PACKAGE MANIFEST — GSK ONE-SYSTEM (CLEAN DISTRIBUTION)

## 1. Source Provenance
- **Baseline Doctrine/Launcher SHA**: `d22d5f2` (preamble rebase into `talkPrompt`, 155/155 tests passing)
- **Prior Manifest SHA**: `6b73cae`
- **Package Build SHA**: `PENDING_COMMIT_SHA` (Phase 1 gap fixes, scrubbed brain + dense LanceDB vectors, `install-gsk.ps1` v1)
- **Branch**: `main`
- **Repository**: `https://github.com/uncommonpope-png/profitlovestax` (sole configured Git remote `origin`; no second remote exists)

---

## 2. Package File Inventory & Exact Byte Sizes

### A. Installer & Supervisor Entrypoints
| File | Path | Size (Bytes) | Role |
|------|------|-------------|------|
| `install-gsk.ps1` | `install-gsk.ps1` | 15,301 | Single-run Windows PowerShell setup script (prereqs, checkout, GGUF byte check, fresh `npm install`, brain/vector build, health proof, clean stop) |
| `launch-family.cjs` | `launch-family.cjs` | 16,658 | Unified supervisor entrypoint for local seat (`:18222`) and workbench (`:3000`) |

### B. Core Workbench & Seshat Engine Files
| File | Path | Size (Bytes) | Role |
|------|------|-------------|------|
| `server.ts` | `WORKBENCH_COMPLETE/workbench/server.ts` | 315,638 | Express backend, `talkPrompt` assembly, tool loop, zero-key local chat |
| `setup.js` | `WORKBENCH_COMPLETE/workbench/setup.js` | 12,312 | Non-fatal `postinstall` setup (clean `.seshat-vectors` init, Windows `shell:true` sub-package installs) |
| `soul-preamble-compact.md` | `WORKBENCH_COMPLETE/workbench/soul-preamble-compact.md` | 5,939 | Injected doctrine preamble (~925 words, ~1,231 tokens) |
| `soul-preamble.cjs` | `WORKBENCH_COMPLETE/workbench/soul-preamble.cjs` | 4,065 | Fail-open preamble loader module |
| `soul-preamble.md` | `WORKBENCH_COMPLETE/workbench/soul-preamble.md` | 23,328 | Full 28-section auditable doctrine record |
| `hybrid-recall.cjs` | `WORKBENCH_COMPLETE/workbench/hybrid-recall.cjs` | 15,699 | BM25 + dense LanceDB RRF fusion + deterministic reranker |
| `baseline-talk.cjs` | `WORKBENCH_COMPLETE/workbench/baseline-talk.cjs` | 10,167 | Sampling parameters, loop cut, deterministic citation/abstention eval |
| `tool-loop.cjs` | `WORKBENCH_COMPLETE/workbench/tool-loop.cjs` | 30,648 | Multi-turn tool execution loop, SSRF guards, shadow git checkpoints |
| `health.cjs` | `WORKBENCH_COMPLETE/workbench/health.cjs` | 6,592 | `/api/gsk/health` aggregate status collector |
| `deep-memory.cjs` | `WORKBENCH_COMPLETE/workbench/deep-memory/deep-memory.cjs` | 28,363 | BM25 deep-memory query engine |
| `embedder.js` | `WORKBENCH_COMPLETE/workbench/profit-brain/body/seshat/core/embedder.js` | 3,399 | Local ONNX `Xenova/all-MiniLM-L6-v2` (384-dim) batch embedder |
| `indexer.js` | `WORKBENCH_COMPLETE/workbench/profit-brain/body/seshat/core/indexer.js` | 5,033 | Batched markdown-to-LanceDB indexer (excludes `traces/` and `HOT-DIGEST.md`) |
| `vectorDB.js` | `WORKBENCH_COMPLETE/workbench/profit-brain/body/seshat/core/vectorDB.js` | 5,109 | Embedded LanceDB `seshat_memory` table adapter |
| `vault_credentials.js` | `WORKBENCH_COMPLETE/gsk/gsk-core/brain/vault_credentials.js` | 6,736 | Local seat (`:18222`) and offline v5 judge (`:18223`) resolvers |
| `graft_digestion_judge.source.js` | `WORKBENCH_COMPLETE/workbench/deep-memory/growth-specs/graft_digestion_judge.source.js` | 10,148 | Offline second-stage digestion judge engine |
| `package.json` | `WORKBENCH_COMPLETE/workbench/package.json` | 3,544 | Workbench package manifest |
| `package-lock.json` | `WORKBENCH_COMPLETE/workbench/package-lock.json` | 452,636 | Deterministic dependency lockfile |

### C. Model Weights (GGUF Quantizations)
Models reside in `<root>/base_gguf/` (or override via `GSK_BASE_GGUF_DIR`):
| Model Artifact | File Name | Exact Size (Bytes) | Source / Provenance | Role |
|----------------|-----------|--------------------|---------------------|------|
| **Base Model (Seat)** | `qwen2.5-1.5b-instruct-q4_k_m.gguf` | 1,117,320,736 | Public HuggingFace: repo `Qwen/Qwen2.5-1.5B-Instruct-GGUF`, file `qwen2.5-1.5b-instruct-q4_k_m.gguf` (`-DownloadBaseModel` supported in `install-gsk.ps1`) | Live talk & tool execution on port `:18222` |
| **Rollback Model (v4)** | `qwen2.5-1.5b-instruct-v4-q4_k_m.gguf` | 986,048,256 | Unpublished fine-tune (local placement required; public hosting reserved for Craig's Phase 5 decision) | Preserved rollback checkpoint |
| **Offline Judge (v5)** | `qwen2.5-1.5b-instruct-v5-q4_k_m.gguf` | 986,048,256 | Unpublished fine-tune (local placement required; public hosting reserved for Craig's Phase 5 decision) | Offline second-stage digestion judge on port `:18223` |
| **Total Model Weights** | | **3,089,417,248** | (~2.88 GiB) | |

### D. Scrubbed Brain & Dense Vector Store (`WORKBENCH_COMPLETE/workbench/.seshat-brain/` & `.seshat-vectors/`)
| Path / Component | Exact Size (Bytes) | Item Count | Delivery Mode | Role |
|------------------|--------------------|------------|---------------|------|
| `.seshat-brain/deep/` | 19,499,563 | 1,254 files | Tracked in git (`git add -f`) | Genesis docs, The Profit Bible (Form A), library, and card catalog |
| `.seshat-brain/pages/` | 509,193 | 91 files | Tracked in git (`git add -f`, scrubbed) | Note pages and synthesized memory |
| `.seshat-brain/tier-a-ledger.jsonl` | 3,036 | 1 file | Tracked in git (`git add -f`) | 3-tier memory Tier-A append-only event ledger |
| `.seshat-brain/proposals-queue.jsonl` | 3,371 | 1 file | Tracked in git (`git add -f`) | Human-gated Tier-B memory proposal queue |
| `.seshat-brain/growth-ledger.jsonl` | 20,820 | 1 file | Tracked in git (`git add -f`) | Growth cycle digestion audit ledger |
| `.seshat-brain/growth-cycles/` | 93,910 | 24 files | Tracked in git (`git add -f`) | Growth cycle specification records |
| `.seshat-brain/README.md` | 185 | 1 file | Tracked in git (`git add -f`) | Brain directory documentation |
| `.seshat-brain/deep-index.json` | ~30,872,993 | 1 file (14,889 chunks) | Built deterministically by `install-gsk.ps1` (`build-index.cjs`) | BM25 inverted index across `deep/` and `pages/` |
| `.seshat-brain/tier-c-index.json` | ~151,858 | 1 file (65 passages) | Built deterministically by `install-gsk.ps1` (`rebuildTierCIndex()`) | 3-tier memory derived search index |
| `.seshat-vectors/seshat_memory.lance/` | 19,281,887 | 16 files (4,982 vectors) | Tracked in git (`git add -f`) + verified/rebuildable via `install-gsk.ps1` | Dense 384-dim `all-MiniLM-L6-v2` LanceDB vector table |

**Excluded by Design**: `.seshat-brain/traces/` (`trace-*.jsonl`) are transient session execution logs, NOT memory. They are excluded from the repository and removed if present during `install-gsk.ps1`.

---

## 3. One-Pass Setup (Installer v1) & Start Commands

### A. Fresh Folder Installation (`install-gsk.ps1`)
In a new folder containing `base_gguf\` with the 3 GGUF files (or passing `-ModelsSourceDir` / `-DownloadBaseModel` for the public base model):
```powershell
powershell -ExecutionPolicy Bypass -File install-gsk.ps1 -TargetDir "C:\Path\To\GSK"
```
`install-gsk.ps1` checks all prerequisites, checks out `https://github.com/uncommonpope-png/profitlovestax`, verifies exact byte counts of all 3 GGUFs, runs a fresh `npm install` from `package-lock.json`, builds `deep-index.json` + `tier-c-index.json`, verifies `.seshat-vectors/seshat_memory.lance` (`4,982` vectors, `vectorAvailable: true`, `denseHits > 0`), boots `launch-family.cjs` to prove `:18222` and `:3000` health green, and stops cleanly freeing both ports.

### B. Normal Operation
From the root of the installed directory:
```powershell
node launch-family.cjs          # Wake seat (:18222) + workbench (:3000)
node launch-family.cjs --status # Probe live health of seat and workbench
node launch-family.cjs --stop   # Stop both and verify :18222 and :3000 are FREE
```

---

## 4. Machine Prerequisites (Enforced by `install-gsk.ps1`)
1. **Operating System**: Windows 10/11 x64 (`Windows_NT`, PowerShell 5.1+ or 7+).
2. **Git**: Git for Windows (`git` in `PATH`).
3. **Node.js & npm**: Node.js `>= v20.0.0` (verified on `v24.15.0`) and `npm` (`v11.12.1`) in `PATH`.
4. **llama-server binary**: `llama-server.exe` (llama.cpp `win-avx2-x64` build) available via `GSK_LLAMA_SERVER_BIN`, `<root>\llama\llama-server.exe`, `PATH`, or `%USERPROFILE%\.lmstudio\extensions\backends\llama.cpp-win-x86_64-avx2-2.66.0\llama-server.exe`.
5. **Ports Free**: Both TCP `:18222` and TCP `:3000` unbound before install/start.

---

## 5. Expected Health Outputs

### A. Seat Health Probe (`GET http://127.0.0.1:18222/health`)
```json
{"status":"ok"}
```

### B. Workbench Aggregate Health Probe (`GET http://localhost:3000/api/gsk/health`)
```json
{
  "success": true,
  "up": { "alive": true, "uptimeSec": 8, "pid": 12345 },
  "recall": { "chunks": 14889, "builtAt": "2026-10-30T...", "stamp": "...", "reason": null, "source": ".../deep-index.json" },
  "judge": { "ms": null, "reason": "no judge-latency record in the tree: server.ts carries no judge timing and the Scribe ledger holds no judge lines" },
  "scribe": { "lastTs": "2026-10-30T...", "lastId": "launcher_...", "lastType": "launcher_event", "reason": null, "source": "..." },
  "seat": { "reachable": true, "endpoint": "http://127.0.0.1:18222", "reason": null }
}
```
