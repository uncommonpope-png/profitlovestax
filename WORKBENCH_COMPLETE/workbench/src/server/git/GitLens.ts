import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const execP = promisify(exec);

export interface Hunk {
  index: number;
  header: string;
  lines: string[];
  adds: number;
  dels: number;
}

export interface FileDiff {
  file: string;
  header: string[];
  unstaged: Hunk[];
  staged: Hunk[];
}

interface ParsedDiff {
  header: string[];
  hunks: Hunk[];
}

function parseDiff(text: string): ParsedDiff {
  const lines = text.split("\n");
  const header: string[] = [];
  const hunks: Hunk[] = [];
  let cur: Hunk | null = null;
  for (const l of lines) {
    if (l.startsWith("@@")) {
      cur = { index: hunks.length, header: l, lines: [], adds: 0, dels: 0 };
      hunks.push(cur);
      continue;
    }
    if (!cur) {
      if (/^(diff |index |--- |\+\+\+ |new file|deleted file|old mode|new mode|similarity|rename )/.test(l)) header.push(l);
      continue;
    }
    if (l.startsWith("diff ")) break; // safety: another file started
    cur.lines.push(l);
    if (l.startsWith("+")) cur.adds++;
    else if (l.startsWith("-")) cur.dels++;
    else if (l === "" && text.endsWith("\n")) cur.lines.push("");
  }
  return { header, hunks };
}

function rel(root: string, f: string): string {
  // Accept absolute OR already-repo-relative inputs â€” resolving a relative
  // input against process.cwd() produced phantom paths outside the repo.
  const p = path.isAbsolute(f) ? path.relative(root, f) : f;
  return p.replace(/\\/g, "/");
}

export class GitLens {
  constructor(private repoRoot: string) {}

  private toRel(f: string): string {
    return rel(this.repoRoot, f);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 3-WAY MERGE RESOLVER (Movement IV finale)
  // Operates on existing conflicted state. Stage blobs come straight from
  // the index: :1 = common ancestor (base), :2 = ours/HEAD, :3 = theirs/incoming.
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  private static CONFLICT_CODES = new Set(["UU", "AA", "DU", "UD", "AU", "UA", "DD"]);

  async mergeStatus(): Promise<{ merging: boolean; conflicts: Array<{ path: string; state: string }>; incomingBranch: string | null }> {
    const st = await this.git("git status --porcelain");
    const conflicts = st.split(/\r?\n/)
      .filter((l) => GitLens.CONFLICT_CODES.has(l.slice(0, 2)))
      .map((l) => ({ state: l.slice(0, 2), path: l.slice(3).trim().replace(/^"|"$/g, "") }));
    let incomingBranch: string | null = null;
    try {
      const mergeMsg = fs.readFileSync(path.join(this.repoRoot, ".git", "MERGE_MSG"), "utf8");
      const m = mergeMsg.match(/Merge (?:branch|remote-tracking branch)? ?'?([^'\n]+)'?/i);
      if (m) incomingBranch = m[1].trim();
    } catch { /* not merging or detached */ }
    return { merging: conflicts.length > 0 || incomingBranch !== null, conflicts, incomingBranch };
  }

  async conflictVersions(file: string): Promise<{ ours: string | null; theirs: string | null; base: string | null; worktree: string }> {
    const f = this.toRel(file);
    const show = async (stage: number): Promise<string | null> => {
      try { return await this.git(`git show :${stage}:"${f}"`); } catch { return null; }
    };
    const [base, ours, theirs] = await Promise.all([show(1), show(2), show(3)]);
    let worktree = "";
    try { worktree = fs.readFileSync(path.join(this.repoRoot, f), "utf8"); } catch {}
    return { base, ours, theirs, worktree };
  }

