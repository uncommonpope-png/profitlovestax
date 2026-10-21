---
tags:: #gsk-combo
name: conditional_example
slug: conditional_example
backend: combo_orchestrator
callable: true
---
## Steps
- skill: check_condition
  params:
    value: "some_value"
  output: "condition_result"

- if: "context.condition_result === true"
  then:
    - skill: do_if_true
      params:
        action: "true_action"
  else:
    - skill: do_if_false
      params:
        action: "false_action"