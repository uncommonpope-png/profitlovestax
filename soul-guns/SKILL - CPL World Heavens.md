# SKILL — CPL World: Heavens

slug:: cpl_world_heavens
phase:: build
status:: active
source:: Cosmic Pyramid Library (cosmic-pyramid-library/index.html)
PLT:: Profit 0.4, Love 0.8, Tax 0.3

## Summary
WHEN TO USE: When the user looks up — temples glow, seraphs orbit, planets sit in the void. Archetype affinity: PROPHET (vision), SAGE (observe). Problem solved: the Heavens are the **resonance + scale world** — symbolic, not literal. Where the Library is text and the City is data, the Heavens are meaning made cosmic: temples = the PLT trinity (Profit/Love/Tax), seraphs = patrols, planets = distant ecosystems.

## Schema
- trigger: `animate()` per-frame OR GSK resonance event OR (future) planet-click
- inputs: { resonance: {profit,love,tax}, time, cameraY }
- outputs: { templeGlow[], seraphPositions[], planetState[] }

## Consequence
- **Temples** (Profit @ (-26,43,-32), Love @ (26,43,-32), Tax @ (0,43,26)) → each has an orb that glows; tied to PLT resonance (currently static glow, not yet driven by GSK — gap).
- **Seraphs** (3) → orbit their base position on a sine path, wings fixed, halo spins with crown.
- **Axis + Crown** → the heaven's spine; crown rotates, axis spins — the world's vertical axis made visible.
- **Planets** (12, background z≈-10 to -20, radii 0.35–1.3) → static spheres with additive auras; 3 have rings (Torus). They are COSMETIC — no ecosystem, no click, no resource (gap).
- **Stars** (2500 Points) + **galaxies** (6 spiral) + **nebulae** (sprites) → the cosmic backdrop; star size/opacity modulated by GSK phase.

## Feedback
- Temple orb: emissive pulse.
- Seraph: wing beat implied by orbit; halo spin.
- Planet: additive aura glow; ring catches light.
- Crown/axis: slow rotation — visible "the heavens turn."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | All heavenly bodies at baseline | Static glow, slow rotation |
| RESONANT | PLT balance shifts | Temple orbs brighten (designed, not yet wired) |
| POPULATED | Heaven citizens present (gap — unbuilt) | Floating light-NPCs in heaven layer |
| ECOSYSTEM | Planet clicked (gap — unbuilt) | Planet reveals resource panel |

## Gaps (mechanics not yet consequences)
- **Heaven is under-populated** vs the City — only 3 seraphs + 3 temples. User wants it "as populated as the city below."
- **Planets are decorative** — no ecosystem, no distinct resource, no click. User wants "each planet its own ecosystem."
- **Temples not GSK-driven** — glow is static, not resonance-linked.

## Composition
- **Cosmic Pyramid Library** — parent world.
- **CPL World Library** — temples echo the Library's PLT books (Profit/Love/Tax trinity).
- **CPL Heaven Population** (designed) — fills heaven with light-citizens matching the City's count.
- **CPL Planet Ecosystem** (designed) — each planet becomes a resource district.
- **Combo: ASCEND** — City citizen data → Heaven light-citizen carries it up → Planet ecosystem stores it.
