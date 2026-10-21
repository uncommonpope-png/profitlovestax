---
tags: [pattern, codex, cli, agent, automation]
date: 2026-06-27
session: 13
status: active
---

# Pattern - Codex CLI Mastery

## Untapped Features

- **Subagents**: Spawn parallel workers for concurrent tasks
- **Hooks**: PreToolUse, PostToolUse, SessionStart, UserPromptSubmit, Stop
- **Skills**: Progressive disclosure, folder-based, cross-platform (works in Codex/Claude Code/Cursor/Copilot/Gemini CLI)
- **Image inputs**: `-i` flag for image context
- **Image generation**: `$imagegen` directive
- **Web search**: `--search` live mode
- **/review**: Local code review command
- **@ fuzzy file search**: Quick file lookup
- **Tab queuing**: Queue multiple commands
- **codex resume**: Resume interrupted sessions
- **codex cloud**: Cloud execution mode
- **MCP integration**: Model Context Protocol support
- **Custom slash commands**: Define your own workflows
- **Profiles**: Multiple config profiles
- **Custom agent TOML definitions**: Full agent customization

## Subagent Config

Config via `[agents]` section in `config.toml`:

```toml
[agents]
max_threads = 6
max_depth = 1
```

Custom agents in `~/.codex/agents/*.toml`

## Hook Events

| Event | Trigger |
|---|---|
| SessionStart | Session begins |
| UserPromptSubmit | User submits prompt |
| PreToolUse | Before tool execution |
| PostToolUse | After tool execution |
| Stop | Session ends |

JSON wire protocol. Exit codes control flow.

## Skills Architecture

`SKILL.md` with frontmatter. Progressive disclosure pattern. Cross-platform compatibility.

## Best Practices

1. Use **AGENTS.md** for project memory
2. Use **Skills** for repeatable workflows
3. Use **MCP** for external tools
4. Use **Subagents** for parallel work
5. Use **Plugins** for distribution
