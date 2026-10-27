# CYCLE-009 FOOD — Following Feed toggle + soul-card attachments BUILT AND DEPLOYED (Oct 24, 2026)

Both platform specs built as one clean build, pushed, and verified live.

- Commit 97fb5e9 on master (push 16a6373..97fb5e9; 3 files: square.html,
  js/social/app.js, js/social/feed.js; 503 insertions, 25 deletions).
  index.html untouched; the treasury move undisturbed.
- Following tab three honest states: logged-out viewers get a Connect prompt
  via the existing sign-in path and the tab never calls the API (no more
  silently coerced global feed); connected with 0 follows gets a
  follow-someone empty state with a Browse button reusing the All tab
  handler; connected with follows gets the server feed (already correct),
  follows cached to `sqFollows`.
- Scope persistence: localStorage `sqScope` plus `?scope=` URL parameter,
  URL wins, active tab restored before first load.
- Relay fallback filters by cached follows (authors list, labeled
  "Following (offline)") or shows the honest offline note — never
  relay-global under the Following label.
- Soul chip becomes a rich catalog card (title, author, PLT, download,
  `?soul=` filter); composer gains an "Attach a soul" picker; one
  attachment enforced; unknown slug falls back to a plain chip.
- Testing: ESM `node --check` clean on both JS files; harness on functions
  extracted verbatim from feed.js 40/40 PASS.
- Live verification on BOTH origins after deploy wait: square.html picker
  markers x2, app.js scope markers x4, feed.js Following/card markers x8 —
  identical counts on Worker and Pages mirror. Parent re-verified
  independently: HEAD 97fb5e9, "Attach a soul" marker serving on both
  origins, sqScope x4 in app.js on both, feed.js byte-identical sizes
  on both.
- Hard constraints held: NO Worker changes (api/src/index.js frozen, no
  migration); index.html frozen; only its own files staged (never
  data/catalog.json or data/catalog-raw.json or test-bridge-list.cjs);
  no test posts, test follows, payments, or spending.
- Tab badge skipped by design (needs a profile fetch per Square load;
  spec-allowed).
