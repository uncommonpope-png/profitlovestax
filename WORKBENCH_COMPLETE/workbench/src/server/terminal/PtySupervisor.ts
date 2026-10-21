import * as os from "node:os";
import * as pty from "node-pty";

export class PtySupervisor {
  private ptyProcess: pty.IPty;
  private ws: any;

  constructor(ws: any, projectRoot: string, cols = 120, rows = 30) {
    this.ws = ws;
    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

    // Windows 1809+ native ConPTY engine allocation
    this.ptyProcess = pty.spawn(shell, [], {
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

    this.ptyProcess.onExit(({ exitCode }) => {
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