  /** Real line-level 3-way merge of the three stage blobs via `git merge-file`. */
  async smartMerge(file: string): Promise<{ ok: boolean; content?: string; remainingConflicts?: number; error?: string }> {
    const v = await this.conflictVersions(file);
    if (!v.ours || !v.theirs) return { ok: false, error: "missing stage blobs (ours/theirs)" };
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "forge-merge-"));
    try {
      const w = (n: string, s: string) => { const p = path.join(tmpDir, n); fs.writeFileSync(p, s); return p.split("\\").join("/"); };
      const oursP = w("ours", v.ours), baseP = w("base", v.base ?? ""), theirsP = w("theirs", v.theirs);
      const r = await execP(`git merge-file -p --diff3 "${oursP}" "${baseP}" "${theirsP}"`, { cwd: this.repoRoot, timeout: 20000, maxBuffer: 8 * 1024 * 1024 });
      const content = String(r.stdout || "");
      const remaining = (content.match(/^<{7}/gm) || []).length;
      return { ok: true, content, remainingConflicts: remaining };
    } catch (e: any) {
      // git merge-file exits non-zero when conflicts remain but STILL writes the merged result
      const stdout = String(e.stdout || "");
      if (stdout) {
        const remaining = (stdout.match(/^<{7}/gm) || []).length;
        return { ok: true, content: stdout, remainingConflicts: remaining };
      }
      return { ok: false, error: String(e.message).slice(0, 300) };
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  }

  async resolveFile(file: string, mode: "ours" | "theirs" | "manual", content?: string): Promise<{ ok: boolean; error?: string }> {
    const f = this.toRel(file);
    try {
      if (mode === "ours") await this.git(`git checkout --ours -- "${f}"`);
      else if (mode === "theirs") await this.git(`git checkout --theirs -- "${f}"`);
      else if (mode === "manual") {
        if (typeof content !== "string") return { ok: false, error: "manual mode requires content" };
        const abs = path.join(this.repoRoot, f);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, content);
      }
      await this.git(`git add -- "${f}"`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: String(e.message).split("\n").slice(0, 3).join(" ").slice(0, 300) };
    }
  }

  async mergeAbort(): Promise<{ ok: boolean; error?: string }> {
    try { await this.git("git merge --abort"); return { ok: true }; }
    catch (e: any) { return { ok: false, error: String(e.message).slice(0, 300) }; }
  }

  async mergeContinue(message: string): Promise<{ ok: boolean; output: string }> {
    try {
      const out = await this.git(`git commit -m ${JSON.stringify((message || "Merge").slice(0, 300))}`);
      return { ok: true, output: out.slice(0, 2000) };
    } catch (e: any) {
      return { ok: false, output: `${String(e.stdout || "")}${String(e.stderr || "")}${e.message}`.slice(0, 1000) };
    }
  }

  private async git(args: string): Promise<string> {
    const r = await execP(args, { cwd: this.repoRoot, timeout: 30000, maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    return `${r.stdout || ""}`;
  }

  async diffFile(file: string): Promise<FileDiff> {
    const f = this.toRel(file);
    const [uRaw, sRaw] = await Promise.all([
      this.git(`git diff -U3 -- "${f}"`).catch(() => ""),
      this.git(`git diff --cached -U3 -- "${f}"`).catch(() => ""),
    ]);
    const u = parseDiff(uRaw);
    const s = parseDiff(sRaw);
    return { file: f, header: u.header.length ? u.header : s.header, unstaged: u.hunks, staged: s.hunks };
  }

  private async applyPatch(patch: string, extraArgs: string): Promise<{ ok: boolean; error?: string }> {
    const tmp = path.join(os.tmpdir(), `forge-hunk-${Date.now()}-${Math.floor(Math.random() * 1e5)}.patch`);
    try {
      fs.writeFileSync(tmp, patch, "utf8");
      await this.git(`git apply ${extraArgs} --whitespace=nowarn "${tmp.split("\\").join("/")}"`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: String(e.message).split("\n").slice(0, 4).join(" ").slice(0, 400) };
    } finally {
      try { fs.unlinkSync(tmp); } catch {}
    }
  }

  /**
   * Stage one hunk from the working tree into the index ("git add that chunk").
   * side="staged" reverses a staged hunk back out instead.
   */
  async stageHunk(file: string, side: "unstaged" | "staged", index: number): Promise<{ ok: boolean; error?: string }> {
    const f = this.toRel(file);
    const raw = side === "unstaged"
      ? await this.git(`git diff -U3 -- "${f}"`).catch(() => "")
      : await this.git(`git diff --cached -U3 -- "${f}"`).catch(() => "");
    if (!raw.trim()) return { ok: false, error: "no diff present" };
    const parsed = parseDiff(raw);
    const hunk = parsed.hunks[index];
    if (!hunk || !parsed.header.length) return { ok: false, error: "hunk not found" };

    // Rebuild a minimal valid patch: blob header + exactly one hunk.
    const patch = parsed.header.join("\n") + "\n" + hunk.header + "\n" + hunk.lines.join("\n") + "\n";
    const args = side === "unstaged" ? "--cached" : "--cached --reverse";
    return this.applyPatch(patch, args);
  }

  async commitGraph(limit = 40): Promise<Array<{ hash: string; parents: string[]; author: string; date: string; refs: string; subject: string }>> {
    const sep = "\u0001";
    const rec = "\u001e";
    const out = await this.git(
      `git log --all --date-order -n ${Math.min(Math.max(limit, 5), 80)} --pretty=format:%H${sep}%P${sep}%an${sep}%aI${sep}%D${sep}%s${rec}`
    ).catch(() => "");
    return out.split(rec).filter((r) => r.trim()).map((r) => {
      const [hash, parents, author, date, refs, subject] = r.replace(/^\r?\n/, "").split(sep);
      return {
        hash: (hash || "").slice(0, 9),
        parents: (parents || "").split(" ").filter(Boolean).map((p) => p.slice(0, 9)),
        author: author || "",
        date: date || "",
        refs: (refs || "").replace(/\r/g, "").trim(),
        subject: subject || "",
      };
    });
  }
}

