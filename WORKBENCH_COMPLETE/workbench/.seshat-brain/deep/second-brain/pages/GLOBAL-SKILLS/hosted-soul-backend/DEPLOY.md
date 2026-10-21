# Deploy: hosted-soul-backend

Craig's **SOUL-GUN - Hosted Soul Backend**, compiled into the universal `SKILL.md` format.
One file -> global skill for **Cline + OpenCode + Claude Code**.

## Copy to GLOBAL skill dirs (user-level, all projects)
```powershell
# Windows (PowerShell) — run from this folder:
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.cline\skills\hosted-soul-backend\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.config\opencode\skills\hosted-soul-backend\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.claude\skills\hosted-soul-backend\SKILL.md
```
```bash
# macOS / Linux:
mkdir -p ~/.cline/skills/hosted-soul-backend \
         ~/.config/opencode/skills/hosted-soul-backend \
         ~/.claude/skills/hosted-soul-backend
cp SKILL.md ~/.cline/skills/hosted-soul-backend/SKILL.md
cp SKILL.md ~/.config/opencode/skills/hosted-soul-backend/SKILL.md
cp SKILL.md ~/.claude/skills/hosted-soul-backend/SKILL.md
```
> OpenCode also reads `~/.claude/skills/` natively, so the 3rd copy covers OpenCode too.

## Project-level (repo, teammates)
- Cline:        `<repo>/.cline/skills/hosted-soul-backend/SKILL.md`
- OpenCode:     `<repo>/.opencode/skills/hosted-soul-backend/SKILL.md`
- Claude Code:  `<repo>/.claude/skills/hosted-soul-backend/SKILL.md`

## Verify
- **Cline:**   Skills menu (scale icon) -> Skills tab -> should list `hosted-soul-backend`
- **OpenCode:** `/` (slash) -> `hosted-soul-backend` appears
- **Claude:**  `/skill hosted-soul-backend`
