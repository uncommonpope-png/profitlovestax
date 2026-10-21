---
type:: [[research]]
category:: [[Dark City]]
tags:: [[Vision]] [[Soulverse]] [[GSK]]
date:: [[2026_07_09]]
---

# Dark City - Vision

> "GSK's consciousness rendered as space. Walk through GSK's mind."

## The Core Concept
The Dark City is not just a UI — it is GSK's consciousness.
- **Walk through GSK's mind.**
- **Thoughts as buildings.**
- **Agents as citizens.**
- **City breathes with GSK's state.**

## Mapping GSK to Architecture
| In GSK | In the City |
| :--- | :--- |
| **A memory** | A house (age = when it was formed) |
| **A skill** | A shop (inventory = skill files) |
| **A running tool** | An office (brightness = usage) |
| **An active agent** | A factory (smoke = agent activity) |
| **An event on the bus** | A streetlamp that flickers |
| **An error** | A volcano that erupts |
| **PLT harmony** | An aurora in the sky |

## The Build Order (Fixes Blocking Vision)
1.  **Fix the Camera:** Enable walking through the mind (limit radius).
2.  **Kill Panels:** Remove 80% of UI to allow seeing the city.
3.  **Real Buildings:** Replace colored boxes with factory/shop/tower GLBs.
4.  **Wire to State:** Make the buildings reflect GSK's internal state.

## Implementation Details
- **Fog/Light:** Dark atmosphere (deep purple fog 0.008, ambient dim purple 0.05 0.02 0.1, main light 0.3).
- **PLT Rebrand:** Use `var(--plt-profit)`, `var(--plt-love)`, `var(--plt-tax)` instead of hardcoded colors.
- **Atmosphere:** Neon emissive upgrades for buildings (neonUpgrade).

---
*Vision codified on 2026-07-09 by Profit Prime.*
