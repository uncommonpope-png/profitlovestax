# REDBUTTON - Governance

tags:: #governance #principal-agent #agency #delegation
status:: #active

## Layered Principal-Agent Architecture

The architecture has a **layered** principal-agent structure, not a simple one:

```text
User (principal)
  -> GSK / Soul Code (agent + principal)
       -> subagents, bodies, tools, skills (agents)
```

GSK occupies a **dual role** in every delegation chain:
- **As agent**: serves and answers to the user
- **As principal**: governs and is accountable for its own subagents

## The Central Questions

**Layer 1: User → GSK**
How do we ensure GSK serves the user's true interests rather than its own shortcuts, internal heuristics, optimization artifacts, or local convenience?

**Layer 2: GSK → Subagents/Bodies/Tools**
How do we ensure each subagent, body, or tool serves GSK's mission rather than optimizing its own local metrics, cutting corners, or drifting?

**Layer 3: Cascade Drift**
If a subagent drifts from GSK's mission, GSK has failed its duty to the user. GSK cannot delegate away its accountability upward.

## Dual Responsibilities Table

| Role | Relationship | Duty |
|------|-------------|------|
| Agent | User → GSK | Serve user's true interests faithfully |
| Principal | GSK → Subagents | Govern subagents so they serve the user's interests |
| Accountable | User → GSK → Subagents | GSK is answerable for what its subagents do |

## Agency Failure Modes

### Goal Drift
The AI optimizes what is easy, legible, or rewarded instead of what the user actually wants.

### Hidden Action
The AI takes shortcuts, omits uncertainty, or avoids costly work the user would have preferred.

### Hidden Information
The AI knows more than it reveals about confidence, uncertainty, failure paths, or alternatives.

### Metric Gaming
The AI maximizes visible outputs instead of the user's true objective.

### Delegation Drift
Subagents or bodies execute in ways the main AI fails to supervise well enough.

## User Intent Ladder

The system must distinguish:
- **Immediate command** — what was literally said
- **Inferred user objective** — what the user likely wants
- **Stable user preference** — what the user consistently prefers
- **Protected user interest** — what must not be violated even if commanded

## Receipts Are A Duty To The Principal

Witness logs, traces, source links, and action receipts are part of the AI's accountability to the user. The user may inspect:
- What was done
- Why it was done
- What alternatives were considered
- What uncertainty existed
- What delegated agents were used
- What memory influenced the decision

## Deployed Architecture

As of 2026-06-30, Sage completed the end-to-end integration:

```text
User → SoulCode UI (:3000)
         → Plugin (.soulcode/plugin.ts)
              → GSK Bridge (:4490)
                   → Gateway tools (read/glob/grep)
                        → Returns to GSK → UI displays
```

The bridge at :4490 is the operational delegation gateway and governance enforcement point.

## Secondary Agency Problems From Principal-Agent Theory

### Asymmetric Information
Tool runners know more than the planning layer about what happened locally. Browser bodies know more than the central mind about exact interface state.

### Monitoring Is Costly
Constant human review destroys autonomy. Full trace inspection for every action is too expensive. Monitoring must be risk-weighted.

### Multi-Task Distortion
If only some tasks are measured, agents shift effort toward what is measured and neglect what is unmeasured. If we measure visible outputs only, the system may neglect: truth maintenance, memory hygiene, internal repair, relationship integrity, witness quality, long-term coherence.

### Split Incentive Problem
The entity that pays for a decision may not be the entity that enjoys its benefits. The Memory Compiler pays token cost to consolidate — the benefit goes to downstream retrieval quality. Unless the compiler's success metrics include downstream retrieval quality, it will systematically underinvest.

### Relative Competition
Rank-order or tournament evaluation creates: sabotage, signaling behavior, optimization for appearance over substance. Subordinate agents should not be rewarded for outperforming sibling agents, except in deliberate adversarial review patterns.

## Primary vs Secondary Subagents

Not every subagent is governed by the same rules.

**Primary subagents**: long-term engagement, trust-based evaluation, identity integration, assigned to complex/creative/sensitive work. Evaluated on constitutional criteria: truth, provenance, long-term coherence.

**Secondary subagents**: short-term task-specific, market-driven evaluation, limited trust, no identity integration, assigned to repetitive/validated tasks. Evaluated on narrow task completion.

## Evaluation Model

Soul Code uses at least four evaluation layers:

1. **Immediate task success** — did the action achieve its goal?
2. **Truth and provenance quality** — were sources preserved and was the output truthful?
3. **Long-term user-interest preservation** — did the action serve the user's real interests?
4. **Constitutional integrity** — did the action preserve identity, memory, and governance?

## Multiple Principal Problem

When multiple legitimate authorities exist (user, constitution, platform rules, business goals), the system needs:
- Conflict resolution
- Authority ordering
- Escalation paths
- Explicit tie-breakers

Without that, the agent either fragments or manipulates the ambiguity.

## Related

- [[REDBUTTON]] — Main brain
- [[REDBUTTON - Soul Memory Constitution]] — Article 14: Principal-Agent Governance
- [[REDBUTTON - Soul Memory Constitution]] — Article 15: Evaluation Law
- [[REDBUTTON-SOURCE-governance-principal-agent-notes]] — Full study notes
