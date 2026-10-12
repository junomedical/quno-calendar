import { expect, test, type Page } from "@playwright/test";
import { waitForDemoEvents } from "#quno-e2e/helpers";

async function sampleAnchor(page: Page) {
  return page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    const top = viewport.getBoundingClientRect().top;
    const date = [...viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')].find((day) => {
      const box = day.getBoundingClientRect();
      return box.top <= top + 1 && box.bottom > top + 1;
    });
    if (!date) throw new Error("Visible date is missing");
    const row = [...date.querySelectorAll<HTMLElement>('[data-testid="calendar-row"]')].find((candidate) => {
      const box = candidate.getBoundingClientRect();
      return box.top <= top + 1 && box.bottom > top + 1;
    });
    return {
      dateKey: date.dataset.date!,
      calendarId: row?.dataset.calendarId,
      offset: (row ?? date).getBoundingClientRect().top - top
    };
  });
}

for (const calendarCount of [1, 6]) {
  test(`3s demo responses preserve the latest viewport after rapid wheel reversals (${calendarCount} calendars)`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.clock.setFixedTime(new Date("2026-10-08T14:00:00+02:00"));
    await page.goto("/demo/infinite-calendar");
    await page.getByTestId("calendar-count").fill(String(calendarCount));
    await waitForDemoEvents(page);
    await page.getByTestId("api-latency-select").selectOption("3000");
    const viewport = page.locator(".quno-calendar-viewport");
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
    for (const delta of [6000, -9000, 14000, -12000, 10000]) {
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(100);
    }
    await expect(page.getByTestId("api-loading-status")).toContainText("Loading events");
    const anchor = await sampleAnchor(page);
    const samples = await viewport.evaluate(async (viewport, anchor) => {
      const frames: Array<{ dateKey?: string; offset?: number }> = [];
      const start = performance.now();
      // Includes delayed responses, idle recentering and the post-load layout.
      while (performance.now() - start < 6500) {
        await new Promise(requestAnimationFrame);
        const top = viewport.getBoundingClientRect().top;
        const day = [...viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')].find((candidate) => {
          const box = candidate.getBoundingClientRect();
          return box.top <= top + 1 && box.bottom > top + 1;
        });
        const anchoredDay = viewport.querySelector<HTMLElement>(
          `[data-testid="calendar-day"][data-date="${anchor.dateKey}"]`
        );
        const element = anchor.calendarId
          ? anchoredDay?.querySelector<HTMLElement>(
              `[data-testid="calendar-row"][data-calendar-id="${anchor.calendarId}"]`
            )
          : anchoredDay;
        frames.push({
          dateKey: day?.dataset.date,
          offset: element ? element.getBoundingClientRect().top - top : undefined
        });
      }
      return frames;
    }, anchor);
    expect(samples.length).toBeGreaterThan(20);
    expect([...new Set(samples.map((sample) => sample.dateKey))]).toEqual([anchor.dateKey]);
    expect(Math.max(...samples.map((sample) => Math.abs(sample.offset! - anchor.offset)))).toBeLessThanOrEqual(1);
    await expect(page.getByTestId("api-loading-status")).toHaveText("API idle", { timeout: 10_000 });
  });
}
