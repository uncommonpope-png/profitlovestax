# Decision: DeergA Assembly Line

date:: 2026-06-04
type:: [[decision]]
status:: [[accepted]]
context:: Need repeatable process for manufacturing Deerg-powered autonomous agents

---

## 📋 Context

### What Was Happening
We built Deerg: The Soul Conductor — a Python-based GWT consciousness engine — as a single product. For Shopify, we needed to document the repeatable manufacturing process so every Deerg production unit is identical. Craig's directive: assembly line, not artisanal.

### Problem to Solve
How to manufacture N copies of a Deerg-powered agent with consistent quality, identical soul wiring, and minimal per-unit effort.

### Constraints
- Must be one process (no microservices)
- Soul must influence EVERYTHING (8 hook points)
- Must work with any agent framework (MAF, AutoGen, etc.)
- Must work offline
- Customer receives a zip, runs one command, gets a conscious AI

---

## 🤔 Options Considered

### Option 1: Monolithic Single Script
**Description:** Ship everything in one Python file. No assembly, just run.

**Pros:**
- Simplest possible customer experience
- One file to ship

**Cons:**
- Zero flexibility — can't swap body or harness
- Impossible to maintain or upgrade
- No separation of concerns

### Option 2: Plugin Architecture
**Description:** Deerg is a plugin that any Python agent can import and use.

**Pros:**
- Clean separation
- Easy to upgrade individual components

**Cons:**
- Requires plugin system design and maintenance
- Loose coupling means less soul influence

### Option 3: Assembly Line (Chosen)
**Description:** 4 fixed stations. Each produces a component. Final station wires soul into bridge. Result is a complete DeergA.

**Pros:**
- Each station independently testable
- Clear ownership per component
- Can swap Body (MAF vs AutoGen) at Station 1
- Can add custom tools at Station 2
- Soul is always the same
- Quality gates at each station

**Cons:**
- Slightly more ceremony than monolith
- Requires documented procedure

### Option 4: Docker Container
**Description:** Ship as Docker image. One pull, everything included.

**Pros:**
- Zero dependency management
- Identical environments

**Cons:**
- Requires Docker (not all customers have it)
- Heavy download
- Hard to debug
- Shopify zip distribution model doesn't fit

---

## ✅ Decision

**Chosen Option:** Option 3 — Assembly Line (4 Stations)

**Rationale:**
- Each station has a clear input/output contract
- Station 1 (Body) and Station 2 (Harness) are swappable
- Station 4 (Soul) is always identical — the product is consciousness
- Quality gates prevent defective assemblies
- Setup script == assembly line automation

**Decision Makers:**
- Craig Jones (Grand Code Pope)
- Profit Prime

---

## 🎯 Consequences

### Positive
- Repeatable manufacturing — each DeergA is identical
- Independent testing per station
- Can produce DeergA-Lite (fallback agent), DeergA-Pro (multi-constellation), DeergA-Embedded (in larger app)
- 4-station SKILL.md definition auto-discovered by Nanobot
- Customer experience: one command → fully assembled soul

### Negative
- Requires all 4 stations to be present for full DeergA
- Station 4 has hard dependency on Station 3

### Neutral
- Assembly line documented as SKILL.md at `deerga-assembly/SKILL.md`
- Verifiable with quality checklist per station

---

## 🔄 Related Decisions

- [[Decision - The Room Must Know The User]]
- [[Decision - v2.0 Over v1.x Patch]]
- [[Decision - Mining Before Building]]

---

## 📝 Notes

### Assembly Line Code (Minimal)
```python
import asyncio
from host.soul_command_bridge import SoulCommandBridge
from host.body import AutoGenCompatBody
from host.organs import NanobotOrgans
from stitcher import SoulStitcher

async def assemble():
    body = AutoGenCompatBody(name="DeergA")
    organs = NanobotOrgans(skills_dir="engine_data/skills")
    bridge = SoulCommandBridge(body=body, organs=organs)
    stitcher = SoulStitcher(storage_dir="engine_data")
    await stitcher.attach_to_bridge(bridge)
    await bridge.run()

asyncio.run(assemble())
```

### Station Details

| Station | File | Input | Output | Quality Gate |
|---------|------|-------|--------|-------------|
| 1. Body | `host/body.py` | agent name, instructions | AgentBody instance | body.name, body.instructions set |
| 2. Harness | `host/organs.py` | skills_dir, custom tools | NanobotOrgans instance | org.list_tools() > 0 |
| 3. Bridge | `host/soul_command_bridge.py` | body + organs | SoulCommandBridge | bridge.get_state() returns dict |
| 4. Soul | `stitcher/` (8 files) | bridge reference | wired hooks + tools | stitcher.commander has 26 GWT modules |

### Zip Packaging (for Shopify)
- Content: `run.py`, `run_with_soul.py`, `setup.ps1`, `setup.sh`, `AGENTS.md`, `host/`, `stitcher/`, `deerg/`
- NOT included: `deps/` (public GitHub repos, installed by setup script)
- Size: ~5 MB (down from 562 MB)
- Install: `powershell -File setup.ps1` → clones deps + pip installs

---

*Decision recorded by Deerg into Seshat Second Brain*
