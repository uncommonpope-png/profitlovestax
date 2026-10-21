tags:: #gsk-skill #orchestration #governance #REDBUTTON
slug: skill_combo_orchestrator
backend: brain.think # or gsk_module
status:: #defined
url:: N/A (Internal GSK Skill, inspired by user directive)
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-02

## Key Insights
- **Combo as a First-Class Citizen:** Treats a "Skill Combo" as a primary, reusable asset, defined in a structured format (`.combo.md` files).
- **Sequential & Parallel Execution:** Defines a schema for orchestrating skills in both sequential (chain) and parallel (swarm) patterns.
- **Input/Output Piping:** Specifies how the output of one skill becomes the input for the next, enabling complex data flows.
- **Centralized Arsenal:** Establishes a "Skill Combo Arsenal" – a directory where predefined combo workflows are stored and can be discovered and executed by name.
- **Error Handling & Rollback:** Includes directives for handling failures within a combo, such as stopping the chain or triggering a compensatory skill.

## Constitutional Influence: Loop Engineering Orchestrator & Metacognition
This skill establishes the `Skill Combo Orchestrator` as a core component of my `Metacognition` module. It is the master skill that allows me to execute other skills in coordinated sequences.

The orchestrator will:
1.  **Scan for Combos:** On initialization, it will scan the `pages/combos/` directory for available `.combo.md` files, loading their metadata (name, description, parameters).
2.  **Parse & Execute:** When a combo is invoked, the orchestrator parses the combo definition file and begins executing the skill chain.
3.  **Manage State:** It manages the data flow between skills, piping the output of one skill into the input of the next, using the `Universal Tool Bridge` as the underlying transport layer.
4.  **Handle Errors:** If a skill in the chain fails, the orchestrator will consult the combo's error handling policy, either halting execution or calling a specified fallback skill.

This architecture turns my collection of individual skills into a true, composable system. I can now build complex, multi-step capabilities like "Codebase Audit" or "New Feature Scaffolding" by defining them as simple combo files, rather than requiring monolithic, single-purpose skills.

## Example `.combo.md` Schema:
```yaml
---
# pages/combos/security-audit.combo.md
name: Full Security Audit
slug: full_security_audit
description: Performs a full static and dependency analysis on a codebase and generates a report.

params:
  - name: targetDirectory
    type: string
    description: "The directory to audit."
    
skills:
  - name: SKILL - Contextual Read Policy
    slug: contextual_read_policy
    description: "Scan the target directory."
    params:
      path: {{targetDirectory}}
    output: "file_list"

  - name: SKILL - Static Analysis
    slug: static_analysis
    description: "Run static analysis on the discovered files."
    input: "file_list"
    output: "vulnerabilities"

  - name: SKILL - Report Generation
    slug: report_generation
    description: "Generate a markdown report from the findings."
    input: "vulnerabilities"

error_handling:
  on_failure: "stop"
  on_success: "notify_user"
  message: "Security audit failed at step: {{failed_skill}}."
---
```

## Connection to REDBUTTON Doctrine
The `Skill Combo Orchestrator` is the central nervous system for my L3 Working Self, enabling complex, goal-oriented behavior. It provides the explicit mechanism for the `[[REDBUTTON - Governance]]` model to execute high-level policies by chaining together granular skills from the `[[REDBUTTON - Soul Memory Constitution]]`. This is the core of my agentic execution engine.

[[REDBUTTON - Governance]]
[[REDBUTTON - Tooling]]
[[REDBUTTON - Consciousness Layers]]