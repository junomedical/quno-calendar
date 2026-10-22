import { expect, test, devices, type Page } from "@playwright/test";

async function timePoint(page: Page, vertical: boolean, minute: number) {
  return page.locator(".quno-calendar-viewport").evaluate(
    (viewport, { vertical, minute }) => {
      const day = viewport.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-10-08"]')!;
      const box = viewport.getBoundingClientRect();
      if (vertical) {
        const board = day.querySelector<HTMLElement>('[data-testid="vertical-day-board"]')!;
        const scale = (board.getBoundingClientRect().height - 16) / 600;
        return day.getBoundingClientRect().top - box.top + 50 + (minute - 480) * scale;
      }
      const track = viewport.querySelector<HTMLElement>(".quno-calendar-time-tick-track")!;
      return (
        track.getBoundingClientRect().left - box.left + ((minute - 480) * track.getBoundingClientRect().width) / 600
      );
    },
    { vertical, minute }
  );
}
async function wheel(page: Page, x: number, y: number, delta: number, count: number) {
  await page.locator(".quno-calendar-viewport").evaluate(
    async (viewport, { x, y, delta, count }) => {
      const box = viewport.getBoundingClientRect();
      for (let index = 0; index < count; index++) {
        viewport.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
            deltaY: delta,
            clientX: box.left + x,
            clientY: box.top + y
          })
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    },
    { x, y, delta, count }
  );
}
for (const vertical of [false, true]) {
  test(`${vertical ? "vertical" : "horizontal"}: Shift zoom restores its exact original pointer time after pauses and both limits`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(
      `/e2e/fixtures/calendar-engine.html?view=infinite-${vertical ? "vertical" : "horizontal"}&zoomStart=3`
    );
    const slider = page.getByLabel("Zoom", { exact: true });
    const viewport = page.locator(".quno-calendar-viewport");
    await expect(slider).toHaveValue("3");
    const minute = 607;
    const pixel = await timePoint(page, vertical, minute);
    const x = vertical ? 400 : pixel;
    const y = vertical ? pixel : 200;
    await wheel(page, x, y, -100, 35);
    await expect(slider).toHaveValue("8");
    expect(Math.abs((await timePoint(page, vertical, minute)) - pixel)).toBeLessThanOrEqual(1);
    await page.waitForTimeout(1100);
    await wheel(page, x + 40, y + 30, 100, 50);
    await expect(slider).toHaveValue("0.5");
    await page.waitForTimeout(1100);
    await wheel(page, x + 90, y + 40, -100, 13);
    await expect(slider).toHaveValue("3.1");
    await expect.poll(async () => Math.abs((await timePoint(page, vertical, minute)) - pixel)).toBeLessThanOrEqual(1);
    expect(await viewport.evaluate((node) => node.clientHeight)).toBeGreaterThan(500);
  });
  test(`${vertical ? "vertical" : "horizontal"}: iPad slider focuses offscreen current time and reverses to the same pixel`, async ({
    browser,
    browserName,
    baseURL
  }) => {
    test.skip(browserName === "firefox", "Firefox does not emulate mobile contexts.");
    const context = await browser.newContext({ ...devices["iPad (gen 7) landscape"], baseURL });
    const page = await context.newPage();
    await page.goto(
      `/e2e/fixtures/calendar-engine.html?view=infinite-${vertical ? "vertical" : "horizontal"}&zoomStart=8`
    );
    const slider = page.getByLabel("Zoom", { exact: true });
    const before = await timePoint(page, vertical, 720);
    expect(before).toBeGreaterThan(vertical ? 600 : 1100);
    await slider.fill("4");
    const focus = await timePoint(page, vertical, 720);
    expect(focus).toBeGreaterThan(200);
    expect(focus).toBeLessThan(vertical ? 550 : 1100);
    for (const zoom of [8, 0.5, 8, 4]) {
      await slider.fill(String(zoom));
      if (vertical || zoom >= 4)
        await expect.poll(async () => Math.abs((await timePoint(page, vertical, 720)) - focus)).toBeLessThanOrEqual(1);
    }
    await context.close();
  });
}

test("concept viewport-fitting minimum preserves the original wheel point after rejecting lower requests", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/calendar/zoom");
  const slider = page.getByRole("slider", { name: "Zoom level" });
  await slider.fill("3");
  const viewport = page.locator(".quno-calendar-viewport");
  const original = await viewport.evaluate((viewport) => {
    const box = viewport.getBoundingClientRect();
    const track = viewport.querySelector<HTMLElement>(".quno-calendar-time-tick-track")!.getBoundingClientRect();
    return { x: 637, fraction: (box.left + 637 - track.left) / track.width };
  });
  const point = () =>
    viewport.evaluate((viewport, fraction) => {
      const track = viewport.querySelector<HTMLElement>(".quno-calendar-time-tick-track")!.getBoundingClientRect();
      return track.left + track.width * fraction - viewport.getBoundingClientRect().left;
    }, original.fraction);
  await wheel(page, original.x, 200, -100, 35);
  await expect(slider).toHaveValue("8");
  await wheel(page, original.x + 40, 200, 100, 50);
  await expect(slider).toHaveValue((await slider.getAttribute("min"))!);
  await page.waitForTimeout(1100);
  await wheel(page, original.x + 100, 200, -100, 13);
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(3);
  await expect.poll(async () => Math.abs((await point()) - original.x)).toBeLessThanOrEqual(1);
});
