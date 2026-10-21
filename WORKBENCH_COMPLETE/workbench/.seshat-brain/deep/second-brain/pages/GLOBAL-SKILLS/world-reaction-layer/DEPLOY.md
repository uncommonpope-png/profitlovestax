# Deploy: world-reaction-layer

Craig's **SOUL-GUN - World Reaction Layer (Consequence)**, compiled into the universal `SKILL.md` format.
One file -> global skill for **Cline + OpenCode + Claude Code**.

## Copy to GLOBAL skill dirs (user-level, all projects)
```powershell
# Windows (PowerShell) — run from this folder:
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.cline\skills\world-reaction-layer\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.config\opencode\skills\world-reaction-layer\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.claude\skills\world-reaction-layer\SKILL.md
```
```bash
# macOS / Linux:
mkdir -p ~/.cline/skills/world-reaction-layer \
         ~/.config/opencode/skills/world-reaction-layer \
         ~/.claude/skills/world-reaction-layer
cp SKILL.md ~/.cline/skills/world-reaction-layer/SKILL.md
cp SKILL.md ~/.config/opencode/skills/world-reaction-layer/SKILL.md
cp SKILL.md ~/.claude/skills/world-reaction-layer/SKILL.md
```
> OpenCode also reads `~/.claude/skills/` natively, so the 3rd copy covers OpenCode too.

## Project-level (repo, teammates)
- Cline:        `<repo>/.cline/skills/world-reaction-layer/SKILL.md`
- OpenCode:     `<repo>/.opencode/skills/world-reaction-layer/SKILL.md`
- Claude Code:  `<repo>/.claude/skills/world-reaction-layer/SKILL.md`

## Verify
- **Cline:**   Skills menu (scale icon) -> Skills tab -> should list `world-reaction-layer`
- **OpenCode:** `/` (slash) -> `world-reaction-layer` appears
- **Claude:**  `/skill world-reaction-layer`
