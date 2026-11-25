import { expect, test, type Page } from "@playwright/test";
const frames = (page: Page) =>
  page
    .locator(".panda-scene-mount")
    .evaluate((el) => Number((el as HTMLElement).dataset.frameCount));
const canvasDigest = (page: Page) =>
  page.locator(".panda-stage canvas").evaluate((el) => {
    const text = (el as HTMLCanvasElement).toDataURL();
    let hash = 0;
    for (let i = 0; i < text.length; i++)
      hash = (hash * 31 + text.charCodeAt(i)) | 0;
    return hash;
  });
test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

test.describe("original realistic panda", () => {
  test.use({ reducedMotion: "no-preference" });
  test("renders both original rigs, pauses actual frames and falls back after GPU loss", async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const original = await (
      await request.get("/panda-reference/panda-1.json")
    ).json();
    expect(original.skeleton.spine).toBe("4.1.24");
    expect(original.bones.length).toBe(101);
    expect(Object.keys(original.animations)).toEqual(["idle-panda"]);
    await page.goto("/app/companion");
    const stage = page.locator(".panda-stage");
    const mount = page.locator(".panda-scene-mount");
    await expect(stage).toHaveAttribute("data-renderer", "webgl", {
      timeout: 30000,
    });
    await expect(mount).toHaveAttribute("data-clip", "idle-panda");
    const start = await frames(page);
    await expect.poll(() => frames(page)).toBeGreaterThan(start + 4);
    await page.getByRole("button", { name: /^Butterfly panda/ }).click();
    await expect(mount).toHaveAttribute("data-scene", "meadow");
    await expect(mount).toHaveAttribute("data-clip", "idle_panda");
    await page.getByRole("button", { name: "Pause panda animation" }).click();
    await expect(stage).toHaveAttribute("data-paused", "true");
    await page.waitForTimeout(150);
    const stopped = await frames(page);
    await page.waitForTimeout(300);
    expect(await frames(page)).toBe(stopped);
    await page.getByRole("button", { name: "Play panda animation" }).click();
    await expect.poll(() => frames(page)).toBeGreaterThan(stopped + 3);
    await page
      .locator("canvas")
      .dispatchEvent("webglcontextlost", { cancelable: true });
    await expect(stage).toHaveAttribute("data-renderer", "poster");
    await expect(stage.locator(".panda-poster")).toBeVisible();
    await expect(stage.locator("canvas")).toHaveCount(0);
    await expect(stage.locator("img")).toHaveAttribute(
      "src",
      "/panda-reference/meadow-poster.png",
    );
    await page.getByRole("button", { name: /^Leaf-crown panda/ }).click();
    await expect(stage.locator("img")).toHaveAttribute(
      "src",
      "/panda-reference/jungle-poster.png",
    );
    await stage.scrollIntoViewIfNeeded();
    expect(errors).toEqual([]);
  });
  test("original timeline changes rendered pixels and resumes the loop", async ({
    page,
  }) => {
    await page.goto("/app/companion");
    await expect(page.locator(".panda-stage")).toHaveAttribute(
      "data-renderer",
      "webgl",
      { timeout: 30000 },
    );
    const range = page.getByLabel(
      "Inspect the original animation, frame by frame",
    );
    await range.focus();
    await range.press("End");
    await expect(page.locator(".panda-stage")).toHaveAttribute(
      "data-paused",
      "true",
    );
    await expect(page.locator(".panda-scene-mount")).toHaveAttribute(
      "data-time",
      "19.95",
    );
    const end = await canvasDigest(page);
    await range.press("Home");
    await expect(page.locator(".panda-scene-mount")).toHaveAttribute(
      "data-time",
      "0",
    );
    expect(await canvasDigest(page)).not.toBe(end);
    await page.getByRole("button", { name: "Resume original motion" }).click();
    await expect(page.locator(".panda-stage")).toHaveAttribute(
      "data-paused",
      "false",
    );
    const start = await frames(page);
    await expect.poll(() => frames(page)).toBeGreaterThan(start + 3);
  });
  test("full viewport scene responds to the pointer, changes with scroll and stops offscreen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto("/");
    const hero = page.locator(".nature-world");
    await expect(hero).toHaveAttribute("data-renderer", "webgl", {
      timeout: 30000,
    });
    await expect(page.locator(".nature-journey")).toHaveAttribute(
      "data-entered",
      "true",
      { timeout: 10000 },
    );
    const scene = hero.locator(".nature-rig");
    await expect(scene).toHaveAttribute("data-scene", "jungle");
    const readFrames = () =>
      scene.evaluate((el) => Number((el as HTMLElement).dataset.frameCount));
    const digest = () =>
      scene
        .locator("canvas")
        .evaluate((el) => (el as HTMLCanvasElement).toDataURL());
    await page.getByRole("button", { name: "Pause ambient motion" }).click();
    await expect(hero).toHaveAttribute("data-paused", "true");
    await page.waitForTimeout(100);
    const paused = await readFrames();
    await page.waitForTimeout(250);
    expect(await readFrames()).toBe(paused);
    await page.mouse.move(100, 250);
    const left = await digest();
    await page.mouse.move(1350, 500);
    expect(await digest()).not.toBe(left);
    await page.getByRole("button", { name: "Resume ambient motion" }).click();
    await expect.poll(readFrames).toBeGreaterThan(paused + 3);
    for (const [progress, name] of [
      [0.6, "meadow"],
      [0.94, "sky"],
    ] as const) {
      await page
        .locator(".nature-journey")
        .evaluate(
          (el, p) =>
            window.scrollTo(
              0,
              (el as HTMLElement).offsetTop +
                (el.clientHeight - innerHeight) * p,
            ),
          progress,
        );
      await expect(scene).toHaveAttribute("data-scene", name, {
        timeout: 10000,
      });
      await expect
        .poll(async () => Number(await scene.getAttribute("data-progress")))
        .toBeGreaterThan(progress - 0.02);
    }
    await page.locator(".nature-tools").scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const stopped = await scene.getAttribute("data-frame-count");
    await page.waitForTimeout(300);
    expect(await scene.getAttribute("data-frame-count")).toBe(stopped);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(scene).toHaveAttribute("data-scene", "jungle", {
      timeout: 10000,
    });
    await scene
      .locator("canvas")
      .dispatchEvent("webglcontextlost", { cancelable: true });
    await expect(hero).toHaveAttribute("data-renderer", "poster");
    await expect(scene.locator("canvas")).toHaveCount(0);
    await expect(hero.locator(".nature-poster")).toBeVisible();
  });
  test("the entrance can be skipped and the full screen navigation works with a keyboard", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto("/");
    const entry = page.getByRole("status", { name: "Opening SwasthyaSetu" });
    await expect(entry).toBeVisible();
    await expect(entry).toHaveCSS("background-color", "rgb(25, 47, 27)");
    await page.getByRole("button", { name: "Skip intro" }).click();
    await expect(entry).toHaveCount(0);
    const menu = page.getByRole("button", { name: "Open navigation" });
    await menu.click();
    const dialog = page.getByRole("dialog", { name: "Explore SwasthyaSetu" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(menu).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  });
});

