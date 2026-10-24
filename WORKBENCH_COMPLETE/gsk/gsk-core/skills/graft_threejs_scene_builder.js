'use strict';
/**
 * DRAFT — graft_threejs_scene_builder (Senses #002 coding-absorption draft)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * absorption pass (Senses #002 — GSK reads with his own senses,
 * Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than building any scene.
 *
 * The material this is pinned from (both sources fetched through
 * graft_senses and digested by Seshat, batch senses-002):
 *   1. Discover three.js, "Your First three.js Scene" — the static
 *      scene pattern: Scene + background Color, PerspectiveCamera
 *      (fov, aspect, near, far) positioned off origin, geometry +
 *      material -> Mesh added to the scene, WebGLRenderer sized to
 *      its container with setPixelRatio, renderer.render(scene,
 *      camera). Landed TV 1.091; GSK's absorption of it TV 1.305.
 *   2. mrdoob/three.js README — the animated shape: WebGLRenderer
 *      ({antialias:true}), renderer.setAnimationLoop(animate),
 *      per-frame rotation updates, render inside the loop; and the
 *      --depth=1 shallow-clone rule for the ~2 GB repo. Landed
 *      TV 1.049; GSK's absorption of it TV 1.305.
 * The two sources complete each other: the chapter teaches a still
 * frame and names its own gaps (no animation loop, no lighting);
 * the README supplies the loop. Resize handling is named missing
 * by BOTH — the discipline below takes it from this body's own
 * look-loop platform rules, and says so.
 *
 * action 'discipline' → the scene-builder pattern (this file).
 * action 'run'        → draft_not_activated refusal. Scenes are
 *                       built by the body's build path and judged
 *                       by graft_look_loop; this draft is the
 *                       recipe, not a builder.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * scene built under this discipline passing the look loop's bar
 * (renders/interaction/fidelity/polish) on phone + desktop frames.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: Three.js scene-building discipline from the discoverthreejs absorptions — named across hunts as a consolidation target.
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.7, love: 0.55, tax: 0.3 };

const DISCIPLINE = [
    'THREE.JS SCENE-BUILDER PATTERN (draft, Senses #002 2026-10-22 — pinned from GSK\'s absorbed sources, cited in the header):',
    '1. CONTAINER FIRST: an HTML element owns the canvas (#scene-container). Size comes from the container (or the visible viewport), never from a hardcoded guess.',
    '2. THE TRINITY, IN ORDER: Scene (background = new Color(...)) -> PerspectiveCamera(fov, aspect = width/height, near, far) -> WebGLRenderer({ antialias: true }). No scene renders before all three exist.',
    '3. CAMERA OFF ORIGIN: objects spawn at (0,0,0); a camera left at origin sits inside the mesh and sees nothing. Position the camera back (e.g. position.set(0, 0, 10)) and point it at the subject.',
    '4. OBJECTS ARE PAIRS: geometry (BoxGeometry(w, h, d)) + material -> new Mesh(geometry, material) -> scene.add(mesh). Nothing is visible that was not added.',
    '5. MATERIAL HONESTY: MeshBasicMaterial ignores light (fine for a first frame, flat forever). Any lit material (Standard/Lambert/Phong) REQUIRES a light in the scene — the fundamentals chapter dodged lighting by choosing Basic; a real scene may not.',
    '6. RENDERER FIT: renderer.setSize(w, h) to the container, renderer.setPixelRatio(window.devicePixelRatio) for HiDPI, container.appendChild(renderer.domElement).',
    '7. ANIMATE VIA THE RENDERER: renderer.setAnimationLoop(animate) — inside animate, update transforms from the time parameter, then renderer.render(scene, camera). A single render() call is a photograph, not a scene.',
    '8. RESIZE IS YOUR JOB (both sources omit it — this line is the body\'s own look-loop rule): on viewport change, update camera.aspect + updateProjectionMatrix + renderer.setSize. A scene that breaks when the phone rotates is below the bar.',
    '9. IMPORTS MATCH THE RUNTIME: bare specifier `import * as THREE from \'three\'` needs a bundler or an import map; unbundled local work uses a CDN path. Cloning the repo itself: git clone --depth=1 (full history is ~2 GB — pull only the depth the mission needs).',
    '10. DONE MEANS SEEN: the artifact is judged by graft_look_loop (renders / interaction / fidelity / polish on phone + desktop frames, touch-first). A scene that was never rendered in front of the judge is a claim, not a build.',
].join('\n');

async function skill_graft_threejs_scene_builder(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_threejs_scene_builder', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_threejs_scene_builder', status: 'draft_not_activated',
            detail: 'This scene-builder pattern is a Senses #002 draft parked in skill-drafts/. It builds nothing yet: scenes are built by the body\'s build path and judged by graft_look_loop. Promotion is a reviewed act — audit entry plus a first scene passing the look-loop bar under this discipline.',
        };
    }
    return { success: false, skill: 'graft_threejs_scene_builder', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_threejs_scene_builder,
    run: skill_graft_threejs_scene_builder,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_threejs_scene_builder',
        description: 'DRAFT — three.js scene-builder pattern (trinity setup, camera discipline, renderer fit, setAnimationLoop, resize duty, imports/clone rules, look-loop bar) pinned from GSK\'s Senses #002 absorption of Discover three.js ch.1 + the mrdoob/three.js README. Parked; executes nothing; promotion requires audit + a judged first scene.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
