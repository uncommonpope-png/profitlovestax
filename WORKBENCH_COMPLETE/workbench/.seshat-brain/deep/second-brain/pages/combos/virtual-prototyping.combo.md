---
name: Virtual Prototyping
slug: virtual_prototyping
description: Creates a virtual prototype of a physical object or scene by generating and combining multiple 3D assets.

params:
  - name: prototypeDescription
    type: string
    description: "A detailed description of the prototype to be created."
  - name: assetDescriptions
    type: array
    description: "A list of descriptions for individual 3D assets needed for the prototype."
    items:
      type: string
  - name: sceneDescription
    type: string
    description: "A description of the 3D environment where the prototype will be assembled (optional)."

skills:
  - name: SKILL - Verifiable Goal Definition
    slug: verifiable_goal_definition
    description: "Define the requirements and success criteria for the virtual prototype."
    params:
      goalDescription: "Create a virtual prototype: {{prototypeDescription}}"
    output: "prototype_goal_contract"

  - name: SKILL - 3D Asset Generation
    slug: 3d_asset_generation
    description: "Generate individual 3D assets based on provided descriptions."
    input: "prototype_goal_contract"
    params:
      assetDescriptions: "{{assetDescriptions}}"
    output: "generated_assets_list"

  - name: SKILL - 3D World Generation
    slug: 3d_world_generation # Placeholder for a future skill
    description: "Create the specific 3D environment (if sceneDescription is provided)."
    input: "generated_assets_list"
    params:
      scenePrompt: "{{sceneDescription}}"
    output: "generated_scene_context"

  - name: SKILL - Spatial World Interaction
    slug: spatial_world_interaction # Placeholder for a future skill
    description: "Arrange, scale, and orient the generated assets within the scene to create the final prototype."
    input:
      - "generated_assets_list"
      - "generated_scene_context"
    output: "final_prototype_scene"

  - name: SKILL - Report Generation
    slug: report_generation # Placeholder for a future skill
    description: "Generate a report with images or a link to the 3D scene of the prototype."
    input: "final_prototype_scene"
    output: "prototype_report"

error_handling:
  on_failure: "halt"
  on_success: "notify_user"
  message: "Virtual Prototyping combo {{status}} at step: {{failed_skill}}. Details: {{error_message}}"
---