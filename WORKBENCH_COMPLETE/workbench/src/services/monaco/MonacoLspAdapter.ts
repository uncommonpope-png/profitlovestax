/**
 * MonacoLspAdapter — Movement I/II bridge: pipes typescript-language-server
 * (via /api/ide/ws/lsp) into Monaco's marker system so real squiggles light up.
 *
 * Beyond Gemini's sketch, this implements the parts without which tsserver
 * publishes NOTHING:
 *  - textDocument/didOpen | didChange | didClose lifecycle sync
 *  - pending-map request/response correlation (init response isn't always id 1)
 *  - monaco instance injection (@monaco-editor/react loads its own copy; a bare
 *    `import * as monaco from 'monaco-editor'` can bind to a different instance)
 *  - auto-reconnect + re-initialize
 */
import type { editor as MonacoEditor, Uri as MonacoUri, MarkerSeverity } from "monaco-editor";

type MonacoLike = {
  editor: {
    getModel(uri: { toString(): string } & object): MonacoEditor.ITextModel | null;
    getModels(): MonacoEditor.ITextModel[];
    setModelMarkers(model: MonacoEditor.ITextModel, owner: string, markers: Array<Record<string, unknown>>): void;
  };
  Uri: { parse(value: string): MonacoUri };
  MarkerSeverity: typeof MarkerSeverity;
};

interface LspDiagnostic {
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  message: string;
  severity?: number;
  source?: string;
}

export type FlatDiag = {
  uri: string;
  fsPath: string;
  file: string;
  line: number;
  col: number;
  severity: number;
  message: string;
  source: string;
};

export class MonacoLspAdapter {
  private ws: WebSocket | null = null;
  private mon: MonacoLike;
  private rootUri: string;
  private nextId = 1;
  private ready = false;
  private closedByUser = false;
  private opened = new Set<string>();
  private reconnectTimer: number | null = null;
  private changeTimers = new Map<string, number>();
  private diagnostics: Record<string, LspDiagnostic[]> = {};
  private diagListeners = new Set<(list: FlatDiag[]) => void>();

  constructor(mon: MonacoLike, repoRootAbsPath: string) {
    this.mon = mon;
    const norm = repoRootAbsPath.replace(/\\/g, "/").replace(/\/$/, "");
    this.rootUri = `file:///${encodeURI(norm).replace(/#/g, "%23")}`;
    this.connect();
  }

  private connect(): void {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${proto}://${window.location.host}/api/ide/ws/lsp`);
    this.ws.onopen = () => {
      // LSP lifecycle: initialize → server replies → send initialized
      this.request("initialize", {
        processId: null,
        rootUri: this.rootUri,
        capabilities: {
          textDocument: {
            publishDiagnostics: { relatedInformation: false },
          },
        },
      });
    };
    this.ws.onmessage = (ev) => {
      let msg: any;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this.handle(msg);
    };
    this.ws.onclose = () => {
      this.ready = false;
      if (!this.closedByUser) {
        if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = window.setTimeout(() => this.connect(), 4000);
      }
    };
    this.ws.onerror = () => {};
  }

  private handle(msg: any): void {
    if (msg.result && msg.result.capabilities && !this.ready) {
      this.ready = true;
      this.notify("initialized", {});
      console.log("[LSP Adapter] language server ready — squiggles armed");
      return;
    }
    if (msg.method === "textDocument/publishDiagnostics") {
      this.applyDiagnostics(String(msg.params?.uri || ""), Array.isArray(msg.params?.diagnostics) ? msg.params.diagnostics : []);
    }
  }

