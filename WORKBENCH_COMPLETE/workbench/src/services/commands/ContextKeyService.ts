type ContextValue = boolean | string | number | undefined;

export type WhenClause = string;

export class ContextKeyService {
  private state: Map<string, ContextValue> = new Map();
  private listeners: Array<(changedKeys: string[]) => void> = [];

  public setContext(key: string, value: ContextValue): void {
    const prev = this.state.get(key);
    if (prev === value) return;
    this.state.set(key, value);
    this.emit([key]);
  }

  public getContextValue(key: string): ContextValue {
    return this.state.get(key);
  }

  public isTrue(key: string): boolean {
    return this.state.get(key) === true;
  }

  public onDidChangeContext(listener: (changedKeys: string[]) => void): { dispose: () => void } {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const idx = this.listeners.indexOf(listener);
        if (idx >= 0) this.listeners.splice(idx, 1);
      },
    };
  }

  private emit(changedKeys: string[]): void {
    for (const l of this.listeners) l(changedKeys);
  }

  /**
   * Evaluates a string-based When clause.
   * Supports: key, !key, key == 'value', key != 'value', and && / || grouping.
   * Example: "editorTextFocus && !isReadonly"
   */
  public evaluate(when: WhenClause | undefined): boolean {
    if (!when || !when.trim()) return true;
    return this.evalOr(when);
  }

  private evalOr(expr: string): boolean {
    return expr.split("||").map((e) => this.evalAnd(e.trim())).some(Boolean);
  }

  private evalAnd(expr: string): boolean {
    return expr.split("&&").map((e) => this.evalAtom(e.trim())).every(Boolean);
  }

  private evalAtom(token: string): boolean {
    token = token.trim();
    if (token.startsWith("!")) return !this.evalAtom(token.slice(1).trim());
    if (token.includes("==")) {
      const [k, v] = token.split("==").map((s) => s.trim());
      const raw = v.replace(/^['"]|['"]$/g, "");
      return this.state.get(k) === raw;
    }
    if (token.includes("!=")) {
      const [k, v] = token.split("!=").map((s) => s.trim());
      const raw = v.replace(/^['"]|['"]$/g, "");
      return this.state.get(k) !== raw;
    }
    return this.state.get(token) === true;
  }
}

export const contextKeyService = new ContextKeyService();
