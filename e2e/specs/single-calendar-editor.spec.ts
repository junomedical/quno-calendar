import { expect, test, type Page } from "@playwright/test";
import { topVisibleDayDate, viewportRelativeEventBox, waitForDemoEvents } from "#quno-e2e/helpers";

const rowSelector =
  '[data-testid="calendar-day"][data-date="2026-10-08"] [data-testid="calendar-row"][data-calendar-id="dr-kirillov"]';

async function rowOffset(page: Page) {
  return viewportRelativeEventBox(page, rowSelector);
}

for (const width of [1280, 1800]) {
  test(`single-calendar editor and subsequent hover preserve the top day (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 800 : 1100 });
    await page.clock.setFixedTime(new Date("2026-10-08T14:00:00+02:00"));
    await page.goto("/demo/infinite-calendar");
    await page.getByTestId("calendar-count").fill("1");
    await waitForDemoEvents(page);
    await expect.poll(() => topVisibleDayDate(page)).toBe("2026-10-08");
    const before = await rowOffset(page);
    expect(before).not.toBeNull();
    const event = page.locator(rowSelector).getByTestId("calendar-event").filter({ hasText: "Acne Therapy" });
    await expect(event).toBeVisible();
    const eventId = await event.getAttribute("data-event-id");
    const assertRow = async () => {
      await expect.poll(async () => Math.abs((await rowOffset(page))!.y - before!.y)).toBeLessThanOrEqual(1);
      await expect.poll(() => topVisibleDayDate(page)).toBe("2026-10-08");
    };

    for (let iteration = 0; iteration < 2; iteration += 1) {
      await event.click();
      await expect(page.getByTestId("external-event-popup")).toBeVisible();
      await assertRow();
      await page.getByTestId("draft-cancel-button").click();
      await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
      // Hover immediately, while the released draft and restore are still active.
      await event.hover();
      await expect(event).toHaveAttribute("data-status", "hovered");
      await assertRow();
      await page.mouse.move(350, 20);
      await assertRow();
    }
    await event.hover();
    await expect(event).toHaveAttribute("data-status", "hovered");
    const stability = await page.evaluate(
      async ({ rowSelector, eventId, expectedY }) => {
        const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
        const positions: number[] = [];
        let lateMutations = 0;
        const start = performance.now();
        const observer = new MutationObserver((records) => {
          if (performance.now() - start > 3200) lateMutations += records.length;
        });
        observer.observe(viewport, { attributes: true, childList: true, subtree: true });
        while (performance.now() - start < 8000) {
          await new Promise(requestAnimationFrame);
          const row = document.querySelector<HTMLElement>(rowSelector);
          if (!row || !row.querySelector(`[data-event-id="${eventId}"]`)) throw new Error("Event row disappeared");
          positions.push(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top);
        }
        observer.disconnect();
        return { movement: Math.max(...positions.map((y) => Math.abs(y - expectedY))), lateMutations };
      },
      { rowSelector, eventId, expectedY: before!.y }
    );
    expect(stability.movement).toBeLessThanOrEqual(1);
    expect(stability.lateMutations).toBe(0);
    await assertRow();
  });
}

for (const [width, height, calendarCount] of [
  [1280, 800, 1],
  [1280, 800, 6],
  [1440, 900, 1],
  [1440, 900, 6],
  [1800, 1100, 6]
]) {
  test(`repeated Acne Therapy participant sequence preserves Dmitry (${width}x${height}, ${calendarCount} calendars)`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height });
    await page.clock.setFixedTime(new Date("2026-10-08T14:00:00+02:00"));
    await page.goto("/demo/infinite-calendar");
    await page.getByTestId("calendar-count").fill(String(calendarCount));
    await waitForDemoEvents(page);
    await expect.poll(() => topVisibleDayDate(page)).toBe("2026-10-08");
    const before = await rowOffset(page);
    expect(before).not.toBeNull();
    const event = page.locator(rowSelector).getByTestId("calendar-event").filter({ hasText: "Acne Therapy" });
    for (let iteration = 0; iteration < 3; iteration += 1) {
      await event.click();
      await expect(page.getByTestId("external-event-popup")).toBeVisible();
      for (const id of ["marco-eggens", "room-202", "surgery-a", "marco-eggens", "dr-kirillov"]) {
        await page.getByTestId(`draft-participant-${id}`).click();
      }
      await expect(page.getByTestId("draft-participant-dr-kirillov")).not.toBeChecked();
      await expect(page.locator(rowSelector)).toHaveCount(0);
      // Cover Cancel after a participant restore expires as well as immediate Cancel.
      if (width === 1440 && calendarCount === 1 && iteration === 2) await page.waitForTimeout(3200);
      await page.getByTestId("draft-cancel-button").click();
      await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
      await expect.poll(() => topVisibleDayDate(page)).toBe("2026-10-08");
      await expect.poll(async () => Math.abs((await rowOffset(page))!.y - before!.y)).toBeLessThanOrEqual(1);
      await expect(event).toBeVisible();
      await event.hover();
      await expect(event).toHaveAttribute("data-status", "hovered");
      await expect.poll(() => topVisibleDayDate(page)).toBe("2026-10-08");
      await expect.poll(async () => Math.abs((await rowOffset(page))!.y - before!.y)).toBeLessThanOrEqual(1);
      if (iteration < 2) await page.mouse.move(350, 20);
    }
    const movement = await page.evaluate(
      async ({ rowSelector, expectedY }) => {
        const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
        let maxDelta = 0;
        const deadline = performance.now() + 4000;
        while (performance.now() < deadline) {
          await new Promise(requestAnimationFrame);
          const row = document.querySelector<HTMLElement>(rowSelector);
          if (!row) throw new Error("Original participant row disappeared after Cancel");
          maxDelta = Math.max(
            maxDelta,
            Math.abs(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top - expectedY)
          );
        }
        return maxDelta;
      },
      { rowSelector, expectedY: before!.y }
    );
    expect(movement).toBeLessThanOrEqual(1);
  });
}
