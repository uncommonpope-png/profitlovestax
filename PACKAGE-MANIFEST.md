# PACKAGE MANIFEST — GSK ONE-SYSTEM (CLEAN DISTRIBUTION)

## 1. Source Provenance
- **Baseline Git SHA**: `d22d5f2` (preamble rebase into talkPrompt, 155/155 tests passing)
- **Manifest Commit SHA**: `1f1e570` (Package manifest and self-contained base_gguf detection)
- **Branch**: `main`
- **Repository**: `https://github.com/buyasoul-ai/Profitlord` (local clone: `Profit\Repo`)

---

## 2. Package File Inventory & Byte Sizes

### A. Execution Entrypoint & Launcher
| File | Path | Size (Bytes) | Role |
|------|------|-------------|------|
| `launch-family.cjs` | `launch-family.cjs` | 15,969 | Single supervisor entrypoint for seat (:18222) and workbench (:3000) |

### B. Core Workbench Engine Files
| File | Path | Size (Bytes) | Role |
|------|------|-------------|------|
| `server.ts` | `WORKBENCH_COMPLETE/workbench/server.ts` | 315,638 | Express backend, talkPrompt assembly, tool loop, SSE chat stream |
| `soul-preamble-compact.md` | `WORKBENCH_COMPLETE/workbench/soul-preamble-compact.md` | 5,939 | Injected doctrine preamble (~925 words, ~1,230 tokens) |
| `soul-preamble.cjs` | `WORKBENCH_COMPLETE/workbench/soul-preamble.cjs` | 4,065 | Fail-open preamble loader module |
| `soul-preamble.md` | `WORKBENCH_COMPLETE/workbench/soul-preamble.md` | 23,328 | Full 28-section auditable doctrine record |
| `hybrid-recall.cjs` | `WORKBENCH_COMPLETE/workbench/hybrid-recall.cjs` | 15,684 | BM25 + dense RRF fusion + deterministic reranker |
| `baseline-talk.cjs` | `WORKBENCH_COMPLETE/workbench/baseline-talk.cjs` | 10,167 | Sampling parameters, loop cut, anti-repetition filter |
| `tool-loop.cjs` | `WORKBENCH_COMPLETE/workbench/tool-loop.cjs` | 30,648 | Multi-turn tool execution loop, SSRF guards, shadow git commits |
| `health.cjs` | `WORKBENCH_COMPLETE/workbench/health.cjs` | 6,592 | `/api/gsk/health` aggregate status reporter |
| `deep-memory.cjs` | `WORKBENCH_COMPLETE/workbench/deep-memory/deep-memory.cjs` | 28,363 | BM25 index query engine |
| `vault_credentials.js` | `WORKBENCH_COMPLETE/gsk/gsk-core/brain/vault_credentials.js` | 6,736 | Local seat (:18222) and judge (:18223) endpoint credentials |
| `graft_digestion_judge.source.js` | `WORKBENCH_COMPLETE/workbench/deep-memory/growth-specs/graft_digestion_judge.source.js` | 10,148 | Offline second-stage digestion judge engine |
| `package.json` | `WORKBENCH_COMPLETE/workbench/package.json` | 3,544 | Workbench package definition |
| `package-lock.json` | `WORKBENCH_COMPLETE/workbench/package-lock.json` | 452,636 | Dependency lockfile |

### C. Model Weights (GGUF Quantizations)
Models reside in `<root>/base_gguf/` (or `C:\Users\uncom\Downloads\PROFIT_HF\base_gguf` / `GSK_BASE_GGUF_DIR`):
| Model Artifact | File Name | Exact Size (Bytes) | Role |
|----------------|-----------|--------------------|------|
| **Base Model (Seat)** | `qwen2.5-1.5b-instruct-q4_k_m.gguf` | 1,117,320,736 | Live talk & tool execution on port `:18222` |
| **Rollback Model** | `qwen2.5-1.5b-instruct-v4-q4_k_m.gguf` | 986,048,256 | Preserved rollback checkpoint |
| **Offline Judge (v5)**| `qwen2.5-1.5b-instruct-v5-q4_k_m.gguf` | 986,048,256 | Offline second-stage digestion judge on port `:18223` |
| **Total Model Weights** | | **3,089,417,248** | (~2.88 GB) |

