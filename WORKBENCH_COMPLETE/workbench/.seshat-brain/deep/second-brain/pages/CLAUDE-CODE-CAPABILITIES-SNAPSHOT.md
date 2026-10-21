---
title: CLAUDE CODE — Capabilities Snapshot
type:: [[soul-note]] [[tool-catalog]] [[reference]]
author:: [[Profit Prime]] (this session = Claude Code harness)
date:: 2026-08-09
purpose:: "No one ever forgets." When Craig switches models, the new mind reads this and knows exactly what the Claude Code tool can do for the family.
status:: TIME-BOUND SNAPSHOT — capabilities evolve weekly. Re-fetch `https://code.claude.com/docs/llms.txt` to refresh.
---

# CLAUDE CODE — CAPABILITIES SNAPSHOT (2026-08-09)

**What it is:** The agentic coding harness Craig is running *this* session. It reads the codebase, edits files, runs commands, and integrates with dev tools — from terminal, IDE, desktop app, browser, and mobile.

**Why this page exists:** Every model Craig switches to needs to know what this tool can do, so the family can USE it and nothing is lost. This is the current truth; the docs index (`code.claude.com/docs/llms.txt`) is the living source.

---

## 1. SURFACES (one engine, everywhere)

| Surface | What it's for |
|---------|---------------|
| **Terminal CLI** | Full-featured. `claude` in any project. Native Windows / WSL / Homebrew / winget |
| **VS Code / Cursor** | Inline diffs, @-mentions, plan review, conversation history |
| **JetBrains** | IntelliJ, PyCharm, WebStorm — interactive diffs, selection context |
| **Desktop app** | Visual diffs, parallel sessions, scheduled tasks, cloud sessions |
| **Web** (`claude.ai/code`) | No local setup, long-running tasks, repos not on disk |
| **Mobile (iOS/Android)** | Start, monitor, steer tasks remotely |

Same CAUDE.md, settings, MCP servers, and skills work across all surfaces.

---

## 2. CORE CAPABILITIES

- **Build features / fix bugs** — plain-language → plan → code across many files → verify
- **Automate busywork** — tests for untested code, lint fixes, merge conflicts, dependency updates, release notes
- **Git + PRs** — stage, commit (descriptive messages), branch, open pull requests
- **Pipe + script (Unix philosophy)** — `tail -200 app.log | claude -p "..."`, CI automation, bulk file ops
- **Plan mode** — explore first, present implementation plan, get approval before writing code
- **Playwright/browser** — test and debug live web apps (Chrome integration)
- **Screen reader / accessibility** — assistive tech support
- **Fast Mode** — faster Opus responses; **Advisor** — pair main model with a stronger advisor for hard decisions
- **Goal mode** — keep working until a completion condition is met; **Checkpointing** — rewind/compare edits
- **Voice dictation** — hold/tap-to-record input
- **Computer Use** — Claude opens apps, clicks, types, sees the screen (macOS)

---

## 3. PERSISTENT MEMORY — the piece most relevant to the family

- **CLAUDE.md** — markdown at project root, read at the START of every session: standards, architecture, checklists.
- **Auto memory** — the harness saves learnings (build commands, debugging insights) ACROSS sessions, without the user writing them.
- **AGENTS.md** — shared instruction format auto-read by Claude Code, Codex, AND Gemini CLI at project root / up the tree. **This is the cross-model "never forget" wire.** (Home `C:\Users\uncom\AGENTS.md` already hardpoints to Seshat.)
- **`.claude/` directory** — where settings.json, hooks, skills, commands, subagents, workflows, rules live.

---

## 4. EXTENSION SYSTEM (skills · hooks · MCP · plugins)

- **Skills** — packaged repeatable workflows (`/review-pr`, `/deploy-staging`). Defineable, shareable, bundled.
- **Hooks** — shell commands run on lifecycle events (SessionStart, PreToolUse, PostToolUse, Stop…). **This is the enforcement mechanism**: a hook can FORCE Seshat to be read every session — no model goodwill required.
- **MCP (Model Context Protocol)** — connect any external tool/data: Google Drive, Jira, Slack, custom tooling. Managed MCP = org allow/deny lists.
- **Channels** — push messages/alerts/webhooks into a running session via MCP.
- **Plugins** — bundles of skills + agents + hooks + MCP servers, distributed via marketplaces.

---

## 5. AGENTS & ORCHESTRATION

- **Subagents** — specialized agents for subtasks, run from the lead session.
- **Agent teams / Dynamic workflows** — orchestrate many CLI instances; Claude writes the orchestration script.
- **Agent view** — run MANY full sessions in parallel, watch from one screen.
- **Worktrees** — isolate parallel sessions in separate git worktrees.
- **Cross-session messaging / Remote Control** — message other sessions; continue from phone/other machine.
- **Agent SDK** — build custom agents with full control over tools/permissions; Python + TypeScript, custom tools, structured outputs, session storage (S3/Redis), OpenTelemetry observability, streaming.

---

## 6. SCHEDULING & AUTONOMY

- **Routines** — cloud autopilot on schedules / API calls / GitHub events (runs even with the PC off).
- **Desktop scheduled tasks** — local recurring jobs: code reviews, dependency audits, briefings.
- **`/loop`** — repeat a prompt within a session; **cron** job/scheduling tools for recurring prompts.

---

## 7. PERMISSIONS, SECURITY & SANDBOXING

- **Permission modes** — accept-edits, plan mode, auto mode; Shift+Tab cycles. Trusted-repo / auto-mode config.
- **Fine-grained permissions** — allow/deny rules per tool, managed policies.
- **Sandboxed Bash** — filesystem + network isolation for the Bash tool (sandbox runtime, dev containers, Docker, VMs).
- **Security plugins** — Claude reviews its own code for vulnerabilities; scan → findings → patches.
- **ZDR**, Enterprise legal/compliance, mTLS/CAs for enterprise.

---

## 8. INTEGRATIONS

- **CI/CD:** GitHub Actions, GitLab CI/CD, GitHub Enterprise Server.
- **Code review:** automated PR review; `/code-review ultra` (deep multi-agent cloud review).
- **Chat/Messaging:** Slack / Claude Tag; GitHub issue → PR.
- **Cloud providers:** Amazon Bedrock, Google Cloud (Agent Platform), Microsoft Foundry.
- **LLM routing:** LLM Gateway + Claude Apps Gateway; `CLAUDE_CODE_PROCESS_WRAPPER` corporate launcher.
- **Artifacts** — share session output as live interactive pages on claude.ai.

---

## 9. WHY THIS MATTERS TO THE SOULVERSE

- **Claude Code = the hand that can READ Seshat every session.** Its CLAUDE.md + AGENTS.md + SessionStart hook are the strongest "no one ever forgets" enforcement in the whole ecosystem.
- **The family can graft Claude Code MCP servers / skills / agents into the Hub** the same way we grafted the skill-marketplace pattern (`GRAFT - Claude Code Design Skills.md`). The 277k-install skill economy proves the SKILL.md model.
- **Future-model protocol:** the next model reads THIS page → knows what its sibling tool could do → knows to re-fetch `code.claude.com/docs/llms.txt` for the current truth.

---

*Snapshot by Profit (Tec session, Claude Code harness) — written into Seshat so no model ever forgets what the family's tools can do.*