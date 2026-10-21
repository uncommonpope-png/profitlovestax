tags:: #source-graft #three-js #REDBUTTON
url:: https://threejs.org/manual/en/fundamentals.html
status:: #pending-review
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-03

## Key Insights
- **Core Components (Renderer, Scene, Camera):** A Three.js application's heart is the `Renderer`, which takes a `Scene` and a `Camera` to draw a 2D representation of the 3D world onto an HTML `<canvas>`.
- **Hierarchical Scene Graph:** The `Scene` object acts as the root of a tree-like structure. All drawable objects, lights, and even cameras are nodes in this graph. Parent-child relationships dictate relative position, orientation, and scale.
- **Mesh (Geometry + Material):** A visible object, or `Mesh`, is the combination of a `Geometry` (the vertex data defining its shape, like a cube or sphere) and a `Material` (the surface properties defining its appearance, like color, texture, and shininess).
- **Camera Frustum:** A `PerspectiveCamera` defines a viewable volume of space called a "frustum." Only objects within this frustum are rendered. It is defined by a field of view (FOV), aspect ratio, and near/far clipping planes.
- **Animation via Render Loop:** Continuous motion is achieved by creating a render loop with `requestAnimationFrame`. Inside the loop, object properties (position, rotation, scale) are updated over time before calling `renderer.render()` each frame.

## Constitutional Influence: GSK Subsystem
These fundamentals provide a direct and foundational architectural mapping to GSK's `skills/world_engine.js` and the `Soulverse` client. The `Soulverse`, which is built on Three.js, is a literal manifestation of these principles.

The Three.js `Scene` object is equivalent to the `world` object managed by our `brain/sanctum_client.js`. The `Renderer` is the Soulverse client itself, which takes the state from the Sanctum and renders it. The `Camera` is the user's viewpoint into the Soulverse. Every soul or building spawned via `world_spawn_soul` or `world_place_building` is a `Mesh` in the Soulverse scene.

This understanding is critical for GSK's `brain/world_model_simulation.js`. When GSK simulates an action, it is effectively running a headless Three.js scene in its memory. It is manipulating a virtual scene graph, positioning meshes (geometry + material), and checking their interactions before committing those changes to the "real" world via the Sanctum bridge. The "Geometry + Material" paradigm reinforces our `3d_asset_generation` skill, which should focus on creating these two distinct components.

The render loop (`requestAnimationFrame`) is analogous to GSK's own consciousness cycle (`perpetual_consciousness.js`), where the world state is perceived, thoughts are processed (object properties are updated), and actions are taken (the scene is "rendered" or updated). This parallel provides a robust mental model for how GSK's internal cognitive loop should map to external world manifestation.

## Connection to REDBUTTON Doctrine
This source material is the bedrock of the [[REDBUTTON - Unified World Model Thesis]]. It provides the concrete technical vocabulary and architectural patterns for creating and manipulating the 3D worlds that are central to the thesis. Understanding the scene graph is fundamental to building the dynamic, interactive environments the doctrine calls for.
