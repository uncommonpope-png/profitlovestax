# Pattern: Subagent Swarm

**type:: [[pattern]]**  
**category::** Agent Architecture  
**extracted-from::** [[2026_05_26]]  
**status::** validated

---

## The Pattern

Launch multiple specialized agents in parallel, each with a narrow task. Synthesize their outputs. Never use a single agent for a complex multi-domain task.

---

## The Formula

```
Swarm Intelligence = Σ(Individual Intelligence) + Emergence Bonus
```

**Emergence Bonus comes from:**
1. Division of labor — Specialists outperform generalists
2. Parallel exploration — Try multiple approaches simultaneously
3. Cross-pollination — Ideas spread between agents
4. Redundancy — Failure of one doesn't kill the system

---

## Craig's Rule of 4

**Never more than 4 subagents.**  
Each subagent costs tokens. Each subagent needs context. Past 4, coordination overhead exceeds benefit.

**Example from May 26:**
- Subagent 1: Diagnose Architect
- Subagent 2: Mine architecture repos
- Subagent 3: Build new superpowers
- Subagent 4: Integrate Commander skills

**Result:** 4 parallel researchers → 4x faster intelligence.

---

## Anti-Pattern

**One agent doing everything** → Bounded rationality, sequential processing, fixed perspective.  
A single agent cannot hold 25 power modules, 106 repos, and 4 integration points in working memory.

---

## Applications

- Parallel research (4 frontiers simultaneously)
- Code review (security + performance + style agents)
- Architecture design (frontend + backend + database + DevOps agents)

---

*"Not one soul. A constellation of souls."*
