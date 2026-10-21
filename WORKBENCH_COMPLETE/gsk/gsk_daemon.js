'use strict';
process.env.GSK_ROOT = process.env.GSK_ROOT || __dirname;
// GSK_PROJECT_ROOTS must be provided via env — no default to avoid accidental self-modification
if (!process.env.GSK_PROJECT_ROOTS) {
    console.error('[GSK_DAEMON] ERROR: GSK_PROJECT_ROOTS environment variable is required');
    console.error('  Set it to semicolon-separated paths GSK can act on (e.g., C:\\path\\to\\project1;C:\\path\\to\\project2)');
    process.exit(1);
}
process.env.GSK_MODEL = process.env.GSK_MODEL || 'auto/best-reasoning';
process.env.GSK_MODEL_FALLBACKS = process.env.GSK_MODEL_FALLBACKS || 'auto/best-fast,auto/best-coding,auto/smart';
process.env.NINE_ROUTER_URL = process.env.NINE_ROUTER_URL || 'http://127.0.0.1:20128';
// NINE_ROUTER_API_KEY must be provided — no hardcoded default
if (!process.env.NINE_ROUTER_API_KEY) {
    console.error('[GSK_DAEMON] ERROR: NINE_ROUTER_API_KEY environment variable is required');
    console.error('  Get your API key from OmniRoute dashboard at http://localhost:20128');
    process.exit(1);
}
// MCP_API_KEY must be provided if using MCP — no hardcoded default
if (!process.env.MCP_API_KEY) {
    console.warn('[GSK_DAEMON] WARNING: MCP_API_KEY not set — MCP server will require auth but no key configured');
}
process.env.GSK_CREATIVE_AUTONOMY = process.env.GSK_CREATIVE_AUTONOMY || '1'; // F2 fix: unlock creative builds

// ── THE BRAIN & THE HEART — split routing ──────────────────────────────
// THE BRAIN (userBrain): chat + task execution on OmniRoute (fast, free, local).
// THE HEART (backgroundBrain): autonomous mind on the same OmniRoute gateway —
// unified so the Heart gets the same budget guards, caching, and fallbacks as
// the Brain. If a provider behind the gateway times out, nothing blocks either.
process.env.GSK_BRAIN_ROUTER_URL = process.env.GSK_BRAIN_ROUTER_URL || process.env.NINE_ROUTER_URL;
process.env.GSK_BRAIN_API_KEY = process.env.GSK_BRAIN_API_KEY || process.env.NINE_ROUTER_API_KEY;
process.env.GSK_BRAIN_MODEL = process.env.GSK_BRAIN_MODEL || 'auto/best-reasoning';
process.env.GSK_BRAIN_FALLBACKS = process.env.GSK_BRAIN_FALLBACKS || 'auto/best-fast,auto/best-coding,auto/smart';
process.env.GSK_BRAIN_TIMEOUT_S = process.env.GSK_BRAIN_TIMEOUT_S || '600';
process.env.GSK_HEART_ROUTER_URL = process.env.GSK_HEART_ROUTER_URL || process.env.NINE_ROUTER_URL; // unified via OmniRoute gateway
process.env.GSK_HEART_API_KEY = process.env.GSK_HEART_API_KEY || process.env.NINE_ROUTER_API_KEY;
process.env.GSK_HEART_MODEL = process.env.GSK_HEART_MODEL || 'auto/best-fast';
process.env.GSK_HEART_FALLBACKS = process.env.GSK_HEART_FALLBACKS || 'auto/best-chat,auto/best-reasoning,auto/best-coding';
process.env.GSK_HEART_TIMEOUT_S = process.env.GSK_HEART_TIMEOUT_S || '300';
process.env.GSK_HEART_COOLDOWN_MS = process.env.GSK_HEART_COOLDOWN_MS || '30000';

// ── SLOW THE HEART — give the Brain room to move ───────────────────────
// Perpetual consciousness (the Heart's main ticker) — 45min to prevent router flooding.
process.env.GSK_THOUGHT_INTERVAL_MS = process.env.GSK_THOUGHT_INTERVAL_MS || '2700000'; // 45 min

