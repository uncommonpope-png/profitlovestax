# SKILL — graphics-color (Correct Color: ACES Tone Mapping + sRGB Gamma)

slug:: graphics-color
phase:: build
status:: active (Base Model — verified, looks "amazing")
source:: cosmic-pyramid-library/index.html (renderer + postprocessing)
PLT:: Profit 0.9, Love 0.6, Tax 0.2

## Summary
WHEN TO USE: To make a Three.js scene's colors correct and cinematic instead of dull/washed. Archetype affinity: ARTIST (color), ARCHITECT (pipeline). Problem solved: default renderer output is linear → colors look flat/dark; Reinhard tone mapping blows highlights. ACES Filmic + a final sRGB (GammaCorrection) pass fixes both.

## Schema
- trigger: scene colors look dull or highlights blow out
- inputs: { renderer, effectComposer }
- outputs: { toneMapping: ACESFilmic, exposure, gammaPass added }

## Consequence
- **Tone mapping**: `renderer.toneMapping = THREE.ACESFilmicToneMapping` (was Reinhard). Cinematic roll-off, no clipped whites.
- **Exposure**: tuned `0.55` after IBL was added (started 1.5 → 1.0 → 0.55 to balance ambient bounce).
- **Gamma pass**: because `EffectComposer` renders through linear render targets, the final on-screen pass needs explicit linear→sRGB. Append `new ShaderPass(GammaCorrectionShader)` LAST (after vignette). Do NOT also set `renderer.outputEncoding = sRGBEncoding` (double correction → washed).
- **Import**: `three/addons/shaders/GammaCorrectionShader.js` (verified 200 on unpkg r128).

## Feedback
- Correct: rich, filmic colors; metals read true; no washed/over-bright.
- Wrong: all-white/washed = double gamma (outputEncoding + GammaCorrection both on); too dark = gamma pass missing.

## States
| State | Behavior | Visual |
|---|---|---|
| LINEAR | default, no gamma | dull/dark |
| ACES | tone map on, no gamma | better but still dark |
| SRGB | gamma pass last | correct color (BASE MODEL) |
| DOUBLE | outputEncoding + gamma | washed white |

## Gaps (mechanics not yet consequences)
- No per-material `envMapIntensity`/tone tuning; global exposure only.
- Bloom strength (0.45) and threshold (0.5) hand-tuned, not auto.

## Composition
- **graphics-ibl** (`graphics-ibl`) — IBL adds ambient; this gun's exposure compensates for it.
- **brighten-city** (`brighten-city`) — earlier global brightness pass (superseded by this).
- **CPL ASSET MAP** (`CPL ASSET MAP`) / **DOUR-BIBLE** (`DOUR-BIBLE`) — recorded in Base Model doc.
- **swap-building**, **scatter**, **clear-obstruction** — unaffected by color pipeline.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]] · Base Model: [[CPL Graphics Base Model]]
- Sibling guns: [[SKILL - graphics-ibl]] · [[SKILL - brighten-city]] · [[SKILL - swap-building]]
