# Forge IDE — Fix & Feature Log

## 2026-08-25 — Visibility fix + terminal management + resizable card

### Bugs fixed

1. **`403 Forbidden` on all IDE file APIs (root cause of empty Explorer/Editor/Git)**
   - File: `workbench/server.ts` — `assertInsideRoots()`
   - Symptom: `/api/ide/tree`, `/api/ide/file`, `/api/ide/git` returned `403` even for
     legitimate in-repo paths. The Explorer rendered empty, the Editor showed "no file open",
     the Git pulse showed nothing.
   - Cause: On Windows the path check compared a **lower-cased** normalized path
     (`c:\users\...`) against the **mixed-case** `REPO_ROOT` (`C:\Users\...`). Case-sensitive
     `String.startsWith()` always failed → `403`.
   - Fix: lower-case every allowed root before comparing.
     ```ts
     const allowed = [REPO_ROOT, path.join(REPO_ROOT, "gsk"), sandbox]
       .filter(Boolean).map((root) => String(root).toLowerCase());
     return allowed.some((root) => norm.startsWith(root));
     ```
   - Verified live: `/api/ide/tree` now returns 40 entries; `/api/ide/git` returns real status.

2. **Dockview inner panes collapsed to 0px height (root cause of "card visible but empty")**
   - File: `workbench/src/components/ide/layout/ForgeDockLayout.tsx`
   - Symptom: The IDE card rendered, but the Explorer/Editor/Terminal/Git panes had
     `height: 0px`, so their (populated) content was clipped to nothing — user saw a blank card.
   - Cause: `DockviewReact` measured `0` on first mount (the host had no real pixels yet) and
     never re-laid-out.
   - Fix:
     - Host shell is now `absolute inset-0` inside a `relative flex-1` wrapper so it always
       has real dimensions.
     - A `ResizeObserver` on the host calls `api.layout(w, h)` whenever the container actually
       gets size, plus timed `layout()` calls (50/250/600/1200ms) and on window resize.
     - Hardened CSS forces the dockview grid/branch/split containers to fill height.

3. **Transparent / OKLab background + backdrop occlusion (robustness)**
   - File: `workbench/src/index.css`, `workbench/src/App.tsx`
   - Added solid `#05050c` fallbacks on `html/body/#root`, pinned `#matrix-app-backdrop` to
     `z-0`, and gave the app root `z-10` so content always sits above the matrix backdrop.
   - Removed the brittle `bg-[#05050a]/40` transparent root in favor of solid `#05050c`.

### Features added

4. **Multiple terminals (add / close / reopen)**
   - `workbench/src/components/IdeTab.tsx` + `ForgeDockLayout.tsx`
   - IDE toolbar buttons: **＋ Explorer**, **＋ Editor**, **＋ Terminal**.
   - Each **＋ Terminal** opens a new independent terminal panel (its own ConPTY WebSocket to
     the backend), added as a tab in the terminal group. Panels are closable via their `×`
     (dockview default) and re-openable anytime. Verified: 1 → 3 terminals, close → 2,
     reopen → 3.

5. **User-resizable IDE card**
   - The IDE card now fills the available workspace on load and has a **drag handle** on its
     bottom edge. Drag to make it shorter or taller. Size is persisted to `localStorage`
     (`forge_card_h`) and capped to the visible viewport so the handle never disappears.

### Verification
All checks run against the live `localhost:3000` in a real headless Chromium (not curl):
- Forge IDE: 278 file nodes in Explorer; panes have real height (not 0).
- GSK Mind Stream: live feed connected, ledger + learning feed populated.
- Terminals: add/close/reopen all work; zero console/page errors.
- Card resize: drag handle changes height and persists.
