// Explicit local setup only. Credentials arrive through hidden stdin, never argv.
// This helper is not called by npm install or shipped in either frontend bundle.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

function upsert(relativePath, values, defaults = {}) {
  const filename = path.join(root, relativePath);
  let content = fs.existsSync(filename)
    ? fs.readFileSync(filename, "utf8")
    : "";
  for (const [name, value] of Object.entries(defaults)) {
    if (!new RegExp("^" + name + "=", "m").test(content)) {
      content +=
        (content.endsWith("\n") || !content ? "" : "\n") +
        name +
        "=" +
        JSON.stringify(value) +
        "\n";
    }
  }
  for (const [name, value] of Object.entries(values)) {
    const line = name + "=" + JSON.stringify(value);
    const existing = new RegExp("^" + name + "=.*$", "m");
    content = existing.test(content)
      ? content.replace(existing, () => line)
      : content +
        (content.endsWith("\n") || !content ? "" : "\n") +
        line +
        "\n";
  }
  fs.writeFileSync(filename, content, { mode: 0o600 });
}

function configure(input) {
  const data = JSON.parse(input);
  if (data.activate === "web") {
    upsert("apps/web/.env.local", {
      VITE_DEMO_MODE: "false",
      VITE_API_BASE_URL: "http://localhost:8000",
    });
    process.stdout.write(
      "\nActivated real web mode against the local API. Mobile remains in labeled Demo Mode until HTTPS deployment.\n",
    );
    return;
  }
  if (data.embeddings === "nvidia") {
    upsert("backend/.env", {
      EMBEDDING_PROVIDER: "nvidia",
      EMBEDDING_MODEL: "nvidia/nemotron-3-embed-1b",
      EMBEDDING_DIMENSIONS: "2048",
      EMBEDDING_BASE_URL: "https://integrate.api.nvidia.com/v1",
    });
    process.stdout.write(
      "\nConfigured hosted NVIDIA Nemotron 3 embeddings at 2048 dimensions; apply migration 002 before indexing.\n",
    );
    return;
  }
  if (data.database_url && !data.nvidia) {
    const database = new URL(data.database_url);
    if (
      !["postgres:", "postgresql:", "postgresql+psycopg:"].includes(
        database.protocol,
      ) ||
      (!database.hostname.endsWith(".supabase.com") &&
        !database.hostname.endsWith(".supabase.co")) ||
      !database.username ||
      !database.password
    ) {
      throw new Error("Invalid Supabase database connection");
    }
    database.protocol = "postgresql+psycopg:";
    database.searchParams.set("sslmode", "require");
    upsert("backend/.env", {
      DATABASE_URL: database.toString(),
      // A real database must never activate anonymous demo administration/seeding.
      DEMO_MODE: "false",
    });
    process.stdout.write(
      "\nSaved the PostgreSQL connection in ignored backend/.env with SSL required and backend demo authentication disabled.\n",
    );
    return;
  }
  const publicClaims = JSON.parse(
    Buffer.from(data.anon.split(".")[1], "base64url").toString("utf8"),
  );
  const privateClaims = JSON.parse(
    Buffer.from(data.service_role.split(".")[1], "base64url").toString("utf8"),
  );
  // Decode only to obtain configuration, never to authenticate or grant a role.
  if (
    !/^[a-z0-9]{20}$/.test(publicClaims.ref) ||
    publicClaims.ref !== privateClaims.ref ||
    publicClaims.role !== "anon" ||
    privateClaims.role !== "service_role" ||
    !data.nvidia.startsWith("nvapi-")
  ) {
    throw new Error("Credential format mismatch");
  }
  const url = "https://" + publicClaims.ref + ".supabase.co";
  upsert(
    "backend/.env",
    {
      NVIDIA_API_KEY: data.nvidia,
      NVIDIA_MODEL: "minimaxai/minimax-m3.1-flash",
      NVIDIA_BASE_URL: "https://integrate.api.nvidia.com/v1",
      NVIDIA_MAX_TOKENS: "16384",
      NVIDIA_REASONING_EFFORT: "low",
      NVIDIA_TEMPERATURE: "1.0",
      NVIDIA_TOP_P: "0.95",
      SUPABASE_URL: url,
      SUPABASE_ANON_KEY: data.anon,
      SUPABASE_SERVICE_ROLE_KEY: data.service_role,
    },
    { DEMO_MODE: "true", DATABASE_URL: "sqlite:///./swasthyasetu.db" },
  );
  upsert(
    "apps/web/.env.local",
    { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: data.anon },
    { VITE_DEMO_MODE: "true", VITE_API_BASE_URL: "http://localhost:8000" },
  );
  upsert(
    "apps/mobile/.env.local",
    { EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: data.anon },
    {
      EXPO_PUBLIC_DEMO_MODE: "true",
      EXPO_PUBLIC_API_BASE_URL: "http://YOUR_LAN_IP:8000",
    },
  );
  process.stdout.write(
    "\nSaved local server credentials and public client configuration. Secret values were not printed.\n",
  );
}

let buffer = "";
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");
process.stdout.write(
  "Ready for local credential JSON on stdin (input is hidden).\n",
);
process.stdin.on("data", (chunk) => {
  if (chunk.includes("\u0003")) process.exit(130);
  buffer += chunk;
  if (!/[\r\n]/.test(buffer)) return;
  try {
    configure(buffer.trim());
    buffer = "";
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.exit(0);
  } catch {
    buffer = "";
    process.stderr.write(
      "\nLocal setup failed; credential values were suppressed.\n",
    );
    process.exit(1);
  }
});
