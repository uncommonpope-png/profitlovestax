# SOUL-NOTE - Volumetric Clouds & Weather

## Proposal 2: Volumetric Clouds & Weather
**Goal:** Upgrade the weather system to generate true volumetric clouds, significantly enhancing atmospheric realism.

## Research Findings
- **Ray Marching:** A common technique for rendering volumetric effects by stepping through a 3D volume along a ray.
- **3D Noise Textures:** Perlin or Worley noise is often used to define cloud density and shape within the volume.
- **Light Scattering:** Mie scattering models how light interacts with cloud particles, giving them their characteristic appearance.
- **Optimization:** Volumetric rendering is computationally expensive. Techniques like sparse voxel octrees, frustum culling, and temporal reprojection are crucial for performance.
- **Resources:**
    - [NVIDIA GDC 2017 Volumetric Cloud Presentation](https://developer.nvidia.com/sites/default/files/akamai/gdc2017/GDC17_VolumetricClouds_Presented.pdf)
    - [WebGL Volumetric Clouds Demo by TheBookOfShaders](https://thebookofshaders.com/edit.php#volumetric-clouds.frag) (basic example)
    - [Real-time Volumetric Clouds by Andrew Schneider (GPU Pro 6)](https://gpupro.blogspot.com/2015/07/real-time-volumetric-clouds.html)

## Implementation Plan
1.  **3D Noise Generation:** Implement a system to generate and sample 3D noise textures (e.g., in a separate compute shader if WebGPU is available, or pre-generated textures).
2.  **Ray Marching Shader:** Develop a fragment shader that performs ray marching through the 3D noise volume.
    *   Calculate density and accumulate light scattering along each ray.
    *   Integrate Mie phase function for realistic cloud lighting.
3.  **Integration:** Modify `src/weather/system.js` to control cloud parameters (e.g., density, coverage, height) and pass them as uniforms to the volumetric cloud shader.
4.  **Performance Optimization:** Explore techniques like lower resolution rendering for distant clouds, temporal reprojection, and potentially a sparse voxel octree for more complex scenes.

## Citations
- NVIDIA Corporation. "Volumetric Clouds." GDC 2017 Presentation.
- Schneider, Andrew. "Real-time Volumetric Clouds." GPU Pro 6, 2015.
- The Book of Shaders. "Volumetric Clouds."

## Associated Soul Gun
- `soul-gun-002-volumetric-clouds.js`
