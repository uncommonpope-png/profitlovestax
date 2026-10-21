# RESEARCH — CPL Delivery & Caching

**type:: [[research]]**
**author:: Dour**
**date:: 2026-07-10**
**links:: [[DOUR-BIBLE]] [[RESEARCH - CPL perf]] [[RESEARCH - CPL tooling pipeline]]**

---

## Question
How to shrink the NETWORK cost of getting the world to the browser, beyond just compressing bytes.

## Service Worker — repeat visits near-instant (verified prior art)
- SW sits between page and network; per-request choose cache / network / both.
- **Cache-first** for immutable assets (GLBs, textures, JS): serve from device, zero network latency.
- **Stale-while-revalidate** for HTML/JS that may update.
- **Precache** the app shell (index.html, three modules, small GLBs) at install.
- Real-world: LCP/FCP/TTFB drop 40–60% on **repeat visits**.
- **Caveat:** SW does NOT control the first visit — only after navigation/return or `clients.claim()`.
  So SW is a *repeat-visit* win; the *first visit* still needs compression ([[RESEARCH - CPL perf]]).
- GLTFLoader uses XHR (needs progress); caching GLBs via SW works through the fetch event, but
  loader-internal sub-resources (.bin/textures) need `LoadingManager.setURLModifier` + blob URLs,
  or a `CachingGLTFLoader` pattern (model-viewer caches parsed glTF in a Map + `gltf.dispose()`).

## CDN + SW stack (complementary, not competing)
- CDN (GitHub Pages edge) speeds FIRST visit (low latency). SW makes REPEAT visits instant. Use both.

## Resource hints (first visit)
- `<link rel="modulepreload">` for three + addons so the module graph fetches in parallel, not waterfall.
- `<link rel="preload" as="fetch" href="assets/world/world.opt.glb" crossorigin>` for the critical GLB.
- `fetch()` + `loader.parse(arrayBuffer)` instead of `loader.load(url)` gives byte-accurate progress
  and lets us drive a real progress bar (vs LoadingManager's file-count progress).

## GitHub Pages specifics
- Serves raw GLBs; gzip helps HTML/JS but NOT binary GLB (already compressed-ish). Brotli for text only.
- Long cache headers on hashed/immutable asset filenames → browser HTTP cache already helps repeat visits
  (SW is the stronger layer on top).

## Proposed actions (BUILD)
- Add a hand-written `service-worker.js` (cache-first for `/assets/**`, stale-while-revalidate for `/`).
- `clients.claim()` + `skipWaiting()` so it controls ASAP.
- `modulepreload` three + addons; `preload` the critical GLB.
- Switch heavy loads to `fetch → parse(ArrayBuffer)` for true progress.

**License (Pope directive):** all our assets are open source, not for resale.
