---
name: Dynamic World Environment Builder
slug: dynamic_world_environment_builder
description: A combo that dynamically constructs and configures an operational environment (a "world") tailored to a specific task, inspired by game engine principles.

params:
  - name: environmentGoal
    type: string
    description: "The purpose or goal of the environment to be built (e.g., 'Integration testing for billing module')."
  - name: assetList
    type: array
    description: "A list of required assets (3D models, data files, code modules) to be included in the environment."
    items:
      type: string
  - name: behaviorScripts
    type: array
    description: "A list of scripts defining dynamic behaviors within the environment."
    items:
      type: string

skills:
  - name: SKILL - Verifiable Goal Definition
    slug: verifiable_goal_definition
    description: "Define the requirements for the operational environment."
    params:
      goalDescription: "Build environment for: {{environmentGoal}}"
    output: "environment_build_contract"

  - name: SKILL - 3D Asset Generation
    slug: 3d_asset_generation
    description: "Generate the foundational 3D assets for the environment."
    input: "environment_build_contract"
    params:
      assetDescriptions: "{{assetList}}"
    output: "generated_assets"

  - name: SKILL - Modular Scene Composition
    slug: modular_scene_composition
    description: "Assemble the generated assets and other required resources into a coherent operational scene."
    input: "generated_assets"
    output: "composed_scene_graph"

  - name: SKILL - Spatial World Interaction
    slug: spatial_world_interaction
    description: "Perform initial setup, placement, and configuration of elements within the composed scene."
    input: "composed_scene_graph"
    output: "configured_environment"

  - name: SKILL - Multi-Language Scripting Integration
    slug: multi_language_scripting_integration
    description: "Integrate and enable the specified behavior scripts within the environment."
    input: "configured_environment"
    params:
      scripts: "{{behaviorScripts}}"
    output: "interactive_environment"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Dynamic World Environment Builder combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---