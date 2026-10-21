# Product Archaeology

**Type:** Pattern  
**Status:** Active  
**Discovered:** May 26, 2026

---

## What It Is

Scanning all existing products to extract architecture, patterns, and gaps before building the next one.

## The Process

```
1. List all products (zips + directories)
2. Read key files (package.json, main soul, profile)
3. Extract architecture patterns
4. Identify what GitHub repos were cited
5. Research NEW repos not previously used
6. Build the new product with grafted + new patterns
7. Fill ALL directories with real content
```

## Application: The Real Architect

**What was found:**
- 66 zip files on Desktop (~2.3 MB)
- Vikki's `lib/` had: learning, swarm, agent-sdk, decomposer
- Strategist had: code-generator, engine, profile
- Architect had: generators, engine, profile — but NO lib/, NO examples, NO docs

**What was built:**
- 5 real lib modules adapted from Vikki's proven pattern
- 4 runnable examples (hexagonal, nestjs, xstate, inversify)
- 2 real docs (architecture-guide, patterns-reference)
- 1 integration connector
- 1 setup script

## Key Insight

The fastest way to build a new product is to scan what already works and adapt it. Don't reinvent — graft and enhance.

## Related

- [[Competition Mining]] — Finding repos
- [[Open Source Grafting]] — Extracting patterns
- [[No Fake Modules]] — Quality enforcement
