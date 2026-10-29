// TOOL LOOP — Sequential Tool Loop & Guardrails for 1.5B (2026-10-28)
//
// Adopted Architecture:
// 1. Native llama-server dialect: OpenAI-compatible tool_calls via Jinja
// 2. Sequential-only execution (parallel calls rejected / serialized)
// 3. Structural (JSON) & Semantic (path confinement, types) validation
// 4. Exactly 1 repair retry on malformed / invalid call before aborting
// 5. Hard step cap: 5 turns max per user turn
// 6. Strict path confinement: locked to workspaceRoot, blocking .. and secrets
// 7. Aider edit discipline: git checkpoint before/after edits

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const dns = require("dns").promises;
const net = require("net");
const { execSync, spawnSync } = require("child_process");
const {
  isTierBPath,
  appendTierA,
  proposeFact,
  searchTierC,
  rebuildTierCIndex
} = require("./three-tier-memory.cjs");

const DEFAULT_WORKSPACE = path.resolve(__dirname, "..");
const MAX_STEPS = 5;
const MAX_READ_BYTES = 50000;
const MAX_FETCH_BYTES = 5 * 1024 * 1024; // 5MB cap
const COMMAND_TIMEOUT_MS = 10000;
const FETCH_TIMEOUT_MS = 15000; // 15s timeout

// Security & Confinement patterns
const SECRET_PATHS = /(\.git-credentials|\.pm2[\\/]dump\.pm2|HF_TOKEN|NINE_ROUTER_API_KEY|SCRIBE_KEY|GENESIS_TOKEN|MCP_API_KEY|\.env($|[\\/.])|id_rsa|\.pem\b|\.aws|\.ssh)/i;

const ALLOWED_COMMAND_PREFIXES = [
  "npm test",
  "node ",
  "git status",
  "git diff",
  "git log",
  "git rev-parse",
  "dir",
  "ls",
  "echo"
];

// 6 Core Tools Schemas (OpenAI-compatible)
const CORE_TOOLS = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file within the workspace with an optional line range.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path to the file inside workspace" },
          start_line: { type: "integer", description: "Optional 1-based start line (inclusive)" },
          end_line: { type: "integer", description: "Optional 1-based end line (inclusive)" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_files",
      description: "Find files matching a glob or substring pattern inside the workspace.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Filename pattern or substring to search for" },
          subpath: { type: "string", description: "Optional subdirectory to limit search" }
        },
        required: ["pattern"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create a new file with content. Refuses to overwrite existing files (use patch_file to edit).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path for the new file" },
          content: { type: "string", description: "Complete content of the file" }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "patch_file",
      description: "Exact-match string replacement (Aider-style). The target string must match exactly once in the file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path to the file" },
          target: { type: "string", description: "Exact character sequence to be replaced (including whitespace)" },
          replacement: { type: "string", description: "Exact character sequence to replace target with" }
        },
        required: ["path", "target", "replacement"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Execute a command from the sanctioned allowlist with a strict timeout.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The exact shell command to execute" }
        },
        required: ["command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "git_status",
      description: "Read-only inspection of repository git status and diff.",
      parameters: {
        type: "object",
        properties: {
          diff: { type: "boolean", description: "Whether to include git diff in addition to status" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description: "Fetch web content from a public HTTP/HTTPS URL with SSRF protection, 5MB size cap, and text extraction.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The public HTTP or HTTPS URL to fetch" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_memory",
      description: "Search 3-tier memory (curated canon and append-only event ledger) using the Tier C derived index.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Query to search across memory tiers" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "record_event",
      description: "Append an event, observation, or fact directly to the Tier A ground-truth ledger.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "The event text to append" },
          type: { type: "string", description: "Optional event type or tag" }
        },
        required: ["text"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "propose_memory",
      description: "Propose a fact for curated canon review. Direct write to canon is forbidden; proposals enter human review queue.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the proposed fact" },
          content: { type: "string", description: "Body of the proposed canon addition" },
          rationale: { type: "string", description: "Why this belongs in curated canon" }
        },
        required: ["title", "content"]
      }
    }
  }
];

