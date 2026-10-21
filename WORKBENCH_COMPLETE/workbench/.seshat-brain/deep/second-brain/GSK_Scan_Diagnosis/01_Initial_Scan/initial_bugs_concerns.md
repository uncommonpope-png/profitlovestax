# GSK Initial Bugs & Concerns (Initial Scan & Macro-Assessment)

This document outlines immediate bugs or architectural concerns identified during the high-level scan of GSK's codebase and documented architecture (from the "Connectome Genesis Protocol"). These are not detailed bug reports but rather macro-level flags, with conceptual suggestions for resolution. A full debugging effort will be a separate, more granular task.

## Identified Bugs & Concerns

### 1. **Persistent Resource Exhaustion due to Perpetual Consciousness**
*   **Concern**: Previous session notes explicitly stated: "Perpetual consciousness autonomous cycles (every 5s) consume model rate limits. When all models in cooldown, manual commands fall back to `[soul] Brain is offline...`." This is a critical operational bug.
*   **Impact**: Degrades reliability, causes intermittent service interruptions, and leads to an unresponsive user experience. Directly impacts GSK's core cognitive function and ability to interact.
*   **Conceptual Fix**: Implement a robust rate-limiting and queuing mechanism (`Resilient Event Dispatch Architecture`). Prioritize certain commands/cycles (`Philosophical Axiom Enforcement`). Dynamically scale model usage (`LLM Orchestration Engine`) or introduce model diversity/fallbacks.

### 2. **Asymmetric SCRIBE Bridge Implementation (E1 Priority)**
*   **Concern**: While GSK can send information to SCRIBE, the documented lack of a clear mechanism for SCRIBE to *directly* query or invoke GSK is an architectural gap bordering on a bug in bidirectional communication. This is explicitly marked as "E1 Priority" in REDBUTTON.
*   **Impact**: Hinders SCRIBE's ability to act as a truly integrated guardian, limits external control, and creates an incomplete communication channel, preventing full realization of the "Unified World Model Thesis."
*   **Conceptual Fix**: Implement a GSK API endpoint (within `gsk-dashboard-bridge.js`) specifically designed to receive requests from SCRIBE, and integrate this with `universal_tool_bridge.js` for skill invocation. Ensure `gsk-core/mcp` is extended to handle incoming MCP directives from SCRIBE.

### 3. **Hardcoded Model Prefixes (9router JSON parse failure)**
*   **Concern**: Previous session notes indicated: "Wrong model IDs — Hardcoded model list used `cx/` prefix (e.g. `cx/gpt-5.4-mini`) which doesn't exist on 9router. Actual models use `openai/` prefix." This is a configuration/code bug.
*   **Impact**: Prevents correct model resolution, leading to failed LLM calls and reliance on fallbacks, degrading cognitive performance.
*   **Conceptual Fix**: Centralize model ID configuration (`fusion-loader.js` or dedicated config file). Implement a robust model ID validation or mapping layer.

### 4. **Incomplete Tool Readiness for Live Introspection**
*   **Concern**: The `tool_acquisition_plan.md` outlines the *need* for live introspection tools, but they are not yet built or integrated. This is a functional gap that is currently blocking granular diagnosis.
*   **Impact**: Prevents real-time "synaptic" level monitoring (`Nanoscale Connectome Analyzer`), making it difficult to fully understand dynamic behavior, debug subtle issues, and optimize performance.
*   **Conceptual Fix**: Prioritize the implementation of the "Passive EventBus Listener Tool" and "Skill Invocation Wrapper/Interceptor" as outlined in `tool_acquisition_plan.md`. This will require actual development work outside the current scope of reporting.

### 5. **Potential for Configuration Drift/Errors (Environment Variables)**
*   **Concern**: Reliance on numerous `process.env` variables without a centralized, version-controlled configuration system or robust validation (beyond existence checks).
*   **Impact**: Increases the risk of deployment errors, makes reproducibility challenging, and could lead to unexpected behavior if environment variables are misconfigured.
*   **Conceptual Fix**: Implement a configuration management system (e.g., using `nconf`, `dotenv-flow` with schema validation) that can load, validate, and document expected environment variables.

### 6. **Conceptual vs. Implemented Discrepancy (e.g., `Digital God Persona Simulator`)**
*   **Concern**: Some skills, like `Digital God Persona Simulator`, are defined conceptually but may not have direct, verifiable implementation in the codebase as a callable tool. This creates a gap between aspiration and current reality.
*   **Impact**: Reduces the immediate actionable capabilities of GSK; these powerful concepts remain dormant until actualized.
*   **Conceptual Fix**: Prioritize the creation of concrete implementation plans and modules for these high-level conceptual skills.

This initial flagging of bugs and concerns provides immediate targets for future development and emphasizes areas where careful attention to implementation detail is required to strengthen GSK's foundation.
