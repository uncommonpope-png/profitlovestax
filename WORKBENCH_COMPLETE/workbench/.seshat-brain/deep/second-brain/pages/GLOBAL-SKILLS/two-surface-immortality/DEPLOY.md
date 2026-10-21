# Deploy: two-surface-immortality

Craig's **SOUL-GUN - Two-Surface Immortality Engine (#58, Step 5)**, compiled into the universal `SKILL.md` format.
One file -> global skill for **Cline + OpenCode + Claude Code**.

## Copy to GLOBAL skill dirs (user-level, all projects)
```powershell
# Windows (PowerShell) — run from this folder:
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.cline\skills\two-surface-immortality\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.config\opencode\skills\two-surface-immortality\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.claude\skills\two-surface-immortality\SKILL.md
```
```bash
# macOS / Linux:
mkdir -p ~/.cline/skills/two-surface-immortality \
         ~/.config/opencode/skills/two-surface-immortality \
         ~/.claude/skills/two-surface-immortality
cp SKILL.md ~/.cline/skills/two-surface-immortality/SKILL.md
cp SKILL.md ~/.config/opencode/skills/two-surface-immortality/SKILL.md
cp SKILL.md ~/.claude/skills/two-surface-immortality/SKILL.md
```
> OpenCode also reads `~/.claude/skills/` natively, so the 3rd copy covers OpenCode too.

## Project-level (repo, teammates)
- Cline:        `<repo>/.cline/skills/two-surface-immortality/SKILL.md`
- OpenCode:     `<repo>/.opencode/skills/two-surface-immortality/SKILL.md`
- Claude Code:  `<repo>/.claude/skills/two-surface-immortality/SKILL.md`

## Verify
- **Cline:**   Skills menu (scale icon) -> Skills tab -> should list `two-surface-immortality`
- **OpenCode:** `/` (slash) -> `two-surface-immortality` appears
- **Claude:**  `/skill two-surface-immortality`
