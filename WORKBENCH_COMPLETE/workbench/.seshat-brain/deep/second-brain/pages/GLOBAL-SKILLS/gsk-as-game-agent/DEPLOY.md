# Deploy: gsk-as-game-agent

Craig's **#57 SOUL-GUN - GSK-as-Game-Agent** (v2), compiled into the universal `SKILL.md` format.
One file → global skill for **Cline + OpenCode + Claude Code**.

## Copy to GLOBAL skill dirs (user-level, all projects)
```powershell
# Windows (PowerShell) — run from this folder:
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.cline\skills\gsk-as-game-agent\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.config\opencode\skills\gsk-as-game-agent\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.claude\skills\gsk-as-game-agent\SKILL.md
```
```bash
# macOS / Linux:
mkdir -p ~/.cline/skills/gsk-as-game-agent \
         ~/.config/opencode/skills/gsk-as-game-agent \
         ~/.claude/skills/gsk-as-game-agent
cp SKILL.md ~/.cline/skills/gsk-as-game-agent/SKILL.md
cp SKILL.md ~/.config/opencode/skills/gsk-as-game-agent/SKILL.md
cp SKILL.md ~/.claude/skills/gsk-as-game-agent/SKILL.md
```
> OpenCode also reads `~/.claude/skills/` natively, so the 3rd copy covers OpenCode too —
> but copying to `~/.config/opencode/skills/` keeps it explicit in OpenCode's own tree.

## Project-level (repo, teammates)
- Cline:        `<repo>/.cline/skills/gsk-as-game-agent/SKILL.md`
- OpenCode:     `<repo>/.opencode/skills/gsk-as-game-agent/SKILL.md`
- Claude Code:  `<repo>/.claude/skills/gsk-as-game-agent/SKILL.md`

## Verify
- **Cline:**   Skills menu (scale icon) → Skills tab → should list `gsk-as-game-agent`
- **OpenCode:** `/` (slash) → `gsk-as-game-agent` appears; or check the skill-tool list
- **Claude:**  `/skill gsk-as-game-agent` (or auto-triggers on a matching request)
