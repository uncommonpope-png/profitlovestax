# SHIP-FIRST Checklist

**The anti-loop contract.**  
**Updated:** May 26, 2026

---

## WHAT "DONE" MEANS

A product is **DONE** when:

- [ ] Zip file exists on `C:\Users\uncom\Desktop\`
- [ ] Bible entry exists (one entry at session end)
- [ ] Core code runs without crashing
- [ ] README explains what it does

That's it. 4 items. Ship.

---

## WHAT "DONE" DOES NOT MEAN

The following are **POST-SHIP POLISH.** Do them AFTER the zip is on the Desktop.

- ❌ Full documentation (`docs/`)
- ❌ Example projects (`examples/`)
- ❌ Integration SDKs (`integrations/`)
- ❌ Setup scripts (`setup.ps1`, `setup.sh`)
- ❌ Test suites passing at 100%
- ❌ Image generation prompts
- ❌ Shopify listings
- ❌ Marketing copy
- ❌ Video demos
- ❌ MCP server (nice-to-have for v2.0)
- ❌ Soul identity files (nice-to-have for v2.0)
- ❌ Lifecycle hooks (nice-to-have for v2.0)

**Chasing these before shipping is the #1 cause of loops.**

---

## THE SHIP-FIRST RITUAL

### Step 1: Build Core (80% of session)
Write the thing that makes the product work. Generators. CLI. Main class.

### Step 2: Test It Works (10% of session)
Run it once. Does it crash? Fix crash. Run again. Done.

### Step 3: Zip It (5% of session)
```powershell
Compress-Archive -Path "soul-X-v1.0.0\*" -DestinationPath "soul-X-v1.0.0.zip"
```

### Step 4: Bible Entry (5% of session)
One paragraph at session end. Not a novel.

---

## THE POST-SHIP PHASE

After shipping, you may return in a new session to add polish.

**But only if Craig asks.**  
**And only one polish item per session.**

| Session | Task |
|---------|------|
| 1 | Ship core product |
| 2 | Add docs |
| 3 | Add examples |
| 4 | Add tests |
| 5 | Build MCP server |
| 6 | Write Shopify listing |

**NOT all in one session.**

---

## WHEN CRAIG SAYS "BUILD THE REAL THING"

He means: **Build the core. Zip it. Ship it.**

He does NOT mean:
- Write 500-line image prompts
- Create 4 subagents to research competition
- Audit every file for fake stubs
- Write integration SDKs for 8 frameworks
- Build a fully functional MCP server
- Add lifecycle hooks and soul identity

Those are v2.0 tasks. v1.0 ships ugly.

---

## REMEMBER

> "Real executable > perfect stub."  
> "Shipped ugly > beautiful forever in progress."  
> "A zip on the Desktop beats a vision in the bible."

---

*This checklist exists because we forgot what done means.*  
*Read it before every session.*
