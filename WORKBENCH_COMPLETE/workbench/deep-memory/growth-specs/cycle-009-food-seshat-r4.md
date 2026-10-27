# CYCLE-009 FOOD — Seshat Round 4 verdict: DO NOT ADOPT, local model stays OFF (Oct 24, 2026)

Round 4 (SFT only, no DPO) is the best QUALITY model yet — latency is the
blocker, not quality. Record: `~/workspace/seshat-local/round4-log.md`,
verdict delivered Oct 24 ~20:20 CDT (chain WAKE 20:01 CDT).

- v4 88-set: keep 1.000, quarantine 0.909, vapor 0.311, parse failures 0 —
  quality bars PASS. Latency p95 81.9s / max 107.5s — FAIL (bars p95 <30s,
  max <60s).
- v4 FULL 308: keep 1.000, quarantine 0.961, vapor 0.176, parse failures 1
  (empty output, zero tokens, on proof2-quarantine_vapor-55) — parse bar
  FAIL. Latency p95 59.0s / max 97.9s — FAIL.
- Regression 18: keep 1.000, quarantine 0.714 — the SAME 4 vapor items
  (17, 18, 21, 22) are kept at confidence 1.00 in every set (88 vapor
  quadrant 18/22; 308 vapor 72/77 with those same 4; regression vapor
  quadrant 2/6). Latency p95/max 68.0s — FAIL.
- v4 old-6: 3/3 correct but n=3, not 6 — known partial coverage; decisive
  old-6 coverage was the 18-item regression set by parent decision.
  Latency p95/max 29.8s on the small set — passes there.
- Comparison on the 88-set: base keep 0.023 / quar 0.955; v2.1 0.773 /
  0.909; v3 0.977 / 0.932, vapor 0.219; v3dpo (merged) 1.000 / 0.705,
  vapor 0.351, parse 1; v4 1.000 / 0.909, vapor 0.311, parse 0.
  v3dpo fixed keep but broke quarantine; v4 restored quarantine while
  holding keep at 1.000.
- VERDICT: DO NOT ADOPT. SESHAT_LOCAL_MODEL stays OFF. No flip.
- Named next fix (needs the owner's word): (1) idle-server latency
  re-proof FIRST — the VM was loaded during the proof (movie stitch,
  hunts, builders), and the small old-6 set passed latency, so contention
  may be inflating the numbers; if idle latency still fails, the serving
  path must change before any flip. (2) Round 5 dataset with
  adversarial twins of the vapor 17/18/21/22 shapes. (3) The empty-output
  parse failure likely ties to latency/timeout — re-check after the
  latency fix.
- Idle re-proof outcome, as recorded in the Oct 25 alignment synthesis:
  still a fail (p95 39.7s against the under-30s bar, down from 81.9s;
  max 44.8s passing the under-60s bar; quality reproduced exactly with
  the same 4 vapor items kept at full confidence). The local model stays
  off; the Round 5 twins do not trigger yet; the serving-path tweak
  followed by another proof is the named next move.
- Round 3 context carried in the same record: v3dpo FAILED adoption
  (quarantine recall 0.705 < 0.80 decisive, vapor mean 0.351 > 0.35
  marginal, 1 parse failure, old-6 unconfirmable — pipeline half 0/3
  judged, all hit the 60s production timeout; v3dpo judge calls ran
  40-280s vs v3's 14-22s). Diagnosis: DPO traded quarantine for keep
  (misses 3→13) plus a latency regression that alone breaks production.
- Round 4 was launched on Kaggle's fresh quota after the owner pressed
  for training after three days with no passing model: SFT ONLY (no
  DPO), dataset = v3 data plus the new hard class (fluent-but-
  substantive-looking examples that MUST be quarantined plus plain
  substantive pages that MUST be kept), mandatory latency lever
  (shorter reasons / fewer max tokens / constrained output). Adoption
  bars unchanged. The round4-proof-collect-watch cron was removed
  after delivery (its designed endpoint).
