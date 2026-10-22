import { expect, test } from "@playwright/test";
import { goToWorkday, setDemoZoom, waitForDemoEvents } from "#quno-e2e/helpers";

for (const initialZoom of [0.5, 3, 8]) {
  for (const mode of ["wheel", "slider"] as const) {
    for (const width of [1280, 1800]) {
      test(`dense vertical ${mode} zoom paints the final date/time projection on every frame from ${initialZoom} at ${width}px`, async ({
        page
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.clock.setFixedTime(new Date("2026-10-08T12:00:00"));
        await page.goto("/demo/infinite-calendar");
        await page.getByTestId("view-infinite-vertical").check();
        await page.getByTestId("scale-select").selectOption("20000");
        await setDemoZoom(page, initialZoom);
        await goToWorkday(page, "2026-10-07");
        await waitForDemoEvents(page);
        await page.locator(".quno-calendar-viewport").evaluate((viewport, initialZoom) => {
          const day = viewport.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-10-08"]')!;
          viewport.scrollTop +=
            day.getBoundingClientRect().top +
            50 +
            240 * initialZoom -
            viewport.getBoundingClientRect().top -
            (initialZoom === 0.5 ? 90 : 300);
        }, initialZoom);
        // Screen prefetch need not cover the following date at high zoom. Acquire it before sampling zoom frames.
        await expect
          .poll(() =>
            page.locator(".quno-calendar-viewport").evaluate((viewport) => {
              const box = viewport.getBoundingClientRect();
              return [
                ...viewport.querySelectorAll<HTMLElement>('[data-date="2026-10-08"] [data-testid="calendar-event"]')
              ].some((node) => {
                const rect = node.getBoundingClientRect();
                return (
                  rect.top > box.top + 80 && rect.bottom < box.bottom && rect.left > box.left && rect.right < box.right
                );
              });
            })
          )
          .toBe(true);
        const result = await page.evaluate(
          async ({ mode, initialZoom }) => {
            const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
            const day = viewport.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-10-08"]')!;
            const board = day.querySelector<HTMLElement>('[data-testid="vertical-day-board"]')!;
            const box = viewport.getBoundingClientRect();
            const inset = 50; // 42px day header plus the 8px timeline gutter.
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const initialHeight = board.getBoundingClientRect().height - 16;
            const anchorY = day.getBoundingClientRect().top + inset + 240 * initialZoom;
            const appointment = Array.from(day.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find(
              (node) => {
                const rect = node.getBoundingClientRect();
                return (
                  rect.top > box.top + 80 && rect.bottom < box.bottom && rect.left > box.left && rect.right < box.right
                );
              }
            );
            if (!appointment) throw new Error("No visible dense vertical appointment");
            const eventY = appointment.getBoundingClientRect().top;
            const samples: Array<{ anchor: number; event: number; connected: boolean; gap: number; ratio: number }> =
              [];
            let running = true;
            const sample = () => {
              const height = board.getBoundingClientRect().height - 16;
              const origin = day.getBoundingClientRect().top + inset;
              const ratio = height / initialHeight;
              const expectedEvent = anchorY + (eventY - anchorY) * ratio;
              const days = Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'))
                .map((node) => node.getBoundingClientRect())
                .sort((a, b) => a.top - b.top);
              const gaps = days.slice(1).map((rect, index) => Math.abs(rect.top - days[index].bottom));
              samples.push({
                ratio,
                gap: Math.max(0, ...gaps),
                anchor: Math.abs(origin + 240 * (height / 600) - anchorY),
                event: Math.abs(appointment.getBoundingClientRect().top - expectedEvent),
                connected: day.isConnected && appointment.isConnected
              });
              if (running) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
            let zoom = initialZoom;
            const deltas =
              initialZoom === 8
                ? [...Array<number>(51).fill(100), ...Array<number>(8).fill(-100)]
                : [-100, -100, -100, -100, 100, 100, 100, 100, -100, 100];
            for (const delta of deltas) {
              if (mode === "slider") {
                zoom =
                  initialZoom === 0.5
                    ? delta < 0
                      ? 8
                      : 0.5
                    : Math.max(0.5, Math.min(8, zoom + (delta < 0 ? 0.15 : -0.15)));
                const slider = document.querySelector<HTMLInputElement>('[data-testid="zoom-slider"]')!;
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, String(zoom));
                slider.dispatchEvent(new Event("input", { bubbles: true }));
              } else
                viewport.dispatchEvent(
                  new WheelEvent("wheel", {
                    bubbles: true,
                    cancelable: true,
                    shiftKey: true,
                    deltaY: delta,
                    clientX: box.left + 300,
                    clientY: anchorY
                  })
                );
              await new Promise((resolve) => requestAnimationFrame(resolve));
            }
            await new Promise((resolve) => setTimeout(resolve, 1600));
            running = false;
            return samples;
          },
          { mode, initialZoom }
        );
        expect(result.some((sample) => Math.abs(sample.ratio - 1) > 0.01)).toBe(true);
        expect(Math.max(...result.map((sample) => sample.gap))).toBeLessThanOrEqual(1);
        expect(result.every((sample) => sample.connected)).toBe(true);
        expect(Math.max(...result.map((sample) => sample.anchor))).toBeLessThanOrEqual(mode === "wheel" ? 1 : 2);
        expect(Math.max(...result.map((sample) => sample.event))).toBeLessThanOrEqual(mode === "wheel" ? 1 : 2);
      });
    }
  }
}
