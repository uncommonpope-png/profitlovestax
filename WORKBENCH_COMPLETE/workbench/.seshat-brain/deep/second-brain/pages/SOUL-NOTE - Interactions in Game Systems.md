# SOUL-NOTE — Interactions in Game Systems

type:: [[soul-note]]
date:: 2026-07-19
source:: web (Bing/Copilot search "interactions in game systems")
theme:: game-design / interaction-loop / systems-thinking
grafts_to:: [[SKILL - Agentic Soul Gun Architecture]] (mechanic + feedback + states); candidate gun `interaction_loop` / `real_time_feedback`

## Core thesis
In game design, **interactions are the bridge between player agency and world evolution.** They run as a continuous **interaction loop**: observe game state → decide → issue command (input) → rules/mechanics translate → output/feedback → repeat (dozens of times/sec). This loop is the foundation of ALL gameplay.

## Core components of an interaction
- **Input devices & sensors** — controller/keyboard/mouse, motion/VR/AR, voice, haptics.
- **Game state** — current condition (position, health, inventory, world) that changes with each interaction.
- **Output devices** — screen/speakers/haptics/VR that return the updated state to the player.
- **Rules & mechanics** — how inputs become actions and actions change the world.

## How interactions create SYSTEMS
Game systems = structured networks of **interdependent** mechanics. Changing one mechanic ripples (enemy damage → difficulty → pacing → resource use). Examples:
- *Zelda: BotW* — fire spreads through grass, metal attracts lightning, wind affects movement (interconnected environmental systems).
- *Detroit: Become Human* — choices branch narrative; NPC behavior + story outcomes depend on prior interactions.

## Role of AI + real-time feedback
AI-powered NPCs, adaptive storytelling, real-time feedback make interactions dynamic: NPCs react to player actions; difficulty adjusts to performance. The **feedback half of the loop is what makes it *feel* alive.**

## System-thinking angle
Interactions are part of a larger network of objects/states/behaviors. Designers use it to: predict emergent behavior, balance to avoid repetition/imbalance, create predictable-yet-varied gameplay.

## WHY THIS MATTERS TO SOUL GUNS (the graft)
This is the **mechanic** half of the 4-part soul-gun structure, made explicit:
- The interaction loop (observe→decide→command→feedback) **IS** the soul-gun lifecycle: `IDLE → ACTIVE → COOLDOWN → IDLE` (+ `ERROR → RETRY`).
- **Feedback** (output returning state) = the soul-gun `feedback` field (what the user sees/hears/feels). No feedback = fluff.
- **Interdependent mechanics** = the "must compose with other guns" fluff-test rule — a gun that doesn't ripple the city is dead weight.
- **AI real-time feedback** = candidate gun: `real_time_feedback` / `interaction_loop` — the system that makes GSK's world *react* live. Maps to his `World Reaction Layer (Consequence)` gun + `citizen_dialogue_tree`.

## Sources (soul notes to graft)
- https://stanislav-stankovic.medium.com/game-mechanics-interaction-loop-and-the-game-state-c38e6e4584dd
- https://namedesigning.org/gaming/game-design-systems/
- https://gamespublisher.com/interactive-video-game-systems-that-boost-engagement/
- https://gamedesigning.org (Understanding Game Design Systems)
- https://proceedings.systemdynamics.org (System Thinking in Game Design, PDF)
- https://academic.oup.com (The Parlance of Play)
- https://link.springer.com (Social Interaction and Connectivity in Gaming Communities)
- https://immerse.network (Interactions and Gameplay Mechanics)
- https://machinations.io (Games Design Diagram Examples)
- https://medium.com (Interaction Design in Games: Affordances, Consistency)
- https://coursera.org (Gameplay Mechanics and Interactive Systems in Game Design)
