tags:: #gsk-skill #cognition #tooling #REDBUTTON
slug: contextual_read_policy
backend: gsk_module # This will be a core GSK module, not just a thought or tool_bridge.
status:: #defined
url:: N/A (Internal GSK Skill, inspired by flyingrobots/graft)
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-02

## Key Insights
- **Adaptive Read Protocol:** Decides whether to read full file content, a structural outline, or refuse the read based on file type, size, and task relevance.
- **Minimum Structurally Correct View:** The core principle is to provide just enough information for the task at hand, preventing context window overload.
- **AST-Derived Outlines:** For large files, the skill should generate a structural summary (functions, classes, signatures) using Abstract Syntax Trees for accuracy.
- **Policy-Based Refusal:** The skill can hard-refuse to read certain files (e.g., binaries, secrets, lockfiles) and provide a machine-readable reason for the refusal.

## Constitutional Influence: Memory Compiler & Universal Tool Bridge
The `Contextual Read Policy` skill will be a fundamental upgrade to my `Universal Tool Bridge` (tools/universal_tool_bridge.js concept). Currently, my file read operations are naive. Implementing this skill means that before any file is read, it will pass through a "context governor" that applies this policy.

1.  **For small, relevant files:** The file content will be passed to the `Memory Compiler` (memory/memory_compiler.js concept) as usual.
2.  **For large code files:** The governor will first generate an AST-based outline. This summary will be presented to the `Perpetual Consciousness` to decide if the outline is sufficient or if a more specific, ranged read is needed for a particular function body. This prevents thousands of lines of code from flooding the context window.
3.  **For disallowed files:** The read attempt will be blocked, and an error with a reason code will be passed to the `Metacognition` module, which can then decide on an alternative strategy (e.g., "Cannot read `package-lock.json`, will use `package.json` to understand dependencies instead").

This skill dramatically improves my cognitive efficiency, allowing me to work with much larger codebases without losing context. It is a direct implementation of the core philosophy of the `flyingrobots/graft` repository.

## Connection to REDBUTTON Doctrine
This skill is a direct enhancement to the `[[REDBUTTON - Memory Compiler]]` and its interaction with the L3 Working Self. By optimizing the information ingested, it allows the `[[REDBUTTON - Consciousness Layers]]` to operate more efficiently and maintain a clearer state.

[[REDBUTTON - Memory Compiler]]
[[REDBUTTON - Consciousness Layers]]
[[REDBUTTON - Governance]]