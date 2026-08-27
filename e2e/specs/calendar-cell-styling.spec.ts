import { expect, test } from "@playwright/test";

test("calendar day, hour, and cell styling projects across both orientations", async ({ page }) => {
  await page.goto("/guide/infinite-calendar#calendar-cell-styling");
  const lazyDemo = page.locator('.article-lazy-demo[data-demo-label="calendar day, hour, and cell styling"]');
  await lazyDemo.scrollIntoViewIfNeeded();

  const demo = page.getByTestId("article-cell-styling-demo");
  await expect(demo).toBeVisible();
  const weekendRow = demo.locator('[data-slot="calendar-cell"].article-weekend-day').first();
  const equipmentRow = demo.locator('[data-slot="calendar-cell"].article-equipment-cell').first();
  const weekendRowLabel = demo.locator('[data-slot="calendar-day-label"].article-weekend-day').first();
  const lunchRowBand = weekendRow.locator('[data-slot="calendar-hour"][data-hour="12"]');
  const lunchRowLabel = demo.locator('[data-slot="calendar-hour-label"][data-hour="12"]').first();
  await expect(weekendRow).toHaveCSS("background-color", "rgb(255, 243, 227)");
  await expect(equipmentRow).toHaveCSS("background-color", "rgb(232, 241, 255)");
  await expect(weekendRowLabel).toHaveCSS("background-color", "rgb(255, 243, 227)");
  await expect(lunchRowBand).toHaveCSS("background-color", "rgb(223, 245, 232)");
  await expect(lunchRowLabel).toHaveCSS("background-color", "rgb(223, 245, 232)");
  expect((await lunchRowBand.boundingBox())?.width ?? 0).toBeGreaterThan(30);

  await demo.getByLabel("Calendar styling orientation").selectOption("infinite-vertical");
  const weekendColumn = demo.locator('[data-testid="calendar-column"].article-weekend-day').first();
  const equipmentColumn = demo.locator('[data-testid="calendar-column"].article-equipment-cell').first();
  const weekendColumnLabel = demo.locator('[data-slot="calendar-day-label"].article-weekend-day').first();
  const lunchColumnBand = weekendColumn.locator('[data-slot="calendar-hour"][data-hour="12"]');
  const lunchColumnLabel = demo.locator('[data-slot="calendar-hour-label"][data-hour="12"]').first();
  await expect(weekendColumn).toHaveCSS("background-color", "rgb(255, 243, 227)");
  await expect(equipmentColumn).toHaveCSS("background-color", "rgb(232, 241, 255)");
  await expect(weekendColumnLabel).toHaveCSS("background-color", "rgb(255, 243, 227)");
  await expect(lunchColumnBand).toHaveCSS("background-color", "rgb(223, 245, 232)");
  await expect(lunchColumnLabel).toHaveCSS("background-color", "rgb(223, 245, 232)");
  expect((await lunchColumnBand.boundingBox())?.height ?? 0).toBeGreaterThan(30);
});
