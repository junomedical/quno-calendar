import { expect, test, type Locator, type Page } from "@playwright/test";

const targetDate = "2026-08-12";
const delayedRoute = "/examples/async-api?latency=2500";

async function openUnloadedTarget(page: Page, route = delayedRoute) {
  await page.goto(route);
  await page.getByTestId("async-api-jump").click();
  const day = page.locator(`[data-testid="calendar-day"][data-date="${targetDate}"]`);
  await expect(day).toBeAttached();
  await expect(day.getByText("Dense appointment 1")).toHaveCount(0);
  return day;
}

async function relativeTop(element: Locator, viewport: Locator) {
  const [elementBox, viewportBox] = await Promise.all([element.boundingBox(), viewport.boundingBox()]);
  if (!elementBox || !viewportBox) throw new Error("Missing async anchor geometry");
  return elementBox.y - viewportBox.y;
}

test("keeps an unloaded date header and requested time fixed while dense events arrive", async ({ page }) => {
  const day = await openUnloadedTarget(page);
  const viewport = page.locator(".ic-viewport");
  const providerRow = day.locator('[data-testid="calendar-row"][data-calendar-id="provider-a"]');
  await expect(providerRow).toBeAttached();

  const before = {
    dayTop: await relativeTop(day, viewport),
    dayHeight: await day.evaluate((element) => element.getBoundingClientRect().height),
    rowHeight: await providerRow.evaluate((element) => element.getBoundingClientRect().height),
    scrollLeft: await viewport.evaluate((element) => element.scrollLeft)
  };
  expect(before.rowHeight).toBe(50);

  await expect(day.getByText("Dense appointment 1")).toBeVisible({ timeout: 10_000 });
  const after = {
    dayTop: await relativeTop(day, viewport),
    dayHeight: await day.evaluate((element) => element.getBoundingClientRect().height),
    rowHeight: await providerRow.evaluate((element) => element.getBoundingClientRect().height),
    scrollLeft: await viewport.evaluate((element) => element.scrollLeft)
  };

  expect(after.rowHeight).toBe(96);
  expect(after.dayHeight - before.dayHeight).toBe(46);
  expect(Math.abs(after.dayTop - before.dayTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.scrollLeft - before.scrollLeft)).toBeLessThanOrEqual(1);
});

test("keeps the visible resource row fixed when late overlap expands a row above it", async ({ page }) => {
  const day = await openUnloadedTarget(page);
  const viewport = page.locator(".ic-viewport");
  await viewport.evaluate((element, dateKey) => {
    const targetDay = element.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${dateKey}"]`);
    if (!targetDay) throw new Error("Missing unloaded target date");
    element.scrollTop = targetDay.offsetTop + 42 + 50 + 13;
  }, targetDate);

  const providerRow = day.locator('[data-testid="calendar-row"][data-calendar-id="provider-a"]');
  const roomRow = day.locator('[data-testid="calendar-row"][data-calendar-id="room-1"]');
  await expect(roomRow).toBeAttached();
  const roomTopBefore = await relativeTop(roomRow, viewport);
  const scrollLeftBefore = await viewport.evaluate((element) => element.scrollLeft);
  expect(roomTopBefore).toBeCloseTo(-13, 0);

  await expect(day.getByText("Dense appointment 1")).toBeVisible({ timeout: 10_000 });
  await expect(providerRow).toHaveCSS("height", "96px");
  const roomTopAfter = await relativeTop(roomRow, viewport);
  const scrollLeftAfter = await viewport.evaluate((element) => element.scrollLeft);

  expect(Math.abs(roomTopAfter - roomTopBefore)).toBeLessThanOrEqual(1);
  expect(Math.abs(scrollLeftAfter - scrollLeftBefore)).toBeLessThanOrEqual(1);
  await expect(day).toBeAttached();
});

test("keeps vertical date and time focus while late overlap widens a resource column", async ({ page }) => {
  const day = await openUnloadedTarget(page, `${delayedRoute}&view=vertical`);
  const viewport = page.locator(".ic-viewport");
  const providerColumn = day.locator('[data-testid="calendar-column"][data-calendar-id="provider-a"]');
  await expect(providerColumn).toBeAttached();
  const before = {
    dayTop: await relativeTop(day, viewport),
    scrollTop: await viewport.evaluate((element) => element.scrollTop),
    columnWidth: await providerColumn.evaluate((element) => element.getBoundingClientRect().width)
  };

  await expect(day.getByText("Dense appointment 1")).toBeVisible({ timeout: 10_000 });
  const after = {
    dayTop: await relativeTop(day, viewport),
    scrollTop: await viewport.evaluate((element) => element.scrollTop),
    columnWidth: await providerColumn.evaluate((element) => element.getBoundingClientRect().width)
  };

  expect(after.columnWidth - before.columnWidth).toBe(80);
  expect(Math.abs(after.dayTop - before.dayTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.scrollTop - before.scrollTop)).toBeLessThanOrEqual(1);
});
