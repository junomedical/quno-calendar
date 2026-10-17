import { expect, test } from "@playwright/test";
import { goToWorkday, setDemoZoom, waitForDemoEvents } from "#quno-e2e/helpers";

for (const mode of ["wheel", "slider"] as const) {
  for (const width of [1280, 1800]) {
    test(`dense ${mode} zoom keeps current time and appointment geometry aligned on every frame at ${width}px`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.clock.setFixedTime(new Date("2026-10-08T12:00:00"));
      await page.goto("/demo/infinite-calendar");
      await page.getByTestId("scale-select").selectOption("20000");
      await goToWorkday(page, "2026-10-08");
      await waitForDemoEvents(page);
      await setDemoZoom(page, 3);
      const result = await page.evaluate(async (mode) => {
        const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
        const marker = viewport.querySelector<HTMLElement>(".quno-calendar-now-pin")!;
        const track = viewport.querySelector<HTMLElement>(".quno-calendar-time-tick-track")!;
        const viewportBox = viewport.getBoundingClientRect();
        viewport.scrollLeft += marker.getBoundingClientRect().left - viewportBox.left - viewportBox.width * 0.6;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const markerX = marker.getBoundingClientRect().left + marker.getBoundingClientRect().width / 2;
        const initialWidth = track.getBoundingClientRect().width;
        const appointment = Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find(
          (element) => {
            const box = element.getBoundingClientRect();
            return (
              box.top > viewportBox.top + 90 &&
              box.bottom < viewportBox.bottom &&
              box.left > viewportBox.left + 240 &&
              box.right < viewportBox.right
            );
          }
        )!;
        if (!appointment) throw new Error("No visible appointment to sample during dense zoom");
        const initialEventX = appointment.getBoundingClientRect().left;
        const samples: Array<{ marker: number; event: number; ratio: number }> = [];
        let running = true;
        const sample = () => {
          const currentX = marker.getBoundingClientRect().left + marker.getBoundingClientRect().width / 2;
          const ratio = track.getBoundingClientRect().width / initialWidth;
          samples.push({
            ratio,
            marker: Math.abs(currentX - markerX),
            event: Math.abs(appointment.getBoundingClientRect().left - (markerX + (initialEventX - markerX) * ratio))
          });
          if (running) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
        let zoom = 3;
        for (const delta of [-100, -100, -100, -100, 100, 100, 100, 100, -100, 100]) {
          if (mode === "slider") {
            zoom += delta < 0 ? 0.15 : -0.15;
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
                clientX: markerX + 1,
                clientY: viewportBox.top + 160
              })
            );
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await new Promise((resolve) => setTimeout(resolve, 700));
        running = false;
        return { samples, sameEvent: appointment.isConnected, changed: samples.some((sample) => sample.ratio !== 1) };
      }, mode);
      expect(result.changed).toBe(true);
      expect(result.sameEvent).toBe(true);
      expect(Math.max(...result.samples.map((sample) => sample.marker))).toBeLessThanOrEqual(1);
      expect(Math.max(...result.samples.map((sample) => sample.event))).toBeLessThanOrEqual(1);
    });
  }
}
