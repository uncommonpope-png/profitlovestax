// TESTS FOR TOOL LOOP & GUARDRAILS (Build 1 & Build 2)
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  CORE_TOOLS,
  ALLOWED_COMMAND_PREFIXES,
  resolveSanctionedPath,
  validateToolCall,
  executeTool
} = require("../tool-loop.cjs");

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

async function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tool-loop-test-"));

  // 1. Path Confinement Checks
  {
    const valid = resolveSanctionedPath("sub/file.txt", tmpDir);
    check("path.valid", valid === path.resolve(tmpDir, "sub/file.txt"), valid);

    let threwEscape = false;
    try {
      resolveSanctionedPath("../../escaped.txt", tmpDir);
    } catch (e) {
      threwEscape = true;
    }
    check("path.escaped-refused", threwEscape, "Escaping path rejected");

    let threwSecret = false;
    try {
      resolveSanctionedPath(".env", tmpDir);
    } catch (e) {
      threwSecret = true;
    }
    check("path.secret-refused", threwSecret, ".env rejected");

    let threwSsh = false;
    try {
      resolveSanctionedPath(".ssh/id_rsa", tmpDir);
    } catch (e) {
      threwSsh = true;
    }
    check("path.ssh-refused", threwSsh, ".ssh rejected");
  }

  // 2. Tool Validation Checks
  {
    const validCall = {
      id: "call_1",
      function: {
        name: "read_file",
        arguments: JSON.stringify({ path: "readme.txt" })
      }
    };
    const valRes = validateToolCall(validCall, CORE_TOOLS, tmpDir);
    check("validation.valid-call", valRes.valid === true, JSON.stringify(valRes));

    const badJson = {
      id: "call_2",
      function: {
        name: "read_file",
        arguments: "{not json"
      }
    };
    const badJsonRes = validateToolCall(badJson, CORE_TOOLS, tmpDir);
    check("validation.bad-json", badJsonRes.valid === false && /JSON/.test(badJsonRes.reason), badJsonRes.reason);

    const missingReq = {
      id: "call_3",
      function: {
        name: "read_file",
        arguments: JSON.stringify({ start_line: 1 })
      }
    };
    const reqRes = validateToolCall(missingReq, CORE_TOOLS, tmpDir);
    check("validation.missing-required", reqRes.valid === false && /path/.test(reqRes.reason), reqRes.reason);

    const unknownTool = {
      id: "call_4",
      function: {
        name: "format_disk",
        arguments: "{}"
      }
    };
    const unkRes = validateToolCall(unknownTool, CORE_TOOLS, tmpDir);
    check("validation.unknown-tool", unkRes.valid === false && /not in registered/.test(unkRes.reason), unkRes.reason);
  }

  // 3. File Tools Execution (write, read, patch, find)
  {
    // Write new file
    const writeRes = await executeTool("write_file", { path: "test.txt", content: "Line 1\nTarget Line\nLine 3" }, tmpDir);
    check("execute.write_file", writeRes.success === true && writeRes.bytesWritten > 0, JSON.stringify(writeRes));

    // Overwrite refuse
    const dupRes = await executeTool("write_file", { path: "test.txt", content: "New Content" }, tmpDir);
    check("execute.write_refuse_overwrite", dupRes.success === false && /already exists/.test(dupRes.error), dupRes.error);

    // Read file
    const readRes = await executeTool("read_file", { path: "test.txt", start_line: 1, end_line: 2 }, tmpDir);
    check("execute.read_file", readRes.success === true && readRes.lines_read === 2 && readRes.content === "Line 1\nTarget Line", readRes.content);

    // Patch file (exact match)
    const patchRes = await executeTool("patch_file", { path: "test.txt", target: "Target Line", replacement: "Patched Line" }, tmpDir);
    check("execute.patch_file", patchRes.success === true && patchRes.replacements === 1, JSON.stringify(patchRes));

    // Verify patch
    const readPatched = await executeTool("read_file", { path: "test.txt" }, tmpDir);
    check("execute.verify_patch", readPatched.content.includes("Patched Line") && !readPatched.content.includes("Target Line"), readPatched.content);

    // Patch refuse if target not found
    const patchMissing = await executeTool("patch_file", { path: "test.txt", target: "Nonexistent", replacement: "X" }, tmpDir);
    check("execute.patch_refuse_missing", patchMissing.success === false && /not found/.test(patchMissing.error), patchMissing.error);

    // Find files
    const findRes = await executeTool("find_files", { pattern: "test.txt" }, tmpDir);
    check("execute.find_files", findRes.success === true && findRes.files.includes("test.txt"), JSON.stringify(findRes.files));
  }

  // 4. Command Execution Guard
  {
    const allowCmd = await executeTool("run_command", { command: "echo hello" }, tmpDir);
    check("command.allowlisted", allowCmd.success === true && /hello/.test(allowCmd.output), allowCmd.output?.trim());

    const denyCmd = await executeTool("run_command", { command: "rm -rf /" }, tmpDir);
    check("command.denied", denyCmd.success === false && /refused/.test(denyCmd.error), denyCmd.error);
  }

  // Summary
  const failed = results.filter(r => !r.pass);
  console.log(`\nTool-Loop Tests: ${results.length - failed.length}/${results.length} PASSED`);
  if (failed.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error("Test Harness Error:", e);
  process.exit(1);
});
