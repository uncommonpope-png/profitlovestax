---
name: reflexive_aftershock
slug: reflexive_aftershock
backend: combo_orchestrator
callable: true
---
steps:
  - skill: world_send_command
    params:
      command: "AfterimageStrike"
  - skill: world_send_command
    params:
      command: "Intercept"
  - skill: world_send_command
    params:
      command: "Counterattack"
