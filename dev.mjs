import { spawn } from "node:child_process";

function start(command, args, label) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`${label} exited with signal ${signal}`);
    } else if (code !== 0) {
      console.log(`${label} exited with code ${code}`);
    }
    process.exitCode = code ?? 0;
  });

  return child;
}

const api = start("node", ["server.js"], "API server");
const vite = start("npx.cmd", ["vite"], "Vite");

function shutdown() {
  api.kill();
  vite.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
