import { expect, test } from "@playwright/test";

test("calendar previews retain chapter spacing and readable date navigation", async ({ page }) => {
  await page.goto("/guide/infinite-calendar");
  const lazyDemo = page.locator('.article-lazy-demo[data-demo-label="date navigation example"]');
  await lazyDemo.scrollIntoViewIfNeeded();

  const demo = page.getByTestId("article-navigation-demo");
  await expect(demo).toBeVisible();
  await expect(demo.getByText("Go to date", { exact: true })).toHaveCount(0);

  const input = demo.getByLabel("Destination date");
  await expect(input).toHaveCSS("font-size", "13px");

  const nextChapter = page.locator("#zoom");
  const [demoBox, nextChapterBox] = await Promise.all([demo.boundingBox(), nextChapter.boundingBox()]);
  expect(demoBox).not.toBeNull();
  expect(nextChapterBox).not.toBeNull();
  expect((nextChapterBox?.y ?? 0) - ((demoBox?.y ?? 0) + (demoBox?.height ?? 0))).toBeGreaterThanOrEqual(120);
});
