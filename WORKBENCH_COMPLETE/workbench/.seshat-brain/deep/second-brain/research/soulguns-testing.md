- type:: [[research]]
- topic:: [[testing]] [[E2E]] [[component testing]] [[unit testing]]
- session:: [[2026_06_02]]
- status:: complete
- repos-mined::
    - [[vitest-dev/vitest]] (68k★) — Vite-native test runner, Jest-compatible API, type testing, coverage, mocking
    - [[microsoft/playwright]] (70k★) — E2E testing, web-first assertions, fixtures, trace viewer, component testing
    - [[cypress-io/cypress]] (48k★) — In-browser E2E, time-travel debugging, component testing, App Actions pattern
    - [[testing-library/react-testing-library]] (19k★) — Component testing philosophy, user-centric queries

## Key Insights

### Vitest
- Config-driven: `defineConfig` with `pool` (forks/threads), `environment` (jsdom/node), `globals`, `setupFiles`, `coverage`
- vi.mock() hoisted before imports, vi.doMock() for in-test, vi.spyOn() for object methods
- vi.stubGlobal() / vi.stubEnv() for global mocking, vi.unstubAllGlobals() for cleanup
- Lifecycle: beforeAll/afterAll (suite), beforeEach/afterEach (test), onTestFailed/onTestFinished (per-test callbacks)
- Type testing: expectTypeOf(), assertType() in *.test-d.ts files with typecheck.enabled
- Workspace support: defineWorkspace() with globs + inline configs

### Testing Library
- "Test as user would" — DOM nodes over component instances, accessibility-first queries
- Query priority: getByRole (best) → getByLabelText → getByPlaceholderText → getByText → getByTestId (last resort)
- userEvent over fireEvent — realistic browser interaction (focus, keyboard, visibility checks)
- Custom render with wrapper providers, screen utility (preferred over destructuring)
- waitFor / waitForElementToBeRemoved for async, findBy* as shorthand
- jest-dom matchers: toBeInTheDocument, toBeVisible, toBeDisabled, toHaveTextContent, etc.
- MSW for network mocking at service worker level

### Playwright
- Config: defineConfig with fullyParallel, projects per browser, webServer, expect timeouts
- Locator priority: getByRole → getByLabel → getByTestId → CSS (same philosophy as TL)
- Web-first assertions: auto-retry until condition met or timeout
- Fixtures: test.extend() for scoped setup/teardown, worker-scoped for shared state, auto fixtures
- Authentication: storageState with setup projects + dependencies
- Network: route interception with fulfill/abort/continue, waitForResponse
- Built-in visual regression: toHaveScreenshot() with pixelmatch config
- CI: sharding with --shard, merge-reports, Docker image for consistent screenshots

### Cypress
- In-process architecture: runs inside browser, command queue, serial execution
- Chain-based API: cy.get().find().should().click() — no async/await
- Automatic retry on queries, single execution on actions
- cy.intercept() for network spying/stubbing/modification
- Custom commands: Cypress.Commands.add() with TypeScript declarations
- App Actions pattern over Page Objects (Cypress team recommendation)
- cy.session() for auth state caching
- Time-travel debugging: hover any command to see DOM snapshot at that point

### Cross-Framework Decisions
- Vitest for unit + integration, Testing Library for component tests, Playwright for E2E (default)
- Cypress when time-travel debugging UX is critical
- userEvent always over fireEvent, getByRole as default query
- Custom render with wrapped providers, fixtures over page objects, MSW for network mocking
- Decision matrix in SKILL.md maps scenarios to recommended tools

## Patterns Extracted
See `~/.config/opencode/skills/soulguns-testing/SKILL.md` — 5 major sections covering all 4 frameworks + cross-cutting patterns with decision matrix.
