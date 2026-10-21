const path = require('path');
const fetch = global.fetch || require('node-fetch');
const { OmniRouteInprocPool } = require('./omniroute-inproc');

// Singleton pool
let pool = null;
function getPool() {
  if (!pool) {
    pool = new OmniRouteInprocPool({});
  }
  return pool;
}

function shouldUseInprocCanary() {
  // If globally disabled, never use inproc
  if (process.env.GSK_OMNIROUTE_INPROC !== 'true') return false;
  // If a forced opt-in is present, always use inproc
  if (process.env.GSK_OMNIROUTE_INPROC_FORCE === 'true') return true;
  // Percent-based canary
  const pct = parseFloat(process.env.GSK_OMNIROUTE_CANARY_PERCENT || '0');
  if (!pct || pct <= 0) return false;
  const roll = Math.random() * 100;
  return roll < pct;
}

async function callExternalOmniRoute(payload, opts = {}) {
  const OMNIROUTE_URL = process.env.OMNIROUTE_URL || process.env.NINE_ROUTER_URL || 'http://127.0.0.1:20128';
  const apiKey = process.env.OMNIROUTE_API_KEY || process.env.GSK_BRAIN_API_KEY || process.env.NINE_ROUTER_API_KEY || '';
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs || 30000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${OMNIROUTE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': 'Bearer ' + apiKey } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await res.json().catch(() => null);
    const now = Date.now();
    const provenance = {
      source: 'omniroute-external',
      modelId: (data && data.model) || payload.model || null,
      provider: (data && data.provider) || null,
      fetchedAt: new Date().toISOString(),
      latency: null
    };
    // If the external service returns timing info, attach it
    if (data && data.__meta && data.__meta.latency) provenance.latency = data.__meta.latency;
    clearTimeout(timer);
    return { ...(data || {}), __provenance: provenance };
  } catch (e) {
    clearTimeout(timer);
    throw new Error(`omniroute-adapter: external call failed: ${e && e.message}`);
  }
}

async function routeRequest({ prompt, model, routeHints, traceId } = {}, opts = {}) {
  // Decide whether to use inproc or external route based on canary
  const useInproc = shouldUseInprocCanary();

  if (!useInproc) {
    // Fallback to external OmniRoute
    try {
      const externalPayload = { prompt, model, routeHints, traceId };
      const result = await callExternalOmniRoute(externalPayload, opts);
      return result;
    } catch (e) {
      // If external fails and inproc is enabled, try inproc as a best-effort fallback
      if (process.env.GSK_OMNIROUTE_INPROC === 'true') {
        console.warn('omniroute-adapter: external failed, attempting inproc fallback:', e.message);
        // fall through to inproc below
      } else {
        throw e;
      }
    }
  }

  // Inproc path
  if (process.env.GSK_OMNIROUTE_INPROC !== 'true') {
    throw new Error('omniroute-inproc disabled. Set GSK_OMNIROUTE_INPROC=true to enable.');
  }
  const p = getPool();
  const payload = { prompt, model, routeHints, traceId };
  const start = Date.now();
  const res = await p.routeRequest(payload, opts);
  const latency = res && res.__meta ? res.__meta.latency : Date.now() - start;

  // Attach provenance to the response
  const provenance = {
    source: 'omniroute-inproc',
    modelId: res.model || model || null,
    provider: res.provider || null,
    fetchedAt: new Date().toISOString(),
    latency
  };

  return { ...res, __provenance: provenance };
}

module.exports = { routeRequest };
