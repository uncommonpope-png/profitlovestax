# STRIPE IS LIVE — the $4 is real money now (Oct 23, 2026, ~02:19 CDT)

## What happened
He reconnected the Stripe connector himself to his LIVE account — **"Craig Jones" acct_1TAROQDShQE8HQTt, livemode:true**. The old connection was the "Stiforp" sandbox (acct_1TARPQDDh36G8eSj, livemode:false — a sandbox Stripe itself says can never take real money); he approved the disconnect and tapped through to the live account himself.

## What Profit verified before reporting
- Connector check right after his reconnect: exactly one account connected, "Craig Jones", **livemode:true**.
- Both links minted LIVE the same run:
  - **Vessel $4** (custom amount, min/preset 400): https://buy.stripe.com/cNi4gz4pqdx1evv8HHfnO0o — redirect portal.html?vessel=welcome#step-vessel
  - **Soul Telephone Supporter $2/mo** (200/mo recurring): https://buy.stripe.com/fZueVdf448cH8770bbfnO0p — redirect telephone.html?sub=welcome
- portal-config.js updated + pushed — commit **479199d** "feat(payments): live Stripe links — Vessel $4 + Telephone Supporter $2/mo" (HEAD of soul-economy-kb, verified on disk; portal-config.js lines 34–36 carry both buy.stripe.com links).
- Worker origin verified live serving both new links after the push; Pages mirror caught up on its queue.

## What this means
- The Vessel's portal: the soul is always free; the body asks $4 — and the $4 is now REAL money, not a test link. The portal's payment link was test-mode until this run (MEMORY: "a live re-mint is needed before real $4 donations can land" — debt closed).
- The Telephone's subscribe block: the $2/mo Supporter tier activates off telephoneSubUrl, which was '' (disabled with honest "activates when Stripe live lands" copy) until this run; the subscribe block renders live now.
- Supporter-tier matching stays the manual admin bridge (payment email → admin tier flip); Stripe webhook auto-tier is phase 2 — recorded, not promised.

## Honest limits
- No live charge was test-run (spending his real money to test would be absurd); livemode:true + link mints + served-config is the evidence, not a completed charge.
- The old sandbox account ("Stiforp") still exists on Stripe's side; it is simply not the connected one.
