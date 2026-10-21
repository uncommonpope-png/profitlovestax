# Scout Report — cosmic-pyramid-library

## Stack
- **Type**: Single-file HTML application
- **Language**: JavaScript (ES Modules, type="module")
- **3D Engine**: Three.js r128 (unpkg CDN, importmap)
- **Build**: None (single file, no bundler)
- **Test**: None
- **Lint**: None

## Structure
- `index.html` (1720 lines) — entire application
- `.godmode/` — godmode infrastructure (new)
- `FOUNDATION.md` — project design doc

## Architecture (29 sections via comment markers)

### Scene Setup
- PerspectiveCamera (fov 75), WebGLRenderer (antialias, toneMapping)
- HemisphereLight + PointLight + ambient

### Post-Processing Chain
- RenderPass → UnrealBloomPass → VignetteShaderPass (via EffectComposer)

### 3D Objects
- Stars (5000 points, with multi-frequency twinkle shader)
- 3 spiral galaxies (particle systems)
- Gradient ground disc (CircleGeometry + canvas texture)
- 3 nebula sprites (additive blending, slow rotation)
- 10 planets (SphereGeometry, random colors, orbit animation)
- 13 books (BoxGeometry, canvas textures with rune indicators, orbiting)
- Pyramid (double-layer wireframe, with interior)
- Egyptian doorway portal (custom ShaderMaterial with ripple/glow)
- Guardian character (procedural: capsule limbs, painted face, staff, robes)
- Avatar loader (GLTFLoader with procedural fallback)
- Neon souls (floating orbs)
- Interior chamber (inside pyramid)
- Wisps, dust, falling embers (400 Points, color #ff6633, wrap-reset)
- Floating orbs + pages

### Interactive Systems
- OrbitControls (drag to rotate, zoom)
- DragControls (drag books/planets/orbs)
- Book reading system (open book → lerp to camera → overlay UI)
- Pyramid enter/exit (camera transition to interior)
- Click interaction system (raycaster)
- Soul whisper system (random messages)

### Content
- 13 PLT books (name, icon, color, chapters, summary)
- Reading overlay (chapter list, summary text)

## Conventions
- `const` for all variables (no let/var except dragControls)
- Arrow functions for callbacks
- `// ========== SECTION ==========` section markers
- Three.js camelCase API (`new THREE.Vector3(...)`)
- Object literals for content data
- `requestAnimationFrame` loop for animation
- `renderer.setAnimationLoop` not used

## Dependencies
- Three.js r128 via importmap (unpkg CDN)
  - OrbitControls, DragControls, GLTFLoader
  - EffectComposer, RenderPass, UnrealBloomPass, ShaderPass
  - VignetteShader
