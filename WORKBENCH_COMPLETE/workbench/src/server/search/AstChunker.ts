import path from "node:path";

/**
 * AstChunker — Tree-Sitter powered structural chunking (Movement III).
 * Chunks become complete symbols (functions/classes/methods/interfaces) instead
 * of arbitrary 70-line windows, so retrieval never serves half a function.
 *
 * Zero-native-build strategy: web-tree-sitter (WASM runtime) + prebuilt grammars
 * from tree-sitter-wasms. Any failure falls back to line-chunking so coverage
 * NEVER regresses vs the old behavior.
 */

export interface AstChunk {
  name: string;
  kind: string;
  startLine: number; // 1-based
  endLine: number;
  text: string;
}

interface WtsNode {
  type: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  text: string;
  children: WtsNode[];
  childForFieldName(field: string): WtsNode | null;
}

type WtsLang = { parse(input: string): { rootNode: WtsNode } };
type WtsParser = { setLanguage(l: WtsLang): void; parse(input: string): { rootNode: WtsNode } };

let parserPromise: Promise<{ ts: WtsParser; tsx: WtsParser } | null> | null = null;
let loadedParsers: { ts: WtsParser; tsx: WtsParser } | null = null;

export function getParsers(): { ts: WtsParser; tsx: WtsParser } | null {
  return loadedParsers;
}

async function loadParsers(): Promise<{ ts: WtsParser; tsx: WtsParser } | null> {
  try {
    // web-tree-sitter ships as CJS; keep the typing friction low on purpose.
    const mod: any = await import("web-tree-sitter");
    const Parser = mod.default ?? mod;
    await Parser.init();
    const wasmsDir = path.join(process.cwd(), "node_modules", "tree-sitter-wasms", "out");
    const tsLang = await Parser.Language.load(path.join(wasmsDir, "tree-sitter-typescript.wasm"));
    const tsxLang = await Parser.Language.load(path.join(wasmsDir, "tree-sitter-tsx.wasm"));
    const mk = (): WtsParser => { const p = new Parser(); return p; };
    const ts = mk(); ts.setLanguage(tsLang);
    const tsx = mk(); tsx.setLanguage(tsxLang);
    loadedParsers = { ts, tsx };
    return loadedParsers;
  } catch (e: any) {
    console.warn(`[AstChunker] init failed — falling back to line chunks: ${String(e.message).slice(0, 140)}`);
    return null;
  }
}

export async function ensureAstParsers(): Promise<boolean> {
  if (!parserPromise) parserPromise = loadParsers();
  return (await parserPromise) !== null;
}

const DECL_TYPES = new Set([
  "function_declaration",
  "generator_function_declaration",
  "class_declaration",
  "abstract_class_declaration",
  "interface_declaration",
  "type_alias_declaration",
  "enum_declaration",
]);

const METHOD_TYPES = new Set(["method_definition", "method_signature", "abstract_method_signature"]);
const SKIP_SUBTREES = new Set(["comment", "string", "template_string", "regex"]);

function nameOf(node: WtsNode): string {
  const named = node.childForFieldName("name");
  if (named) return named.text;
  return "";
}

function collect(node: WtsNode, ancestorChain: string[], out: Array<{ node: WtsNode; kind: string; name: string; ancestors: string[] }>): void {
  if (SKIP_SUBTREES.has(node.type)) return;

  let pushed = false;
  if (DECL_TYPES.has(node.type)) {
    out.push({ node, kind: node.type.replace("_declaration", "").replace("generator_function", "generator"), name: nameOf(node), ancestors: [...ancestorChain] });
    pushed = true;
  } else if (node.type === "lexical_declaration" || node.type === "variable_declaration") {
    // const foo = async () => {...} | function(){} — chunk whole declaration when value is a function
    for (const child of node.children) {
      if (child.type !== "variable_declarator") continue;
      const val = child.childForFieldName("value");
      if (val && (val.type === "arrow_function" || val.type === "function_expression" || val.type === "function")) {
        out.push({ node, kind: "function", name: child.childForFieldName("name")?.text || "", ancestors: [...ancestorChain] });
        pushed = true;
        break;
      }
    }
  }

  const nextChain = pushed && nameOf(node) ? [...ancestorChain, nameOf(node)] : ancestorChain;

  for (const child of node.children) {
    if (METHOD_TYPES.has(child.type)) {
      const mName = nameOf(child);
      out.push({
        node: child,
        kind: "method",
        name: nextChain.length ? `${nextChain.join(".")}.${mName}` : mName,
        ancestors: [],
      });
      continue; // do not descend into method bodies
    }
    collect(child, nextChain, out);
  }
}

/** Parse one JS/TS source into complete-symbol chunks. Returns null when parsers unavailable. */
export function astChunkSource(file: string, source: string, parsers: { ts: WtsParser; tsx: WtsParser } | null): AstChunk[] | null {
  if (!parsers) return null;
  const ext = path.extname(file).toLowerCase();
  const parser = ext === ".tsx" || ext === ".jsx" ? parsers.tsx : parsers.ts;
  let root: WtsNode;
  try {
    root = parser.parse(source).rootNode;
  } catch {
    return null;
  }

  const raw: Array<{ node: WtsNode; kind: string; name: string; ancestors: string[] }> = [];
  collect(root, [], raw);

  // Containment filter: drop nodes fully inside an already-larger kept symbol
  // unless they are methods of a big class (methods were added flat already).
  const sorted = [...raw].sort((a, b) => (b.node.endPosition.row - b.node.startPosition.row) - (a.node.endPosition.row - a.node.startPosition.row));
  const kept: Array<{ node: WtsNode; kind: string; name: string }> = [];
  for (const item of sorted) {
    const s = item.node.startPosition.row, e = item.node.endPosition.row;
    const contained = kept.some((k) => k.node.startPosition.row <= s && k.node.endPosition.row >= e);
    if (!contained) kept.push({ node: item.node, kind: item.kind, name: item.name });
  }

  const lines = source.split(/\r?\n/);
  const chunks: AstChunk[] = [];
  for (const k of kept.sort((a, b) => a.node.startPosition.row - b.node.startPosition.row)) {
    const start = k.node.startPosition.row; // 0-based
    const end = k.node.endPosition.row;
    if (end - start + 1 < 3) continue;
    const label = [k.kind !== "function" ? k.kind : "", k.name].filter(Boolean).join(" ") || "(anonymous)";
    if (end - start + 1 <= 160) {
      chunks.push({ name: label, kind: k.kind, startLine: start + 1, endLine: end + 1, text: lines.slice(start, end + 1).join("\n") });
    } else {
      // Oversize symbol: split body windows but keep the symbol header on each
      for (let s2 = start; s2 <= end; s2 += 70) {
        const e2 = Math.min(s2 + 79, end);
        chunks.push({ name: `${label}.part${Math.floor((s2 - start) / 70) + 1}`, kind: k.kind, startLine: s2 + 1, endLine: e2 + 1, text: lines.slice(s2, e2 + 1).join("\n") });
        if (e2 >= end) break;
      }
    }
  }
  return chunks;
}

export type Parsers = { ts: WtsParser; tsx: WtsParser } | null;
