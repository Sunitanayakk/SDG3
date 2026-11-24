// Explicit opt-in test. Reads the ignored credentials directly; never records
// traces, passwords, tokens, browser storage or generated reasoning.
const fs = require("node:fs");
const path = require("node:path");
const { chromium, expect } = require("@playwright/test");
const root = path.resolve(__dirname, "..");
const credentials = require("dotenv").parse(
  fs.readFileSync(path.join(root, "backend/.env.admin.local")),
);
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const checks = [];
  let stage = "administrator login";
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto("http://localhost:5173/signin?admin=1");
    await page
      .getByLabel("Email", { exact: true })
      .fill(credentials.SUPABASE_ADMIN_EMAIL);
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials.SUPABASE_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/overview$/, { timeout: 45000 });
    await expect(
      page.getByText("Aggregate permitted usage", { exact: true }),
    ).toBeVisible({ timeout: 30000 });
    checks.push({ test: "browser_real_supabase_admin_login", passed: true });
    await page.screenshot({
      path: path.join(root, "artifacts/live-admin.png"),
    });
    stage = "indexed official documents";
    await page.goto("http://localhost:5173/admin/documents");
    await expect(
      page.getByRole("cell", { name: /eSanjeevani/ }).first(),
    ).toBeVisible({ timeout: 30000 });
    checks.push({ test: "browser_real_indexed_documents", passed: true });
    stage = "real patient chat";
    await page.goto("http://localhost:5173/app/chat");
    await page
      .getByLabel("Ask a question")
      .fill(
        "Why is checking blood pressure important even when someone feels well?",
      );
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/chat") && r.request().method() === "POST",
      { timeout: 180000 },
    );
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const response = await responsePromise;
    if (response.status() !== 200) throw new Error("Chat request failed");
    const body = await response.json();
    if (
      body.mode !== "real" ||
      !body.citations.some(
        (c) => c.source_id === "official-source-who-blood-pressure",
      ) ||
      !body.retrieval.used
    )
      throw new Error("Live citation/retrieval check failed");
    await expect(
      page.getByText("SETU · GENERAL INFORMATION", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("SETU · DEMO CONTENT", { exact: true }),
    ).toHaveCount(0);
    checks.push({ test: "browser_real_grounded_chat", passed: true });
    await page.screenshot({ path: path.join(root, "artifacts/live-chat.png") });
  } catch {
    checks.push({ test: stage, passed: false });
  } finally {
    await browser.close();
  }
  const report = {
    mode: "real",
    checks,
    all_passed: checks.every((x) => x.passed),
  };
  fs.writeFileSync(
    path.join(root, "artifacts/live-web-validation.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  process.exitCode = report.all_passed ? 0 : 1;
})();
