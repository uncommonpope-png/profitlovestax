/** Unified Forge surface color — Dockview panes, Xterm canvas, and Monaco
 *  editor all resolve to this hex so the workspace reads as one continuous
 *  glass sheet instead of stacked widgets. */
export const FORGE_BG = "#090d16";
export const FORGE_MONACO_THEME = "forge-glass";

/** Idempotently register the Forge Monaco theme on any monaco instance. */
export function defineForgeTheme(mon: { editor: { defineTheme(name: string, theme: unknown): void } }): void {
  mon.editor.defineTheme(FORGE_MONACO_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": FORGE_BG,
      "editorGutter.background": FORGE_BG,
      "minimap.background": FORGE_BG,
      "diffEditor.insertedTextBackground": "#22c55e18",
      "diffEditor.removedTextBackground": "#ef444415",
    },
  });
}
