import { expect, test, type Page } from "@playwright/test";
import { goToWorkday, horizontalDrawTarget } from "#quno-e2e/helpers";

const dateKey = "2026-10-17";
const rowSelector = `[data-testid="calendar-day"][data-date="${dateKey}"] [data-testid="calendar-row"][data-calendar-id="room-203"]`;

async function observeFrames(page: Page, duration: number) {
  return page.evaluate(
    async ({ rowSelector, duration }) => {
      const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
      const read = () => {
        const row = document.querySelector<HTMLElement>(rowSelector);
        return row ? row.getBoundingClientRect().top - viewport.getBoundingClientRect().top : null;
      };
      const baseline = read()!;
      const frames: Array<{ delta: number | null; gap: number; horizontalDelta: number }> = [];
      const scrollLeft = viewport.scrollLeft;
      const visibleGap = () => {
        const box = viewport.getBoundingClientRect();
        let covered = box.top + 40;
        let gap = 0;
        const days = Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'))
          .map((day) => day.getBoundingClientRect())
          .filter((day) => day.bottom > covered && day.top < box.bottom)
          .sort((a, b) => a.top - b.top);
        for (const day of days) {
          gap = Math.max(gap, day.top - covered);
          covered = Math.max(covered, day.bottom);
        }
        return Math.max(gap, box.bottom - covered);
      };
      const deadline = performance.now() + duration;
      while (performance.now() < deadline) {
        await new Promise(requestAnimationFrame);
        const offset = read();
        frames.push({
          delta: offset === null ? null : offset - baseline,
          gap: visibleGap(),
          horizontalDelta: viewport.scrollLeft - scrollLeft
        });
      }
      return frames;
    },
    { rowSelector, duration }
  );
}

for (const width of [1280, 1800]) {
  test(`draw and cancel keep the resource fixed on every frame at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/demo/infinite-calendar");
    await page.getByTestId("api-latency-select").selectOption("0");
    await page.getByTestId("scale-select").selectOption("1000");
    await goToWorkday(page, "2026-10-16");
    await expect(page.getByTestId("api-loading-status")).toHaveText("API idle");
    const target = await horizontalDrawTarget(page, { dateKey, calendarId: "room-203", distance: 200 });
    await page.mouse.move(target.startX, target.y);
    await page.mouse.down();
    await page.mouse.move(target.endX, target.y, { steps: 8 });
    const opening = observeFrames(page, 1200);
    await page.mouse.up();
    await expect(page.getByTestId("external-event-popup")).toBeVisible();
    const openingFrames = await opening;
    expect(
      openingFrames.filter(
        ({ delta, gap, horizontalDelta }) =>
          delta === null || Math.abs(delta) > 4 || gap > 2 || Math.abs(horizontalDelta) > 4
      )
    ).toEqual([]);
    const closing = observeFrames(page, 4000);
    await page.getByTestId("draft-cancel-button").click();
    await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
    const closingFrames = await closing;
    expect(
      closingFrames.filter(
        ({ delta, gap, horizontalDelta }) =>
          delta === null || Math.abs(delta) > 4 || gap > 2 || Math.abs(horizontalDelta) > 4
      )
    ).toEqual([]);
  });
}