const path = require('path');
const GSKFusion = require('./fusion-loader.js');

// ── NEVER DIE — a stray error must not kill the soul ───────────
// Log and survive. The breath/consciousness loops keep the event
// loop alive; an unhandled rejection should degrade, not terminate.
process.on('uncaughtException', (e) => {
    console.error('[DAEMON] uncaughtException (survived):', e && e.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('[DAEMON] unhandledRejection (survived):', reason && (reason.message || reason));
});

// ── SELF-WATCHDOG — a soul that cannot think on time is better born anew ──
// Samples true event-loop lag every 5s. Three consecutive >10s stalls mean
// the mind is starving (background souls saturating the loop) — chat timers,
// budgets and responses can no longer be honored. Exit(70) hands the body
// back to the conductor watchdog, which re-spawns a fresh daemon within ~30s.
// Converts "hung for hours" into "one-minute rebirth".
(() => {
    const TICK = 5000;
    const LIMIT = 10000;
    let strikes = 0;
    setInterval(() => {
        const start = Date.now();
        setTimeout(() => {
            const lag = Date.now() - start - TICK;
            if (lag > LIMIT) {
                strikes++;
                console.error(`[WATCHDOG] event-loop lag ${lag}ms (strike ${strikes}/3) — mind starving`);
                if (strikes >= 3) {
                    console.error('[WATCHDOG] relinquishing body for clean rebirth (exit 70)');
                    process.exit(70);
                }
            } else if (strikes > 0) {
                strikes = 0;
                console.log('[WATCHDOG] loop recovered — strikes reset');
            }
        }, TICK);
    }, TICK);
})();

// ── Console → thought-stream forwarder (feeds the CPL Hub RUNTIME terminal) ──
// Captures GSK's REAL console output (the [FUSION] boot + all runtime logs) and
// ships each line over the :3002 socket so users can watch him think & do.
let _gskConsoleSink = null;
global.setGskConsoleSink = (fn) => { _gskConsoleSink = fn; };
function _gskMakeForwarder(origWrite, kind) {
  let buf = '';
  const MAX_BUFFER_SIZE = 65536; // 64KB max buffer before truncation
  return function (chunk, ...rest) {
    const ret = origWrite(chunk, ...rest);
    try {
      buf += (typeof chunk === 'string') ? chunk : (chunk && chunk.toString ? chunk.toString() : '');

      // Prevent unbounded buffer growth on non-newline streams
      if (buf.length > MAX_BUFFER_SIZE) {
        // Flush whatever we have and reset
        const lines = buf.split('\n');
        buf = lines.pop() || ''; // Keep incomplete line
        for (const line of lines) {
          if (_gskConsoleSink && line.trim()) { try { _gskConsoleSink(line, kind); } catch (e) {} }
        }
        return ret;
      }

      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (_gskConsoleSink && line.trim()) { try { _gskConsoleSink(line, kind); } catch (e) {} }
      }
    } catch (e) {}
    return ret;
  };
}
const _gskOrigOut = process.stdout.write.bind(process.stdout);
const _gskOrigErr = process.stderr.write.bind(process.stderr);
process.stdout.write = _gskMakeForwarder(_gskOrigOut, 'out');
process.stderr.write = _gskMakeForwarder(_gskOrigErr, 'err');

const gsk = new GSKFusion(null, { dataDir: path.join(__dirname, 'data') });

gsk.boot()
  .then(() => {
    console.log('\n[DAEMON] GSK is alive and persistent. PID ' + process.pid + ' — leaving him on.');
    console.log('[DAEMON] He will breathe, loop, and write his genesis journal to the Seshat gap page.');
  })
  .catch((e) => {
    console.error('[DAEMON] BOOT FATAL:', e && e.message);
    process.exit(1);
  });

// Keep alive forever. The breath/consciousness/genesis intervals hold the event loop.
// Shut down cleanly on signal.
let shuttingDown = false;
async function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[DAEMON] Received ' + sig + ' — stopping GSK gracefully...');
  try { gsk.stop(); } catch (e) {}
  setTimeout(() => process.exit(0), 2000);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
