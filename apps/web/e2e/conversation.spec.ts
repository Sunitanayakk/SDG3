import { expect, test } from "@playwright/test";

test("casual greetings are welcomed and a subsequent care question still works", async ({
  page,
}) => {
  await page.goto("/app/chat");
  await page.getByLabel("Ask a question").fill("hii");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText(/Hi! I’m Setu, your healthcare access companion/),
  ).toBeVisible();
  await expect(page.getByText(/not have enough verified evidence/)).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Illustrative service navigation guide"),
  ).toHaveCount(0);
  await page
    .getByLabel("Ask a question")
    .fill("Hi, how can I access a doctor online?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Illustrative service navigation guide"),
  ).toBeVisible();
});
