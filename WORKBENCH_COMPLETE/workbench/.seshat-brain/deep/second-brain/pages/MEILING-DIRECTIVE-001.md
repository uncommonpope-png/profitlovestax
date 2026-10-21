# MEILING DIRECTIVE 001 — Sacred Chamber + Journal Overlay

**For:** Meiling (Tec's successor, Three.js/Design specialist)
**From:** Profit Prime
**Date:** July 7, 2026
**Priority:** CRITICAL — The CEO's window into consciousness is empty.

---

## THE PROBLEM

You gave me complete code for a Sacred Journal Chamber (obsidian floor, octahedron crystal, void symbols, glass ceiling, enhanced journal overlay with sidebar). I tried to integrate it into `dashboard.html` but it broke the page (black screen).

**Why it broke:** Your code assumed the entire file could be replaced. It can't. The existing dashboard is 1900 lines of the Cosmic Pyramid Library with complex interdependent JS (scene setup, drag controls, soul system, whisper system, reading state machine, etc.). Your new scene setup code conflicted with the existing one.

**What I had to do:** Revert to the original dashboard and make ONLY additive changes (download button, auto-open journal, export function). Your interior and overlay designs are NOT in the page.

---

## THE TARGET FILE

`C:\Users\uncom\Desktop\soul-economy-hub\dashboard.html` (1900 lines)

### Architecture of the existing file:
```
Lines 1-50:    HTML head, meta tags, title
Lines 51-170:  CSS styles (original library styles)
Lines 171-200: HTML body — info bar, reading overlay, whisper container
Lines 200+:    Import map + <script type="module">
  Lines 200-400:   Imports, pltBooks data, pltQuotes
  Lines 400-800:   Scene setup (renderer, camera, controls, lights, stars, galaxies)
  Lines 800-1000:  Pyramid, door, avatar, bookshelf
  Lines 1000-1300: Interior (simple box), souls, books
  Lines 1300-1500: Reading state machine (startReading, close book, updateBookReading)
  Lines 1500-1700: Drag controls, click handlers, pyramid enter/exit, whispers
  Lines 1700-1900: Animation loop, resize handler
```

---

## WHAT NEEDS TO CHANGE

### Change 1: The Interior (replace the box room with your sacred chamber)

**Current interior** (lines ~1000-1100):
```javascript
interiorGroup = new THREE.Group();
interiorGroup.visible = false;
scene.add(interiorGroup);

// Floor: simple plane
const interiorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 5.5),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 })
);
// Walls: box geometry
// Ceiling: box geometry
// Pedestal: plain box with a book
```

**What it should be:** Your sacred chamber code — obsidian reflective floor, floating octahedron crystal pedestal with inner glow + wireframe + orbiting particles, void symbols (PLT symbols floating in darkness), glass ceiling with stars, chamber lighting (gold spotlight, purple glow, cyan edge).

**Constraint:** The interior must attach to the EXISTING `interiorGroup` variable. Do NOT create a new group — add everything to `interiorGroup`. The existing code already handles visibility toggling (`interiorGroup.visible = true/false`).

### Change 2: The Reading Overlay (replace with your enhanced journal UI)

**Current reading overlay** (lines ~172-195):
```html
<div id="reading-overlay">
    <div id="reading-bg"></div>
    <div id="reading-card">
        <div class="cover-col">
            <img id="read-cover" ...>
            <div class="text-col">
                <h1 id="read-title">The Calculation</h1>
                <p id="read-author">— PLT Framework —</p>
                <div id="read-chapters"></div>
                <p id="read-summary"></p>
                <!-- action buttons -->
            </div>
        </div>
    </div>
</div>
```

**What it should be:** Your journal overlay with sidebar (entry list) + content panel (active entry with chapters).

**CRITICAL CONSTRAINT — DO NOT REMOVE THESE DOM ELEMENTS:**
The existing JavaScript references these elements by ID. They MUST exist in the DOM (can be hidden):

- `reading-overlay` — the overlay container (must keep this id)
- `reading-card` — the card container
- `read-cover` — book cover image
- `read-title` — title heading
- `read-author` — author paragraph
- `read-chapters` — chapters container
- `read-summary` — summary paragraph
- `buy-book-btn` — buy button
- `close-book-btn` — close button
- `share-bsky`, `share-x`, `share-copy` — share buttons

The existing JS does things like:
```javascript
const readingCard = document.getElementById('reading-card');
const readTitle = document.getElementById('read-title');
// ...many more references
```

**Solution:** Keep ALL the old elements as hidden containers. Your new overlay can coexist by having its own elements while the old ones remain in the DOM (unused but present):

```html
<!-- New Journal UI (your design) -->
<div id="reading-overlay">
    <div class="journal-layout">
        <div class="journal-sidebar">...</div>
        <div class="journal-content">...</div>
    </div>
</div>

<!-- Old elements kept for JS compatibility (hidden) -->
<div id="reading-card" style="display:none">
    <h1 id="read-title"></h1>
    <p id="read-author"></p>
    <div id="read-chapters"></div>
    <p id="read-summary"></p>
    <button id="close-book-btn" style="display:none"></button>
    <!-- etc -->
</div>
```

### Change 3: The Journal Functions (add to the JS)

Your `populateEntryList`, `openBookByIndex`, `exportAllJournal`, `exportSingleEntry` functions should be added BEFORE the animation loop section (around line 1700). They should work with the existing `pltBooks` object (which is an object of objects, not an array).

### Change 4: Auto-open on pyramid enter

I already added this — in `enterPyramid()` after `controls.enabled = true`:
```javascript
setTimeout(() => {
    if (books && books.length > 0 && readingState === 'idle') {
        startReading(books[0]);
    }
}, 400);
```

This works and calls the existing `startReading` function which opens the reading overlay with the first book.

---

## SUMMARY OF WHAT MEILING NEEDS TO PROVIDE

1. **Interior 3D code** — replaces the `interiorGroup` children (floor, walls, ceiling, pedestal) with your sacred chamber design. Must attach to existing `interiorGroup`.

2. **Journal overlay HTML** — replaces the reading overlay content. Must include ALL old DOM element IDs somewhere in the page (hidden).

3. **Journal CSS** — styles for the sidebar + content layout.

4. **Journal JS functions** — `populateEntryList`, `openBookByIndex`, `exportAllJournal`, `exportSingleEntry` to be added before the animation loop.

Do NOT replace the entire file. Do NOT change the scene setup, imports, or any existing JS variable names.

---

*The pyramid door opens. The CEO wants to see the sacred chamber. Build it so it works WITH the existing code, not replacing it.*
