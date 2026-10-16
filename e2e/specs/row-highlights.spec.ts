import { expect, test } from "@playwright/test";
import { goToWorkday, visibleDayDates, waitForDemoEvents } from "#quno-e2e/helpers";

test("keeps resource highlights stable while October 30 and 31 share the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.clock.setFixedTime(new Date("2026-10-30T10:00:00+01:00"));
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page, "2026-10-30");
  await waitForDemoEvents(page);
  await expect.poll(async () => (await visibleDayDates(page)).slice(0, 2)).toEqual(["2026-10-30", "2026-10-31"]);

  const day = page.locator('[data-testid="calendar-day"][data-date="2026-10-30"]');
  const room = day.locator('[data-slot="calendar-cell"][data-calendar-id="room-201"]');
  const initialColor = await room.evaluate((element) => getComputedStyle(element).backgroundColor);
  const origin = await page.locator(".quno-calendar-viewport").evaluate((element) => element.scrollTop);
  const colors = await day
    .locator('[data-slot="calendar-cell"]')
    .evaluateAll((elements) =>
      Object.fromEntries(
        elements.map((element) => [element.getAttribute("data-calendar-id"), getComputedStyle(element).backgroundColor])
      )
    );
  expect(new Set(Object.values(colors)).size).toBe(2);

  for (const offset of [200, 250, 200, 0]) {
    await page.locator(".quno-calendar-viewport").evaluate((element, top) => {
      element.scrollTop = top;
    }, origin + offset);
    // Moving past the third row removes an odd number of preceding resources.
    await expect(day.getByTestId("calendar-row")).toHaveCount(offset === 250 ? 4 : offset ? 5 : 6);
    await expect(room).toBeVisible();
    await expect(room).toHaveCSS("background-color", initialColor);
    for (const date of ["2026-10-30", "2026-10-31"]) {
      const mismatches = await page
        .locator(`[data-testid="calendar-day"][data-date="${date}"] [data-slot="calendar-cell"]`)
        .evaluateAll(
          (elements, expected) =>
            elements.filter(
              (element) =>
                getComputedStyle(element).backgroundColor !== expected[element.getAttribute("data-calendar-id")!]
            ).length,
          colors
        );
      expect(mismatches).toBe(0);
    }
  }
});
