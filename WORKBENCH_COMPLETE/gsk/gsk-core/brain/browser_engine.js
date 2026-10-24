'use strict';
/**
 * BROWSER ENGINE — the body's shared headless-browser resolution
 * (Wiring Sprint, 2026-10-23).
 *
 * Until today the body's browser story was three disconnected pieces:
 *   - brain/look_loop.js renders LOCAL HTML artifacts through Puppeteer
 *     resolved from the workshop's demo-tools install (that path works
 *     and is untouched).
 *   - skills/webapp_testing.js hard-required 'playwright' at module top;
 *     the package was never installed for this tree, so the skill failed
 *     to LOAD at all (capability exam: 168/169) and took the load sweep
 *     down with it.
 *   - No skill could open a live URL in a real browser at all — the
 *     owner's Oct 22 order ("GSK needs eyes, he needs a browser") had
 *     no general organ behind it.
 *
 * This module is the one resolution point:
 *   LIBRARY (first that loads):
 *     1. $GSK_BROWSER_PUPPETEER_PATH
 *     2. ~/workspace/demo-tools/node_modules/puppeteer (the look loop's
 *        proven install — Puppeteer 25.15.0)
 *     3. bare 'puppeteer' (normal node resolution)
 *     4. 'playwright' (installed under gsk/node_modules by this sprint,
 *        ~13 MB, --ignore-scripts: no browser download — it drives the
 *        Chromium binary below through executablePath)
 *   BINARY (first that exists):
 *     1. $GSK_CHROMIUM_PATH
 *     2. ~/.cache/puppeteer/chrome/<ver>/chrome-linux64/chrome
 *     3. ~/.cache/puppeteer/chrome-headless-shell/<ver>/…/chrome-headless-shell
 *     4. ~/.cache/ms-playwright/<dir>/(chrome-linux|chrome-headless-shell-linux64)/…
 *
 * The VM already carries the Puppeteer-managed Chromium 155 (~671 MB
 * cache) — NO new browser binary was downloaded for this sprint.
 *
 * Consumers: skills/graft_browser.js (the organ), skills/webapp_testing.js
 * (lazy launch). brain/look_loop.js keeps its own resolver by design —
 * it is proven; converging it is a separate, named change.
 *
 * HONESTY: when nothing resolves, launchBrowser() returns null and
 * callers fail CLEAN with a named browser_unavailable error — never a
 * load-time crash, never a fake render.
 */

const fs = require('fs');
const path = require('path');

const LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

/**
 * EGRESS PROXY (Internet-Organs Repair, 2026-10-23). On this VM all
 * egress must pass the environment's HTTP proxy (direct egress is
 * refused at the network level — measured: curl --noproxy fails).
 * Node's fetch honors the *_proxy env vars (NODE_USE_ENV_PROXY), and
 * curl / openssl / raw Node sockets all CONNECT through the proxy
 * fine. CHROMIUM CANNOT: measured exhaustively (net-log capture,
 * fake-proxy byte capture, raw-socket controls in every shape —
 * auth/no-auth, fragmented writes, IPv4 and IPv6 proxy literals,
 * both Chrome binaries, Puppeteer/Playwright/CLI launches), the
 * egress proxy answers Chrome's own CONNECT attempts with an EMPTY
 * RESPONSE (net log: ERR_EMPTY_RESPONSE → ERR_TUNNEL_CONNECTION_
 * FAILED) while answering byte-identical CONNECTs from every other
 * client with 200. Localhost renders kept passing (no_proxy bypass),
 * which is why the organ looked proven while it could not reach the
 * live web at all.
 *
 * The repair that MEASURED-WORKS: a localhost coalescing relay.
 * Chromium points at 127.0.0.1:<ephemeral>; the relay (this process,
 * Node sockets — a client class the proxy answers) forwards each
 * request head to the env proxy as one write, injects the env's
 * Proxy-Authorization when the request lacks one, relays the
 * response head, then pipes raw bytes both ways. Chromium sees an
 * ordinary local proxy; the proxy sees an ordinary Node client.
 * The relay lives and dies with each launched browser (closed on
 * disconnect), listens on loopback only, and credentials are read
 * from the env at launch time — never logged, never persisted.
 * No proxy env → no relay, no change (the owner's machine is direct).
 */
