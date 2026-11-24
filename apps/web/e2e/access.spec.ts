import { expect, test } from "@playwright/test";

test("access passport saves only on request and exports a useful card", async ({
  page,
}) => {
  await page.goto("/app/passport");
  await page.getByRole("checkbox", { name: /Hearing/ }).check();
  await expect(
    page.getByRole("region", { name: "Passport preview" }),
  ).toContainText("Please face me and write down key information");
  expect(
    await page.evaluate(() => localStorage.getItem("setu-passport-v1")),
  ).toBeNull();
  await page.getByRole("button", { name: "Save on this device" }).click();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Hearing/ })).toBeChecked();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download text" }).click();
  expect((await download).suggestedFilename()).toBe(
    "my-accessibility-passport.txt",
  );
  await page.getByRole("button", { name: "Clear saved passport" }).click();
  await expect(
    page.getByRole("checkbox", { name: /Hearing/ }),
  ).not.toBeChecked();
});

test("communication board switches language, presents text and keeps custom messages transient", async ({
  page,
}) => {
  await page.goto("/app/communicate");
  await page.getByLabel("Board language").selectOption("hi");
  await page.getByRole("button", { name: /कृपया लिखकर बताइए/ }).click();
  await expect(
    page.getByRole("region", { name: "Selected communication message" }),
  ).toContainText("कृपया लिखकर बताइए");
  await page
    .getByLabel("Or type your own message")
    .fill("Please give me written instructions.");
  await page.getByRole("button", { name: "Show large message" }).click();
  await expect(
    page
      .getByText("Please give me written instructions.", { exact: true })
      .last(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByLabel("Or type your own message")).toHaveValue("");
});

test("visit plan adapts to access needs and remembers explicitly saved progress", async ({
  page,
}) => {
  await page.goto("/app/planner");
  await page.getByRole("radio", { name: "Visit a clinic" }).check();
  await page.getByRole("checkbox", { name: /Moving/ }).check();
  const request = page.getByRole("checkbox", {
    name: "Please confirm step-free access, seating and any assistance before my visit.",
  });
  await request.check();
  await page.getByRole("button", { name: "Save checklist locally" }).click();
  await page.reload();
  await expect(request).toBeChecked();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "1");
});

test("library is readable without the backend and new screens fit small and large layouts", async ({
  page,
}) => {
  await page.goto("/app/library");
  await page.getByLabel("Search the library").fill("blood pressure");
  await expect(
    page.getByRole("heading", { name: "Understanding blood pressure" }),
  ).toBeVisible();
  await page.getByLabel("Reading language").selectOption("or");
  await expect(page.locator(".library-card p")).toContainText("ରକ୍ତଚାପ");
  await expect(
    page.getByRole("link", { name: /World Health Organization/ }),
  ).toHaveAttribute(
    "href",
    "https://www.who.int/news-room/fact-sheets/detail/hypertension",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of [
      "tools",
      "passport",
      "communicate",
      "planner",
      "library",
    ]) {
      await page.goto("/app/" + route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app/tools");
  await page.screenshot({
    path: "../../artifacts/access-toolkit.png",
    fullPage: true,
  });
});
