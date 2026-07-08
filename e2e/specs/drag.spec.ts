import { expect, test } from "@playwright/test";
import { firstDuplicatedViewportEvent, goToWorkday, selectPageText } from "../helpers";

test("supports dragging an event to another time", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const initialEventCount = await page.getByTestId("calendar-event").count();
  const duplicate = await firstDuplicatedViewportEvent(page);
  const [box] = duplicate.boxes;
  const gridBox = await page
    .locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"]`)
    .first()
    .evaluate((element) => {
      const grid = element.closest(".ic-row-grid");
      const rect = grid?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right } : null;
    });
  expect(gridBox).not.toBeNull();
  if (!gridBox) return;
  const targetX = Math.max(gridBox.left + 12, Math.min(box.x + 80, gridBox.right - 12));

  await selectPageText(page);
  await page.mouse.move(box.x + 12, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(targetX, box.y + 12);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await expect(
    page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"] [data-render-status="dragging"]`)
  ).toHaveCount(duplicate.boxes.length);
  expect(await page.getByTestId("drag-preview-event").count()).toBeGreaterThanOrEqual(duplicate.boxes.length);
  await expect(page.locator('[data-render-status="dragging"]').first()).toHaveCSS("opacity", "0.5");
  await expect(page.locator(".ic-viewport")).toHaveCSS("user-select", "none");
  await expect(page.locator("body")).toHaveCSS("user-select", "none");
  await expect(page.locator("html")).toHaveCSS("user-select", "none");
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toBe("");
  expect(await page.locator('[data-render-status="hovered"]').count()).toBe(0);
  expect(await page.getByTestId("calendar-event").count()).toBe(initialEventCount);
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText(/Move accepted|Move rejected/);
});
