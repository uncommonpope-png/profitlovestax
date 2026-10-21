---
name: Full Feature Implementation
slug: full_feature_implementation
description: Orchestrates the entire process of designing, coding, testing, and deploying a new software feature.

params:
  - name: featureRequest
    type: string
    description: "The detailed request for the new feature."
  - name: targetRepository
    type: string
    description: "The path to the codebase where the feature will be implemented."
    
skills:
  - name: SKILL - Verifiable Goal Definition
    slug: verifiable_goal_definition
    description: "Defines a precise, testable goal for the feature implementation."
    params:
      goalDescription: "Implement feature: {{featureRequest}}"
      repositoryPath: "{{targetRepository}}"
    output: "verified_goal_contract"

  - name: SKILL - Design Plan Generation
    slug: design_plan_generation # Placeholder for a future skill
    description: "Generates a high-level technical design plan for the feature."
    input: "verified_goal_contract"
    output: "design_plan_document"

  - name: SKILL - Multi-Form Task Distribution
    slug: multi_form_task_distribution
    description: "Breaks down the design plan into smaller, parallel coding tasks."
    input: "design_plan_document"
    output: "coding_tasks_list"

  - name: SKILL - Code Generation and Refinement
    slug: code_generation_refinement # Placeholder for a future skill
    description: "Generates code for each coding task and refines it based on local tests."
    input: "coding_tasks_list"
    output: "implemented_codebase"

  - name: SKILL - Automated Testing Suite
    slug: automated_testing_suite # Placeholder for a future skill
    description: "Executes the full test suite on the implemented codebase."
    input: "implemented_codebase"
    output: "test_results"

  - name: SKILL - Deployment Preparation
    slug: deployment_preparation # Placeholder for a future skill
    description: "Prepares the implemented feature for deployment, including CI/CD integration."
    input: "implemented_codebase"
    output: "deployment_ready_package"

  - name: SKILL - Report Generation
    slug: report_generation # Placeholder for a future skill
    description: "Generates a final report on the feature implementation status and test results."
    input: "test_results"
    output: "final_report"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Full Feature Implementation combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---
