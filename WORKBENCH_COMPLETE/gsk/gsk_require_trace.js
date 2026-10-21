// gsk_require_trace.js
// Seshat Runtime Require Tracer
// Captures actual runtime require() activity, including dynamic loads
// that static import-graph tracers may miss.

const Module = require("node:module");
const fs = require("node:fs");
const path = require("node:path");

const originalLoad = Module._load;

const state = {
  startedAt: new Date().toISOString(),
  loaded: new Map(),
  failed: [],
};

function ensureReportsDir() {
  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  return reportsDir;
}

function safeResolve(request, parent) {
  try {
    return Module._resolveFilename(request, parent);
  } catch (err) {
    return null;
  }
}

function isExternalOrNodeInternal(request) {
  return (
    request.startsWith("node:") ||
    request.includes("node_modules") ||
    request.startsWith("internal/")
  );
}

function writeReports() {
  try {
    const reportsDir = ensureReportsDir();
    const loadedArray = [...state.loaded.values()].sort((a, b) =>
      a.resolved.localeCompare(b.resolved)
    );
    const summary = {
      startedAt: state.startedAt,
      endedAt: new Date().toISOString(),
      totalNonNodeModulesLoaded: loadedArray.length,
      totalFailedRequires: state.failed.length,
    };
    const loadedOut = { summary, loaded: loadedArray };
    const failedOut = { summary, failed: state.failed };
    fs.writeFileSync(path.join(reportsDir, "runtime-required.json"), JSON.stringify(loadedOut, null, 2));
    fs.writeFileSync(path.join(reportsDir, "runtime-require-failures.json"), JSON.stringify(failedOut, null, 2));
    fs.writeFileSync(path.join(reportsDir, "runtime-require-summary.json"), JSON.stringify(summary, null, 2));
    console.log("\n[SESHAT_REQUIRE_TRACE] Reports written:");
    console.log(`  ${summary.totalNonNodeModulesLoaded} local modules loaded`);
    console.log(`  ${summary.totalFailedRequires} failed requires`);
  } catch (err) {
    console.error("[SESHAT_REQUIRE_TRACE] Failed to write reports:", err.message);
  }
}

Module._load = function (request, parent, isMain) {
  const parentFile = parent && parent.filename ? parent.filename : "unknown";
  try {
    const resolved = safeResolve(request, parent);
    const result = originalLoad.apply(this, arguments);
    if (resolved && !isExternalOrNodeInternal(request)) {
      if (!state.loaded.has(resolved)) {
        state.loaded.set(resolved, {
          resolved,
          firstRequiredBy: parentFile,
          requiredBySample: [parentFile],
          firstLoadedAt: new Date().toISOString(),
          lastLoadedAt: new Date().toISOString(),
          loadCount: 0,
        });
      }
      const record = state.loaded.get(resolved);
      record.loadCount += 1;
      record.lastLoadedAt = new Date().toISOString();
      if (record.requiredBySample.length < 20 && !record.requiredBySample.includes(parentFile)) {
        record.requiredBySample.push(parentFile);
      }
    }
    return result;
  } catch (err) {
    if (!isExternalOrNodeInternal(request)) {
      state.failed.push({ request, parentFile, error: err.message, at: new Date().toISOString() });
    }
    throw err;
  }
};

// SESHAT PATCH: Periodic snapshot for daemon hard-kills
const SNAPSHOT_INTERVAL_MS = 15000;
const outDir = path.join(process.cwd(), "reports");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const snapshotFile = path.join(outDir, "runtime-required-snapshot.json");

const writeSnapshot = () => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      totalLoaded: state.loaded.size,
      files: [...state.loaded.keys()].sort()
    };
    fs.writeFileSync(snapshotFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("[SESHAT_REQUIRE_TRACE] Snapshot write failed:", err.message);
  }
};

const intervalId = setInterval(writeSnapshot, SNAPSHOT_INTERVAL_MS);
if (intervalId.unref) intervalId.unref();
console.log(`[SESHAT_REQUIRE_TRACE] Snapshotting every ${SNAPSHOT_INTERVAL_MS/1000}s to ${snapshotFile}`);

process.on("exit", writeReports);
process.on("SIGINT", () => { writeReports(); process.exit(130); });
process.on("SIGTERM", () => { writeReports(); process.exit(143); });

console.log("[SESHAT_REQUIRE_TRACE] Runtime require tracing active");
