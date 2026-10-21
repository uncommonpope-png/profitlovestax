import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execP = promisify(exec);

export interface WorktreeInfo {
  name: string;
  path: string;
  relPath: string;
  branch: string;
  head: string;
  isMain: boolean;
}

interface TaskMeta {
  task: string;
  createdAt: number;
}

export class WorktreeFleet {
  private meta: Record<string, TaskMeta> = {};

  constructor(private repoRoot: string) {
    try {
      const raw = fs.readFileSync(path.join(repoRoot, ".fleet", "tasks.json"), "utf8");
      this.meta = JSON.parse(raw);
    } catch {
      this.meta = {};
    }
  }

  private fleetDir(): string {
    return path.join(this.repoRoot, ".fleet");
  }

  private persistMeta(): void {
    try {
      fs.mkdirSync(this.fleetDir(), { recursive: true });
      fs.writeFileSync(path.join(this.fleetDir(), "tasks.json"), JSON.stringify(this.meta, null, 2));
    } catch {
      /* best effort */
    }
  }

  private async git(args: string, cwd?: string): Promise<string> {
    const r = await execP(args, { cwd: cwd || this.repoRoot, timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
    return `${r.stdout || ""}${r.stderr || ""}`.trim();
  }

  async list(): Promise<WorktreeInfo[]> {
    const out = await this.git("git worktree list --porcelain");
    const blocks = out.split(/\r?\n\r?\n/);
    const infos: WorktreeInfo[] = [];
    for (const b of blocks) {
      const lines = b.split(/\r?\n/).filter(Boolean);
      if (!lines.length) continue;
      const wtLine = lines.find((l) => l.startsWith("worktree "));
      if (!wtLine) continue;
      const abs = wtLine.slice("worktree ".length).trim();
      const headLine = lines.find((l) => l.startsWith("HEAD "));
      const branchLine = lines.find((l) => l.startsWith("branch "));
      const branch = branchLine ? branchLine.replace("branch refs/heads/", "").trim() : "(detached)";
      const norm = abs.replace(/[\\/]+$/, "");
      const rel = path.relative(this.repoRoot, norm);
      const isMain = !rel || (!rel.startsWith(".fleet") && rel.split(/[\\/]/).length <= 1 && norm.toLowerCase() === this.repoRoot.toLowerCase()) ;
      const name = rel.startsWith(".fleet") ? path.basename(norm) : "main";
      infos.push({
        name,
        path: norm,
        relPath: rel || ".",
        branch,
        head: headLine ? headLine.slice(5).trim().slice(0, 9) : "?",
        isMain: name === "main" || !(rel.startsWith(".fleet")),
      });
    }
    return infos;
  }

  async create(rawName: string, task: string): Promise<{ ok: boolean; error?: string; info?: WorktreeInfo }> {
    const name = String(rawName || "").trim();
    if (!/^[a-z0-9][a-z0-9-_]{0,38}$/i.test(name)) return { ok: false, error: "invalid name (use letters/digits/-/_)" };
    const all = await this.list();
    if (all.some((w) => w.name === name)) return { ok: false, error: `worktree '${name}' already exists` };
    const dir = path.join(this.fleetDir(), name);
    let out: string;
    try {
      out = await this.git(`git worktree add -b fleet/${name} "${dir}"`);
    } catch (e: any) {
      const msg = String(e.message || "");
      if (/already exists|branch/i.test(msg)) {
        try {
          out = await this.git(`git worktree add "${dir}" fleet/${name}`);
        } catch (e2: any) {
          return { ok: false, error: String(e2.message).slice(0, 300) };
        }
      } else {
        return { ok: false, error: msg.slice(0, 300) };
      }
    }
    this.meta[name] = { task: String(task || "").slice(0, 500), createdAt: Date.now() };
    this.persistMeta();
    return { ok: true, info: { name, path: dir, relPath: `.fleet\\${name}`, branch: `fleet/${name}`, head: "", isMain: false } };
  }

  async remove(name: string): Promise<{ ok: boolean; error?: string }> {
    const dir = path.join(this.fleetDir(), name);
    if (!dir.toLowerCase().startsWith(this.fleetDir().toLowerCase())) return { ok: false, error: "bad path" };
    try {
      await this.git(`git worktree remove --force "${dir}"`);
    } catch (e: any) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
      try { await this.git(`git worktree prune`); } catch { /* ignore */ }
    }
    try { await this.git(`git branch -D fleet/${name}`); } catch { /* branch may be merged */ }
    delete this.meta[name];
    this.persistMeta();
    return { ok: true };
  }

  async merge(name: string): Promise<{ ok: boolean; output: string }> {
    try {
      const output = await this.git(`git merge --no-edit fleet/${name}`);
      return { ok: true, output: output.slice(0, 3000) };
    } catch (e: any) {
      try { await this.git(`git merge --abort`); } catch { /* nothing to abort */ }
      return { ok: false, output: String(e.message).slice(0, 3000) };
    }
  }

  async inspect(name: string): Promise<{ dirty: number; ahead: number; log: string[]; changedFiles: string[] }> {
    const dir = path.join(this.fleetDir(), name);
    let dirty = 0;
    let changedFiles: string[] = [];
    try {
      const st = await this.git(`git status --porcelain`, dir);
      changedFiles = st.split(/\r?\n/).filter(Boolean).map((l) => l.slice(3).trim());
      dirty = changedFiles.length;
    } catch { /* ignore */ }
    let ahead = 0;
    try {
      const base = (await this.list()).find((w) => w.isMain)?.branch || "master";
      const c = await this.git(`git rev-list --count ${base}..fleet/${name}`);
      ahead = parseInt(c.trim() || "0", 10) || 0;
    } catch { /* ignore */ }
    let log: string[] = [];
    try {
      const l = await this.git(`git log --oneline -5`, dir);
      log = l.split(/\r?\n/).filter(Boolean);
    } catch { /* ignore */ }
    return { dirty, ahead, log, changedFiles };
  }

  async run(name: string, command: string): Promise<{ ok: boolean; output: string }> {
    const dir = path.join(this.fleetDir(), name);
    if (!dir.toLowerCase().startsWith(this.fleetDir().toLowerCase())) return { ok: false, output: "bad path" };
    if (!command.trim()) return { ok: false, output: "empty command" };
    try {
      const out = await execP(command, { cwd: dir, timeout: 120000, maxBuffer: 1024 * 1024 });
      const text = `${out.stdout || ""}\n${out.stderr || ""}`.trim();
      return { ok: true, output: text.slice(0, 8000) || "(no output)" };
    } catch (e: any) {
      return { ok: false, output: `${String(e.stdout || "")}${String(e.stderr || "")}${e.message}`.slice(0, 8000) };
    }
  }

  taskOf(name: string): string {
    return this.meta[name]?.task || "";
  }
}
