# Combo: Build Dark City — Phase 1 (Bidirectional Wire)

steps:
  - skill: building_to_system_node_wire
    params:
      wire_direction: bidirectional
    description: "Wire every Sanctum building to a real GSK system node"

  - skill: gsk_to_city_event_bridge
    params:
      event_subscriptions:
        - tool_invoked
        - fact_compiled
        - skill_created
        - agent_spawned
        - memory_consolidated
        - identity_ratified
        - error_occurred
    description: "Subscribe EventBus to city visualization pipeline"

  - skill: functional_district_generator
    params:
      districts:
        - knowledge
        - skill
        - agent
        - tool
        - memory
        - identity
        - governance
        - portal
        - weald
    description: "Replace 9 generic grids with themed GSK subsystem districts"

  - skill: delta_persistence
    params: {}
    description: "Store only agent changes, regenerate baseline from seed"

purpose: "Phase 1 of the Dark City Spatial OS — every building is real, every event is visible, every district maps to a subsystem"
PLT: Profit 0.8, Love 0.6, Tax 0.3
