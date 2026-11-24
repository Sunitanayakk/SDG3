// One command starts both parts of the local experience. Never stop a process
// we did not launch, and never print environment-file contents.
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const children = [];
let ending = false;
function stop(code = 0) {
  if (ending) return;
  ending = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === "win32")
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
    else child.kill("SIGTERM");
  }
  process.exit(code);
}
async function healthy() {
  try {
    const r = await fetch("http://127.0.0.1:8000/health", {
      signal: AbortSignal.timeout(1800),
    });
    return r.ok && (await r.json()).status === "ok";
  } catch {
    return false;
  }
}
function launch(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    windowsHide: true,
  });
  children.push(child);
  child.on("error", () => {
    console.error("Could not start a project service. See README setup steps.");
    stop(1);
  });
  child.on("exit", (code) => {
    if (!ending) stop(code || 0);
  });
  return child;
}
(async () => {
  const { loadEnv } = await import("vite");
  const publicEnv = loadEnv(
    "development",
    path.join(root, "apps/web"),
    "VITE_",
  );
  const demo =
    (process.env.VITE_DEMO_MODE ?? publicEnv.VITE_DEMO_MODE) !== "false";
  const remote = !["localhost", "127.0.0.1"].includes(
    new URL(publicEnv.VITE_API_BASE_URL || "http://localhost:8000").hostname,
  );
  if (!demo && !remote && !(await healthy())) {
    const python = path.join(
      root,
      "backend/.venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );
    if (!fs.existsSync(python))
      throw new Error("Install backend dependencies first; see README.md.");
    launch(
      python,
      [
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--no-access-log",
      ],
      path.join(root, "backend"),
    );
    let ready = false;
    for (let i = 0; i < 20; i++) {
      if (await healthy()) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!ready)
      throw new Error(
        "The backend did not become ready. Check its configuration and database connection.",
      );
  }
  console.log(
    demo
      ? "Starting labeled Demo Mode; no backend or credentials required."
      : remote
        ? "Using the configured remote care API."
        : "Care API ready at http://localhost:8000. Starting the website…",
  );
  launch(
    process.execPath,
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      "5173",
      "--strictPort",
    ],
    path.join(root, "apps/web"),
  );
})().catch((e) => {
  console.error(e.message);
  stop(1);
});
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
