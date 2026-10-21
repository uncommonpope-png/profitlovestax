---
name: absolute_overdrive
slug: absolute_overdrive
backend: combo_orchestrator
callable: true
---
steps:
  - skill: world_send_command
    params:
      command: "FullPower"
  - skill: world_send_command
    params:
      command: "Kaioken"
  - skill: world_send_command
    params:
      command: "PotentialUnleashed"
