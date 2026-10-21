import * as os from "node:os";

// F1 (field-test fix, Oct 2026): node-pty is an OPTIONAL dependency.
// Its native build legitimately fails on some platforms — no prebuild
// for the platform, no node-gyp toolchain, or a sandbox that refuses
// the build (the Oct 2026 field test's Linux VM: node-gyp could not
// even extract the Node headers, and because node-pty was a HARD
// dependency the whole `npm install` exited 1). A top-level static
// import would also make a missing binary fatal to server.ts at
// module load. So it is loaded lazily and guarded here: when the
// native module cannot load, the terminal reports itself unavailable
// and everything else in the workbench boots and runs unaffected.
let ptyLib: any = null;
let ptyLoadError: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ptyLib = require("node-pty");
} catch (e: any) {
  ptyLoadError = (e && e.message) || String(e);
}

export class PtySupervisor {
  private ptyProcess: any;
  private ws: any;

  constructor(ws: any, projectRoot: string, cols = 120, rows = 30) {
    this.ws = ws;
    if (!ptyLib) {
      const msg = `[PtySupervisor] Terminal unavailable on this platform: the node-pty native module could not be loaded (${ptyLoadError || "not installed"}). This affects only the terminal tab — the rest of the workbench is unaffected.`;
      console.error(msg);
      try {
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: "stdout", data: msg + "\r\n" }));
      } catch { /* socket may already be gone */ }
      throw new Error(msg);
    }
    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

    // Windows 1809+ native ConPTY engine allocation
    this.ptyProcess = ptyLib.spawn(shell, [], {
      name: "xterm-256color",
      cols,
      rows,
      cwd: projectRoot,
      env: process.env as Record<string, string>,
      useConpty: true,
    });

    this.ptyProcess.onData((data: string) => {
      if (this.ws.readyState === 1) {
        this.ws.send(JSON.stringify({ type: "stdout", data }));
      }
    });

    this.ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
      if (this.ws.readyState === 1) {
        this.ws.send(JSON.stringify({ type: "exit", code: exitCode }));
      }
    });

    this.bindSocketEvents();
  }

  private bindSocketEvents(): void {
    this.ws.on("message", (message: Buffer | string) => {
      try {
        const text = typeof message === "string" ? message : message.toString("utf-8");
        const payload = JSON.parse(text);
        if (payload.type === "stdin") {
          this.ptyProcess.write(payload.data);
        } else if (payload.type === "resize") {
          this.ptyProcess.resize(payload.cols, payload.rows);
        }
      } catch (err) {
        console.error("[PtySupervisor] Bad packet", err);
      }
    });

    this.ws.on("close", () => {
      try { this.ptyProcess.kill(); } catch { /* already gone */ }
    });
  }
}