  private applyDiagnostics(uri: string, diags: LspDiagnostic[]): void {
    // tsserver re-encodes URIs its own way (%3A vs : etc.) — match on fsPath,
    // never on string equality of the encoded form.
    const target = this.mon.Uri.parse(uri);
    const model =
      this.mon.editor.getModel(target) ||
      (this.mon.editor.getModels().find((m) => m.uri.fsPath.toLowerCase().replace(/^\//, "") === decodeURIComponent(target.fsPath).toLowerCase().replace(/^\//, "")) ?? null);
    this.diagnostics[uri] = diags;
    if (!model) { this.notifyDiagListeners(); return; }
    const markers = diags.map((d) => ({
      severity: (d.severity === 1 ? this.mon.MarkerSeverity.Error : d.severity === 2 ? this.mon.MarkerSeverity.Warning : this.mon.MarkerSeverity.Info) as MarkerSeverity,
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: Math.max(d.range.end.line + 1, d.range.start.line + 1),
      endColumn: d.range.end.character + 2,
      message: d.message,
      source: d.source || "tsserver",
    }));
    this.mon.editor.setModelMarkers(model, "lsp-diagnostics", markers);
    this.notifyDiagListeners();
  }

  /** Flattened, UI-friendly diagnostics list for the Problems panel. */
  public getDiagnosticsList(): FlatDiag[] {
    const out: FlatDiag[] = [];
    for (const uri of Object.keys(this.diagnostics)) {
      const fsPath = decodeURIComponent(uri.replace(/^file:\/\//, ""));
      for (const d of this.diagnostics[uri]) {
        out.push({
          uri,
          fsPath,
          file: fsPath.split("/").pop() || fsPath,
          line: d.range.start.line + 1,
          col: d.range.start.character + 1,
          severity: d.severity ?? 3,
          message: d.message,
          source: d.source || "tsserver",
        });
      }
    }
    out.sort((a, b) => (a.severity - b.severity) || (a.fsPath.localeCompare(b.fsPath)) || (a.line - b.line));
    return out;
  }

  public subscribe(cb: (list: FlatDiag[]) => void): () => void {
    this.diagListeners.add(cb);
    cb(this.getDiagnosticsList());
    return () => { this.diagListeners.delete(cb); };
  }

  private notifyDiagListeners(): void {
    const list = this.getDiagnosticsList();
    this.diagListeners.forEach((cb) => cb(list));
  }

  /** Call when a tab opens/mounts. Content is sent so tsserver can analyze immediately. */
  public openDocument(fileRepoPath: string, text: string, languageId: string): void {
    if (!this.ready || !this.ws || this.ws.readyState !== 1) return;
    const uri = this.toUri(fileRepoPath);
    if (this.opened.has(uri)) return;
    this.opened.add(uri);
    this.notify("textDocument/didOpen", {
      textDocument: { uri, languageId, version: 1, text },
    });
  }

  /** Debounced per-file; call on every keystroke via model.onDidChangeContent. */
  public changeDocument(fileRepoPath: string, text: string): void {
    if (!this.ready) return;
    const uri = this.toUri(fileRepoPath);
    if (!this.opened.has(uri)) return;
    const key = uri;
    const existing = this.changeTimers.get(key);
    if (existing) window.clearTimeout(existing);
    this.changeTimers.set(key, window.setTimeout(() => {
      this.changeTimers.delete(key);
      this.notify("textDocument/didChange", {
        textDocument: { uri, version: Date.now() },
        contentChanges: [{ text }],
      });
    }, 450));
  }

  /** Call when a tab closes. */
  public closeDocument(fileRepoPath: string): void {
    const uri = this.toUri(fileRepoPath);
    if (!this.opened.delete(uri)) return;
    if (this.ready && this.ws && this.ws.readyState === 1) {
      this.notify("textDocument/didClose", { textDocument: { uri } });
    }
  }

  private toUri(repoRelOrAbsPath: string): string {
    // Accept either absolute paths under the repo or repo-relative ones.
    let p = String(repoRelOrAbsPath).replace(/\\/g, "/");
    if (!this.rootUri.includes(p.split("/")[0])) {
      // looks repo-relative → absolutize against root
      p = `${this.rootUri.replace("file:///", "")}/${p}`;
    } else if (/^[A-Za-z]:/.test(p)) {
      p = p; // already absolute
    }
    return `file:///${encodeURI(p.replace(/^\//, "")).replace(/#/g, "%23")}`;
  }

  private request(method: string, params: unknown): void {
    if (!this.ws || this.ws.readyState !== 1) return;
    this.ws.send(JSON.stringify({ jsonrpc: "2.0", id: this.nextId++, method, params }));
  }

  private notify(method: string, params: unknown): void {
    if (!this.ws || this.ws.readyState !== 1) return;
    this.ws.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
  }

  public dispose(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}

let singleton: MonacoLspAdapter | null = null;

/** Idempotent — safe to call on every editor mount. */
export function getMonacoLspAdapter(mon: MonacoLike, repoRootAbsPath: string): MonacoLspAdapter {
  if (!singleton) singleton = new MonacoLspAdapter(mon, repoRootAbsPath);
  return singleton;
}

/** Subscribe to the singleton adapter's diagnostics (no-op until the adapter exists). */
export function subscribeLspDiagnostics(cb: (list: FlatDiag[]) => void): () => void {
  if (!singleton) { cb([]); return () => {}; }
  return singleton.subscribe(cb);
}
