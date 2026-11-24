import { expect, test } from "@playwright/test";
test("responsive public pages, navigation and chat", async ({ page }) => {
  for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Better care starts with being understood.",
      }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
      offenders: [...document.querySelectorAll("body *")]
        .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
        .map((e) => ({
          tag: e.tagName,
          cls: String(e.className),
          right: e.getBoundingClientRect().right,
        }))
        .slice(0, 8),
    }));
    expect(dimensions.scroll, JSON.stringify(dimensions)).toBeLessThanOrEqual(
      width,
    );
    if (width === 1440 || width === 390)
      await page.screenshot({
        path: "../../artifacts/landing-" + width + ".png",
        fullPage: false,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/chat");
  await page
    .getByLabel("Ask a question")
    .fill("How can I access a doctor online?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("SETU · DEMO CONTENT")).toBeVisible();
  await page.screenshot({
    path: "../../artifacts/chat-390.png",
    fullPage: true,
  });
  await expect(
    page.getByText("Illustrative service navigation guide"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New conversation", exact: true })
    .click();
  await page.getByLabel("Ask a question").fill("I cannot breathe");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/This may be an emergency/)).toBeVisible();
  await page.goto("/app/emergency");
  await expect(
    page.getByRole("link", { name: "Call 112 · India emergency" }),
  ).toHaveAttribute("href", "tel:112");
});
test("admin demo upload, executed safety rules, preferences and responsive workspace", async ({
  page,
}) => {
  await page.goto("/signin?admin=1");
  await page.getByRole("button", { name: "Enter demo admin" }).click();
  await expect(
    page.getByText("Synthetic Demo Data", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    // Recharts sizes its SVG in a ResizeObserver callback after viewport layout.
    // A persistent overflow still fails; allow the chart to finish that resize.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/documents");
  await page.getByRole("button", { name: "Add document", exact: true }).click();
  await page.getByLabel("Document file").setInputFiles({
    name: "synthetic-guide.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("Synthetic navigation guide content for testing."),
  });
  await page.getByLabel("Source title").fill("Browser synthetic guide");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add document", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Search documents").fill("Browser synthetic guide");
  await expect(
    page.getByRole("button", { name: /^Browser synthetic guide/ }),
  ).toBeVisible();
  await page.goto("/admin/safety");
  await expect(page.getByText("Not executed").first()).toBeVisible();
  await page.getByRole("button", { name: "Run safety rules" }).click();
  await expect(page.getByText("Passed", { exact: true })).toHaveCount(14);
  await page.goto("/app/preferences");
  await page.getByRole("checkbox", { name: "High contrast" }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "true");
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "High contrast" }),
  ).toBeChecked();
  await page.goto("/admin/overview");
  await expect(
    page.getByText("Synthetic Demo Data", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../../artifacts/admin-1440.png",
    fullPage: true,
  });
});
test("extra-large text remains usable at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/app/preferences");
  await page.getByLabel("Text size").selectOption("extra");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-size", "extra");
  for (const path of ["/", "/app/chat", "/app/resources", "/app/profile"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  }
});
