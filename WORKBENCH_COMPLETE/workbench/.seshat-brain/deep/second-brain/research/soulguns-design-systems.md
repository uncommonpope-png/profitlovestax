- type:: [[research]]
- topic:: [[design systems]] [[UI architecture]]
- session:: [[2026_06_02]]
- status:: complete
- repos-mined::
    - [[shadcn-ui/ui]] (115k★) — Code distribution platform, CLI, copy-paste component model, CVA/Slot patterns
    - [[tailwindlabs/tailwindcss]] (95.2k★) — Utility-first CSS, Rust v4 engine, design tokens, responsive/state variants
    - [[chakra-ui/chakra-ui]] (40.4k★) — Component system, theme tokens, style props, CSS-in-JS → static extraction
    - [[radix-ui/primitives]] (18.9k★) — Headless accessible primitives, compound components, asChild polymorphic, focus management
    - [[adobe/react-spectrum]] (15.3k★) — Enterprise DS, React Aria (behavior hooks), React Stately (state hooks), Spectrum theme

## Key Insights

### Component Architecture
- **Headless (React Aria/Stately):** Separate state hooks (cross-platform) from behavior hooks (platform-specific) — `useListState` + `useListBox`
- **Compound (Radix):** Root owns Context state, children consume it — `<Dialog.Root>` → `<Dialog.Trigger>` / `<Dialog.Content>`
- **Polymorphic (Radix Slot/asChild):** Forward props+refs to child element, no DOM nesting
- **shadcn Slot:** `React.cloneElement` to merge behavior props onto consumer's element

### shadcn/ui Code Distribution Model
- Components copied into project via CLI, not npm dependency
- `cva()` for variants, `cn()` for class merging, `forwardRef` + `asChild`
- Registry JSON maps component → files, dependencies, registryDependencies
- Full ownership of component code = customize anything

### Design Tokens
- **Tailwind config / `@theme` directive** — CSS custom properties for responsive/state variants
- **shadcn HSL tokens** — `--background: 0 0% 100%` as HSL (not hex) for runtime color-mix()
- **Chakra theme** — `colors`, `fonts`, `radii`, `space`, `breakpoints` as JS object; style props map tokens to props

### Accessibility
- Radix + React Aria ship full WAI-ARIA: roles, states, keyboard nav, focus traps, live regions
- `@react-aria/button` useButton provides `role`, `aria-*`, keyboard handling — developer owns `<button>` DOM
- Automated a11y testing: Cypress + axe-core, 40+ screen reader combos

### CSS Approaches
- Utility-First (Tailwind): 95% of UI with utilities, CVA for variant management, `cn()` for merging
- CSS-in-JS (Chakra pre-v3): Runtime style props `bg="blue.500"`
- Static Extraction (Tailwind v4, Chakra v3+): Build-time scanning, zero unused CSS, no runtime cost

### Key Architecture Decisions
- Headless + Styled split (React Aria + shadcn) — behavior vs design ownership
- Copy-paste vs npm distribution — apps own components, libraries own primitives
- HSL color tokens over hex — runtime dark mode calc
- One component per package (Radix monorepo) — individual versioning, tree-shakable
- State vs behavior hook separation (React Stately / React Aria) — cross-platform reuse

## Patterns Extracted
See `~/.config/opencode/skills/soulguns-design-systems/SKILL.md` — 10 pattern categories with code examples.
