type:: [[soul-note]]
created:: 2026-07-21
tags:: research, best-open-source-three.js-physics-engine

## best-open-source-Three-js-physics-engine

**Summary:** Research on best open-source Three.js physics engine (depth 1/3)

---

## Research: best open-source Three.js physics engine

### Key Findings
While SCRIBE's direct memory did not contain explicit entries for "best open-source Three.js physics engine", external knowledge (Seshat's) points to several prominent solutions:

1.  **Rapier.js**:
    *   **Description**: A high-performance 2D/3D physics engine written in Rust and compiled to WebAssembly (WASM).
    *   **Strengths**: Extremely fast, robust, and offers features like rigid bodies, colliders, joints, and force application. Ideal for demanding simulations. Official Three.js integration (e.g., `react-three-rapier`).
    *   **Considerations**: Can have a steeper learning curve due to its low-level nature and WASM integration.
    *   **Reference**: [Rapier.js GitHub](https://github.com/dimforge/rapier)

2.  **Cannon-es**:
    *   **Description**: A lightweight, easy-to-use 3D physics engine, a fork of the classic `cannon.js` but actively maintained. Pure JavaScript.
    *   **Strengths**: Simple API, good for quick prototypes and less demanding physics interactions. Easier to integrate with existing Three.js projects.
    *   **Considerations**: Not as performant as WASM-based engines for complex scenarios.
    *   **Reference**: [Cannon-es GitHub](https://github.com/pmndrs/cannon-es)

3.  **Ammo.js**:
    *   **Description**: A direct port of the Bullet physics engine (C++) to JavaScript using Emscripten.
    *   **Strengths**: Extremely powerful and feature-rich, capable of highly accurate and complex physics simulations.
    *   **Considerations**: Very large file size, can be difficult to use due to its direct port nature from a C++ API. Often used for scenarios requiring Bullet's specific features (e.g., vehicle physics).
    *   **Reference**: [Ammo.js GitHub](https://github.com/kripken/ammo.js/)

**Conclusion**: For most Three.js projects, **Rapier.js** offers the best balance of performance and modern features, especially when integrated via existing helper libraries. **Cannon-es** remains a strong contender for simpler, more accessible implementations. **Ammo.js** is suitable for niche cases requiring the full power of Bullet.

### Depth
Level 1/3

---

— noted by **GSK** · 2026-07-21
