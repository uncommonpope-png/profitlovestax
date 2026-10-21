import fs from "node:fs";
import path from "node:path";
import { ensureAstParsers, astChunkSource, getParsers } from "./AstChunker";

interface Chunk {
  file: string;
  symbol: string;
  startLine: number;
  endLine: number;
  text: string;
  tokens: Map<string, number>;
}

const STOP = new Set(["the", "and", "for", "with", "this", "that", "from", "into", "const", "let", "function", "return", "import", "export", "class", "async", "await", "type", "interface", "new", "not", "are", "was", "has", "have", "you", "your"]);

const SKIP_DIRS = /^(node_modules|\.git|dist|\.build|build|logs|\.next|coverage|\.fleet|\.vite|out)$/i;
const FILE_RE = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|html|css|ps1|py|rs|go)$/i;
const CHUNK_LINES = 70;

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9_]+/g) || []).filter((t) => t.length > 1 && !STOP.has(t));
}

export class CodebaseIndex {
  private chunks: Chunk[] = [];
  private df: Map<string, number> = new Map();
  private filesIndexed = 0;
  private builtAt = 0;
  private building: Promise<void> | null = null;
  private parsers: ReturnType<typeof getParsers> = null;
  private astChunks = 0;
  private fallbackChunks = 0;

  constructor(private root: string) {}

  status(): { files: number; chunks: number; builtAt: number; ready: boolean; astChunks: number; fallbackChunks: number; engine: string } {
    return {
      files: this.filesIndexed,
      chunks: this.chunks.length,
      builtAt: this.builtAt,
      ready: this.builtAt > 0,
      astChunks: this.astChunks,
      fallbackChunks: this.fallbackChunks,
      engine: this.astChunks > 0 ? "tree-sitter+line-fallback" : "line",
    };
  }

  async ensure(): Promise<void> {
    if (this.builtAt === 0 || Date.now() - this.builtAt > 30000) {
      await this.rebuild();
    }
  }

  async rebuild(): Promise<void> {
    if (this.building) return this.building;
    this.building = this.buildNow().finally(() => { this.building = null; });
    return this.building;
  }

  private buildNow(): Promise<void> {
    return new Promise((resolve) => {
      const chunks: Chunk[] = [];
      let files = 0;
      let astCount = 0;
      let fbCount = 0;
      ensureAstParsers().finally(() => {
        this.parsers = getParsers();
        const walk = (d: string) => {
        if (chunks.length > 20000) return;
        let ents: fs.Dirent[] = [];
        try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
        for (const e of ents) {
          if (chunks.length > 20000) return;
          if (e.name.startsWith(".")) continue;
          const p = path.join(d, e.name);
          if (e.isDirectory()) { if (!SKIP_DIRS.test(e.name)) walk(p); continue; }
          if (!FILE_RE.test(e.name)) continue;
          try {
            const st = fs.statSync(p);
            if (st.size > (/\.(json|html)$/i.test(e.name) ? 100 * 1024 : 400 * 1024)) continue;
            const source = fs.readFileSync(p, "utf8");
            const lines = source.split(/\r?\n/);
            files++;
            // ─── TREE-SITTER FIRST (Movement III) — complete symbols, line-fallback ───
            const isCode = /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(e.name);
            let used = false;
            if (isCode && this.parsers) {
              const ast = astChunkSource(p, source, this.parsers);
              if (ast && ast.length > 0) {
                for (const c of ast) {
                  chunks.push({ file: p, symbol: c.name, startLine: c.startLine, endLine: c.endLine, text: c.text, tokens: countTokens(tokenize(`${p} ${c.name} ${c.name} ${c.text}`)) });
                  astCount++;
                }
                used = true;
              } else if (ast && ast.length === 0) {
                used = true; // parsed fine but nothing chunkable (e.g. pure types re-exports)
              }
            }
            if (!used) {
              for (let i = 0; i < lines.length; i += CHUNK_LINES) {
                const text = lines.slice(i, i + CHUNK_LINES).join("\n");
                if (!text.trim()) continue;
                chunks.push({ file: p, symbol: "", startLine: i + 1, endLine: Math.min(i + CHUNK_LINES, lines.length), text, tokens: countTokens(tokenize(`${p} ${text}`)) });
                fbCount++;
                if (chunks.length > 20000) break;
              }
            }
          } catch { /* unreadable file */ }
        }
        };
        walk(this.root);

        const df = new Map<string, number>();
        for (const c of chunks) {
          for (const t of c.tokens.keys()) df.set(t, (df.get(t) || 0) + 1);
        }
        this.chunks = chunks;
        this.df = df;
        this.filesIndexed = files;
        this.astChunks = astCount;
        this.fallbackChunks = fbCount;
        this.builtAt = Date.now();
        console.log(`[CodebaseIndex] rebuilt: ${files} files · ${astCount} AST chunks · ${fbCount} line-fallback chunks`);
        resolve();
      });
    });
  }

  async search(query: string, k = 5): Promise<Array<{ file: string; symbol: string; startLine: number; endLine: number; score: number; text: string }>> {
    await this.ensure();
    const qTokens = [...new Set(tokenize(query))];
    if (!qTokens.length || !this.chunks.length) return [];
    const N = this.chunks.length;
    const scored = this.chunks.map((c) => {
      let score = 0;
      const lowerFile = c.file.toLowerCase();
      const lowerSym = (c.symbol || "").toLowerCase();
      for (const qt of qTokens) {
        const tf = c.tokens.get(qt) || 0;
        if (!tf) continue;
        const idf = Math.log(1 + N / (1 + (this.df.get(qt) || 0)));
        score += tf * idf;
        if (lowerFile.includes(qt)) score += 2.5 * idf;
        if (lowerSym && lowerSym.includes(qt)) score += 3.0 * idf; // symbol-name match: strongest signal
      }
      return { c, score };
    }).filter((x) => x.score > 0);
    scored.sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    const out: Array<{ file: string; symbol: string; startLine: number; endLine: number; score: number; text: string }> = [];
    for (const s of scored) {
      if (seen.has(s.c.file + ":" + s.c.startLine)) continue;
      seen.add(s.c.file + ":" + s.c.startLine);
      out.push({ file: s.c.file, symbol: s.c.symbol, startLine: s.c.startLine, endLine: s.c.endLine, score: Math.round(s.score * 100) / 100, text: s.c.text.slice(0, 1200) });
      if (out.length >= k) break;
    }
    return out;
  }
}

function countTokens(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}
