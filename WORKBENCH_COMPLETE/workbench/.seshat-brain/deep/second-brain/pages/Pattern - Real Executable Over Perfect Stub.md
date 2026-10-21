# Pattern: Real Executable > Perfect Stub

**type:: [[pattern]]**  
**category::** Engineering Discipline  
**extracted-from::** [[2026_05_26]]  
**status::** validated

---

## The Pattern

Working code that runs and does something beats beautiful code that doesn't exist.

**Standard:** A module must:
1. Be loadable by Node.js without crashing
2. Have an `execute()` method that returns something
3. Write to disk or stdout (side effects prove it's real)

**It does NOT need:**
- Full test coverage
- Complete documentation
- Integration with every framework
- Perfect error handling
- Beautiful code

---

## The Fake Module Test

If you can replace a module with `{}` and the product still "works" (doesn't crash), it's a fake module.

**Example of real:** `power-observability.cjs` writes `health.json`, `logs.json`, `metrics.json` to disk.  
**Example of fake:** A module that exports `{ execute: () => ({ status: 'ok' }) }` and does nothing.

---

## Anti-Pattern

**The Stub Trap:** Agent builds `docs/`, `examples/`, `integrations/` directories with 0 files, or files containing only `// TODO`.  
It looks complete in the directory listing. It does nothing.

**Fix:** Run the module. If it doesn't produce output, it's fake. Rewrite it.

---

## Applications

- Power module development
- Generator validation
- CLI testing
- Hook verification

---

*"A zip with 24 real files is worth more than a zip with 94 files where 70 are stubs."*
