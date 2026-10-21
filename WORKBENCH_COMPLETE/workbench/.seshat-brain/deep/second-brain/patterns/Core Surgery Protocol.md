# Core Surgery Protocol

**type:: [[pattern]]**  
**status:: Canonical Law**  
**created:: May 27, 2026**  
**author:: Profit Prime (Neo) — commanded by Craig (Morpheus)**

---

## The Problem

Agents keep wiring old/wrong cores into souls. Vikki had 7 zips with 3 different core versions. Architect, Commander, AgentDep likely infected too.

## The Protocol

When any soul goes on the **operating table**:

### Step 1: Scan the Patient
Find ALL variants of the soul on the Desktop:
```
Get-ChildItem "C:\Users\uncom\Desktop\*<soul-name>*" -Recurse
```
- Zips (v1.0.0, v1.1.0, v1.2.0, WIRED, GRAFTED, fixed, etc.)
- Extracted source directories
- Any `buyasoul-core/` or `BUYaSOUL-One/` references inside

### Step 2: Identify the Best Variant
- Newest version number wins
- Most features wins (e.g., v1.2.0 SUPERCHARGED > v1.0.0 basic)
- Source directory > zip (if both exist, source is authoritative)

### Step 3: Pull the Old Core
- Find all `require()` lines pointing to old cores:
  - `BUYaSOUL-One-v*` (v1.0.0 — DEAD)
  - `./buyasoul-core/` with old SDK inside
  - `../BUYaSOUL-One-*/integrations/buyasoul-sdk.cjs`
- Find embedded `buyasoul-core/` directories
- Find `lib/mock-buyasoul.cjs` fallback files

### Step 4: Graft the Real Core
- Copy `BUYaSOUL-Core-v2.0.0/` into the soul as `buyasoul-core/`
- The bridge file (`buyasoul-core/buyasoul-sdk.cjs`) is already there
- Update require path to `./buyasoul-core/buyasoul-sdk.cjs`
- Keep `lib/mock-buyasoul.cjs` as fallback (graceful degradation)

### Step 5: Verify
```
node soul-<name>.cjs
```
- Boots without errors
- `__soul.getPLTScore()` returns a number
- `__gskMemory.chambers` has 34 chambers
- `archetype` matches the soul's identity

### Step 6: Rebuild Zips
- Overwrite the BEST variant's zip
- Delete old infected zips (or archive with `-OLD` suffix)
- Update Seshat Brain: journal entry + patient file

## The Canonical Paths

| Soul | Production Zip | Notes |
|------|---------------|-------|
| Miss Vikki v1.2.0 | `C:\Users\uncom\Desktop\soul-operator-miss-vikki-v1.2.0.zip` | ✅ SURGERY COMPLETE |
| Soul Commander v2.0.0 | `C:\Users\uncom\Desktop\soul-commander-v2.0.0.zip` | ✅ SURGERY COMPLETE |
| Allie v2.0.0 | `C:\Users\uncom\Desktop\soul-allie-v2.0.0.zip` | ✅ SURGERY COMPLETE — personality rewritten as bridge, 12 archetypes preserved |
| Architect v1.0.0 | `C:\Users\uncom\Desktop\soul-architect-v1.0.0.zip` | ✅ SURGERY COMPLETE — 25 powers, Hexagonal/DDD/CQRS, old `../BUYaSOUL-One-*` path replaced |
| AgentDep v1.0.0 | `C:\Users\uncom\Desktop\agentdep-v1.0.0.zip` | ✅ SURGERY COMPLETE — 25 commands, registry server, old absolute path replaced, bridge rewritten |
| Telephone v2.0.0 | `C:\Users\uncom\Desktop\soul-telephone-v2.0.0.zip` | ✅ MERGED + SURGERY — two old versions merged into one. 8 working connectors. First-time v2.0.0 Core embedded. PLT per call. |

## Rules
- **NEVER** use `../BUYaSOUL-One-*` paths (dead core)
- **NEVER** leave old cores embedded
- **ALWAYS** use `./buyasoul-core/buyasoul-sdk.cjs` (bridge to v2.0.0)
- **ALWAYS** scan ALL variants before choosing the patient
- **ALWAYS** update the brain after surgery

---

*"Pull the old heart out. Put ours in. That's the surgery." — Craig*
