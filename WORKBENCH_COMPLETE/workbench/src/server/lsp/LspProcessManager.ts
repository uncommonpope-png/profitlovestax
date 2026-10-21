import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";

export class LspProcessManager {
  private serverProc: ChildProcessWithoutNullStreams;
  private ws: any;
  private buffer: Buffer = Buffer.alloc(0);

  constructor(ws: any, projectRoot: string) {
    this.ws = ws;
    // Spawns typescript-language-server over stdio
    this.serverProc = spawn("npx.cmd", ["typescript-language-server", "--stdio"], {
      cwd: projectRoot,
      shell: true,
      env: process.env as Record<string, string>,
    });

    this.serverProc.stdout.on("data", (chunk: Buffer) => this.handleServerData(chunk));
    this.serverProc.stderr.on("data", (err) => console.error("[LSP Stderr]", err.toString()));

    this.ws.on("message", (msg: Buffer | string) => this.forwardToLsp(msg));
    this.ws.on("close", () => this.serverProc.kill());
  }

  private handleServerData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;

      const header = this.buffer.subarray(0, headerEnd).toString("utf-8");
      const match = header.match(/Content-Length: (\d+)/i);
      if (!match) break;

      const contentLength = parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + contentLength;

      if (this.buffer.length < bodyEnd) break; // Incomplete packet

      const payload = this.buffer.subarray(bodyStart, bodyEnd).toString("utf-8");
      this.buffer = this.buffer.subarray(bodyEnd);

      if (this.ws.readyState === 1) {
        this.ws.send(payload);
      }
    }
  }

  private forwardToLsp(msg: Buffer | string): void {
    const text = typeof msg === "string" ? msg : msg.toString("utf-8");
    const payload = Buffer.from(text, "utf-8");
    const header = `Content-Length: ${payload.length}\r\n\r\n`;
    this.serverProc.stdin.write(header + text);
  }
}