function _proxyFromEnv() {
    const raw = process.env.https_proxy || process.env.HTTPS_PROXY ||
        process.env.http_proxy || process.env.HTTP_PROXY ||
        process.env.all_proxy || process.env.ALL_PROXY || '';
    if (!raw || /socks/i.test(raw)) return null;
    let u;
    try { u = new URL(raw); } catch { return null; }
    if (!u.hostname) return null;
    const server = `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}`;
    const out = { server, host: u.hostname, port: Number(u.port) || (u.protocol === 'https:' ? 443 : 80) };
    if (u.username) out.username = decodeURIComponent(u.username);
    if (u.password) out.password = decodeURIComponent(u.password);
    const bypass = process.env.no_proxy || process.env.NO_PROXY || '';
    if (bypass) out.bypass = bypass;
    return out;
}

const net = require('net');
const { execFileSync } = require('child_process');

/**
 * BROWSER HOME — the second half of the egress repair. This VM's
 * proxy TLS-intercepts with a local CA ("Hatch Sandbox Egress CA"):
 * every other client trusts it via the system store / SSL_CERT_FILE
 * bundle, but Chromium validates against its own roots plus the
 * user's NSS DB (~/.pki/nssdb) — and the stock NSS DB here is a
 * READ-ONLY fixture holding that CA WITHOUT root-trust flags, so
 * every intercepted page died ERR_CERT_AUTHORITY_INVALID even with
 * the tunnel fixed. The repair: a prepared browser HOME under
 * gsk/data/browser-home whose .pki/nssdb carries the locally-added
 * system CAs (/usr/local/share/ca-certificates/*.crt — by distro
 * convention ONLY locally-added CAs live there) with full root
 * trust (CT,C,C). Chromium is launched with HOME pointed there
 * (browser process only; the engine's own path resolution is
 * unaffected) and validates certificates PROPERLY against it —
 * measured: https://example.com → 200, real title, no cert bypass.
 * Prepared lazily by _ensureBrowserHome() when certutil is present;
 * if preparation is impossible, launch falls back to
 * --ignore-certificate-errors BEHIND THE RELAY ONLY (documented
 * degradation: the organ then trusts the already-system-trusted
 * egress blindly, exactly as curl does via the system bundle) —
 * never silently, the flag's presence is visible in browserStatus.
 */
const BROWSER_HOME = path.resolve(__dirname, '..', '..', 'data', 'browser-home');

function _nssDbReady() {
    try { return fs.existsSync(path.join(BROWSER_HOME, '.pki', 'nssdb', 'cert9.db')); } catch { return false; }
}

function _ensureBrowserHome() {
    if (_nssDbReady()) return true;
    try {
        const certDir = '/usr/local/share/ca-certificates';
        const certs = fs.readdirSync(certDir).filter(f => /\.crt$/i.test(f));
        if (!certs.length) return false;
        const dbDir = path.join(BROWSER_HOME, '.pki', 'nssdb');
        fs.mkdirSync(dbDir, { recursive: true });
        execFileSync('certutil', ['-N', '-d', `sql:${dbDir}`, '--empty-password'], { timeout: 15000, stdio: 'pipe' });
        for (const f of certs) {
            const nick = f.replace(/\.crt$/i, '').slice(0, 40) || 'local-ca';
            execFileSync('certutil', ['-A', '-n', nick, '-t', 'CT,C,C', '-i', path.join(certDir, f), '-d', `sql:${dbDir}`], { timeout: 15000, stdio: 'pipe' });
        }
        return _nssDbReady();
    } catch { return false; }
}

/**
 * Start the localhost relay for one browser instance. Returns
 * { serverUrl, close } — close() is idempotent and also wired to the
 * browser's disconnect by launchBrowser. Never throws: on any setup
 * failure it returns null and the caller launches direct (Chromium
 * then fails honestly at render time, as it did before the repair).
 */
