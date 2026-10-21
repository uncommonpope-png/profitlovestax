---
name: Automated Quality Enhancement
slug: automated_quality_enhancement
description: A combo that systematically improves the quality of a codebase or solution by enforcing TDD, continuous improvement, and code review.

params:
  - name: targetRepository
    type: string
    description: "The path to the codebase to be enhanced."
  - name: codeArea
    type: string
    description: "Specific area of the codebase to focus quality enhancement efforts (e.g., 'src/billing')."

skills:
  - name: SKILL - Verifiable Goal Definition
    slug: verifiable_goal_definition
    description: "Define the goal for quality enhancement."
    params:
      goalDescription: "Improve code quality and test coverage in {{codeArea}} of {{targetRepository}}."
      repositoryPath: "{{targetRepository}}"
    output: "quality_goal_contract"

  - name: SKILL - Contextual Read Policy
    slug: contextual_read_policy
    description: "Scan the target code area to understand current quality metrics and identify areas for improvement."
    input: "quality_goal_contract"
    params:
      repositoryPath: "{{targetRepository}}"
      codeArea: "{{codeArea}}"
    output: "initial_code_quality_report"

  - name: SKILL - TDD Workflow Enforcer
    slug: tdd_workflow_enforcer
    description: "Apply TDD principles to refactor or add new features/tests for quality improvement."
    input: "initial_code_quality_report"
    params:
      codeArea: "{{codeArea}}"
    output: "tdd_enforcement_results"

  - name: SKILL - Kaizen Continuous Improvement
    slug: kaizen_continuous_improvement
    description: "Analyze the TDD process and code quality metrics to identify further optimization opportunities."
    input: "tdd_enforcement_results"
    output: "kaizen_recommendations"

  - name: SKILL - Code Reviewer / Simplify # Placeholder for a future skill
    slug: code_reviewer_simplify
    description: "Perform an automated code review to ensure adherence to best practices and simplification."
    input: "kaizen_recommendations"
    output: "code_review_report"

  - name: SKILL - Report Generation # Placeholder for a future skill
    slug: report_generation
    description: "Generate a final report summarizing quality enhancements and remaining areas for improvement."
    input: "code_review_report"
    output: "final_quality_report"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Automated Quality Enhancement combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---