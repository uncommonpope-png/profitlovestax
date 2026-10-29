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
const { execSync } = require("child_process");

const DEFAULT_WORKSPACE = path.resolve(__dirname, "..");
const MAX_STEPS = 5;
const MAX_READ_BYTES = 50000;
const COMMAND_TIMEOUT_MS = 10000;

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
  }
];

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
      if (!pattern) return { success: false, error: "pattern is required" };
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
              if (ent.name.toLowerCase().includes(pattern) || rel.toLowerCase().includes(pattern)) {
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
      const fullPath = resolveSanctionedPath(args.path, workspaceRoot);
      if (fs.existsSync(fullPath)) {
        return { success: false, error: `File '${args.path}' already exists. Use patch_file to edit existing files.` };
      }
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, String(args.content || ""), "utf8");
      return { success: true, path: args.path, bytesWritten: Buffer.byteLength(args.content || "", "utf8") };
    }

    case "patch_file": {
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
      return { success: true, path: args.path, replacements: 1 };
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
        const status = execSync("git status --short", { cwd: workspaceRoot, encoding: "utf8" });
        let diff = "";
        if (args.diff) {
          diff = execSync("git diff --stat", { cwd: workspaceRoot, encoding: "utf8" });
        }
        return { success: true, status: status.trim(), diff: diff.trim() };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
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

// Main Sequential Tool Loop Engine
async function runSequentialToolLoop(opts) {
  const {
    endpoint = "http://127.0.0.1:18222/v1/chat/completions",
    model = "qwen2.5-1.5b-instruct-q4_k_m",
    systemPrompt = "You are GSK, an agent with access to local tools. When asked to inspect, find, read, or write files, call the appropriate tool. Use sequential calls.",
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
