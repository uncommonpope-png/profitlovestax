# SOUL-NOTE - Physically-Based Sky & Atmosphere

## Proposal 1: Physically-Based Sky & Atmosphere
**Goal:** Implement a physically-based sky shader (e.g., Nishita or Preetham model) for realistic time-of-day transitions.

## Research Findings
- **Rayleigh Scattering:** Causes the blue color of the sky.
- **Mie Scattering:** Causes the white haze around the sun.
- **Resources:**
    - [Three.js Sky Shader Example](https://threejs.org/examples/#webgl_shaders_sky)
    - [GPU Gems: Atmospheric Scattering](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering)
    - Nishita Atmosphere model is the standard for high-fidelity sky simulation in games.

## Implementation Plan
1. **Shader:** Create `src/graphics/sky-shader.js` using TSL (Three.js Shading Language) or GLSL if TSL is not yet fully migrated.
2. **Integration:** Update `src/world/time-of-day.js` to feed the current sun direction and atmosphere parameters into the shader.
3. **Pipeline:** Ensure the shader is integrated into the Three.js scene's background or as a full-screen quad.

## Citations
- Three.js Documentation (Shaders)
- Nishita Atmospheric Scattering Model Research Papers

## Associated Soul Gun
- `soul-gun-001-sky-shader.js`
