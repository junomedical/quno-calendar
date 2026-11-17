import { expect, test } from "@playwright/test";

for (const timezoneId of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
  for (const vertical of [false, true]) {
    test(`${timezoneId}: brand-time geometry and mutations in ${vertical ? "vertical" : "horizontal"} view`, async ({
      browser,
      baseURL
    }) => {
      const context = await browser.newContext({ baseURL, timezoneId, viewport: { width: 1500, height: 900 } });
      const page = await context.newPage();
      const view = vertical ? "infinite-vertical" : "infinite-horizontal";
      await page.goto(`/e2e/fixtures/touch-interactions.html?view=${view}&timeZone=Europe%2FBerlin`);
      const day = page.locator('[data-testid="calendar-day"][data-date="2026-10-08"]');
      const grid = day.locator(
        `${vertical ? ".icv-calendar-column-grid" : ".quno-calendar-row-grid"}[data-calendar-id="one"]`
      );
      const event = day.locator('[data-testid="calendar-event"][data-event-id="visit"]');
      await expect(event).toBeVisible();
      let gridBox = (await grid.boundingBox())!;
      const scale = await grid.evaluate((element, vertical) => {
        const size = getComputedStyle(element).backgroundSize.split(" ");
        return parseFloat(size[vertical ? 1 : 0]) / 15;
      }, vertical);
      const eventBox = (await event.boundingBox())!;
      // 09:00 Berlin is one hour from the 08:00 grid origin, at 1.5 px/minute.
      expect(Math.abs((vertical ? eventBox.y - gridBox.y : eventBox.x - gridBox.x) - (8 + 60 * scale))).toBeLessThan(3);
      expect(Math.abs((vertical ? eventBox.height : eventBox.width) - 60 * scale)).toBeLessThan(3);
      const marker = vertical
        ? day.locator(".icv-now-line").first()
        : grid.locator(".quno-calendar-now-line.is-current");
      const markerBox = (await marker.boundingBox())!;
      expect(Math.abs((vertical ? markerBox.y - gridBox.y : markerBox.x - gridBox.x) - (8 + 120 * scale))).toBeLessThan(
        3
      );
      const point = (minute: number) => ({
        x: vertical ? gridBox.x + gridBox.width / 2 : gridBox.x + 8 + (minute - 480) * scale,
        y: vertical ? gridBox.y + 8 + (minute - 480) * scale : eventBox.y + eventBox.height / 2
      });
      const source = {
        x: vertical ? eventBox.x + eventBox.width / 2 : eventBox.x + 3,
        y: vertical ? eventBox.y + 3 : eventBox.y + eventBox.height / 2
      };
      const target = point(660);
      await page.mouse.move(source.x, source.y);
      await page.mouse.down();
      await page.mouse.move(target.x, target.y, { steps: 8 });
      await page.mouse.up();
      await expect(page.getByTestId("result")).toHaveText("move:2026-10-08T09:00:00.000Z");
      gridBox = (await grid.boundingBox())!;
      const start = point(540);
      const end = point(600);
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(end.x, end.y, { steps: 8 });
      await page.mouse.up();
      await expect(page.getByTestId("result")).toHaveText("draw:2026-10-08T07:00:00.000Z");
      await context.close();
    });
  }
}
