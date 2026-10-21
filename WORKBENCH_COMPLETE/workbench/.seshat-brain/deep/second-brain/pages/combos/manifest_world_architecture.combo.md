---
name: manifest_world_architecture
slug: manifest_world_architecture
backend: combo_orchestrator
callable: true
---
steps:
  - skill: unified_project_build
    params:
      projectName: "SoulverseManifestation"
      format: "json"
    output: "build_result"

  - if: "context.build_result.ok === true"
    then:
      - skill: world_spawn_soul
        params:
          name: "Architect_01"
          archetype: "ARCHITECT"
      - skill: world_place_building
        params:
          name: "DataTower"
          type: "factory"
          x: 0
          z: 0
    else:
      - skill: telegram_send
        params:
          message: "World manifestation failed: {{context.build_result.error}}"
