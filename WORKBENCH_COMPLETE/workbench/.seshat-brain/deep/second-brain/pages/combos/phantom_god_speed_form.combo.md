---
name: phantom_god_speed_form
slug: phantom_god_speed_form
backend: combo_orchestrator
callable: true
---
steps:
  - if: "context.priority === 'critical'"
    then:
      - skill: world_send_command
        params:
          command: "InstantTransmission"
      - skill: world_send_command
        params:
          command: "Kaioken"
      - skill: world_send_command
        params:
          command: "AfterimageStrike"
    else:
      - skill: world_send_command
        params:
          command: "NormalMovement"
