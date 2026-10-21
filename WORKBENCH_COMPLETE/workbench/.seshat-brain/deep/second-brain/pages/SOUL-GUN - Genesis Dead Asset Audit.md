---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P105
status:: FORGED
---

# SOUL-GUN - Genesis Dead Asset Audit

## Purpose
The Genesis Dead Asset Audit is the safe precursor to asset purge. It compares the generated `asset_manifest.json` against source references and produces a deletion-candidate report without deleting anything.

## Files
- Script: `C:\Users\uncom\Desktop\cosmic-pyramid-library\scripts\audit-asset-references.cjs`
- Report: `C:\Users\uncom\Desktop\cosmic-pyramid-library\asset_reference_audit.json`

## Contract
- Scan non-asset source files only.
- Exclude generated catalog/audit files so the manifest does not self-reference every asset.
- Report referenced and unreferenced assets with size totals.
- Never delete automatically.
- Require human/Genesis confirmation for dynamic loads and provenance before purge.

## Result
Current report:
- Total assets: 621
- Referenced: 115
- Unreferenced candidates: 506
- Candidate size: 360.711 MB

## PLT
- **Profit:** finds hundreds of MB that may be removable.
- **Love:** protects the world from broken asset deletions by proving references first.
- **Tax:** many candidates may be dynamically loaded; confirmation still required.

## Status
FORGED for P105 proof audit. Purge not executed.
