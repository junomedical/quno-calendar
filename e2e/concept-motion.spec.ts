import { calendarInitial } from "#quno-e2e/concept-helpers";
import { test, expect, type Page } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
async function scene(page: Page, name: string, vertical = false) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (vertical) await calendarInitial(page, { view: "infinite-vertical" });
  await page.goto("/concept");
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.locator(".concept-scenario button").filter({ hasText: name }).click();
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
      while (document.querySelector(".concept")?.getAttribute("data-playing") === "true") {
        const workspace = document.querySelector<HTMLElement>(".concept-calendar-workspace")!;
        const event = workspace.querySelector('[data-event-id="2026-10-19-event-0"]')?.getBoundingClientRect();
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
    expect(samples.at(-1)!.size).toBeGreaterThan(samples[0].size * 1.4);
    expect(Math.max(...samples.map((item) => Math.abs(item.pointer - item.thumb)))).toBeLessThan(2);
    expect(samples.every((item, i) => !i || item.zoom >= samples[i - 1].zoom)).toBe(true);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-zoom", "2.3");
    await expect(
      page.locator(
        '.concept-screen[data-active="true"] .concept-statusbar, .concept-fullscreen-dock .concept-statusbar'
      )
    ).not.toContainText("demonstration paused");
  });
  test(`demo scroll shows continuous intermediate positions in ${vertical ? "vertical" : "horizontal"} view`, async ({
    page
  }) => {
    await scene(page, "Infinite scroll", vertical);
    await page.getByRole("button", { name: "Try it", exact: true }).click();
    await page.getByRole("button", { name: "Replay scene", exact: true }).click();
    const samples = await page.evaluate(async () => {
      const values: number[] = [];
      let started = false;
      while (document.querySelector(".concept")?.getAttribute("data-playing") === "true") {
        const scrolling = !!document.querySelector('.concept-cursor[data-gesture="scroll"]');
        if (started && !scrolling) break;
        started ||= scrolling;
        // The date stays mounted while offscreen resource cells may mount after travel has begun.
        // Measure visible travel: the infinite viewport may rebase its internal scroll offset.
        const reference = document.querySelector('[data-testid="calendar-day"][data-date="2026-10-20"]');
        if (reference && started) values.push(-reference.getBoundingClientRect().top);
        await new Promise(requestAnimationFrame);
      }
      return values;
    });
    expect(new Set(samples).size).toBeGreaterThan(25);
    expect(samples.at(-1)! - samples[0]).toBeGreaterThan(400);
    expect(Math.max(...samples.slice(1).map((value, i) => Math.abs(value - samples[i])))).toBeLessThan(100);
  });
}
test("manual takeover stops interpolated zoom without a trailing animation", async ({ page }) => {
  await scene(page, "Zoom");
  const workspace = page.locator(".concept-calendar-workspace");
  await expect.poll(async () => Number(await workspace.getAttribute("data-zoom"))).toBeGreaterThan(1.5);
  await page.getByRole("button", { name: "Try it", exact: true }).click();
  const stopped = Number(await workspace.getAttribute("data-zoom"));
  expect(stopped).toBeLessThan(2.3);
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
  await page.getByRole("button", { name: "Try it", exact: true }).click();
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
