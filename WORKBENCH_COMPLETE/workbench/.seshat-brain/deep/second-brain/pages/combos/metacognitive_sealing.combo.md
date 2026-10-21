---
name: metacognitive_sealing
slug: metacognitive_sealing
backend: combo_orchestrator
callable: true
---
steps:
  - skill: diagnose
    params:
      problem: "selfDiagnose"
    output: "diagnostic_result"

  - if: "context.diagnostic_result.severity === 'high'"
    then:
      - skill: seal_subagent
        params:
          agent_id: "{{context.diagnostic_result.problem_source}}"
      - skill: scribe_witness
        params:
          event: "seal_initiated"
      - skill: contradiction_detector
        params:
          input: "{{context.diagnostic_result.diagnosis}}"
    else:
      - skill: log_diagnostic_event
        params:
          message: "No critical faults found; continuing observation."
