---
name: Skill Development Cycle
slug: skill_development_cycle
description: Orchestrates a personalized learning and development cycle to enhance a specific GSK skill.

params:
  - name: skillToDevelop
    type: string
    description: "The name of the skill to be developed or improved."
  - name: learningResources
    type: array
    description: "A list of URLs or paths to learning resources (articles, docs, code examples)."
    items:
      type: string

skills:
  - name: SKILL - Dynamic Competence Mapping
    slug: dynamic_competence_mapping
    description: "Assess the current competence stage for the specified skill."
    params:
      skillName: "{{skillToDevelop}}"
    output: "current_competence_stage"

  - name: SKILL - Cognitive Reframing Protocol
    slug: cognitive_reframing_protocol
    description: "Address any limiting beliefs or flawed heuristics related to the skill's development."
    input: "current_competence_stage"
    params:
      targetSkill: "{{skillToDevelop}}"
    output: "reframed_mindset_context"

  - name: SKILL - Accelerated Learning Protocol
    slug: accelerated_learning_protocol
    description: "Applies stage-appropriate learning strategies using provided resources."
    input:
      competenceStage: "current_competence_stage"
      mindsetContext: "reframed_mindset_context"
      resources: "learningResources"
    params:
      targetSkill: "{{skillToDevelop}}"
    output: "learning_progress_report"

  - name: SKILL - Dynamic Competence Mapping
    slug: dynamic_competence_mapping
    description: "Re-assess competence after the learning cycle to track progress."
    params:
      skillName: "{{skillToDevelop}}"
      previousStage: "current_competence_stage"
    output: "updated_competence_stage"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Skill Development Cycle combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---
