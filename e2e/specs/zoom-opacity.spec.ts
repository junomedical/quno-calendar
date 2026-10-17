import { expect, test } from "@playwright/test";
import { goToWorkday, setDemoZoom, waitForDemoEvents } from "#quno-e2e/helpers";

for (const vertical of [false, true]) {
  for (const reduced of [false, true]) {
    for (const fine of [false, true]) {
      for (const mode of ["wheel", "slider"] as const) {
        test(`${vertical ? "vertical" : "horizontal"} ${mode} ${fine ? "fine grid" : "quarter labels"} follows zoom immediately with reduced motion ${reduced}`, async ({
          page
        }) => {
          await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
          await page.clock.setFixedTime(new Date("2026-10-08T12:00:00"));
          await page.goto("/demo/infinite-calendar");
          if (vertical) await page.getByTestId("view-infinite-vertical").check();
          await page.getByTestId("scale-select").selectOption("20000");
          const low = fine ? (mode === "wheel" ? 5.9 : 6) : 1.8;
          await setDemoZoom(page, low);
          await goToWorkday(page, "2026-10-08");
          await waitForDemoEvents(page);
          const result = await page.evaluate(
            async ({ vertical, reduced, fine, mode, low }) => {
              const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
              const day = viewport.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-10-08"]')!;
              const track = vertical
                ? day.querySelector<HTMLElement>('[data-testid="vertical-day-board"]')!
                : viewport.querySelector<HTMLElement>(".quno-calendar-time-tick-track")!;
              const ticks = Array.from(
                (vertical ? day : viewport).querySelectorAll<HTMLElement>(
                  vertical ? ".icv-time-tick" : ".quno-calendar-time-tick"
                )
              );
              const label = ticks.find((node) => node.textContent?.trim() === (fine ? "5" : "15"))!;
              const detail = day.querySelector<HTMLElement>(".quno-calendar-time-grid-detail")!;
              const targets = fine ? [label, detail] : [label];
              const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              const geometry = () => (vertical ? track.style.height : track.style.width);
              const sample = () =>
                targets.map((node) => ({
                  opacity: Number(getComputedStyle(node).opacity),
                  display: getComputedStyle(node).display,
                  animations: node.getAnimations().length
                }));
              const initial = sample();
              const viewportBox = viewport.getBoundingClientRect();
              const pointerX = vertical ? viewportBox.left + 300 : track.getBoundingClientRect().left + 15 * low;
              const pointerY = vertical ? day.getBoundingClientRect().top + 50 + 15 * low : viewportBox.top + 160;
              const samples = [];
              let zoom = low;
              for (const direction of [1, 1, -1, 1, -1, -1]) {
                const previous = geometry();
                zoom = Number((zoom + direction * (mode === "wheel" ? 0.15 : 0.1)).toFixed(2));
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
                while (geometry() === previous && frames < 5) {
                  await frame();
                  frames += 1;
                }
                const opacity = Math.min(1, Math.max(0, (zoom - (fine ? 6 : 1.85)) / 0.15));
                samples.push({
                  frames,
                  expected: reduced && opacity > 0 ? 1 : opacity,
                  state: sample(),
                  hidden: label.getAttribute("aria-hidden"),
                  spacing: getComputedStyle(detail).backgroundSize,
                  zoom
                });
              }
              const finalGeometry = geometry();
              const immediate = sample();
              await new Promise((resolve) => setTimeout(resolve, 200));
              return {
                initial,
                samples,
                immediate,
                settled: sample(),
                sameGeometry: finalGeometry === geometry(),
                stable: targets.every((node) => node.isConnected),
                hiddenCount: ticks
                  .filter((node) => node.getAttribute("aria-hidden") === "true")
                  .every((node) => getComputedStyle(node).display === "none"),
                pointerEvents: getComputedStyle(detail).pointerEvents
              };
            },
            { vertical, reduced, fine, mode, low }
          );
          expect(result.initial.every((state) => state.opacity === 0 && state.display === "none")).toBe(true);
          expect(result.stable && result.sameGeometry && result.hiddenCount).toBe(true);
          expect(result.pointerEvents).toBe("none");
          expect(result.immediate).toEqual(result.settled);
          for (const sample of result.samples) {
            expect(sample.frames).toBeLessThan(5);
            expect(sample.hidden).toBe(sample.expected > 0 ? "false" : "true");
            expect(sample.spacing).toBe(vertical ? `100% ${sample.zoom * 15}px` : `${sample.zoom * 15}px 100%`);
            for (const state of sample.state) {
              expect(state.opacity).toBeCloseTo(sample.expected, 5);
              expect(state.display).toBe(sample.expected > 0 ? "block" : "none");
              expect(state.animations).toBe(0);
            }
          }
        });
      }
    }
  }
}
