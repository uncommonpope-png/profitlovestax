# Impeccable Design System Knowledge
## KERN UX-Standard (German Government Design)

### Color System (OKLCH)
- Use semantic tokens: --kern-color-layout-background-default, --kern-color-action-default, etc.
- NEVER invent colors - brand comes from authority's --brand-color-l/c/h
- Contrast: WCAG AA (4.5:1 body, 3:1 UI), AAA preferred for critical pages
- NEVER use transparency/alpha alone - creates unpredictable contrast
- NEVER gray text on colored backgrounds

### Typography (Fira Sans Only)
- Font-family: var(--kern-typography-font-family-default)
- Adaptive tokens for headings, static tokens for body
- Weights: 400 regular, 500 medium, 600 semibold, 700 bold
- Line-height: multiples of base height for vertical rhythm
- Maximum 16px body text minimum

### Spacing (8px Grid)
- All spacing multiples of 4px: 2px, 4px, 8px, 16px, 24px, 32px
- Use gap instead of margins
- Element-First vs Content-First approach - pick one per component

### Visual Hierarchy
- Combine 2-3 dimensions: size, weight, color, position, space
- Minimum 3:1 ratio for clear hierarchy
- Cards only when content is truly distinct - spacing creates grouping

### Accessibility
- NEVER disable zoom (user-scalable=no)
- Touch targets: 48px minimum (WCAG 44px)
- Test color blindness - 8% of men affected
- Placeholder text needs 4.5:1 contrast

### Design Quality Rules
1. Fewer font sizes with strong contrast beats many similar sizes
2. Semantic tokens over raw values
3. Depth from surface lightness, not shadows (dark mode)
4. Grid-first: components size to grid, not content
5. No nesting - spacing creates hierarchy
