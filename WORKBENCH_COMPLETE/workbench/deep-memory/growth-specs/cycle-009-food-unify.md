# CYCLE-009 FOOD — Platform unify step 1 COMPLETE (Oct 24, 2026)

The Soul Economy's split identity is closed. Server-first profiles now resolve by
pubkey, with the local sanctuary and PR publish path kept as fallback.

- Commit e6b45b1 on master, verified live on BOTH origins (Worker origin and
  Pages mirror).
- Shared pubkey resolver, local key first, across identity-bridge.js and
  js/social/auth.js.
- Server-first `?pubkey=` profile route with a Follow button; local-sanctuary
  fallback, never a blank page.
- Publish-time `pubkey` field in the generated registry JSON.
- NIP-98 `POST /api/shelf` plus a new `shelves` table in D1; one-click migration
  of the local top-8 shelf.
- D1 shelves migration applied via dashboard 19:34 CDT Oct 24; the `/api/shelf`
  endpoint serves for real (the unavailable flag is gone).
- Shelf migration verified end to end on a throwaway test profile: write 8,
  all 8 rendered in order on the server-backed `?pubkey=` route, then cleared
  to empty; the test key was deleted, zero residue.
- Git gate held: the pre-existing data/catalog.json and data/catalog-raw.json
  modifications and test-bridge-list.cjs stayed uncommitted, as always.
- Queued next on the owner's word at the time: Following Feed toggle,
  soul-card attachments, Nostr relay sync.
- Relay note, per the standing team rule: the completion was sent to Gemini in
  the same existing Gemini chat, so the team moves as a whole.
