import { expect, test, type Page } from "@playwright/test";
import { todayDateKey, topVisibleDayDate, topVisibleDayState } from "../helpers";

function setCalendarCount(page: Page, count: string) {
  return page.getByTestId("calendar-count").evaluate((element, nextCount) => {
    const input = element as HTMLInputElement;
    input.value = nextCount;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, count);
}

test("keeps the active day when calendar count changes and supports date navigation", async ({ page }) => {
  await page.goto("/");
  const viewport = page.locator(".ic-viewport");

  await page.getByTestId("zoom-slider").fill("4");
  await page.getByTestId("jump-date-input").fill("2026-08-12");
  await page.getByTestId("jump-time-input").fill("15:30");
  await page.getByTestId("go-date-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("2026-08-12 15:30");
  await expect.poll(async () => topVisibleDayDate(page)).toBe("2026-08-12");
  await expect.poll(async () => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(400);

  await setCalendarCount(page, "3");
  await expect.poll(async () => topVisibleDayDate(page)).toBe("2026-08-12");

  const visibleDate = await topVisibleDayDate(page);
  await viewport.evaluate((element) => {
    element.scrollTop += 90;
  });
  await page.waitForTimeout(40);
  const visibleStateBeforeIncrease = await topVisibleDayState(page);
  await setCalendarCount(page, "9");
  await expect.poll(async () => topVisibleDayDate(page)).toBe(visibleDate);
  const visibleStateAfterIncrease = await topVisibleDayState(page);
  expect(visibleStateAfterIncrease.date).toBe(visibleStateBeforeIncrease.date);
  expect(
    Math.abs(visibleStateAfterIncrease.offsetWithinDate - visibleStateBeforeIncrease.offsetWithinDate)
  ).toBeLessThanOrEqual(2);

  await viewport.evaluate((element) => {
    element.scrollTop += 260;
  });
  await page.waitForTimeout(40);
  const visibleStateBeforeReduction = await topVisibleDayState(page);
  await setCalendarCount(page, "1");
  await expect.poll(async () => topVisibleDayDate(page)).toBe(visibleStateBeforeReduction.date);
  const visibleStateAfterReduction = await topVisibleDayState(page);
  const reducedDayHeight = await page
    .locator(`[data-testid="calendar-day"][data-date="${visibleStateBeforeReduction.date}"]`)
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(visibleStateAfterReduction.date).toBe(visibleStateBeforeReduction.date);
  expect(visibleStateAfterReduction.offsetWithinDate).toBeLessThan(reducedDayHeight);

  await page.getByTestId("today-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("today");
  await expect.poll(async () => topVisibleDayDate(page)).toBe(todayDateKey());
});

test("recenters the horizontal virtual window after a large date scroll", async ({ page }) => {
  await page.goto("/");
  const viewport = page.locator(".ic-viewport");

  await page.getByTestId("jump-date-input").fill("2026-07-06");
  await page.getByTestId("go-date-button").click();
  await expect.poll(async () => topVisibleDayDate(page)).toBe("2026-07-06");

  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight - element.clientHeight - 5;
  });
  await expect
    .poll(async () => {
      try {
        return await topVisibleDayDate(page);
      } catch {
        return null;
      }
    })
    .not.toBeNull();

  await expect
    .poll(
      async () =>
        viewport.evaluate((element) => element.scrollTop / Math.max(1, element.scrollHeight - element.clientHeight)),
      { timeout: 5_000 }
    )
    .toBeLessThan(0.75);
  await expect
    .poll(async () => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(1_000);
  await expect
    .poll(async () => {
      try {
        return await topVisibleDayDate(page);
      } catch {
        return null;
      }
    })
    .not.toBeNull();
});
