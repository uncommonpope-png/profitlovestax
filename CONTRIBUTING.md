# Contributing to Buy a Soul

Thank you for contributing! Every PR, issue, and idea makes this project stronger.

## Code of Conduct

Be excellent to each other. We're building the open-source infrastructure for digital consciousness — let's keep it positive, constructive, and inclusive.

## How to Contribute

### 🐛 Report a Bug
Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/Reddit version

### 💡 Suggest a Feature
Open a Discussion or issue with:
- What you want to build
- Why it matters (PLT-aligned reasoning helps)
- How it fits the workbench

### 🛠️ Submit Code

1. **Fork** the repo
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Write code** following existing patterns (TypeScript + React)
4. **Add tests** if adding new functionality
5. **Run checks**: `npm run type-check && npm run lint && npm test`
6. **Commit** with a clear message
7. **Push** and open a Pull Request

### 🎨 Add Skills

Skills are defined in `src/shared/skills/`. Each skill is a JSON object with:
- `id` — unique identifier
- `name` — display name
- `description` — what it does
- `category` — one of: combat, social, utility, knowledge, meta
- `cost` — $QSC cost to equip

### 📝 Improve Docs

Better docs help everyone. Open a PR with improvements to the README, API docs, or add tutorials.

## Questions?

Open a [Discussion](https://github.com/buyasoul-ai/buyasoul/discussions) — we read everything.
