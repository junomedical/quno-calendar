import { expect, test } from "@playwright/test";
import { goToWorkday, setDemoZoom } from "#quno-e2e/helpers";

for (const vertical of [false, true]) {
  for (const reduced of [false, true]) {
    for (const fine of [false, true]) {
      test(`${vertical ? "vertical" : "horizontal"} ${fine ? "five-minute grid" : "quarter-hour labels"} fades reversibly with reduced motion ${reduced}`, async ({
        page
      }) => {
        await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
        await page.clock.setFixedTime(new Date("2026-10-08T12:00:00"));
        await page.goto("/demo/infinite-calendar");
        if (vertical) await page.getByTestId("view-infinite-vertical").check();
        const low = fine ? 5.9 : 1.9;
        const high = fine ? 6.1 : 2.1;
        await setDemoZoom(page, low);
        await goToWorkday(page, "2026-10-08");
        const result = await page.evaluate(
          async ({ vertical, reduced, fine, low, high }) => {
            const day = document.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-10-08"]')!;
            const ticks = Array.from(
              (vertical ? day : document).querySelectorAll<HTMLElement>(
                vertical ? ".icv-time-tick" : ".quno-calendar-time-tick"
              )
            );
            const label = ticks.find((node) => node.textContent?.trim() === (fine ? "5" : "15"))!;
            const detail = day.querySelector<HTMLElement>(".quno-calendar-time-grid-detail")!;
            const targets = fine ? [label, detail] : [label];
            const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            // Finish any navigation-time transition before measuring the zoom itself.
            targets.forEach((node) => node.getAnimations().forEach((animation) => animation.finish()));
            const opacity = () => targets.map((node) => Number(getComputedStyle(node).opacity));
            const initial = opacity();
            const project = async (zoom: number, hidden: boolean) => {
              const slider = document.querySelector<HTMLInputElement>('[data-testid="zoom-slider"]')!;
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, String(zoom));
              slider.dispatchEvent(new Event("input", { bubbles: true }));
              for (let index = 0; index < 60; index += 1) {
                await frame();
                if (label.classList.contains("is-label-hidden") === hidden) break;
              }
              // Resolve the new style so the browser creates its CSS opacity transitions.
              opacity();
              const animations = targets.flatMap((node) => node.getAnimations());
              const properties = animations.map((animation) => (animation as CSSTransition).transitionProperty);
              for (const animation of animations) {
                animation.pause();
                animation.currentTime = Number(animation.effect!.getComputedTiming().duration) / 2;
              }
              return { animations, properties, midpoint: opacity(), hidden: label.getAttribute("aria-hidden") };
            };
            const entering = await project(high, false);
            entering.animations.forEach((animation) => animation.finish());
            const shown = opacity();
            const exiting = await project(low, true);
            // Reverse an unfinished exit; the same nodes must fade back from their current opacity.
            const reversing = await project(high, false);
            reversing.animations.forEach((animation) => animation.finish());
            const reshown = opacity();
            const finalExit = await project(low, true);
            finalExit.animations.forEach((animation) => animation.finish());
            return {
              initial,
              shown,
              reshown,
              final: opacity(),
              stages: [entering, exiting, reversing, finalExit].map(({ properties, midpoint, hidden }) => ({
                properties,
                midpoint,
                hidden
              })),
              stable: targets.every((node) => node.isConnected),
              tickCount:
                (vertical ? day : document).querySelectorAll(vertical ? ".icv-time-tick" : ".quno-calendar-time-tick")
                  .length === ticks.length,
              pointerEvents: getComputedStyle(detail).pointerEvents,
              gridSize: getComputedStyle(detail).backgroundSize,
              duration: getComputedStyle(label).transitionDuration,
              reduced
            };
          },
          { vertical, reduced, fine, low, high }
        );
        expect(result.initial.every((opacity) => opacity === 0)).toBe(true);
        expect(result.shown.every((opacity) => opacity === 1)).toBe(true);
        expect(result.reshown.every((opacity) => opacity === 1)).toBe(true);
        expect(result.final.every((opacity) => opacity === 0)).toBe(true);
        expect(result.stable && result.tickCount).toBe(true);
        expect(result.pointerEvents).toBe("none");
        expect(result.gridSize).toBe(vertical ? `100% ${low * 15}px` : `${low * 15}px 100%`);
        expect(result.duration).toBe(reduced ? "0s" : "0.16s");
        expect(result.stages.map((stage) => stage.hidden)).toEqual(["false", "true", "false", "true"]);
        for (const stage of result.stages) {
          expect(stage.properties).toEqual(reduced ? [] : Array(fine ? 2 : 1).fill("opacity"));
          expect(stage.midpoint.every((opacity) => reduced || (opacity > 0 && opacity < 1))).toBe(true);
        }
      });
    }
  }
}
