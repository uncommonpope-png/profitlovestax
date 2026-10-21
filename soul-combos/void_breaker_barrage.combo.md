---
name: void_breaker_barrage
slug: void_breaker_barrage
backend: combo_orchestrator
callable: true
---
steps:
  - if: "context.target_engaged === true"
    then:
      - skill: world_send_command
        params:
          command: "DieDieMissile"
      - skill: world_send_command
        params:
          command: "SpiritBall"
        input: "target_coords"
    else:
      - skill: world_get_state
        output: "current_world_state"
