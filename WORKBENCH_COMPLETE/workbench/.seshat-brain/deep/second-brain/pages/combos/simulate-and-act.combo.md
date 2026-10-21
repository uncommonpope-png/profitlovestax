---
name: Simulate and Act
slug: simulate_and_act
description: "A combo that embodies Spatial Intelligence by first simulating a series of actions and their outcomes within an internal World Model before committing to real-world execution. The World Model Integrator and Perception-Action Loop are conceptual contexts, not directly callable steps."

params:
  - name: simulationGoal
    type: string
    description: "The goal to be achieved in the simulation."
  - name: simulationEnvironment
    type: string
    description: "A description of the environment to be simulated (e.g., a codebase, a 3D scene)."

skills:
  - name: SKILL - Verifiable Goal Definition
    slug: verifiable_goal_definition
    description: "Define the goal for the simulation."
    params:
      goalDescription: "{{simulationGoal}}"
    output: "simulation_goal_contract"

  - name: SKILL - World Model Simulation
    slug: world_model_simulation
    description: "Executes the simulation using the Perception-Action Loop within the context of the World Model."
    input: "simulation_goal_contract"
    params:
      environment: "{{simulationEnvironment}}"
    output: "simulation_outcome_report"

  - name: SKILL - Plan from Simulation
    slug: plan_from_simulation
    description: "Analyzes the successful simulation path and creates a concrete execution plan."
    input: "simulation_outcome_report"
    output: "execution_plan"
    
  - name: COMBO - Execute Real Action
    slug: execute_real_action
    description: "Executes the validated plan in the real environment."
    input: "execution_plan"
    output: "real_action_results"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Simulate and Act combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---