import { expect, test, type Page } from "@playwright/test";

const moods = [
  "idle",
  "welcome",
  "curious",
  "listening",
  "thinking",
  "reading",
  "happy",
  "celebrate",
  "concerned",
  "resting",
];
const frames = (page: Page) =>
  page
    .locator(".panda-scene-mount")
    .evaluate((el) => Number((el as HTMLElement).dataset.frameCount));

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });
test.describe("original 3D companion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("renders WebGL, changes every pose, pauses real frames and resumes", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/app/companion");
    const stage = page.locator(".panda-stage");
    await expect(stage).toHaveAttribute("data-renderer", "webgl");
    const start = await frames(page);
    await expect.poll(() => frames(page)).toBeGreaterThan(start + 4);
    for (let i = 0; i < moods.length; i++) {
      await page
        .getByRole("group", { name: "Choose a panda expression" })
        .getByRole("button")
        .nth(i)
        .click();
      await expect(stage).toHaveAttribute("data-mood", moods[i]);
    }
    await page.getByRole("button", { name: "Pause panda animation" }).click();
    await expect(stage).toHaveAttribute("data-paused", "true");
    // A resize or pose update may draw once; a running animation must draw repeatedly.
    await page.waitForTimeout(150);
    const stopped = await frames(page);
    await page.waitForTimeout(300);
    expect(await frames(page)).toBe(stopped);
    await page.getByRole("button", { name: "Play panda animation" }).click();
    await expect.poll(() => frames(page)).toBeGreaterThan(stopped + 3);
    // A lost GPU context must leave a usable vector character and controls.
    await page
      .locator("canvas")
      .dispatchEvent("webglcontextlost", { cancelable: true });
    await expect(stage).toHaveAttribute("data-renderer", "poster");
    await expect(stage.locator(".panda-poster")).toBeVisible();
    await expect(stage.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: /^Reading An open/ }).click();
    await expect(stage).toHaveAttribute("data-mood", "reading");
    await page
      .getByRole("link", { name: "Meet Setu in the chat" })
      .scrollIntoViewIfNeeded();
    await stage.scrollIntoViewIfNeeded();
    expect(errors).toEqual([]);
  });

  test("scroll chapters change pose and offscreen scenes stop rendering", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto("/");
    const hero = page.locator(".panda-hero .panda-stage");
    await expect(hero).toHaveAttribute("data-renderer", "webgl");
    const scene = hero.locator(".panda-scene-mount");
    for (const [index, mood] of ["reading", "listening", "happy"].entries()) {
      await page
        .locator(`.panda-chapters article[data-chapter="${index}"]`)
        .scrollIntoViewIfNeeded();
      await expect(page.locator(".story-panda")).toHaveAttribute(
        "data-mood",
        mood,
      );
    }
    await page.waitForTimeout(150);
    const stopped = await scene.getAttribute("data-frame-count");
    await page.waitForTimeout(300);
    expect(await scene.getAttribute("data-frame-count")).toBe(stopped);
    await page.getByRole("button", { name: "Understand", exact: true }).click();
    await expect(page.locator(".story-panda")).toHaveAttribute(
      "data-mood",
      "reading",
    );
  });
});

test("system reduced motion freezes frames while keeping pose selection useful", async ({
  page,
}) => {
  await page.goto("/app/companion");
  const stage = page.locator(".panda-stage");
  await expect(stage).toHaveAttribute("data-paused", "true");
  await expect(
    page.getByRole("button", { name: "Play panda animation" }),
  ).toBeDisabled();
  await expect(stage).toHaveAttribute("data-renderer", "webgl");
  await page.getByRole("button", { name: /^Reading An open/ }).click();
  await expect(stage).toHaveAttribute("data-mood", "reading");
  await page.waitForTimeout(150);
  const stopped = await frames(page);
  await page.waitForTimeout(300);
  expect(await frames(page)).toBe(stopped);
});

test("text-only removes the canvas and descriptions remain keyboard accessible at small widths", async ({
  page,
}) => {
  await page.goto("/app/preferences");
  await page.getByRole("checkbox", { name: "Text-only mode" }).check();
  await page.getByLabel("Text size").selectOption("extra");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-only", "true");
  await page.goto("/app/companion");
  await expect(page.locator("canvas")).toHaveCount(0);
  const reading = page.getByRole("button", { name: /^Reading An open/ });
  await reading.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".panda-live-description")).toContainText(
    "An open book",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test("chat focus and reply state change poses; urgent guidance stays calm", async ({
  page,
}) => {
  await page.goto("/app/chat");
  const panda = page.locator(".chat-header .panda-avatar");
  await expect(panda).toHaveAttribute("data-mood", "welcome");
  await page.getByLabel("Ask a question").focus();
  await expect(panda).toHaveAttribute("data-mood", "listening");
  await page.getByLabel("Ask a question").fill("hii");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(panda).toHaveAttribute("data-mood", "thinking");
  await expect(panda).toHaveAttribute("data-mood", "happy");
  await page.getByLabel("Ask a question").fill("I cannot breathe");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/This may be an emergency/)).toBeVisible();
  await expect(panda).toHaveAttribute("data-mood", "concerned");
});

test("only saved preferences and completed checklists trigger a success pose", async ({
  page,
}) => {
  await page.goto("/app/passport");
  await expect(page.locator(".passport-head .panda-avatar")).toHaveAttribute(
    "data-mood",
    "idle",
  );
  await page.getByRole("button", { name: "Save on this device" }).click();
  await expect(page.locator(".passport-head .panda-avatar")).toHaveAttribute(
    "data-mood",
    "celebrate",
  );
  await page.goto("/app/planner");
  const panda = page.locator(".visit-checklist .panda-avatar");
  await expect(panda).toHaveAttribute("data-mood", "reading");
  for (const checkbox of await page
    .locator(".visit-checklist input[type=checkbox]")
    .all())
    await checkbox.check();
  await expect(panda).toHaveAttribute("data-mood", "celebrate");
});
