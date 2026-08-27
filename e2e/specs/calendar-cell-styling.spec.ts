import { expect, test } from "@playwright/test";

test("calendar cell styling follows weekends and equipment across both orientations", async ({ page }) => {
  await page.goto("/guide/infinite-calendar#calendar-cell-styling");
  const lazyDemo = page.locator('.article-lazy-demo[data-demo-label="calendar cell styling"]');
  await lazyDemo.scrollIntoViewIfNeeded();

  const demo = page.getByTestId("article-cell-styling-demo");
  await expect(demo).toBeVisible();
  const weekendRow = demo.locator('[data-slot="calendar-cell"].article-weekend-cell').first();
  const equipmentRow = demo.locator('[data-slot="calendar-cell"].article-equipment-cell').first();
  await expect(weekendRow).toHaveCSS("background-color", "rgb(255, 243, 227)");
  await expect(equipmentRow).toHaveCSS("background-color", "rgb(232, 241, 255)");

  await demo.getByLabel("Calendar styling orientation").selectOption("infinite-vertical");
  const weekendColumn = demo.locator('[data-testid="calendar-column"].article-weekend-cell').first();
  const equipmentColumn = demo.locator('[data-testid="calendar-column"].article-equipment-cell').first();
  await expect(weekendColumn).toHaveCSS("background-color", "rgb(255, 243, 227)");
  await expect(equipmentColumn).toHaveCSS("background-color", "rgb(232, 241, 255)");
});