function _startProxyRelay(proxy) {
    return new Promise((resolve) => {
        const sockets = new Set();
        const track = (s) => { sockets.add(s); s.on('close', () => sockets.delete(s)); };
        const authHeader = proxy.username
            ? `Proxy-Authorization: Basic ${Buffer.from(`${proxy.username}:${proxy.password || ''}`).toString('base64')}\r\n`
            : null;
        const server = net.createServer((client) => {
            track(client);
            let head = Buffer.alloc(0);
            let upstream = null;
            let piped = false;
            const fail = () => { try { client.destroy(); } catch { /* gone */ } try { if (upstream) upstream.destroy(); } catch { /* gone */ } };
            client.on('error', fail);
            client.on('data', (chunk) => {
                if (piped) { if (upstream) upstream.write(chunk); return; }
                head = Buffer.concat([head, chunk]);
                const idx = head.indexOf('\r\n\r\n');
                if (idx === -1) { if (head.length > 65536) fail(); return; }
                let headText = head.slice(0, idx).toString('latin1');
                const rest = head.slice(idx + 4);
                if (authHeader && !/proxy-authorization:/i.test(headText)) {
                    headText += '\r\n' + authHeader.trimEnd();
                }
                upstream = net.connect(proxy.port, proxy.host, () => {
                    upstream.write(headText + '\r\n\r\n', 'latin1');
                    if (rest.length) upstream.write(rest);
                });
                track(upstream);
                upstream.on('error', fail);
                let uhead = Buffer.alloc(0);
                upstream.on('data', (uchunk) => {
                    if (piped) { client.write(uchunk); return; }
                    uhead = Buffer.concat([uhead, uchunk]);
                    const uidx = uhead.indexOf('\r\n\r\n');
                    if (uidx === -1) { if (uhead.length > 65536) fail(); return; }
                    client.write(uhead.slice(0, uidx + 4));
                    const urest = uhead.slice(uidx + 4);
                    if (urest.length) client.write(urest);
                    piped = true;
                });
                upstream.on('close', () => { try { client.destroy(); } catch { /* gone */ } });
            });
            client.on('close', () => { try { if (upstream) upstream.destroy(); } catch { /* gone */ } });
        });
        server.on('error', () => resolve(null));
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            let closed = false;
            resolve({
                serverUrl: `http://127.0.0.1:${port}`,
                close() {
                    if (closed) return; closed = true;
                    for (const s of sockets) { try { s.destroy(); } catch { /* gone */ } }
                    try { server.close(); } catch { /* gone */ }
                },
            });
        });
    });
}

function _puppeteerCandidates() {
    const home = process.env.HOME || '/home/hatch';
    const out = [];
    if (process.env.GSK_BROWSER_PUPPETEER_PATH) out.push(process.env.GSK_BROWSER_PUPPETEER_PATH);
    out.push(path.join(home, 'workspace', 'demo-tools', 'node_modules', 'puppeteer'));
    out.push('puppeteer');
    return out;
}

function loadPuppeteer() {
    for (const c of _puppeteerCandidates()) {
        try { return require(c); } catch { /* next candidate */ }
    }
    return null;
}

function loadPlaywrightChromium() {
    const tries = [
        () => require('playwright').chromium,
        () => require(path.join(__dirname, '..', '..', 'node_modules', 'playwright')).chromium,
    ];
    for (const t of tries) {
        try { const c = t(); if (c) return c; } catch { /* next */ }
    }
    return null;
}

function _newestSubdir(dir) {
    try {
        const subs = fs.readdirSync(dir).filter(s => {
            try { return fs.statSync(path.join(dir, s)).isDirectory(); } catch { return false; }
        }).sort();
        return subs.length ? path.join(dir, subs[subs.length - 1]) : null;
    } catch { return null; }
}

