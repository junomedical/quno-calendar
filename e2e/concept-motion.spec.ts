import {
  pauseCalendarScene,
  restartCalendarScene,
  calendarInitial,
  selectCalendarScene
} from "#quno-e2e/concept-helpers";
import { test, expect, type Page } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
async function scene(page: Page, name: string, vertical = false) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (vertical) await calendarInitial(page, { view: "infinite-vertical" });
  await page.goto("/concept");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await selectCalendarScene(page, name);
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
}
for (const vertical of [false, true]) {
  test(`demo zoom interpolates real geometry with a held slider in ${vertical ? "vertical" : "horizontal"} view`, async ({
    page
  }) => {
    await scene(page, "Zoom", vertical);
    await expect(page.locator('.concept-cursor[data-gesture="drag"]')).toBeVisible();
    const samples = await page.evaluate(async (vertical) => {
      const result: { zoom: number; size: number; pointer: number; thumb: number }[] = [];
      while (
        document.querySelector(".concept")?.getAttribute("data-playing") === "true" &&
        document.querySelector(".concept-canvas")?.getAttribute("data-playback-cycle") === "0"
      ) {
        const workspace = document.querySelector<HTMLElement>(".concept-calendar-workspace")!;
        const event = workspace.querySelector('[data-event-id$="-event-0"]')?.getBoundingClientRect();
        const input = workspace.querySelector<HTMLInputElement>('[data-action="zoom"]')!;
        const slider = input.getBoundingClientRect();
        const pointer = document.querySelector<HTMLElement>(".concept-cursor")!;
        if (event && pointer.dataset.gesture === "drag")
          result.push({
            zoom: Number(workspace.dataset.zoom),
            size: vertical ? event.height : event.width,
            pointer: pointer.getBoundingClientRect().left + 3,
            thumb:
              slider.left +
              8 +
              ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) *
                (slider.width - 16)
          });
        await new Promise(requestAnimationFrame);
      }
      return result;
    }, vertical);
    expect(new Set(samples.map((item) => item.zoom)).size).toBeGreaterThan(20);
    expect(new Set(samples.map((item) => item.size)).size).toBeGreaterThan(20);
    expect(Math.max(...samples.map((item) => item.size))).toBeGreaterThan(
      Math.min(...samples.map((item) => item.size)) * 3
    );
    expect(Math.max(...samples.map((item) => Math.abs(item.pointer - item.thumb)))).toBeLessThan(2);
    expect(samples.some((item, i) => i > 0 && item.zoom < samples[i - 1].zoom)).toBe(true);
    expect(samples.some((item, i) => i > 0 && item.zoom > samples[i - 1].zoom)).toBe(true);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-zoom", "8");
    await expect(
      page.locator(
        '.concept-screen[data-active="true"] .concept-statusbar, .concept-fullscreen-dock .concept-statusbar, .concept-tour-status'
      )
    ).not.toContainText("demonstration paused");
  });
  test(`demo scroll shows continuous intermediate positions in ${vertical ? "vertical" : "horizontal"} view`, async ({
    page
  }) => {
    await scene(page, "Infinite scroll", vertical);
    await pauseCalendarScene(page);
    await restartCalendarScene(page);
    const { values: samples, times } = await page.evaluate(async () => {
      const values: number[] = [];
      const times: number[] = [];
      let started = false;
      const deadline = performance.now() + 5000;
      while (
        document.querySelector(".concept")?.getAttribute("data-playing") === "true" &&
        performance.now() < deadline
      ) {
        const scrolling = !!document.querySelector('.concept-cursor[data-gesture="scroll"]');
        if (started && !scrolling) break;
        started ||= scrolling;
        // The date stays mounted while offscreen resource cells may mount after travel has begun.
        // Measure visible travel: the infinite viewport may rebase its internal scroll offset.
        const reference = document.querySelector('[data-testid="calendar-day"][data-date="2026-10-20"]');
        if (reference && started) {
          values.push(-reference.getBoundingClientRect().top);
          times.push(performance.now());
        }
        await new Promise(requestAnimationFrame);
      }
      return { values, times };
    });
    expect(new Set(samples).size).toBeGreaterThan(25);
    expect(samples.at(-1)! - samples[0]).toBeGreaterThanOrEqual(800);
    expect(
      samples.some(
        (value, index) =>
          index >= 8 &&
          value - samples[0] >= 800 &&
          samples.slice(index - 8, index + 1).every((position) => Math.abs(position - value) <= 1)
      )
    ).toBe(true);
    expect(Math.max(...samples.slice(1).map((value, i) => Math.abs(value - samples[i])))).toBeLessThan(100);
    let heldSince = 0;
    let longestHold = 0;
    for (let index = 1; index < samples.length; index++) {
      if (Math.abs(samples[index] - samples[index - 1]) > 1) heldSince = index;
      else longestHold = Math.max(longestHold, times[index] - times[heldSince]);
    }
    expect(longestHold).toBeGreaterThanOrEqual(1900);
  });
}
test("manual takeover stops interpolated zoom without a trailing animation", async ({ page }) => {
  await scene(page, "Zoom");
  const workspace = page.locator(".concept-calendar-workspace");
  await page.waitForFunction(() => {
    const zoom = Number(document.querySelector(".concept-calendar-workspace")?.getAttribute("data-zoom"));
    return zoom < 7 && zoom > 1;
  });
  await pauseCalendarScene(page);
  const stopped = Number(await workspace.getAttribute("data-zoom"));
  expect(stopped).toBeGreaterThan(0.5);
  expect(stopped).toBeLessThan(8);
  await page.waitForTimeout(800);
  await expect(workspace).toHaveAttribute("data-zoom", String(stopped));
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
  await expect(page.locator(".concept-cursor")).toBeHidden();
});

test("manual takeover stops eased scrolling at the current position", async ({ page }) => {
  await scene(page, "Infinite scroll");
  await page.waitForFunction(() => document.querySelector('.concept-cursor[data-gesture="scroll"]'));
  const viewport = page.locator(".quno-calendar-viewport");
  const start = await viewport.evaluate((element) => element.scrollTop);
  await page.waitForFunction(
    (start) => document.querySelector(".quno-calendar-viewport")!.scrollTop > start + 60,
    start
  );
  await pauseCalendarScene(page);
  expect((await viewport.evaluate((element) => element.scrollTop)) - start).toBeLessThan(400);
  const stopped = await viewport.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const event = [...element.querySelectorAll<HTMLElement>("[data-event-id]")].find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.top > bounds.top + 50 && rect.bottom < bounds.bottom;
    })!;
    return { id: event.dataset.eventId!, y: event.getBoundingClientRect().top - bounds.top };
  });
  await page.waitForTimeout(1500);
  const event = page.locator(`[data-event-id="${stopped.id}"]`);
  const position = (await event.boundingBox())!.y - (await viewport.boundingBox())!.y;
  expect(position).toBeCloseTo(stopped.y, 0);
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
  await expect(page.locator(".concept-cursor")).toBeHidden();
});
