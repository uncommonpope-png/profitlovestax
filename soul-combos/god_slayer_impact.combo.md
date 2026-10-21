---
name: god_slayer_impact
slug: god_slayer_impact
backend: combo_orchestrator
callable: true
---
steps:
  - skill: world_send_command
    params:
      command: "DeathBall"
  - skill: world_send_command
    params:
      command: "FinalFlash"
  - skill: world_send_command
    params:
      command: "BigBangAttack"
