// gsk/gsk-core/bridges/omniroute-worker.js
// Worker entry for the OmniRoute in-process POC.
// Listens for messages { id, payload } and replies with { id, ok, result } or { id, ok:false, error }.

const { parentPort } = require('worker_threads');
const path = require('path');

// Try to require the real OmniRoute routerEval if available. If not, fall back to a mock implementation.
let routerEval = null;
try {
  // Attempt to load OmniRoute's routerEval module from the repository
  // This path may need adjustment depending on OmniRoute internal structure.
  const candidate = path.resolve(__dirname, '../../../../omniroute/src/lib/routerEval');
  routerEval = require(candidate);
  console.log('[omniroute-worker] loaded routerEval from', candidate);
} catch (e) {
  console.warn('[omniroute-worker] could not load real routerEval; using mock. Error:', e && e.message);
  // Mock routerEval with a simple echoing route handler for POC
  routerEval = {
    async route(request) {
      // Simulate routing and model selection latency
      await new Promise((r) => setTimeout(r, 50));
      return {
        model: request.model || 'mock-model',
        provider: 'mock-provider',
        response: `Echo: ${request.prompt || request.input || JSON.stringify(request)}`,
        meta: { mocked: true }
      };
    }
  };
}

if (!parentPort) throw new Error('omniroute-worker must be run as a Worker thread');

parentPort.on('message', async (msg) => {
  const { id, payload } = msg;
  try {
    // Expected payload: { prompt, model, routeHints, traceId }
    const start = Date.now();
    const result = await routerEval.route(payload);
    const latency = Date.now() - start;
    parentPort.postMessage({ id, ok: true, result: { ...result, __meta: { latency } } });
  } catch (err) {
    parentPort.postMessage({ id, ok: false, error: err && err.message });
  }
});