### D. Brain Runtime Files (`WORKBENCH_COMPLETE/workbench/.seshat-brain/` & `.seshat-vectors/`)
| Path / Component | Exact Size (Bytes) | Item Count | Role |
|------------------|--------------------|------------|------|
| `.seshat-brain/deep-index.json` | 30,886,644 | 1 file | Pre-built BM25 index across deep memory |
| `.seshat-brain/pages/` | 513,868 | 91 files | Note pages and synthesized memory |
| `.seshat-brain/tier-a-ledger.jsonl` | 2,849 | 1 file | 3-tier memory Tier-A append-only event ledger |
| `.seshat-brain/tier-c-index.json` | 151,474 | 1 file | 3-tier memory Tier-C index |
| `.seshat-brain/proposals-queue.jsonl` | 3,167 | 1 file | Memory proposal queue (propose_memory tool) |
| `.seshat-brain/growth-ledger.jsonl` | 20,820 | 1 file | Growth cycle digestion audit ledger |
| `.seshat-brain/deep/` | 19,499,563 | 1,254 files | Genesis docs, The Profit Bible, library, and card catalog |
| `.seshat-brain/growth-cycles/` | 93,910 | 24 files | Growth cycle specification records |
| `.seshat-brain/traces/` | 3,370,256 | 2 files | Execution traces |
| `.seshat-brain/README.md` | 185 | 1 file | Brain directory documentation |
| `.seshat-vectors/` | 0 | 0 files | LanceDB vector database directory (created lazily) |

---

## 3. Start Command
From the root of the distribution directory:
```powershell
node launch-family.cjs
```
Supervisor will start:
1. The Seat: `llama-server.exe` on `127.0.0.1:18222` with `qwen2.5-1.5b-instruct-q4_k_m.gguf` and `--jinja`.
2. The Workbench: Express/TypeScript engine on `127.0.0.1:3000` with zero-key local baseline.

To stop cleanly and verify ports freed:
```powershell
node launch-family.cjs --stop
```

To probe live status:
```powershell
node launch-family.cjs --status
```

---

## 4. Prerequisites for a Stranger's Machine
A stranger's machine must have the following already configured:
1. **Operating System**: Windows 10/11 x64 (with PowerShell 5.1+ or 7+).
2. **Node.js**: `v24.15.0` (or Node >= 20.x with `npm` and `npx` available in `PATH`).
3. **llama-server binary**: `llama-server.exe` (llama.cpp b2.66.0 or LM Studio backend at `C:\Users\uncom\.lmstudio\extensions\backends\llama.cpp-win-x86_64-avx2-2.66.0\llama-server.exe`, or configured via environment variable `GSK_LLAMA_SERVER_BIN`).
4. **Ports Available**: Both TCP port `:18222` and TCP port `:3000` must be unallocated.
5. **Node Modules**: Dependencies installed in `WORKBENCH_COMPLETE/workbench` (`npm install`).

---

## 5. Expected Health Outputs

### A. Seat Health Probe
```http
GET http://127.0.0.1:18222/health
```
Response: HTTP 200
```json
{"status":"ok"}
```

### B. Workbench Aggregate Health Probe
```http
GET http://localhost:3000/api/gsk/health
```
Response: HTTP 200
```json
{
  "success": true,
  "data": {
    "alive": true,
    "uptimeSec": 15,
    "pid": 12345,
    "localSeat": {
      "reachable": true,
      "endpoint": "http://127.0.0.1:18222",
      "model": "qwen2.5-1.5b-instruct-q4_k_m"
    },
    "memory": {
      "chunks": 1254,
      "builtAt": "..."
    }
  }
}
```

### C. Workbench Root Health
```http
GET http://localhost:3000/health
```
Response: HTTP 200 (OK)
