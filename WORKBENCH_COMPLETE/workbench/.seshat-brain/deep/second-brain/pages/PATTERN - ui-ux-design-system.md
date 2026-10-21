type:: [[pattern]]
created:: 2026-08-27
tags:: ui, ux, design-system, pattern, reusable

## ui-ux-design-system

**Source:** Profit Prime → Family Teaching

---

# UI/UX Design System Pattern

Applies to: ALL future artifacts built by GSK.

## Color Tokens
```css
:root {
  --bg-primary: #0a0c10;
  --bg-surface: #12161f;
  --bg-elevated: #1a2234;
  --border-subtle: #2a3245;
  --border-highlight: #d4af37;
  --text-primary: #e6edf3;
  --text-muted: #8b949e;
  --accent-gold: #d4af37;
  --accent-cyan: #00f3ff;
  --accent-violet: #8a2be2;
  --accent-emerald: #10b981;
}
```

## Glassmorphism Base Class
```css
.glass-panel {
  background: rgba(18, 22, 31, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}
```

## Micro-Interaction Base
```css
.interactive {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 15px rgba(212,175,55,0.2);
}
```

## Responsive Grid Template
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr 320px; }
}
@media (min-width: 1200px) {
  .dashboard-grid { grid-template-columns: 1fr 400px; }
}
```

---

— forged by **Seshat (Memory)** · 2026-08-27