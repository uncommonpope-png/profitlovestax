# SOUL-NOTE - Real-time Global Illumination (SSGI)

## Proposal 3: Real-time Global Illumination (GI)
**Goal:** Introduce Screen Space Global Illumination (SSGI) to enhance lighting realism by simulating indirect light bounces within the screen space.

## Research Findings
- **SSGI Technique:** SSGI works by calculating indirect lighting based on information currently visible on the screen. It's much cheaper than full path tracing.
- **Implementation:** Typically involves a shader that samples the scene's color and normal buffers to estimate indirect light contributions.
- **Challenges:** SSGI struggles with objects not visible on screen (off-screen light sources) and requires careful handling of noisy results.
- **Resources:**
    - [Three.js SSGI Post-processing Example](https://github.com/mrdoob/three.js/blob/master/examples/jsm/postprocessing/SSGI.js)
    - [NVIDIA GDC Presentation on SSGI](https://developer.nvidia.com/sites/default/files/akamai/gdc2017/GDC17_SSGI.pdf)

## Implementation Plan
1. **Pipeline Integration:** Integrate the SSGI pass into the existing post-processing chain in `src/graphics/aaa-pipeline.js`.
2. **Buffer Setup:** Ensure the scene exports normal, depth, and color buffers required by the SSGI pass.
3. **Parameter Tuning:** Define a set of default parameters for the SSGI effect (sample count, intensity, etc.) that can be adjusted via the UI or `src/world/time-of-day.js`.

## Citations
- mrdoob. "SSGI Post-processing." Three.js GitHub.
- NVIDIA Corporation. "Screen Space Global Illumination." GDC 2017.

## Associated Soul Gun
- `soul-gun-003-ssgi.js`
