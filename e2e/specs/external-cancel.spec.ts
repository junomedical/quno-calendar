import { expect, test } from "@playwright/test";
import { goToWorkday, selectPageText } from "../helpers";

test("keeps the possible event position when cancelling external create", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const viewport = page.locator(".ic-viewport");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await selectPageText(page);
  await page.mouse.move(box.x + 310, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 650, box.y + 90);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  const possibleRowAnchor = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const draft = document.querySelector<HTMLElement>('[data-testid="draft-event"]');
    const row = draft?.closest<HTMLElement>('[data-testid="calendar-row"]');
    if (!viewport || !row) return null;
    return row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  });
  expect(possibleRowAnchor).not.toBeNull();
  if (possibleRowAnchor === null) return;

  await page.getByTestId("draft-cancel-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
  await expect
    .poll(async () =>
      page.evaluate((before) => {
        const viewport = document.querySelector<HTMLElement>(".ic-viewport");
        const day = document.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-07-06"]');
        const row = day?.querySelector<HTMLElement>('[data-testid="calendar-row"][data-calendar-id="dr-kirillov"]');
        if (!viewport || !row) return Number.POSITIVE_INFINITY;
        return Math.abs(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top - before);
      }, possibleRowAnchor)
    )
    .toBeLessThanOrEqual(4);
});