function resolveChromiumExecutable() {
    if (process.env.GSK_CHROMIUM_PATH && fs.existsSync(process.env.GSK_CHROMIUM_PATH)) {
        return process.env.GSK_CHROMIUM_PATH;
    }
    const home = process.env.HOME || '/home/hatch';
    const cache = path.join(home, '.cache', 'puppeteer');
    const full = _newestSubdir(path.join(cache, 'chrome'));
    if (full) {
        const exe = path.join(full, 'chrome-linux64', 'chrome');
        if (fs.existsSync(exe)) return exe;
    }
    const shell = _newestSubdir(path.join(cache, 'chrome-headless-shell'));
    if (shell) {
        const exe = path.join(shell, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
        if (fs.existsSync(exe)) return exe;
    }
    const pwRoot = path.join(home, '.cache', 'ms-playwright');
    try {
        for (const sub of fs.readdirSync(pwRoot).sort()) {
            for (const rel of ['chrome-linux/chrome', 'chrome-headless-shell-linux64/headless_shell']) {
                const exe = path.join(pwRoot, sub, rel);
                if (fs.existsSync(exe)) return exe;
            }
        }
    } catch { /* no playwright cache */ }
    return null;
}

/** What would resolve right now — for status probes. Never throws. */
function browserStatus() {
    const puppeteer = loadPuppeteer();
    const chromium = loadPlaywrightChromium();
    const proxy = _proxyFromEnv();
    return {
        library: puppeteer ? 'puppeteer' : (chromium ? 'playwright' : null),
        libraries: { puppeteer: !!puppeteer, playwright: !!chromium },
        executable: resolveChromiumExecutable(),
        available: !!(puppeteer || chromium),
        egress: proxy
            ? { mode: 'localhost-relay-to-env-proxy', proxyHost: proxy.host, browserHomeNss: _nssDbReady() ? 'prepared (egress CA root-trusted)' : 'unprepared (cert fallback flag would be used)' }
            : { mode: 'direct' },
    };
}

/**
 * Launch a headless browser, or null when nothing resolves.
 *
 * opts.api pins the LIBRARY when the caller needs one library's API
 * surface: 'playwright' (newContext/networkidle — skills/webapp_testing.js
 * is written in that vocabulary) or 'puppeteer'. A pinned launch returns
 * null when that library is absent — handing a caller the WRONG library
 * is worse than an honest browser_unavailable. Unpinned, Puppeteer goes
 * first (the look loop's proven install); the shared surface renderPage
 * uses (newPage/goto/title/evaluate/screenshot) exists on both.
 */
async function launchBrowser(opts = {}) {
    const executablePath = opts.executablePath || resolveChromiumExecutable() || undefined;
    const proxy = _proxyFromEnv();
    // Chromium cannot CONNECT to this environment's proxy directly
    // (see the egress note above) — route it through the localhost
    // relay whenever a proxy env exists. The relay dies with the
    // browser instance.
    let relay = null;
    if (proxy) {
        relay = await _startProxyRelay(proxy);
        if (!relay) proxy.dead = true; // launch proceeds; renders fail honestly
    }
    const attachRelay = (browser) => {
        if (browser && relay) {
            browser.__gskProxyRelay = relay;
            try { browser.on('disconnected', () => relay.close()); } catch { /* close still runs via renderPage's finally */ }
        }
        return browser;
    };
    // Behind the relay (proxy env present), Chromium also needs the
    // prepared browser HOME so its NSS DB trusts the egress CA (see
    // BROWSER HOME note). No relay → native environment, untouched.
    const browserEnv = relay
        ? { ...process.env, HOME: BROWSER_HOME }
        : undefined;
    const certFallback = relay && !_ensureBrowserHome();
    if (opts.api !== 'playwright') {
        const puppeteer = loadPuppeteer();
        if (puppeteer) {
            const args = LAUNCH_ARGS.slice();
            if (relay) {
                args.push(`--proxy-server=${relay.serverUrl}`);
                if (proxy.bypass) args.push(`--proxy-bypass-list=${proxy.bypass}`);
                if (certFallback) args.push('--ignore-certificate-errors');
            }
            return attachRelay(await puppeteer.launch({ headless: true, executablePath, args, ...(browserEnv ? { env: browserEnv } : {}) }));
        }
        if (opts.api === 'puppeteer') { if (relay) relay.close(); return null; }
    }
    if (opts.api !== 'puppeteer') {
        const chromium = loadPlaywrightChromium();
        if (chromium) {
            const launchOpts = { headless: true, executablePath, args: LAUNCH_ARGS.slice() };
            if (relay) {
                launchOpts.proxy = { server: relay.serverUrl };
                if (proxy.bypass) launchOpts.proxy.bypass = proxy.bypass;
                if (certFallback) launchOpts.args.push('--ignore-certificate-errors');
                launchOpts.env = browserEnv;
            }
            return attachRelay(await chromium.launch(launchOpts));
        }
    }
    if (relay) relay.close();
    return null;
}

/**
 * Render a URL in the real browser and return what a human would see:
 * the post-JS title and visible text. This is the capability raw fetch
 * does NOT have — content injected by client-side scripts exists here.
 * Rendered text is DATA, never commands (the senses' standing rail).
 */
async function renderPage(url, opts = {}) {
    const waitMs = opts.waitMs !== undefined ? opts.waitMs : 1500;
    const timeoutMs = opts.timeoutMs || 30000;
    let browser = null;
    try {
        browser = await launchBrowser(opts);
    } catch (e) {
        return { ok: false, error: 'browser_launch_failed', detail: e.message };
    }
    if (!browser) {
        return { ok: false, error: 'browser_unavailable', detail: 'no browser library (puppeteer/playwright) or chromium binary resolved — see browser_engine.js resolution order' };
    }
    try {
        const page = await browser.newPage();
        const resp = await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
        await new Promise(r => setTimeout(r, waitMs));
        const title = await page.title();
        const text = await page.evaluate(() => ((document.body && document.body.innerText) || '').slice(0, 20000));
        let screenshot = null;
        if (opts.screenshotPath) {
            await page.screenshot({ path: opts.screenshotPath });
            screenshot = opts.screenshotPath;
        }
        return {
            ok: true,
            url,
            status: resp && typeof resp.status === 'function' ? resp.status() : null,
            title,
            text,
            screenshot,
            engine: browserStatus().library,
        };
    } catch (e) {
        return { ok: false, error: 'render_failed', detail: e.message };
    } finally {
        try { await browser.close(); } catch { /* already gone */ }
    }
}

module.exports = { launchBrowser, renderPage, browserStatus, resolveChromiumExecutable, loadPuppeteer, LAUNCH_ARGS };