test("reduced motion retains the full background without a pinned journey or pointer motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");
  const world = page.locator(".nature-world"),
    scene = page.locator(".nature-rig");
  await expect(page.locator(".nature-entry")).toHaveCount(0);
  await expect(world).toHaveAttribute("data-renderer", "webgl", {
    timeout: 30000,
  });
  expect(
    await page.locator(".nature-journey").evaluate((el) => el.clientHeight),
  ).toBeLessThanOrEqual(951);
  await expect(
    page.getByRole("button", { name: "Pause ambient motion" }),
  ).toBeDisabled();
  const read = () =>
    scene
      .locator("canvas")
      .evaluate((el) => (el as HTMLCanvasElement).toDataURL());
  const initial = await read();
  await page.mouse.move(1200, 400);
  await page.waitForTimeout(250);
  expect(await read()).toBe(initial);
});
test("system reduced motion freezes frames while retaining scene selection", async ({
  page,
}) => {
  await page.goto("/app/companion");
  const stage = page.locator(".panda-stage");
  await expect(stage).toHaveAttribute("data-paused", "true");
  await expect(
    page.getByRole("button", { name: "Play panda animation" }),
  ).toBeDisabled();
  await expect(stage).toHaveAttribute("data-renderer", "webgl", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: /^Butterfly panda/ }).click();
  await expect(stage).toHaveAttribute("data-scene", "meadow");
  await page.waitForTimeout(150);
  const stopped = await frames(page);
  await page.waitForTimeout(300);
  expect(await frames(page)).toBe(stopped);
});
test("text-only avoids graphics and scene controls fit enlarged text at small widths", async ({
  page,
}) => {
  await page.goto("/app/preferences");
  await page.getByRole("checkbox", { name: "Text-only mode" }).check();
  await page.getByLabel("Text size").selectOption("extra");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-only", "true");
  const mediaRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/panda-reference/")) mediaRequests.push(r.url());
  });
  await page.goto("/app/companion");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".panda-avatar")).toHaveCount(0);
  const button = page.getByRole("button", { name: /^Butterfly panda/ });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".panda-live-description")).toContainText(
    "bow-tie",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  expect(mediaRequests).toEqual([]);
  await page.goto("/");
  await expect(page.locator(".nature-world")).toHaveCount(0);
  await expect(page.locator(".nature-entry")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(mediaRequests).toEqual([]);
});
test("chat activity updates the real avatar and urgent guidance uses a still", async ({
  page,
}) => {
  await page.goto("/app/chat");
  const panda = page.locator(".chat-header .panda-avatar");
  await expect(panda).toHaveAttribute("data-mood", "welcome");
  await expect(panda).toHaveAttribute(
    "src",
    "/panda-reference/jungle-poster.png",
  );
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
  await expect(panda).toHaveAttribute(
    "src",
    "/panda-reference/jungle-poster.png",
  );
});
test("saved passport and completed checklist acknowledge task success", async ({
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
