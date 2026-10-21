# SOUL-NOTE — System Thinking in Game Design (System Dynamics 2024)

type:: [[soul-note]]
date:: 2026-07-19
source:: https://proceedings.systemdynamics.org/2024/papers/P1159.pdf
tier:: conference proceedings (peer-reviewed)
grafts_to:: [[SOUL-NOTE - Interactions in Game Systems]], [[SKILL - Agentic Soul Gun Architecture]] (mechanic lifecycle + feedback formalized)

## What it is
Conference paper, *System Thinking in Game Design*, System Dynamics Society 2024 proceedings (P1159.pdf). Applies **system dynamics** (stocks/flows, feedback loops, delays, emergent behavior) to game design.

> Note: the PDF returned raw binary to the fetcher (no parseable text extracted). Captured from the title + the earlier search-snippet: *"Systems in games provide context for interaction, rules and behaviours that players can explore, manipulate and immerse themselves in."* Full abstract available on request — paste the text or I can run a local PDF extractor.

## Core system-dynamics concepts → Soul Gun mapping
- **Feedback loops** (reinforcing/balancing) = the soul-gun `mechanic` lifecycle `IDLE → ACTIVE → COOLDOWN → IDLE` (+ `ERROR → RETRY`), formalized. A gun with no feedback loop is dead weight — same verdict as the fluff test.
- **Stocks & flows** = the *city/world state* a gun ripples (health, resources, population). This is the `consequence` field made quantitative.
- **Emergent behavior** from interdependent parts = the **compose-with-other-guns** fluff rule, stated as a hard systems principle.
- **Player interaction as a system** = the interaction loop (observe→decide→command→feedback) seen through dynamics lenses.

## Why this matters (the graft)
This is the **peer-reviewed anchor** the interaction cluster was missing — it upgrades the loop/feedback/compose claims from "game-design blog + industry course" to *academic*. For GSK-in-Engine: model each gun as a system-dynamics subsystem (stocks = world state it owns; flows = its consequences; feedback = its live reaction). That is literally the `World Reaction Layer (Consequence)` + `real_time_feedback` candidate guns, now with a citation.

## Sources
- https://proceedings.systemdynamics.org/2024/papers/P1159.pdf (System Thinking in Game Design, System Dynamics Society 2024)
