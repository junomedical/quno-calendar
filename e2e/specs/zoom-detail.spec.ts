import { expect, test } from "@playwright/test";
import { goToWorkday, setDemoZoom, waitForDemoEvents } from "#quno-e2e/helpers";

for (const vertical of [false, true]) {
  for (const reduced of [false, true]) {
    for (const mode of ["wheel", "slider"] as const) {
      test(`${vertical ? "vertical" : "horizontal"} ${mode} zoom switches detail immediately with reduced motion ${reduced}`, async ({
        page
      }) => {
        await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
        await page.clock.setFixedTime(new Date("2026-10-08T12:00:00"));
        await page.goto("/demo/infinite-calendar");
        if (vertical) await page.getByTestId("view-infinite-vertical").check();
        await page.getByTestId("scale-select").selectOption("20000");
        await setDemoZoom(page, 5.9);
        await goToWorkday(page, "2026-10-08");
        await waitForDemoEvents(page);
        const result = await page.evaluate(
          async ({ vertical, mode }) => {
            const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
            const day = viewport.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-10-08"]')!;
            const grid = day.querySelector<HTMLElement>(
              vertical ? ".icv-calendar-column-grid" : ".quno-calendar-row-grid"
            )!;
            const track = vertical
              ? day.querySelector<HTMLElement>('[data-testid="vertical-day-board"]')!
              : viewport.querySelector<HTMLElement>(".quno-calendar-time-tick-track")!;
            const ticks = Array.from(
              (vertical ? day : viewport).querySelectorAll<HTMLElement>(
                vertical ? ".icv-time-tick" : ".quno-calendar-time-tick"
              )
            );
            const label = ticks.find((tick) => tick.textContent?.trim() === "5")!;
            const geometry = () => (vertical ? track.style.height : track.style.width);
            const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const box = viewport.getBoundingClientRect();
            const pointerX = vertical ? box.left + 300 : track.getBoundingClientRect().left + 15 * 5.9;
            const pointerY = vertical ? day.getBoundingClientRect().top + 50 + 15 * 5.9 : box.top + 160;
            const sample = () => ({
              display: getComputedStyle(label).display,
              hidden: label.getAttribute("aria-hidden"),
              spacing: getComputedStyle(grid).backgroundSize,
              opaque: ticks
                .filter((tick) => tick.getAttribute("aria-hidden") !== "true")
                .every((tick) => getComputedStyle(tick).opacity === "1"),
              animations: ticks.flatMap((tick) => tick.getAnimations()).length
            });
            const initial = sample();
            const samples = [];
            let zoom = 5.9;
            for (const direction of [1, -1, 1, -1]) {
              const before = geometry();
              zoom = Number((zoom + direction * (mode === "wheel" ? 0.3 : 0.2)).toFixed(2));
              if (mode === "wheel")
                viewport.dispatchEvent(
                  new WheelEvent("wheel", {
                    bubbles: true,
                    cancelable: true,
                    shiftKey: true,
                    deltaY: -100 * direction,
                    clientX: pointerX,
                    clientY: pointerY
                  })
                );
              else {
                const slider = document.querySelector<HTMLInputElement>('[data-testid="zoom-slider"]')!;
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, String(zoom));
                slider.dispatchEvent(new Event("input", { bubbles: true }));
              }
              let frames = 0;
              while (geometry() === before && frames < 5) {
                await frame();
                frames += 1;
              }
              samples.push({ ...sample(), zoom, frames });
            }
            return {
              initial,
              samples,
              stable: ticks.every((tick) => tick.isConnected),
              overlays: viewport.querySelectorAll(".quno-calendar-time-grid-detail").length
            };
          },
          { vertical, mode }
        );
        expect(result.initial.display).toBe("none");
        expect(result.initial.hidden).toBe("true");
        expect(result.stable).toBe(true);
        expect(result.overlays).toBe(0);
        for (const sample of result.samples) {
          const fine = sample.zoom > 6;
          expect(sample.frames).toBeLessThan(5);
          expect(sample.display).toBe(fine ? "block" : "none");
          expect(sample.hidden).toBe(fine ? "false" : "true");
          const spacing = sample.zoom * (fine ? 5 : 15);
          expect(sample.spacing).toBe(vertical ? `100% ${spacing}px` : `${spacing}px 100%`);
          expect(sample.opaque).toBe(true);
          expect(sample.animations).toBe(0);
        }
      });
    }
  }
}
