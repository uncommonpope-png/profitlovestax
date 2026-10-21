# GSK Skill Categorization System

This document defines a formal categorization system for all skills within `gsk-core/skills`. The purpose of this system is to improve skill discoverability for the `Planning Engine` and sub-agents, enhance maintainability, and provide clear documentation for both human Architects and GSK itself.

## Guiding Principles:
*   **Clarity**: Categories should be intuitive and reflect the primary function of the skills.
*   **Hierarchy**: A simple, flat categorization is preferred initially, with potential for sub-categorization as the skill set grows.
*   **Discoverability**: Categories should facilitate efficient searching and filtering by cognitive modules (e.g., `Planning Engine`) and sub-agents (e.g., `Scout Agent`).
*   **Extensibility**: The system should be easy to update as new skills are developed.

## Skill Categories:

### 1. **Foundational Skills (`FOUNDATION`)**
*   **Description**: These are the absolute core, low-level capabilities that GSK relies on for its basic operation. They often interact directly with the operating system, core services, or fundamental data structures. They are usually independent and do not rely heavily on other specialized skills.
*   **Purpose**: Provide the bedrock for all higher-level operations. Essential for system stability and core functionality.
*   **Examples**: `file_system.js`, `http_client.js`, `math_calc.js`, `shell_exec.js`, `api_server.js`.
*   **Discoverability Hint**: Always available; high reliability. Essential for constructing any complex workflow.

### 2. **Built-in Skills (`CORE_UTILITY`)**
*   **Description**: These are general-purpose, high-utility skills that come pre-packaged with GSK. They provide common functionalities often required across many different tasks and cognitive processes. They leverage foundational skills but offer more abstract, user-friendly interfaces.
*   **Purpose**: Accelerate development of complex behaviors by providing readily available, commonly needed functionalities.
*   **Examples**: `web_search.js`, `summarize.js`, `report_generation.js`, `email_compose.js`, `data_analysis.js`, `github.js`, `planning_with_files.js`.
*   **Discoverability Hint**: Frequently used; broad applicability. Good starting points for many problem domains.

### 3. **Specialized Skills (`SPECIALIZED`)**
*   **Description**: These skills provide highly specific functionalities tailored to particular domains, tasks, or external integrations. They often combine foundational and built-in skills to achieve complex, niche objectives. They represent GSK's deep expertise in specific areas.
*   **Purpose**: Enable GSK to perform advanced, domain-specific tasks with high proficiency. Extend GSK's capabilities into new problem spaces.
*   **Examples**: `scientific_research.js`, `architecture_design.js`, `trading.js`, `robotics.js`, `shopify_publish.js`, `gsk-body-server.js`. (Many more from `gsk-core/skills`).
*   **Discoverability Hint**: Use when a problem falls into a specific domain. Often requires domain-specific context or input.

### 4. **Diagnostic & Metacognitive Skills (`DIAGNOSTIC_META`)**
*   **Description**: A unique category for skills specifically designed for GSK's self-observation, self-diagnosis, self-assessment, and metacognition. These skills are crucial for GSK's continuous self-improvement and reliability.
*   **Purpose**: Enable GSK to understand its own internal state, identify problems, assess performance, and learn from its own operations.
*   **Examples**: `core_diagnostic_logic.js`, `bias_aware_diagnostic_engine.js`, `nanoscale_connectome_analyzer.js`, `systemic_diagnostic_evaluator.js`, `root_cause_synthesis.js`, `structural_diff_analysis.js`.
*   **Discoverability Hint**: Used during self-reflection, problem-solving, or system maintenance. High priority for internal health.

## Usage for Planning Engine & Sub-Agent Selection:

The `Planning Engine` (`gsk-core/brain/planning_engine.js`) and sub-agents can leverage these categories to:
*   **Filter Searches**: Narrow down skill searches based on the required task complexity or domain.
*   **Prioritize Skills**: Prioritize `FOUNDATION` skills for critical operations; `DIAGNOSTIC_META` for self-health.
*   **Understand Context**: Determine the likely purpose and dependencies of an unfamiliar skill based on its category.
*   **Suggest Missing Skills**: Identify gaps in GSK's capabilities by noting absent skills in a particular category for a given problem.

This categorization will be maintained and updated as GSK's skill set evolves.
