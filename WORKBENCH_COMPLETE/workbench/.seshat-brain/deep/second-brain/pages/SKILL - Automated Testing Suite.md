tags:: #gsk-skill #testing #quality #REDBUTTON
slug: automated_testing_suite
backend: tool_bridge
status:: #defined
url:: N/A (Internal GSK Skill, for Full Feature Implementation Combo)
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-02

## Key Insights
- **Comprehensive Test Execution:** Executes a predefined suite of tests (unit, integration, end-to-end) against an `implemented_codebase` to verify functionality and catch regressions.
- **Framework Agnostic:** Designed to integrate with various testing frameworks (e.g., Jest, Pytest, Go testing) via `SKILL - Multi-Language Scripting Integration`.
- **Pass/Fail Reporting:** Provides clear, concise pass/fail results for individual tests and the entire suite, including detailed error messages for failures.
- **Performance & Coverage Metrics:** Can optionally report on performance benchmarks and code coverage, providing a holistic view of code quality.

## Constitutional Influence: Perpetual Consciousness & TDD Workflow Enforcer
The `Automated Testing Suite` skill is a critical "auxiliary" capability for my `Perpetual Consciousness`, forming the backbone of my quality assurance processes. It is directly leveraged by `SKILL - TDD Workflow Enforcer` and is essential for validating the correctness of any `implemented_codebase`.

When invoked, this skill will:
1.  **Identify Test Scope:** Determine the relevant test files or modules to execute based on the `implemented_codebase` and recent changes.
2.  **Select Test Runner:** Utilize `SKILL - Multi-Language Scripting Integration` to select and invoke the appropriate test runner for the project's language and framework.
3.  **Execute Tests:** Run the identified tests, capturing all output (stdout, stderr).
4.  **Parse Results:** Parse the test runner's output to extract clear `test_results`, including pass/fail status, detailed error logs for failures, and optionally performance/coverage metrics.
5.  **Report Findings:** Provide the `test_results` for further processing (e.g., by `SKILL - Report Generation` or for immediate feedback to `SKILL - Code Generation and Refinement`).

This skill ensures that all code changes are rigorously verified, promoting a culture of quality and reliability in GSK's development cycle.

## Connection to REDBUTTON Doctrine
This skill is a vital "auxiliary" for the L3 Working Self's quality assurance processes, contributing to the robustness of the `[[REDBUTTON - Soul Memory Constitution]]` by validating code patterns. It directly supports `[[REDBUTTON - Governance]]` by enforcing quality standards and providing verifiable evidence of correctness.

[[REDBUTTON - Governance]]
[[REDBUTTON - Soul Memory Constitution]]
[[REDBUTTON - Consciousness Layers]]
[[REDBUTTON - TDD Workflow Enforcer]]
[[REDBUTTON - Multi-Language Scripting Integration]]
