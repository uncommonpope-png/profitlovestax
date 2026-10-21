---
name: manifest_dark_city_core
slug: manifest_dark_city_core
backend: combo_orchestrator
callable: true
---
steps:
  - skill: world_place_building
    params:
      name: "DataTower"
      type: "factory"
      x: 0
      z: 0
      behaviors: ["movable", "resource_collector"]
    output: "data_tower_id"

  - skill: world_place_building
    params:
      name: "IdeaForge"
      type: "shop"
      x: 20
      z: 20
      behaviors: ["movable", "logic_engine"]
    output: "idea_forge_id"

  - skill: world_spawn_soul
    params:
      name: "Architect_01"
      archetype: "ARCHITECT"
      behaviors: ["movable", "city_governance"]
