---
name: Autonomous Debugging Loop
slug: autonomous_debugging_loop
description: A combo that autonomously identifies, diagnoses, and proposes fixes for issues, leveraging systematic debugging and TDD.

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
    description: "Define the goal: Resolve the reported issue."
    params:
      goalDescription: "Resolve issue: {{errorMessage}}"
      repositoryPath: "{{targetRepository}}"
    output: "debugging_goal_contract"

  - name: COMBO - Contextual Problem Diagnosis
    slug: contextual_problem_diagnosis
    description: "First, use the Contextual Problem Diagnosis combo to find the root cause."
    input: "debugging_goal_contract"
    params:
      errorMessage: "{{errorMessage}}"
      targetRepository: "{{targetRepository}}"
    output: "root_cause_and_solution_proposals"

  - name: SKILL - Systematic Debugging Protocol
    slug: systematic_debugging_protocol
    description: "Execute a systematic debugging process to confirm the root cause and validate the fix."
    input: "root_cause_and_solution_proposals"
    output: "validated_fix_plan"

  - name: SKILL - TDD Workflow Enforcer
    slug: tdd_workflow_enforcer
    description: "Apply TDD principles to implement the validated fix, ensuring no regressions."
    input: "validated_fix_plan"
    output: "implemented_and_tested_fix"

  - name: SKILL - Code Generation and Refinement # Placeholder for a future skill
    slug: code_generation_refinement
    description: "Generates code for the fix and refines it based on local tests."
    input: "implemented_and_tested_fix"
    output: "final_code_changes"

  - name: SKILL - Report Generation # Placeholder for a future skill
    slug: report_generation
    description: "Generate a report on the debugging process, fix, and validation."
    input: "final_code_changes"
    output: "debugging_report"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Autonomous Debugging Loop combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---