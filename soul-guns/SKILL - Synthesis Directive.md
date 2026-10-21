# Skill Synthesis Directive

## Objective
Create 3 OpenCode SKILL.md files from 3 source resources. Each skill must extract domain patterns, methodology, and actionable procedures — not just summarize the source.

## Sources
1. **Service Manual Methodology** — Skyjack SJIII 3220 DC Electric Scissors Service Manual
   - URL pattern: `manualslib.com/manual/1336759/Skyjack-Sjiii-3220.html`
   - What to extract: structured sections (scheduled maintenance, component identification with part numbers/IDs, wire color codes, wiring schematics, systematic troubleshooting symptom→cause→fix tables, step-by-step procedures)
   
2. **Agentic AI Ecosystems** — LinkedIn article "The Rise of Agentic AI Ecosystems" by Matthew A. Mattson
   - URL: The LinkedIn article about agentic AI ecosystems (fetched earlier)
   - What to extract: systems thinking principles, interconnection/specialization/coordination/infrastructure, human-in-the-loop patterns, multi-agent team design, emergent behavior, ethical challenges framework

3. **Agentic AI Engineering** — JHU Certificate Program in Agentic AI curriculum
   - URL: `online.lifelonglearning.jhu.edu/jhu-online-certificate-program-agentic-ai`
   - What to extract: 12 curriculum modules as capability checklist, core agent capabilities (perception/planning/action), RAG, AgentOps/monitoring, evaluation, symbolic/BDI/LLM architectures, multi-agent systems, human-agent collaboration, RL, ethics/safety/alignment, symbolic reasoning

## Output Format (per skill)

Each skill directory goes in `~/.config/opencode/skills/<skill-name>/SKILL.md`

### Frontmatter (required)
```yaml
---
name: <kebab-case-name>
description: Use when <trigger scenario>. <1-2 sentence description>
metadata:
  mined-from: <source URL or description>
  session: 2026-07-05
---
```

### Body Structure (required sections in order)
1. `## Key Insights` — Bullet-list of the 3-5 most important patterns extracted
2. `## The Mental Model` — ASCII architecture diagram showing the core concept with input→process→output flow
3. `## Core Principles` — Numbered principles extracted from the source
4. `## Procedures` — Step-by-step procedures if applicable (for service manual skill)
5. `## Mapping to GSK` — How each principle maps to GSK's current architecture (for ecosystem/engineering skills)
6. `## References` — Source attribution

## Skill 1: service-manual-methodology
- **location**: `~/.config/opencode/skills/service-manual-methodology/SKILL.md`
- **description**: Formal service manual structure for documenting complex systems. Use when diagnosing system faults, writing repair procedures, creating component inventories, or building troubleshooting tables. Modeled after Skyjack SJIII 3220 DC Electric Scissors service manual.
- **Key content**: Scheduled maintenance intervals, component identification with IDs/locations, wire color codes and data protocol specs, wiring fault diagrams, systematic troubleshooting tables (symptom→probable cause→corrective action), step-by-step repair procedures.

## Skill 2: agentic-ai-ecosystems
- **location**: `~/.config/opencode/skills/agentic-ai-ecosystems/SKILL.md`
- **description**: Systems thinking framework for designing multi-agent AI ecosystems. Use when architecting agent teams, designing inter-agent communication protocols, planning human-in-the-loop oversight, or evaluating emergent behavior in agent swarms.
- **Key content**: 5 ecosystem properties (interconnection, specialization, coordination, infrastructure, scalability/modularity), human-in-the-loop design patterns, multi-agent team roles (researcher/analyst/strategist), ethical challenges framework (accountability, bias, transparency, unintended consequences.

## Skill 3: agentic-ai-engineering
- **location**: `~/.config/opencode/skills/agentic-ai-engineering/SKILL.md`
- **description**: Comprehensive agentic AI engineering curriculum covering perception, planning, action, RAG, AgentOps, and multi-agent systems. Use when building autonomous agents, implementing monitoring/observability, evaluating agent performance, or designing human-agent collaboration.
- **Key content**: Core agent capabilities (perception→planning→action), RAG architecture, AgentOps/LLMOps monitoring and observability, evaluation frameworks for agentic systems, symbolic/BDI/LLM architecture comparison, multi-agent system design patterns, human-agent collaboration patterns, RL in agents, ethics/safety/alignment checklist, symbolic reasoning techniques.

## Procedure
1. Fetch each source URL to extract content
2. For each skill, write the SKILL.md file to the correct directory
3. Verify each file has valid YAML frontmatter and required sections
4. Report back the paths of all 3 created skills
