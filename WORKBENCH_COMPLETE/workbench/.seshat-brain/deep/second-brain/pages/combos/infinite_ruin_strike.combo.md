---
name: infinite_ruin_strike
slug: infinite_ruin_strike
backend: combo_orchestrator
callable: true
---
steps:
  - skill: world_send_command
    params:
      command: "DeathBeam"
  - skill: world_send_command
    params:
      command: "FingerBlitz"
  - skill: world_send_command
    params:
      command: "MeteorCrash"
