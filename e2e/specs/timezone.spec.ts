import { test, expect } from "@playwright/test";
for (const timezoneId of ["America/New_York", "Asia/Tokyo"]) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    test("positions the UTC interval in the configured timezone and updates cached geometry on timezone change", async ({
      page
    }) => {
      await page.goto("/demo/calendar-timezone");
      const event = page.locator('[data-event-id="berlin-hours"]');
      await expect(event).toBeVisible();
      await expect(event).toContainText("15:00–17:00");
      await expect
        .poll(() =>
          event.evaluate(
            (e) => (parseFloat((e as HTMLElement).style.left) - 8) / parseFloat((e as HTMLElement).style.width)
          )
        )
        .toBeCloseTo(4, 3);
      expect(await event.evaluate((e) => parseFloat((e as HTMLElement).style.width))).toBeGreaterThan(100);
      await page.getByLabel("Display timezone").selectOption("UTC");
      await expect(event).toContainText("12:00–14:00");
      await expect
        .poll(() =>
          event.evaluate(
            (e) => (parseFloat((e as HTMLElement).style.left) - 8) / parseFloat((e as HTMLElement).style.width)
          )
        )
        .toBeCloseTo(2.5, 3);
      await expect(page.getByLabel("Saved UTC interval")).toContainText("2026-09-19T12:00:00Z");
    });
  });
}
