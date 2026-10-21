import chokidar, { FSWatcher } from "chokidar";

const IGNORED = /(^|[\\/])(node_modules|\.git|dist|\.build|logs|\.next|coverage|\.fleet|\.vite|out)([\\/]|$)|(^|[\\/])gsk[\\/]data([\\/]|$)/;

interface WsLike {
  readyState: number;
  send: (data: string) => void;
  on: (ev: string, cb: (arg?: any) => void) => void;
}

/**
 * WatchHub — ONE chokidar watcher for the whole process, fanned out to every
 * connected browser client. The Downloads-scale root takes ~20s+ for its
 * initial scan, so a per-client watcher would pay that tax on every tab open.
 * Late joiners get an immediate {"type":"ready"} — chokidar swallows FS
 * mutations that occur during the initial scan, so arming state is explicit.
 */
export class WatchHub {
  private watcher: FSWatcher | null = null;
  private armed = false;
  private clients = new Set<WsLike>();

  constructor(private root: string) {}

  addClient(ws: WsLike): void {
    this.clients.add(ws);
    ws.on("close", () => this.clients.delete(ws));
    ws.on("error", () => this.clients.delete(ws));

    if (!this.watcher) this.start();

    if (this.armed) this.sendReady(ws);
  }

  private start(): void {
    this.watcher = chokidar.watch(this.root, {
      ignoreInitial: true,
      ignored: IGNORED,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 120 },
    });

    const fanOut = (type: string) => (p: string) => {
      const payload = JSON.stringify({ type, path: p });
      for (const c of this.clients) {
        if (c.readyState === 1) {
          try { c.send(payload); } catch { /* closing */ }
        }
      }
    };

    this.watcher
      .on("add", fanOut("add"))
      .on("change", fanOut("change"))
      .on("unlink", fanOut("unlink"))
      .on("addDir", fanOut("addDir"))
      .on("unlinkDir", fanOut("unlinkDir"))
      .on("error", () => {})
      .on("ready", () => {
        this.armed = true;
        console.log(`[WatchHub] armed on ${this.root} (${this.clients.size} client(s))`);
        for (const c of this.clients) this.sendReady(c);
      });
  }

  private sendReady(ws: WsLike): void {
    if (ws.readyState === 1) {
      try { ws.send(JSON.stringify({ type: "ready", path: this.root })); } catch {}
    }
  }

  get stats(): { clients: number; armed: boolean } {
    return { clients: this.clients.size, armed: this.armed };
  }
}