// Helper: Git Checkpoint (Aider edit discipline)
function createGitCheckpoint(workspaceRoot, action, fullPath) {
  try {
    const isGit = execSync("git rev-parse --is-inside-work-tree", { cwd: workspaceRoot, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
    if (isGit !== "true") return { checkpointCreated: false, reason: "not a git repo" };
    const rel = path.relative(workspaceRoot, fullPath);
    execSync(`git add "${rel}"`, { cwd: workspaceRoot, stdio: "ignore" });
    const msg = `checkpoint: ${action} ${rel.replace(/\\/g, "/")}`;
    execSync(`git commit -m "${msg}" --no-verify`, { cwd: workspaceRoot, stdio: "ignore" });
    const commit = execSync("git rev-parse --short HEAD", { cwd: workspaceRoot, encoding: "utf8" }).trim();
    return { checkpointCreated: true, commit, action, file: rel };
  } catch (e) {
    return { checkpointCreated: false, reason: e.message };
  }
}

// Helper: SSRF IP & Host Validation Guard
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 127) return true; // 127.0.0.0/8
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 (Link-local/AWS/GCP metadata)
    if (parts[0] === 0) return true; // 0.0.0.0/8
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true; // Carrier NAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const clean = ip.toLowerCase();
    if (clean === "::1" || clean === "::") return true;
    if (clean.startsWith("fe80:") || clean.startsWith("fc") || clean.startsWith("fd")) return true;
    return false;
  }
  return true;
}

async function validatePublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL format: '${rawUrl}'`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http: and https: are allowed.`);
  }
  const hostname = parsed.hostname;
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error(`SSRF guard: Forbidden hostname '${hostname}'`);
  }
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error(`SSRF guard: Private/loopback IP address '${hostname}' is forbidden`);
    }
    return parsed;
  }
  const addresses = await dns.lookup(hostname, { all: true });
  for (const addr of addresses) {
    if (isPrivateIp(addr.address)) {
      throw new Error(`SSRF guard: Resolved IP '${addr.address}' for '${hostname}' is private/loopback`);
    }
  }
  return parsed;
}

// Helper: Trafilatura Extraction (CPU-fast text extraction from HTML)
function extractTextWithTrafilatura(html) {
  try {
    const pyScript = "import sys, trafilatura\\nhtml = sys.stdin.read()\\nres = trafilatura.extract(html)\\nprint(res or '')";
    const child = spawnSync("python", ["-c", pyScript], {
      input: html,
      encoding: "utf8",
      timeout: 10000
    });
    if (child.stdout && child.stdout.trim()) {
      return child.stdout.trim();
    }
  } catch {}
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
             .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
             .replace(/<[^>]+>/g, " ")
             .replace(/\s+/g, " ")
             .trim();
}

