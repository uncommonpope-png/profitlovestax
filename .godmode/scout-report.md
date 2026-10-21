# BUYaSOUL App — Scout Report

## Stack
- **Frontend**: React 19, Tailwind CSS 4, Vite 8, TypeScript 6
- **Backend**: Devvit (Reddit serverless), Hono, tRPC v11
- **Testing**: Vitest 4.1.6
- **Blockchain**: Solana (@solana/web3.js)
- **3D**: Three.js
- **Deployment**: Reddit Devvit platform

## Architecture

### Client (`src/client/`)
- `splash.tsx` — Entry point (inline view in Reddit feed)
- `game.tsx` → `Workbench.tsx` — Main expanded view
- `advanced/` — 14 React components for the agent workbench

### Server (`src/server/`)
- `index.ts` — Hono app with tRPC + menu/triggers routes
- `trpc.ts` — Router with init.get, counter.increment/decrement/get
- `core/count.ts` — Redis-backed counter
- `routes/menu.ts` — Reddit menu item handler
- `routes/triggers.ts` — App install trigger

### Shared (`src/shared/`)
- `transformer.ts` — SuperJSON transformer for tRPC

## Components (14 total)

| Component | Purpose |
|-----------|---------|
| `Workbench.tsx` | Main container, 10 tabs, state management |
| `CoreCapabilities.tsx` | Tab 0 — System overview |
| `AgentPreview.tsx` | Tab 1 — Character blueprint designer |
| `BrainIngestion.tsx` | Tab 1 — LLM provider config, MCP servers |
| `SkillLibrary.tsx` | Tab 2 — Skill equip/unequip, custom skills |
| `AgentSimulator.tsx` | Tab 3 — Test bench playground |
| `WorkflowIntegration.tsx` | Tab 4 — Production pipelines |
| `RealismAuditor.tsx` | Tab 5 — Ultra-realism reviewer |
| `VaultAndMemory.tsx` | Tab 6 — API & token vault |
| `MultiAgentHabitat.tsx` | Tab 7 — Multi-agent habitat |
| `SoulMarketplace.tsx` | Tab 8 — Social & live market |
| `TransactionsTab.tsx` | Tab 9 — Marketplace transactions |
| `SolanaWalletAdapter.tsx` | Tab 9 — Solana wallet integration |
| `MatrixBackground.tsx` | Visual — Matrix code rain backdrop |
| `Agent3DViewer.tsx` | 3D agent viewer (Three.js) |

## Current State

### ✅ Passing
- TypeScript type-check: PASS
- Core functionality: Working

### ❌ Failing
- 1 test failure: `splash.test.ts` — Looking for "Docs" button that doesn't exist
- Lint command: Broken glob pattern in package.json

### ⚠️ Issues Found
1. `@ts-nocheck` in Workbench.tsx and types.ts — bypassing type safety
2. Test expects "Docs" button but splash.tsx only has "See inside" button
3. Lint script uses wrong glob pattern

## Key Files
- `package.json` — Dependencies and scripts
- `devvit.json` — Reddit app configuration
- `src/client/advanced/Workbench.tsx` — 750 lines, main UI
- `src/client/advanced/types.ts` — Type definitions
- `src/client/advanced/constants.ts` — Initial skills data
