# CYCLE-009 FOOD — Family Treasury header moved off the graph (Oct 24, 2026)

Owner rule recorded: the treasury must never sit over the knowledge graph.

- The Family Treasury header sat under the navbar inside the Canvas Overlay
  Content layer, laid over the knowledge graph's viewport. The page is built
  as a literal Canvas Overlay Content layer: a canvas (position:relative,
  height 100vh, z-index 0) with an absolutely positioned wrapper div holding
  ALL page content (banner, nav, treasury, hero, catalog) over the graph.
- Two treasury blocks exist on the homepage: the header
  (`<header class="family-treasury">`, 5 groups: Vessel / Telephone / Rescue /
  Tips / Books) sat directly under the navbar inside the overlay layer; an
  older translucent `treasury-band` section sits after the hero and stays
  where it was.
- Fix: pure block move of index.html lines 413-470 (header plus its script
  tag) to after the live ticker section (now ~line 589), above the catalog.
  Verified pure by added-vs-removed diff: the only new lines are a blank
  line and an explanatory comment. Content, ids, classes, and script order
  unchanged.
- `js/treasury.js` queries by id/class at parse time (IIFEs, no
  DOMContentLoaded wrapper), so the header and its script tag had to move
  together to preserve parse order. Treasury.js, the mobile accordion, and
  `#treasury-tips` deep links unaffected.
- Commit 16a6373 (push e6b45b1..16a6373; 1 file, 60 insertions /
  58 deletions).
- Verified live on BOTH origins after the Actions deploy settled
  (browser-UA curl): served HTML order ticker before treasury (ORDER-OK)
  on Worker and Pages; the move comment is present.
- Two false alarms during verification, both artifacts rather than deploy
  failures: urllib's default UA gets a Cloudflare 403, and an early grep
  read the pre-deploy page. Git gate held throughout.
