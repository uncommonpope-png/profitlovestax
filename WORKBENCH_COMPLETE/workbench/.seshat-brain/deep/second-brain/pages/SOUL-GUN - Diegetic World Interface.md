# SOUL-GUN - Diegetic World Interface

type:: [[Soul Gun]]
project:: [[Cosmic Pyramid Library]]
date:: [[2026_07_13]]
status:: [[usable]]

## Purpose

Turn browser UI panels into in-world command surfaces so the 3D world becomes the interface.

## Pattern

1. Keep a tiny outside status strip only.
2. Render UI content to `CanvasTexture` screens inside the 3D scene.
3. Assign semantic `userData` actions to screen meshes and physical buttons.
4. Route raycast clicks through `resolveInteractionTarget()`.
5. Execute existing actions from the in-world click handler.
6. Use small DOM input only when unavoidable, anchored as a bottom terminal rather than a full-screen modal.
7. Build a real in-world keyboard — physical keystrokes render onto screens; the player types in-world, never in a browser input.
8. Add a GSK Runtime screen: read-only, the user CANNOT send input, constantly streaming GSK's actual thinking/doing as proof of being.
9. Honor the Four UI Classes: Diegetic > Spatial > Meta; ban Non-Diegetic overlays in the Hub.
10. Honor the Four Commandments: Consistency, Functionality, Integration, Feedback — pitfall-check Obscurity / Intrusiveness / Over-Reliance.
11. Material honesty: a press is a handshake; state is proven by the object, not a number.
12. Less is more. If a character could not see it in-universe, neither can the camera.

## CPL Hooks

- `makeCmdScreen(w, h, action, label)`
- `makeCmdButton(label, accent, action)`
- `handleCommandCenterClick(target)`
- `resolveInteractionTarget(obj)` with `commandAction`, `commandConsole`, `agentPlug`
- `enterPyramid()` at index.html:5499 — opens the GSK Command Center
- `GSKClient` at index.html:6220 — execute / chat / memories / spawn to GSK
- `issueWorldCommand()` at index.html:7551 — drives the world via Sanctum
- `makeInWorldKeyboard()` — TO BUILD: renders a tactile key plane
- `streamGskRuntime()` — TO BUILD: read-only feed of GSK's live daemon output

## Rule

If the player needs to press it often, put it on a screen, console, terminal, socket, or physical object inside the world. Non-Diegetic overlays are forbidden. The Hub proves GSK is alive by streaming his runtime — read-only, untouchable.
