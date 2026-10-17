import { expect, test } from "@playwright/test";

for (const view of ["infinite-horizontal", "infinite-vertical"]) {
  test(`${view} keeps contiguous geometry through seeded mixed viewport actions`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}`);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await expect(page.getByTestId("calendar-event").first()).toBeVisible();
    let seed = 7319;
    for (let step = 0; step < 32; step++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      switch (seed % 6) {
        case 0:
          await page.getByRole("button", { name: "Filter", exact: true }).click();
          break;
        case 1:
          await page.getByRole("button", { name: "Refresh", exact: true }).click();
          break;
        case 2:
          await page.getByRole("button", { name: step % 2 ? "October 8" : "November 3" }).click();
          break;
        case 3:
          await page.getByRole("slider", { name: "Zoom" }).fill(String(0.5 + (seed % 40) * 0.15));
          break;
        case 4:
          await page.setViewportSize({ width: 900 + (seed % 500), height: 800 });
          break;
        case 5:
          await page.locator(".quno-calendar-viewport").evaluate((element) => {
            element.scrollTop += 219;
            element.scrollLeft += 43;
          });
          break;
      }
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
        const days = [...viewport.querySelectorAll<HTMLElement>(".quno-calendar-day")]
          .map((day) => ({ index: Number(day.dataset.index), box: day.getBoundingClientRect() }))
          .sort((a, b) => a.index - b.index);
        const gaps = days
          .slice(1)
          .flatMap((day, index) =>
            day.index === days[index].index + 1 ? [Math.abs(day.box.top - days[index].box.bottom)] : []
          );
        const identities = [...viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')].map(
          (event) => `${event.dataset.eventId}:${event.dataset.calendarId}`
        );
        return {
          gap: Math.max(0, ...gaps),
          valid: days.every(({ box }) => Number.isFinite(box.top) && box.height > 0),
          unique: new Set(identities).size === identities.length,
          nodes: viewport.querySelectorAll("*").length,
          events: identities.length
        };
      });
      expect(geometry.gap).toBeLessThanOrEqual(1);
      expect(geometry.valid).toBe(true);
      expect(geometry.unique).toBe(true);
      expect(geometry.nodes).toBeLessThan(view === "infinite-horizontal" ? 5000 : 6500);
      expect(geometry.events).toBeLessThanOrEqual(1000);
    }
    expect(errors).toEqual([]);
  });
}
