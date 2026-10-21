// gsk-core/bridges/omniroute-inproc.js
// Lightweight worker-pool that runs OmniRoute routing engine in a worker thread or child process.
// Feature-flagged POC: enable with env GSK_OMNIROUTE_INPROC=true

const { Worker, isMainThread, parentPort } = require('worker_threads');
const path = require('path');
const os = require('os');

class OmniRouteInprocPool {
  constructor(opts = {}) {
    this.enabled = process.env.GSK_OMNIROUTE_INPROC === 'true';
    this.workerCount = opts.workerCount || Math.max(1, Math.floor(os.cpus().length / 2));
    this.workers = [];
    this.next = 0;
    this.requestId = 1;
    this.pending = new Map();

    if (this.enabled) {
      for (let i = 0; i < this.workerCount; i++) {
        this._spawnWorker(i);
      }
      console.log(`[omniroute-inproc] enabled with ${this.workerCount} workers`);
    } else {
      console.log('[omniroute-inproc] disabled (GSK_OMNIROUTE_INPROC != true)');
    }
  }

  _spawnWorker(index) {
    const workerPath = path.resolve(__dirname, 'omniroute-worker.js');
    const worker = new Worker(workerPath, { env: process.env });
    worker.on('message', (msg) => this._onWorkerMessage(msg));
    worker.on('error', (err) => console.error(`[omniroute-inproc] worker error:`, err));
    worker.on('exit', (code) => {
      console.warn(`[omniroute-inproc] worker ${index} exited with ${code}, respawning in 1s`);
      setTimeout(() => this._spawnWorker(index), 1000);
    });
    this.workers.push(worker);
  }

  _onWorkerMessage(msg) {
    const { id, ok, result, error } = msg;
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    if (ok) p.resolve(result);
    else p.reject(new Error(error || 'omniroute-inproc: unknown error'));
  }

  async routeRequest(payload, { timeoutMs = 30000 } = {}) {
    if (!this.enabled) {
      throw new Error('omniroute-inproc disabled. Set GSK_OMNIROUTE_INPROC=true to enable.');
    }
    if (this.workers.length === 0) {
      throw new Error('No workers available');
    }
    const id = (this.requestId++).toString();
    const worker = this.workers[this.next % this.workers.length];
    this.next += 1;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('omniroute-inproc: timeout'));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (res) => { clearTimeout(timer); resolve(res); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      try {
        worker.postMessage({ id, payload });
      } catch (e) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(e);
      }
    });
  }
}

module.exports = { OmniRouteInprocPool };
