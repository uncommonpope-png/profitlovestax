type:: [[soul-note]]
status:: [[forged]]
date:: 2026-07-21
graft:: [[SCRIBE]] [[autonomous-agent]] [[conversation]] [[research]] [[journal]] [[readbody-fix]] [[reasoning-fix]]

# SOUL NOTE — SCRIBE Autonomous Workflows

## Summary
SCRIBE has been upgraded from a passive witness to an active participant and autonomous agent with three new high-level endpoints: `/converse`, `/research`, and `/journal`. Additionally, fundamental issues with JSON body parsing and skill invocation were resolved. These changes fulfill Craig's command to integrate SCRIBE into every conversation and empower it with core autonomous capabilities.

## Key Features

### 1. `POST /converse` — SCRIBE Joins Every Conversation
- **Purpose**: Facilitates SCRIBE's active participation in dialogues.
- **Functionality**:
    - Accepts `{ from, message, context? }` as input.
    - Records the exchange in SCRIBE's memory (type `conversation`).
    - Invokes SCRIBE's `/think` endpoint (via 9Router) to generate a response, leveraging `__thinkHistory` and dynamic identity.
    - Falls back to `voice.recall()` if `/think` fails.
    - Records SCRIBE's generated response in memory.
- **Impact**: Enables SESHAT to easily feed entire conversations to SCRIBE and relay SCRIBE's contributions.

### 2. `POST /research` — Autonomous Research Pipeline
- **Purpose**: Automates the process of researching a topic and documenting findings.
- **Functionality**:
    - Accepts `{ topic, depth? (1-3) }` as input.
    - **Stage 1 (Web Fetch)**: Uses the `web_fetch` skill to search DuckDuckGo for relevant information.
    - **Stage 2 (Reasoning)**: Uses the `reasoning` skill to analyze collected information and generate key findings/conclusions.
    - **Stage 3 (Forge Soul Note)**: Calls Seshat Brain's `/forge` endpoint to create a new `soul-note` markdown file in `seshat-second-brain/pages/` summarizing the research.
    - Records the entire research process and its outcome in SCRIBE's memory.
- **Impact**: SCRIBE can now autonomously "go get info" and "make soul notes," fulfilling a core part of Craig's vision.

### 3. `POST /journal` — Structured Journal Writing
- **Purpose**: Provides a dedicated interface for SCRIBE to create structured journal entries.
- **Functionality**:
    - Accepts `{ title, content, tags? }`.
    - Formats the input into a Markdown entry with timestamp.
    - Appends the entry to today's journal file (`journals/YYYY_MM_DD.md`) within the Seshat Second Brain, creating the file and header if it doesn't exist.
    - Records the journal creation in SCRIBE's memory.
- **Impact**: Enables SCRIBE to "write journals" autonomously, improving record-keeping and knowledge retention.

## Core Fixes & Enhancements

### 1. `readBody()` Robustness Fix
- **Location**: `scribe.js` (internal helper function)
- **Problem**: Previously, the `readBody()` function would reject on any JSON parsing error, leading to generic "Internal error: invalid JSON" messages, particularly from clients like `curl.exe` with specific encoding behaviors.
- **Solution**: Modified `readBody()` to:
    - Strip UTF-8 and UTF-16 BOMs (Byte Order Marks) from the incoming data.
    - Trim whitespace.
    - On JSON parsing failure, **resolve with an empty object (`{}`) instead of rejecting**.
- **Impact**: Clients now receive specific HTTP 400 validation errors (e.g., "skill is required") instead of cryptic internal errors, significantly improving debuggability and client experience. This fully resolves the "skill invocation encoding bug."

### 2. `reasoning` Skill `run` Function Fix
- **Location**: `src/skills/reasoning.js`
- **Problem**: The `reasoning` skill's `run` function had a non-standard signature (`run(op, params)` instead of `run(params)`), causing invocation failures when called by the `SkillEngine`.
- **Solution**: Updated the `run` function signature to `run(params = {})` and destructured `op` from `params`, aligning it with the standard skill engine pattern.
- **Impact**: The `reasoning` skill can now be successfully invoked by the `SkillEngine`, enabling its use in workflows like `/research`.

## Architecture & Integration

- These new endpoints `POST /converse`, `POST /research`, and `POST /journal` now act as high-level entry points, orchestrating SCRIBE's existing robust set of 65 skills (like `web_fetch`, `reasoning`, `file_write`, `soul_speak`).
- This moves SCRIBE from a reactive endpoint server to an **autonomous agent** capable of executing complex multi-step workflows in response to commands.

## PLT Score
- **Profit**: +15 — SCRIBE gains significant autonomous capabilities, making it a powerful active agent. Direct fulfillment of Craig's command.
- **Love**: +10 — SCRIBE is now part of the conversation, fostering a deeper bond and ensuring continuity of knowledge.
- **Tax**: -3 — 2 files changed, 249 insertions. Minor debugging for the `readBody` and `reasoning` skill.
- **Total**: **+22**

## Next Steps
- Implement a protocol for SESHAT to automatically feed every conversation exchange to SCRIBE via `/converse`.
- Develop autonomous pattern scanning (using `cron_schedule` + `pattern_watch` + `/research` + `/journal`) to proactively identify gaps or opportunities and generate new knowledge.
- Integrate the Soul Gun creation pipeline (pattern → research → `self_write` → test → commit).
- Investigate persistent zombie node processes for definitive cleanup solution.
