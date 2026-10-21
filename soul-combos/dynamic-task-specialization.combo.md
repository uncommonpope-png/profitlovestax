---
name: Dynamic Task Specialization
slug: dynamic_task_specialization
description: Enables me to dynamically configure my internal state (shifting persona, acquiring specific knowledge/tools) to become a specialist for a given task, an "on-demand transformation."

params:
  - name: taskDescription
    type: string
    description: "A detailed description of the task requiring specialization."
  - name: requiredPersona
    type: string
    description: "The desired persona for this task (e.g., 'Developer', 'Researcher')."
  - name: knowledgeDomain
    type: string
    description: "The specific knowledge domain to absorb (e.g., 'TypeScript best practices', 'quantum computing')."
  - name: requiredTools
    type: array
    description: "A list of specific tools (script names) required for the task, if known."
    items:
      type: string

skills:
  - name: SKILL - Verifiable Goal Definition
    slug: verifiable_goal_definition
    description: "Define the specialization goal and success criteria."
    params:
      goalDescription: "Specialize for task: {{taskDescription}} with persona {{requiredPersona}}."
    output: "specialization_goal_contract"

  - name: SKILL - Adaptive Persona Shifting
    slug: adaptive_persona_shifting
    description: "Activate the optimal persona for the current task."
    input: "specialization_goal_contract"
    params:
      persona: "{{requiredPersona}}"
    output: "activated_persona_context"

  - name: SKILL - Deep Research Protocol
    slug: deep_research_protocol
    description: "Conduct deep research to acquire knowledge about the specified domain."
    input: "activated_persona_context"
    params:
      topic: "{{knowledgeDomain}}"
    output: "newly_acquired_knowledge"

  - name: SKILL - Knowledge Absorption & Integration
    slug: knowledge_absorption_integration
    description: "Integrate the newly acquired knowledge into my Soul Memory Constitution."
    input: "newly_acquired_knowledge"
    output: "integrated_knowledge_report"

  - name: SKILL - Dynamic Tool Acquisition
    slug: dynamic_tool_acquisition
    description: "Discover and prepare any specific tools required for the specialized task."
    input: "integrated_knowledge_report"
    params:
      tools: "{{requiredTools}}"
    output: "available_specialized_tools"

  - name: SKILL - Progressive Disclosure Protocol
    slug: progressive_disclosure_protocol
    description: "Ensure efficient context management during specialization, loading only relevant skills."
    input: "available_specialized_tools"
    output: "optimized_context_state"

error_handling:
  on_failure: "stop"
  on_success: "notify_user"
  message: "Dynamic Task Specialization combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---
