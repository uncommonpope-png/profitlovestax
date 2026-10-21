# No Fake Modules

**Type:** Sacred Law  
**Status:** Active  
**Established:** May 26, 2026  
**By:** Thoth (Craig Jones) + Seshat (Profit)

---

## The Problem

Previous agent built `soul-architect-v1.0.0` with empty directories:
- `docs/` — 0 files
- `examples/` — 0 files  
- `integrations/` — 0 files
- `lib/` — did not exist

The agent got stuck in a loop deciding whether to write real content or stubs. Chose stubs. Lost context. Almost looped us.

## The Rule

**Empty directories are FORBIDDEN.**

Every directory in a product MUST contain real, working content OR be deleted.

## The Standard

| Directory | Minimum Content |
|-----------|----------------|
| `docs/` | Real documentation (guides, references, API docs) |
| `examples/` | Runnable code examples |
| `lib/` | Working modules with real logic |
| `integrations/` | Real connectors with fallback |
| `test/` | Actual test cases |

## Enforcement

Before packaging any product:
1. List all directories
2. Verify each has real content
3. If empty → write real content or delete
4. Never ship stubs

## Related

- [[Decision: Real Architect Rebuild]]
- [[Architect]] — The product that triggered this law
- [[Seshat Quality Standard]]