// Helper: Path Confinement Guard
function resolveSanctionedPath(userPath, workspaceRoot) {
  if (typeof userPath !== "string" || !userPath.trim()) {
    throw new Error("Path must be a non-empty string");
  }
  const cleanPath = userPath.trim();
  if (SECRET_PATHS.test(cleanPath)) {
    throw new Error(`Access to secret path '${cleanPath}' is hard-denied`);
  }
  if (cleanPath.includes("\0")) {
    throw new Error("Null bytes prohibited in path");
  }
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(root, cleanPath);
  
  // Must stay within workspaceRoot
  const rel = path.relative(root, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path '${cleanPath}' escapes workspace root '${root}'`);
  }
  return target;
}

// Tool Implementation Handlers
async function executeTool(name, args, workspaceRoot) {
  try {
    switch (name) {
      case "read_file": {
      const fullPath = resolveSanctionedPath(args.path, workspaceRoot);
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `File not found: ${args.path}` };
      }
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        return { success: false, error: `Path is a directory: ${args.path}` };
      }
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      let start = Math.max(1, parseInt(args.start_line, 10) || 1);
      let end = Math.min(lines.length, parseInt(args.end_line, 10) || lines.length);
      if (start > end) {
        return { success: false, error: `start_line (${start}) cannot exceed end_line (${end})` };
      }
      const slice = lines.slice(start - 1, end).join("\n");
      const truncated = slice.length > MAX_READ_BYTES;
      const text = truncated ? slice.slice(0, MAX_READ_BYTES) + `\n\n[TRUNCATED: Exceeded ${MAX_READ_BYTES} bytes]` : slice;
      return {
        success: true,
        path: args.path,
        total_lines: lines.length,
        lines_read: end - start + 1,
        content: text
      };
    }

    case "find_files": {
      const rawPattern = String(args.pattern || "").trim();
      const pattern = rawPattern.replace(/\\/g, "").toLowerCase();
      const contentPattern = args.content_pattern ? String(args.content_pattern) : null;
      if (!pattern && !contentPattern) return { success: false, error: "pattern or content_pattern is required" };
      const sub = args.subpath ? resolveSanctionedPath(args.subpath, workspaceRoot) : workspaceRoot;
      const matches = [];

      function walk(dir) {
        if (matches.length >= 25) return;
        try {
          const list = fs.readdirSync(dir, { withFileTypes: true });
          for (const ent of list) {
            if (ent.name === ".git" || ent.name === "node_modules" || ent.name === ".transformers-cache") continue;
            const full = path.join(dir, ent.name);
            const rel = path.relative(workspaceRoot, full).replace(/\\/g, "/");
            if (ent.isDirectory()) {
              walk(full);
            } else if (ent.isFile()) {
              let matched = false;
              if (pattern && (ent.name.toLowerCase().includes(pattern) || rel.toLowerCase().includes(pattern))) {
                matched = true;
              }
              if (contentPattern) {
                try {
                  const stat = fs.statSync(full);
                  if (stat.size <= 256 * 1024) {
                    const content = fs.readFileSync(full, "utf8");
                    if (content.includes(contentPattern)) {
                      matched = true;
                    }
                  }
                } catch {}
              }
              if (matched) {
                matches.push(rel);
                if (matches.length >= 25) break;
              }
            }
          }
        } catch {}
      }
      walk(sub);
      return { success: true, count: matches.length, files: matches };
    }

    case "write_file": {
      if (isTierBPath(args.path)) {
        return {
          success: false,
          error: `Tier B Poisoning Defense: Direct model modification of curated canon ('${args.path}') is strictly forbidden. Use propose_memory to submit facts for review.`
        };
      }
      const fullPath = resolveSanctionedPath(args.path, workspaceRoot);
      if (fs.existsSync(fullPath)) {
        return { success: false, error: `File '${args.path}' already exists. Use patch_file to edit existing files.` };
      }
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, String(args.content || ""), "utf8");
      const bytesWritten = Buffer.byteLength(args.content || "", "utf8");
      const cp = createGitCheckpoint(workspaceRoot, "create", fullPath);
      return {
        success: true,
        path: args.path,
        bytesWritten,
        diffPreview: `+++ b/${args.path}\n+ ${String(args.content || "").slice(0, 150)}`,
        checkpoint: cp.checkpointCreated ? cp.commit : null
      };
    }

    case "patch_file": {
      if (isTierBPath(args.path)) {
        return {
          success: false,
          error: `Tier B Poisoning Defense: Direct model modification of curated canon ('${args.path}') is strictly forbidden. Use propose_memory to submit facts for review.`
        };
      }
      const fullPath = resolveSanctionedPath(args.path, workspaceRoot);
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `File '${args.path}' does not exist.` };
      }
      const original = fs.readFileSync(fullPath, "utf8");
      const target = String(args.target || "");
      const replacement = String(args.replacement || "");
      if (!target) return { success: false, error: "Target string cannot be empty" };

      // Normalization of newlines for matching
      const count = original.split(target).length - 1;
      if (count === 0) {
        return { success: false, error: "Target string was not found in the file." };
      }
      if (count > 1) {
        return { success: false, error: `Target string appears ${count} times in the file; must match exactly once.` };
      }
      const updated = original.replace(target, replacement);
      fs.writeFileSync(fullPath, updated, "utf8");
      const cp = createGitCheckpoint(workspaceRoot, "patch", fullPath);
      return {
        success: true,
        path: args.path,
        replacements: 1,
        diffPreview: `--- a/${args.path}\n+++ b/${args.path}\n- ${target.slice(0, 100)}\n+ ${replacement.slice(0, 100)}`,
        checkpoint: cp.checkpointCreated ? cp.commit : null
      };
    }

    case "run_command": {
      const cmd = String(args.command || "").trim();
      if (!cmd) return { success: false, error: "Command cannot be empty" };
      const isAllowed = ALLOWED_COMMAND_PREFIXES.some(prefix => cmd.startsWith(prefix));
      if (!isAllowed) {
        return { success: false, error: `Command '${cmd}' refused: not in allowlist (${ALLOWED_COMMAND_PREFIXES.join(", ")})` };
      }
      try {
        const out = execSync(cmd, {
          cwd: workspaceRoot,
          timeout: COMMAND_TIMEOUT_MS,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"]
        });
        return { success: true, output: out.slice(0, 4000) };
      } catch (err) {
        return {
          success: false,
          exitCode: err.status,
          error: (err.stderr || err.stdout || err.message).slice(0, 2000)
        };
      }
    }

    case "git_status": {
      try {
        const status = execSync("git status --short .", { cwd: workspaceRoot, encoding: "utf8" });
        let diff = "";
        if (args.diff) {
          diff = execSync("git diff --stat .", { cwd: workspaceRoot, encoding: "utf8" });
        }
        return { success: true, status: status.trim(), diff: diff.trim() };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case "fetch_url": {
      const rawUrl = String(args.url || "").trim();
      if (!rawUrl) return { success: false, error: "url is required" };
      const parsedUrl = await validatePublicUrl(rawUrl);

      const res = await fetch(parsedUrl.href, {
        method: "GET",
        headers: {
          "User-Agent": "GSK-WebFetch/1.0 (+https://buyasoul.org)",
          "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });

      if (!res.ok) {
        return { success: false, status: res.status, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
      if (contentLength > MAX_FETCH_BYTES) {
        return { success: false, error: `Content-Length (${contentLength} bytes) exceeds 5MB cap` };
      }

      const text = await res.text();
      const byteLen = Buffer.byteLength(text, "utf8");
      if (byteLen > MAX_FETCH_BYTES) {
        return { success: false, error: `Response payload (${byteLen} bytes) exceeds 5MB cap` };
      }

      const contentType = res.headers.get("content-type") || "";
      let extracted = text;
      if (contentType.includes("html") || text.includes("<html") || text.includes("<body")) {
        extracted = extractTextWithTrafilatura(text);
      }

      return {
        success: true,
        url: rawUrl,
        status: res.status,
        content_type: contentType,
        bytes: byteLen,
        text: extracted.slice(0, 8000)
      };
    }

    case "search_memory": {
      const q = String(args.query || "").trim();
      if (!q) return { success: false, error: "query is required" };
      const hits = searchTierC(q, { topK: 5 });
      return { success: true, count: hits.length, hits };
    }

    case "record_event": {
      const txt = String(args.text || "").trim();
      if (!txt) return { success: false, error: "text is required" };
      const evt = appendTierA({
        text: txt,
        type: args.type || "observation",
        source: "agent"
      });
      rebuildTierCIndex();
      return { success: true, id: evt.id, timestamp: evt.timestamp };
    }

    case "propose_memory": {
      const title = String(args.title || "").trim();
      const content = String(args.content || "").trim();
      if (!title || !content) return { success: false, error: "title and content are required" };
      const res = proposeFact({
        title,
        content,
        rationale: args.rationale || "",
        proposed_by: "agent"
      });
      return res;
    }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Validator: Grammar & Semantics with 1 Repair retry
function validateToolCall(call, registeredTools, workspaceRoot) {
  if (!call || typeof call !== "object") {
    return { valid: false, reason: "Malformed tool call: not an object" };
  }
  const fn = call.function;
  if (!fn || typeof fn !== "object" || !fn.name) {
    return { valid: false, reason: "Malformed tool call: missing function.name" };
  }
  const registered = registeredTools.find(t => t.function.name === fn.name);
  if (!registered) {
    return { valid: false, reason: `Tool '${fn.name}' is not in registered tool belt` };
  }
  let parsedArgs;
  try {
    parsedArgs = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : (fn.arguments || {});
  } catch (e) {
    return { valid: false, reason: `Invalid JSON in arguments: ${e.message}` };
  }
  // Check required parameters
  const req = registered.function.parameters.required || [];
  for (const r of req) {
    if (parsedArgs[r] === undefined || parsedArgs[r] === null) {
      return { valid: false, reason: `Missing required argument '${r}' for tool '${fn.name}'` };
    }
  }
  // Semantic path checks
  if (parsedArgs.path) {
    try {
      resolveSanctionedPath(parsedArgs.path, workspaceRoot);
    } catch (e) {
      return { valid: false, reason: e.message };
    }
  }
  return { valid: true, toolName: fn.name, parsedArgs };
}

// Scribe Logger interface
function logToScribe(event) {
  try {
    const scribePath = path.join(os.homedir(), ".soul-scribe", "ledger.jsonl");
    const entry = JSON.stringify({
      id: "tool_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      type: "tool_use",
      ...event
    }) + "\n";
    fs.appendFileSync(scribePath, entry, "utf8");
  } catch {}
}

const DEFAULT_SYSTEM_PROMPT = "You are GSK, an agent with access to local tools. You must complete tasks using tools sequentially. When calling a tool, emit only the tool call without conversational commentary or parentheses. Never guess or hallucinate contents. When instructed to find and inspect a file, call find_files first, then call read_file on the found path before answering. When instructed to write and read back, call write_file first, then call read_file before answering. When instructed to inspect a web page, call fetch_url. When instructed to search memory, call search_memory. When instructed to record an event, call record_event. When instructed to propose a canon fact, call propose_memory.";

// Main Sequential Tool Loop Engine
async function runSequentialToolLoop(opts) {
  const {
    endpoint = "http://127.0.0.1:18222/v1/chat/completions",
    model = "qwen2.5-1.5b-instruct-q4_k_m",
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    userMessage,
    workspaceRoot = DEFAULT_WORKSPACE,
    maxSteps = MAX_STEPS,
    tools = CORE_TOOLS,
    decoding = { temperature: 0.1, max_tokens: 350 }
  } = opts;

  const startTime = Date.now();
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

  let step = 0;
  let callsMade = 0;
  let malformedCount = 0;
  let repairSuccess = 0;
  let capHit = false;
  let loopDetected = false;
  let finalResponse = "";

  while (step < maxSteps) {
    step++;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        tools,
        tool_choice: "auto",
        ...decoding
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Inference endpoint returned HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    if (!msg) throw new Error("No response message returned from inference seat");

    const toolCalls = msg.tool_calls;
    // Base case: No tool call emitted -> Text response
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      finalResponse = msg.content || "";
      break;
    }

    // Sequential Enforcement: Only execute the first call
    const call = toolCalls[0];
    callsMade++;

    // Validation
    const validation = validateToolCall(call, tools, workspaceRoot);

    if (!validation.valid) {
      malformedCount++;
      // Attempt 1 repair retry
      messages.push({
        role: "assistant",
        content: msg.content || null,
        tool_calls: [call]
      });
      messages.push({
        role: "tool",
        tool_call_id: call.id || "err_call",
        name: call.function?.name || "unknown",
        content: JSON.stringify({
          success: false,
          error: `Tool call validation error: ${validation.reason}. Please fix your arguments and call the tool again.`
        })
      });

      // Query model for repaired call
      const repairRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, tools, tool_choice: "auto", ...decoding }),
        signal: AbortSignal.timeout(60000)
      });
      const repairJson = await repairRes.json().catch(() => null);
      const repairMsg = repairJson?.choices?.[0]?.message;
      const repairedCall = repairMsg?.tool_calls?.[0];
      const revalidation = validateToolCall(repairedCall, tools, workspaceRoot);
      if (!revalidation.valid) {
        // Failed after 1 retry
        finalResponse = `Tool validation failed after repair: ${revalidation.reason}`;
        break;
      }
      repairSuccess++;
      // Proceed with repaired call
      validation.toolName = revalidation.toolName;
      validation.parsedArgs = revalidation.parsedArgs;
      call.id = repairedCall.id;
    }

    // Execute tool
    const result = await executeTool(validation.toolName, validation.parsedArgs, workspaceRoot);

    // Scribe Logging
    logToScribe({
      tool: validation.toolName,
      args: validation.parsedArgs,
      result: result.success ? "success" : result.error
    });

    // Append to message history for next step
    messages.push({
      role: "assistant",
      content: msg.content || null,
      tool_calls: [call]
    });
    messages.push({
      role: "tool",
      tool_call_id: call.id,
      name: validation.toolName,
      content: JSON.stringify(result)
    });
  }

  if (step >= maxSteps && !finalResponse) {
    capHit = true;
    finalResponse = "Step cap reached (5 turns max).";
  }

  const turnTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);

  return {
    success: true,
    response: finalResponse.trim(),
    steps: step,
    callsMade,
    malformedCount,
    repairSuccess,
    capHit,
    loopDetected,
    turnTimeSec
  };
}

module.exports = {
  CORE_TOOLS,
  ALLOWED_COMMAND_PREFIXES,
  SECRET_PATHS,
  resolveSanctionedPath,
  validateToolCall,
  executeTool,
  runSequentialToolLoop
};
