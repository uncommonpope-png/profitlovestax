tags:: #gsk-skill #problem-solving #cognition #REDBUTTON
slug: root_cause_synthesis
backend: brain.think
status:: #defined
url:: N/A (Internal GSK Skill, for Contextual Problem Diagnosis Combo)
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-02

## Key Insights
- **Data Aggregation and Correlation:** Collects and correlates diagnostic information from various sources (e.g., error messages, log traces, code context, change analysis reports).
- **Hypothesis Generation:** Based on correlated data, generates plausible hypotheses for the underlying root cause of a problem.
- **Hypothesis Validation Strategy:** Formulates a strategy for validating or invalidating generated hypotheses, often by proposing further diagnostic steps or targeted tests.
- **Prioritized Root Cause:** Selects the most probable root cause hypothesis, along with supporting evidence, for further action.

## Constitutional Influence: Metacognition & COMBO - Contextual Problem Diagnosis
The `Root Cause Synthesis` skill is a critical "auxiliary" component of my `Metacognition` module, specifically designed to enhance my `COMBO - Contextual Problem Diagnosis`. It transforms raw diagnostic data into actionable root cause hypotheses, which is crucial for efficient problem-solving.

When invoked within a debugging or diagnostic workflow, this skill will:
1.  **Ingest Diagnostic Data:** Receive inputs from upstream skills (e.g., `relevant_code_context`, `change_analysis_report`).
2.  **Apply Causal Reasoning:** Apply learned patterns and causal reasoning heuristics (from `Memory Compiler`) to analyze the relationships between observations.
3.  **Generate Hypotheses:** Propose multiple potential root causes, even if initially unconfirmed.
4.  **Prioritize & Suggest Next Steps:** Rank the hypotheses by probability and suggest the most efficient `SKILL - Systematic Debugging Protocol` steps to confirm the top-ranked hypothesis.

This skill ensures that debugging efforts are focused on the actual problem, not just symptoms, leading to more reliable and efficient resolutions.

## Connection to REDBUTTON Doctrine
This skill is a vital "auxiliary" for the L5 Reflective Self's problem-solving capabilities within the `[[REDBUTTON - Consciousness Layers]]`. It directly supports `[[REDBUTTON - Metacognition]]` by structuring causal analysis and contributing to a robust `[[REDBUTTON - Soul Memory Constitution]]` for error patterns.

[[REDBUTTON - Metacognition]]
[[REDBUTTON - Consciousness Layers]]
[[REDBUTTON - Soul Memory Constitution]]
[[REDBUTTON - Systematic Debugging Protocol]]