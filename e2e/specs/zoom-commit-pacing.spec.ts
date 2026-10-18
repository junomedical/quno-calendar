import { expect, test } from "@playwright/test";
import type {} from "#quno-e2e/fixtures/zoomProbe";

for (const view of ["infinite-horizontal", "infinite-vertical"]) {
  test(`${view} accumulates input until delayed geometry commits without blanking content`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}&zoomDelay=180`);
    await expect(page.getByTestId("calendar-event").first()).toBeAttached();
    await page.waitForTimeout(200);
    const result = await page.evaluate(async (view) => {
      const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
      const box = viewport.getBoundingClientRect();
      const date = viewport.querySelector<HTMLElement>('[data-date="2026-10-08"]')!;
      const track =
        view === "infinite-horizontal"
          ? viewport.querySelector<HTMLElement>(".quno-calendar-time-tick-track")!
          : date.querySelector<HTMLElement>('[data-testid="vertical-day-board"]')!;
      const scale = () =>
        view === "infinite-horizontal"
          ? parseFloat(track.style.width) / 600
          : (parseFloat(track.style.height) - 16) / 600;
      const origin = () =>
        view === "infinite-horizontal" ? track.getBoundingClientRect().left : track.getBoundingClientRect().top + 8;
      const minute = 60;
      const anchor = origin() + minute * scale();
      const samples: Array<{
        error: number;
        events: number;
        visibleEvents: number;
        invalidEvents: number;
        gap: number;
      }> = [];
      let running = true;
      const sample = () => {
        const days = Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'))
          .map((day) => day.getBoundingClientRect())
          .sort((a, b) => a.top - b.top);
        const events = Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).map(
          (event) => event.getBoundingClientRect()
        );
        samples.push({
          error: Math.abs(origin() + minute * scale() - anchor),
          events: events.length,
          visibleEvents: events.filter(
            (event) =>
              event.bottom > box.top && event.top < box.bottom && event.right > box.left && event.left < box.right
          ).length,
          invalidEvents: events.filter(
            (event) => !Number.isFinite(event.x + event.y) || event.width <= 0 || event.height <= 0
          ).length,
          gap: Math.max(0, ...days.slice(1).map((day, index) => Math.abs(day.top - days[index].bottom)))
        });
        if (running) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      for (let index = 0; index < 8; index++) {
        viewport.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
            deltaY: -20,
            clientX: view === "infinite-horizontal" ? anchor : box.left + 300,
            clientY: view === "infinite-horizontal" ? box.top + 120 : anchor
          })
        );
        await new Promise(requestAnimationFrame);
      }
      await new Promise((resolve) => setTimeout(resolve, 650));
      running = false;
      return { probe: window.zoomProbe, samples, scale: scale(), overflow: getComputedStyle(viewport).overflow };
    }, view);
    expect(result.probe.maximumOutstanding).toBe(1);
    expect(result.probe.requests.length).toBeLessThanOrEqual(3);
    expect(result.probe.requests.every((request) => request.commitAt !== null)).toBe(true);
    expect(result.scale).toBeCloseTo(3.9, 2);
    expect(Math.max(...result.samples.map((sample) => sample.error))).toBeLessThanOrEqual(1);
    expect(Math.max(...result.samples.map((sample) => sample.gap))).toBeLessThanOrEqual(1);
    expect(Math.min(...result.samples.map((sample) => sample.events))).toBeGreaterThan(0);
    expect(Math.min(...result.samples.map((sample) => sample.visibleEvents))).toBeGreaterThan(0);
    expect(Math.max(...result.samples.map((sample) => sample.invalidEvents))).toBe(0);
    expect(result.overflow).toBe("auto");
  });
  test(`${view} recovers from a rejected request without retrying stale zoom`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}&zoomReject=1`);
    const viewport = page.locator(".quno-calendar-viewport");
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + 300, box.y + 160);
    await page.keyboard.down("Shift");
    await page.mouse.wheel(0, -100);
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Shift");
    await page.waitForTimeout(1100);
    expect(await page.evaluate(() => window.zoomProbe.requests.length)).toBe(1);
    await expect(page.getByRole("slider", { name: "Zoom" })).toHaveValue("1.5");
    await expect(viewport).toHaveCSS("overflow", "auto");
    await page.keyboard.down("Shift");
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Shift");
    await expect.poll(() => page.evaluate(() => window.zoomProbe.requests.length)).toBe(2);
    expect(await page.evaluate(() => window.zoomProbe.requests[1].zoom)).toBe(1.8);
  });
}
