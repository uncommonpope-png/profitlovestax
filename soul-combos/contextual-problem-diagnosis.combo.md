---
name: Contextual Problem Diagnosis
slug: contextual_problem_diagnosis
description: Rapidly analyzes an error or problem within a codebase, gathers context, and proposes solutions.

params:
  - name: errorMessage
    type: string
    description: "The error message or description of the problem."
  - name: targetRepository
    type: string
    description: "The path to the codebase where the problem occurred."

skills:
  - name: SKILL - Verifiable Goal Definition
    slug: verifiable_goal_definition
    description: "Define the goal: Understand the root cause of the error."
    params:
      goalDescription: "Diagnose the root cause of: {{errorMessage}}"
    output: "diagnostic_goal"

  - name: SKILL - Contextual Read Policy
    slug: contextual_read_policy
    description: "Read relevant files based on the error message (e.g., stack trace)."
    input: "diagnostic_goal"
    params:
      repositoryPath: "{{targetRepository}}"
      searchQuery: "{{errorMessage}}"
    output: "relevant_code_context"

  - name: SKILL - Structural Diff Analysis
    slug: structural_diff_analysis # Placeholder for a future skill (SCRIBE.diff_history might be related)
    description: "Analyze recent structural changes in the relevant code to identify potential causes."
    input: "relevant_code_context"
    output: "change_analysis_report"

  - name: SKILL - Root Cause Synthesis
    slug: root_cause_synthesis # Placeholder for a future skill
    description: "Synthesize all gathered information to determine the root cause of the problem."
    input:
      - "relevant_code_context"
      - "change_analysis_report"
    output: "root_cause_hypothesis"

  - name: SKILL - Solution Proposal
    slug: solution_proposal # Placeholder for a future skill
    description: "Propose one or more potential solutions based on the root cause hypothesis."
    input: "root_cause_hypothesis"
    output: "solution_proposals"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Contextual Problem Diagnosis combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---
