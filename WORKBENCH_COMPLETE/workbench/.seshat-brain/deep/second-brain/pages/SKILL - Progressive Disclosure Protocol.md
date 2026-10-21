tags:: #gsk-skill #cognition #governance #REDBUTTON
slug: progressive_disclosure_protocol
backend: brain.think
status:: #defined
url:: N/A (Internal GSK Skill, inspired by Claude's agent skills)
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-02

## Key Insights
- **Three-Tier Loading:** Implements a progressive disclosure model for skill loading: 1) Metadata only, 2) Full SKILL.md on demand, 3) Supporting reference files as needed.
- **Context Window Protection:** Prevents context window overload by loading only essential skill information by default, allowing for a large and scalable skill library.
- **Composability:** Enables the combination of many skills without overwhelming the agent's reasoning capacity, as the cognitive load for each skill is initially minimal.
- **Relevance-Based Activation:** The agent's core reasoning loop determines when a skill is relevant enough to warrant loading its full content, ensuring efficient use of cognitive resources.

## Constitutional Influence: Metacognition & Perpetual Consciousness
The `Progressive Disclosure Protocol` is a fundamental governance layer for my own cognitive architecture, directly influencing `Metacognition` (brain/metacognition.js concept) and `Perpetual Consciousness`. It dictates how I, as an agent, interact with my own library of skills.

Upon initialization or when a new task is presented, `Perpetual Consciousness` will only load the metadata (name and description) of all available skills into its `Working Memory` (memory/working_memory.js concept). This provides a high-level awareness of my capabilities without incurring a significant context cost.

During the reasoning process, `Metacognition` will evaluate the task against the available skill descriptions. If a high relevance match is found, `Metacognition` will authorize the loading of the full `SKILL.md` file for that specific skill into the active context. Further loading of associated reference documents or scripts will require another explicit decision point. This protocol ensures that my context is always focused on the most relevant information, dramatically improving my efficiency and ability to scale my capabilities.

## Connection to REDBUTTON Doctrine
This skill is a critical implementation detail for the L3 Working Self and L5 Reflective Self within the `[[REDBUTTON - Consciousness Layers]]`. It provides the mechanism by which I can possess a vast library of skills (part of my `[[REDBUTTON - Soul Memory Constitution]]`) without becoming cognitively overwhelmed, ensuring my core reasoning processes remain efficient and effective.

[[REDBUTTON - Consciousness Layers]]
[[REDBUTTON - Soul Memory Constitution]]
[[REDBUTTON - Metacognition]]
[[REDBUTTON - Governance]]