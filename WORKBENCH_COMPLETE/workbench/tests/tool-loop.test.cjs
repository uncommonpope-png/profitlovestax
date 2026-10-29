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
    // Initialize temporary git repo to test Aider checkpoint discipline
    try {
      execSync("git init", { cwd: tmpDir, stdio: "ignore" });
      execSync("git config user.email 'test@test.local'", { cwd: tmpDir, stdio: "ignore" });
      execSync("git config user.name 'Test Runner'", { cwd: tmpDir, stdio: "ignore" });
    } catch {}

    // Write new file with checkpoint
    const writeRes = await executeTool("write_file", { path: "test.txt", content: "Line 1\nTarget Line\nLine 3" }, tmpDir);
    check("execute.write_file", writeRes.success === true && writeRes.bytesWritten > 0, JSON.stringify(writeRes));
    check("execute.write_checkpoint", writeRes.checkpoint !== null && typeof writeRes.checkpoint === "string", "Commit: " + writeRes.checkpoint);

    // Overwrite refuse
    const dupRes = await executeTool("write_file", { path: "test.txt", content: "New Content" }, tmpDir);
    check("execute.write_refuse_overwrite", dupRes.success === false && /already exists/.test(dupRes.error), dupRes.error);

    // Read file
    const readRes = await executeTool("read_file", { path: "test.txt", start_line: 1, end_line: 2 }, tmpDir);
    check("execute.read_file", readRes.success === true && readRes.lines_read === 2 && readRes.content === "Line 1\nTarget Line", readRes.content);

    // Patch file (exact match) with checkpoint & diff preview
    const patchRes = await executeTool("patch_file", { path: "test.txt", target: "Target Line", replacement: "Patched Line" }, tmpDir);
    check("execute.patch_file", patchRes.success === true && patchRes.replacements === 1, JSON.stringify(patchRes));
    check("execute.patch_checkpoint", patchRes.checkpoint !== null && typeof patchRes.checkpoint === "string", "Commit: " + patchRes.checkpoint);
    check("execute.patch_diffPreview", typeof patchRes.diffPreview === "string" && patchRes.diffPreview.includes("- Target Line") && patchRes.diffPreview.includes("+ Patched Line"), patchRes.diffPreview);

    // Verify patch
    const readPatched = await executeTool("read_file", { path: "test.txt" }, tmpDir);
    check("execute.verify_patch", readPatched.content.includes("Patched Line") && !readPatched.content.includes("Target Line"), readPatched.content);

    // Patch refuse if target not found
    const patchMissing = await executeTool("patch_file", { path: "test.txt", target: "Nonexistent", replacement: "X" }, tmpDir);
    check("execute.patch_refuse_missing", patchMissing.success === false && /not found/.test(patchMissing.error), patchMissing.error);

    // Patch refuse if target appears multiple times
    await executeTool("write_file", { path: "multi.txt", content: "foo bar foo" }, tmpDir);
    const patchMulti = await executeTool("patch_file", { path: "multi.txt", target: "foo", replacement: "baz" }, tmpDir);
    check("execute.patch_refuse_ambiguous", patchMulti.success === false && /must match exactly once/.test(patchMulti.error), patchMulti.error);

    // Find files by name
    const findRes = await executeTool("find_files", { pattern: "test.txt" }, tmpDir);
    check("execute.find_files", findRes.success === true && findRes.files.includes("test.txt"), JSON.stringify(findRes.files));

    // Find files by grep content
    const grepRes = await executeTool("find_files", { content_pattern: "Patched Line" }, tmpDir);
    check("execute.grep_content", grepRes.success === true && grepRes.files.includes("test.txt"), JSON.stringify(grepRes.files));

    // Git status & diff inspect
    const gitStatusRes = await executeTool("git_status", { diff: true }, tmpDir);
    check("execute.git_status", gitStatusRes.success === true, JSON.stringify(gitStatusRes));
  }

  // 4. Command Execution Guard
  {
    const allowCmd = await executeTool("run_command", { command: "echo hello" }, tmpDir);
    check("command.allowlisted", allowCmd.success === true && /hello/.test(allowCmd.output), allowCmd.output?.trim());

    const denyCmd = await executeTool("run_command", { command: "rm -rf /" }, tmpDir);
    check("command.denied", denyCmd.success === false && /refused/.test(denyCmd.error), denyCmd.error);
  }

  // 5. Web Fetch & SSRF Protection
  {
    const loopbackRes = await executeTool("fetch_url", { url: "http://127.0.0.1:18222/v1/models" }, tmpDir);
    check("ssrf.block_127_0_0_1", loopbackRes.success === false && /SSRF guard/.test(loopbackRes.error), loopbackRes.error);

    const localhostRes = await executeTool("fetch_url", { url: "http://localhost:3000/" }, tmpDir);
    check("ssrf.block_localhost", localhostRes.success === false && /SSRF guard/.test(localhostRes.error), localhostRes.error);

    const metaRes = await executeTool("fetch_url", { url: "http://169.254.169.254/meta" }, tmpDir);
    check("ssrf.block_metadata", metaRes.success === false && /SSRF guard/.test(metaRes.error), metaRes.error);

    const lanRes = await executeTool("fetch_url", { url: "http://192.168.0.1/" }, tmpDir);
    check("ssrf.block_lan", lanRes.success === false && /SSRF guard/.test(lanRes.error), lanRes.error);

    // Public fetch test
    const publicRes = await executeTool("fetch_url", { url: "https://example.com" }, tmpDir);
    check("fetch.public_extract", publicRes.success === true && publicRes.text && publicRes.text.includes("documentation examples"), publicRes.text?.slice(0, 100));
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
