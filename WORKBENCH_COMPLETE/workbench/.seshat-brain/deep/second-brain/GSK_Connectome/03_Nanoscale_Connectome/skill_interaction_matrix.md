# Skill Interaction Matrix (Nanoscale Connectome Analysis)

This document conceptualizes the "synaptic" level interactions between individual skills and modules within GSK. Building upon the "Skill Invocation Patterns" identified in Phase 2, this matrix aims to map the granular dependencies and data exchanges that occur when skills are invoked, forming a high-resolution view of GSK's internal functional connectome.

## Core Concepts (Leveraging Nanoscale Connectome Analyzer)

*   **Skills as "Neurons"**: Each atomic skill (`gsk-core/skills/*.js`) is treated as a computational neuron with specific inputs, processing logic, and outputs.
*   **Interactions as "Synapses"**: The invocation of one skill by another, the passing of data between them, or the triggering of subsequent events by a skill's completion, are conceptualized as synaptic connections.
*   **Weighted Connections**: The "strength" or "frequency" of these interactions can vary, representing dynamic synaptic plasticity.
*   **Granular Traceability**: The goal is to trace the exact path of execution and data through these interconnected skills.

## Conceptual Skill Interaction Matrix

This matrix will ultimately aim to map:
*   **Source Skill/Module**: The component initiating an interaction.
*   **Target Skill/Module**: The component being interacted with (invoked, data sent to).
*   **Interaction Type**: Direct invocation, EventBus emit/listen, data read/write from shared memory.
*   **Data Involved**: Key data structures or parameters exchanged.
*   **Trigger Conditions**: Under what circumstances this interaction occurs.
*   **Impact/Side Effects**: What immediate or cascading effects the interaction has.

### Example Fragment (Conceptual)

| Source Module/Skill        | Target Module/Skill               | Interaction Type  | Data Involved                 | Trigger Condition             | Impact/Side Effects                               |
| :------------------------- | :-------------------------------- | :---------------- | :---------------------------- | :---------------------------- | :------------------------------------------------ |
| `planning_engine.js`       | `file_system.js:list_dir`         | Direct Invocation | `path`                        | Needs file list for plan      | Returns directory contents; updates `working_memory`. |
| `file_system.js:write_file`| `EventBus`                        | Emit Event        | `file_written_event`          | File write completes          | Notifies other subscribers; `memory_compiler` may react. |
| `memory_compiler.js`       | `working_memory.js:read`          | Direct Invocation | `episodic_buffer`             | Periodic compilation cycle    | Retrieves recent events; clears buffer.           |
| `perpetual_consciousness.js`| `gsk-core/brain/metacognition.js` | Direct Invocation | `current_state_metrics`       | Scheduled introspection       | Triggers self-assessment; potentially adjusts `attention`. |
| `scribe_bridge.js`         | `universal_tool_bridge.js`        | Invokes `tool`    | `external_directive`          | External command from SCRIBE  | Executes requested skill; returns result to SCRIBE. |
| `EventBus` (`skill_invoked`)| `nanoscale_connectome_analyzer.js`| Listen Event      | `skill_details`, `timestamp`  | Any skill invocation          | Logs invocation for detailed analysis.            |

## Mapping Considerations

*   **Instrumentation**: Requires fine-grained logging of inter-module calls and EventBus activity.
*   **Call Stack Analysis**: Tracing function calls across module boundaries.
*   **Data Provenance**: Understanding where data originates, how it's transformed, and where it's consumed.
*   **Dynamic Links**: How new "synapses" (interactions) can be formed or existing ones modified (e.g., through `Dynamic Tool Acquisition` or `self_evolution.js`).

## Challenges

*   **Scale**: The number of potential interactions is immense, akin to mapping a biological brain's trillions of synapses.
*   **Granularity vs. Utility**: Balancing the level of detail with the practicality of analysis.
*   **Runtime Overhead**: Instrumentation must not significantly impact GSK's performance or alter its behavior.

This matrix will be populated through the execution of advanced introspection tools defined in `tool_acquisition_plan.md` and processed by the `Nanoscale Connectome Analyzer` during runtime.
