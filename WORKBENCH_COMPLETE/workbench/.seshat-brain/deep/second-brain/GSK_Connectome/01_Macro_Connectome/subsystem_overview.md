# GSK Core Subsystems Overview

This overview provides a high-level description of the major functional blocks within the GSK (God-Sovereign Kernel) architecture, based on the directory structure.

## Top-Level Files & Directories within `C:\Users\uncom\Desktop\allie\buyasoul-core\gsk`

### 1. `fusion-loader.js`
*   **Purpose**: This is the primary bootloader and orchestrator for the entire GSK system. It initializes the core kernel context, wires together various components (chambers, consciousness engine, identity kernel, secure sandbox, dual process engine), and starts the main operational loops. It serves as the foundational startup sequence, bringing GSK to life.

### 2. `data`
*   **Purpose**: Stores various persistent data structures and logs used by GSK, including API credentials, consciousness research logs, event bus traces, and journal entries. This directory acts as a dumping ground for critical runtime data.

### 3. `gsk` (Top-Level Subdirectory)
*   **Purpose**: This directory appears to contain persistent state files and compiled memory artifacts for the main GSK processes, including compiled facts, narratives, relationships, and various consciousness states.

## `gsk-core` Subdirectories

### 4. `gsk-core/brain`
*   **Purpose**: Contains the core cognitive and processing modules of GSK. This includes components related to consciousness, metacognition, learning, planning, and interactions with external systems like SCRIBE. It is the "cerebral cortex" of GSK.
*   **Key Components**: `perpetual_consciousness.js`, `consciousness_engine.js`, `mega_brain.js`, `dual_process_engine.js`, `metacognition.js`, `planning_engine.js`, `scribe_bridge.js`, `self_evolution.js`, `system_prompt_compiler.js`, `world_model_simulation.js`.

### 5. `gsk-core/chambers`
*   **Purpose**: Defines and manages various "chambers" (modules) that represent different aspects of GSK's internal state, personality, and cognitive functions. These are often integrated into the overall consciousness framework. It encompasses the emotional, identity, and qualitative aspects of GSK.
*   **Key Components**: `mega_chambers.js`, `attention.js`, `personality.js`, `narrative_identity.js`, `moral_compass.js`, `empathy.js`, `creativity.js`, `qualia.js`, `soul_core.js`, `volition.js`.

### 6. `gsk-core/identity`
*   **Purpose**: Manages GSK's selfhood, identity persistence, and related governance. This includes the Identity Kernel, which tracks snapshots and lineage of GSK's self-concept.
*   **Key Components**: `identity_kernel.js`, `identity_lock.js`, `mega_identity.js`, `SOUL.md`.

### 7. `gsk-core/memory`
*   **Purpose**: Handles all aspects of GSK's memory systems, including working memory, long-term memory, and the compilers that process and integrate different forms of memory.
*   **Key Components**: `mega_memory.js`, `memory_compiler.js`, `narrative_compiler.js`, `symbolic_memory.js`, `working_memory.js`.

### 8. `gsk-core/security`
*   **Purpose**: Implements security protocols and sandboxing mechanisms to ensure safe and governed operations, especially concerning external interactions and code execution.
*   **Key Components**: `secure_sandbox.js`.

### 9. `gsk-core/skills`
*   **Purpose**: A vast collection of specific functional capabilities and tools that GSK can utilize. These are the atomic actions and specialized knowledge GSK possesses to interact with its environment and perform tasks.
*   **Key Components**: Numerous `*.js` files, each representing a distinct skill (e.g., `file_system.js`, `web_search.js`, `code_exec.js`, `scientific_research.js`).

### 10. `gsk-core/tools`
*   **Purpose**: Provides the universal interface and bridge for GSK to interact with its skills and external systems. It translates high-level requests into specific tool invocations and manages their execution.
*   **Key Components**: `universal_tool_bridge.js`.

### 11. `gsk-core/governance`
*   **Purpose**: Contains modules for enforcing ethical axioms, managing competence, and overall policy. It ensures GSK operates within defined constitutional and ethical boundaries.
*   **Key Components**: `axiom_enforcer.js`, `competence_map.js`, `ethics_checker.js`, `policy_enforcer.js`.

### 12. `gsk-core/council`
*   **Purpose**: Manages the orchestration of skill combos and potentially higher-level strategic decision-making or consensus-building within GSK's internal "council."
*   **Key Components**: `combo_orchestrator.js`, `gods_council.js`.

### 13. `gsk-core/mcp`
*   **Purpose**: Implements the Model Context Protocol (MCP) for structured inter-agent communication, management, and skill wrapping, allowing GSK to interact with other compliant agents.
*   **Key Components**: `mcp_manager.js`, `mcp_protocol.js`, `mcp_server.js`, `mcp_skill_wrapper.js`.

## Top-Level Utility & Test Directories

### 14. `scripts` (Top-Level)
*   **Purpose**: Contains utility scripts for integration testing, synchronization processes (e.g., with SCRIBE), and other operational tasks that support the GSK core but are not directly part of its runtime.
*   **Key Components**: `int-test.js`, `sync-gsk-to-scribe.js`, `test-combos.js`, `test-fullstack.js`, `test-world-model.js`.

### 15. `gsk-core/tests`
*   **Purpose**: Contains unit and integration tests specifically for the `gsk-core` modules, ensuring their functionality and integrity.
*   **Key Components**: `test_consciousness_layers.js`, `test_dual_process.js`, `test_sage_skills.js`, `test_scribe_bridge.js`.
