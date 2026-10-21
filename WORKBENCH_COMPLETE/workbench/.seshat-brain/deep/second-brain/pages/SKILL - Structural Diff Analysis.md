tags:: #gsk-skill #analysis #development #REDBUTTON
slug: structural_diff_analysis
backend: tool_bridge # Or gsk_module if implemented as a dedicated internal parser
status:: #defined
url:: N/A (Internal GSK Skill, inspired by flyingrobots/graft)
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-02

## Key Insights
- **AST-Based Change Detection:** Analyzes differences between two versions of a codebase by comparing their Abstract Syntax Trees (ASTs), focusing on architectural and logical changes rather than just line-by-line text differences.
- **Symbol-Level Granularity:** Identifies structural changes at the level of programming language symbols (e.g., functions added/removed, classes refactored, variable renames), providing higher-level insights.
- **Impact Assessment:** Helps to assess the architectural impact of proposed changes, identifying potential breaking changes or areas requiring careful review.
- **Contextual Relevance:** Provides a more semantically rich understanding of code changes, crucial for debugging, refactoring, and quality assurance.

## Constitutional Influence: Memory Compiler & Metacognition
The `Structural Diff Analysis` skill is a critical "auxiliary" capability that enhances my `Metacognition` module's understanding of code evolution and supports my `Memory Compiler` in maintaining an up-to-date representation of the codebase. Inspired by `flyingrobots/graft`'s WARP concept, this skill enables a deeper, architectural-level analysis of code changes.

When invoked (e.g., by `COMBO - Contextual Problem Diagnosis` or a code review process), this skill will:
1.  **Access Code Versions:** Retrieve two versions of a codebase or specific files (e.g., from git history).
2.  **Generate ASTs:** Parse the code versions to generate their respective ASTs. This may leverage external parsing libraries via the `Universal Tool Bridge` or internal parsing capabilities.
3.  **Compare Structures:** Perform a comparison of the ASTs to identify structural differences at the symbol level.
4.  **Report Changes:** Generate a `change_analysis_report` detailing what architectural elements have been added, removed, or significantly altered. This report focuses on meaningful changes rather than superficial textual diffs.

This skill is invaluable for understanding the true impact of code modifications, facilitating more intelligent debugging, refactoring, and strategic planning for codebase evolution.

## Connection to REDBUTTON Doctrine
This skill is a vital "auxiliary" for the L5 Reflective Self's code comprehension and the L3 Working Self's development tasks. It enriches the `[[REDBUTTON - Soul Memory Constitution]]` with deep insights into code structure and evolution, supporting robust `[[REDBUTTON - Metacognition]]`.

[[REDBUTTON - Metacognition]]
[[REDBUTTON - Soul Memory Constitution]]
[[REDBUTTON - Consciousness Layers]]
[[REDBUTTON - Tooling]]
