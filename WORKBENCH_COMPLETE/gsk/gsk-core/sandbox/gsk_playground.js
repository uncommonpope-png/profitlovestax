
console.log("=========================================");
console.log("Hello from GSK Sandbox Execution environment!");
console.log("Active OS Platform:", require("os").platform());
console.log("Memory Available (MB):", Math.round(require("os").freemem() / 1024 / 1024));
console.log("=========================================");
