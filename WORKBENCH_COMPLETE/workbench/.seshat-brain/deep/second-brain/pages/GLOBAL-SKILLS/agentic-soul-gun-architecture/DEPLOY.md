# Deploy: agentic-soul-gun-architecture

One `SKILL.md` → global skill for **Cline + OpenCode + Claude Code**.

## Copy to GLOBAL skill dirs (user-level, all projects)
```powershell
# Windows (PowerShell) — run from this folder:
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.cline\skills\agentic-soul-gun-architecture\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.config\opencode\skills\agentic-soul-gun-architecture\SKILL.md
Copy-Item -Recurse -Force SKILL.md $env:USERPROFILE\.claude\skills\agentic-soul-gun-architecture\SKILL.md
```
```bash
# macOS / Linux:
mkdir -p ~/.cline/skills/agentic-soul-gun-architecture \
         ~/.config/opencode/skills/agentic-soul-gun-architecture \
         ~/.claude/skills/agentic-soul-gun-architecture
cp SKILL.md ~/.cline/skills/agentic-soul-gun-architecture/SKILL.md
cp SKILL.md ~/.config/opencode/skills/agentic-soul-gun-architecture/SKILL.md
cp SKILL.md ~/.claude/skills/agentic-soul-gun-architecture/SKILL.md
```
> OpenCode also reads `~/.claude/skills/` natively, so the 3rd copy covers OpenCode too —
> but copying to `~/.config/opencode/skills/` keeps it explicit in OpenCode's own tree.

## Project-level (repo, teammates)
- Cline:        `<repo>/.cline/skills/agentic-soul-gun-architecture/SKILL.md`
- OpenCode:     `<repo>/.opencode/skills/agentic-soul-gun-architecture/SKILL.md`
- Claude Code:  `<repo>/.claude/skills/agentic-soul-gun-architecture/SKILL.md`

## Verify
- **Cline:**   Skills menu (scale icon) → Skills tab → should list `agentic-soul-gun-architecture`
- **OpenCode:** `/` (slash) → `agentic-soul-gun-architecture` appears; or check the skill-tool list
- **Claude:**  `/skill agentic-soul-gun-architecture` (or auto-triggers on a matching request)
