# Cursor Study — What Forge IDE Is Missing

Source: cursor.com product/docs, Cursor 3 blog (2026-04), Composer guide, Ask/Agent/Plan/Debug
mental model (2026-06/07). Goal: find the gaps between Cursor's agentic editor and our
Forge IDE so we know what to borrow.

## What Cursor does that we should mirror

| # | Cursor feature | Why it matters | Forge IDE status |
| - | -------------- | -------------- | ---------------- |
| 1 | **Agent modes: Ask / Plan / Agent / Debug** | Separate "think only" from "edit + run". Plan writes an editable plan *before* any code. Debug chases a failing test. | We have one GSK chat + composer. No Plan/Debug split. |
| 2 | **Composer multi-file diff review** (Accept / Reject / Reject-with-feedback) | User stays in control of every edit via inline diffs. | We have a "staged shadow diff" but no per-file Accept/Reject UI in the editor. |
| 3 | **Inline edit `⌘K`** | Edit the selection you're looking at, in place. | UI advertises `⌘K compose` — confirm it's wired to the editor selection. |
| 4 | **Tab AI autocomplete** | Whole-line + next-edit prediction as you type (~200ms). | Monaco only; no AI completion yet. |
| 5 | **Checkpoints / rollback** | Snapshot before each tool call; click to revert working dir. | We journal GSK, not per-edit file checkpoints. |
| 6 | **Command approval gate + auto-run read-only** | Agent prompts before write/shell cmds; read-only auto-run. | Terminals run free; no approval gate. |
| 7 | **Git & checkpoints SCM panel** (stage/commit/PR, diffs view) | One surface for the whole git loop. | We have Git Pulse + conflict UI, no full SCM panel. |
| 8 | **Problems panel** | Aggregated diagnostics (lint/type errors) from LSP. | LSP runs; no Problems panel view. |
| 9 | **Breadcrumbs / Outline** | Navigate file structure quickly. | Missing. |
| 10 | **Multi-root / multi-repo workspace** | Work across repos in one window. | Single root (`WORKBENCH_COMPLETE`). |
| 11 | **Command palette `⌘⇧P`** | Every action reachable by name. | UI advertises `⌘P palette`; verify it's live. |
| 12 | **@-context menu** (`@File @Folder @Code @Docs @Web @Terminal @Notepad`) | Attach precise context to a prompt. | We have `@codebase`/skills; no unified @-menu. |
| 13 | **Background / cloud agents + parallel fleets** | Delegate long tasks, run many at once. | We have swarm dispatch (delegate) — strong already. |
| 14 | **Plugins / MCP marketplace (1-click install)** | Extend with community MCPs/skills. | We have OmniRoute 42-tool arsenal + skill library. |

## What we already match or beat Cursor on
- **Codebase indexing + semantic search** (`@codebase`, AST chunker, LSP) — present.
- **Multi-agent swarm dispatch** (delegate a file to an agent, stage a shadow diff) — present and on par with subagents.
- **Live GSK Mind Stream** (real runtime cognition) — unique to us, Cursor has nothing equivalent.
- **Multiple terminals (add/close/reopen)** — just added; matches Cursor.

## Recommended quick wins (highest leverage, lowest effort)
1. **Plan mode toggle** in the GSK/Agent chat: "research + write an editable plan, no edits" before Agent executes. (Mirrors Cursor Plan.)
2. **Per-file diff Accept/Reject** in the editor for staged agent changes. (Mirrors Composer.)
3. **Problems panel** fed by the existing LSP diagnostics. (Cheap, high value.)
4. **Confirm/ wire `⌘K` inline edit + `⌘⇧P` command palette** (UI already claims them).
5. **Checkpoint rollback**: snapshot files before an agent edit, allow one-click revert.

## Deferred (larger)
- Tab AI autocomplete, multi-repo workspaces, full SCM panel, @-context menu, plugin
  marketplace. These are real but bigger; tackle after the quick wins land.
