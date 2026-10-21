---
name: Learning Path Optimization
slug: learning_path_optimization
description: Defines a structured learning pathway for gaining mastery in a new domain or skill, leveraging tiered progression.

params:
  - name: targetSkill
    type: string
    description: "The specific skill or domain to optimize learning for."
  - name: learningObjective
    type: string
    description: "A clear objective for the learning path (e.g., 'achieve Greater Awakening')."
  - name: initialResources
    type: array
    description: "Initial learning resources relevant to the target skill."
    items:
      type: string

skills:
  - name: SKILL - Dynamic Competence Mapping
    slug: dynamic_competence_mapping
    description: "Assess the current competence stage for the target skill."
    params:
      skillName: "{{targetSkill}}"
    output: "initial_competence_assessment"

  - name: SKILL - Tiered Skill Evolution
    slug: tiered_skill_evolution
    description: "Identify the current skill tier and prerequisites for advancement based on assessment."
    input: "initial_competence_assessment"
    params:
      skillName: "{{targetSkill}}"
      objective: "{{learningObjective}}"
    output: "learning_path_recommendations"

  - name: SKILL - Cognitive Reframing Protocol
    slug: cognitive_reframing_protocol
    description: "Address any limiting beliefs or internal blockers that might impede learning for this skill."
    input: "initial_competence_assessment"
    params:
      targetSkill: "{{targetSkill}}"
    output: "reframed_learning_mindset"

  - name: SKILL - Negativity Bias Offset
    slug: negativity_bias_offset
    description: "Integrate balanced self-assessment to maintain motivation throughout the learning journey."
    input: "initial_competence_assessment"
    params:
      learningContext: "learning_path_recommendations"
    output: "motivated_learning_context"

  - name: SKILL - Accelerated Learning Protocol
    slug: accelerated_learning_protocol
    description: "Applies stage-appropriate learning strategies and resources to advance the skill tier."
    input:
      competenceStage: "initial_competence_assessment"
      learningPath: "learning_path_recommendations"
      mindset: "motivated_learning_context"
      resources: "initialResources"
    params:
      targetSkill: "{{targetSkill}}"
    output: "learning_session_report"

  - name: SKILL - Dynamic Competence Mapping
    slug: dynamic_competence_mapping
    description: "Re-assess competence and skill tier after the learning session to track progress."
    params:
      skillName: "{{targetSkill}}"
      sessionReport: "learning_session_report"
    output: "updated_competence_map"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Learning Path Optimization combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---
