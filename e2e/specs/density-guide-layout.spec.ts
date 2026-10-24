import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`busy-schedule date labels fit their headers at ${width}px in ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/docs/infinite-calendar#performance");
      await page.locator('.article-lazy-demo[data-demo-label="event density comparison"]').scrollIntoViewIfNeeded();
      const demo = page.getByTestId("density-guide-demo");
      const workspace = demo.locator(".concept-calendar-workspace");
      await expect(workspace).toHaveAttribute("data-theme", "light");
      await expect(demo).toHaveCSS("font-size", "16px");
      await expect(demo).toHaveCSS("line-height", "normal");
      for (const [label, count] of [
        ["Quiet · 4", "4"],
        ["Busy · 20", "20"],
        ["Packed · 60", "60"]
      ] as const) {
        await demo.getByRole("button", { name: label, exact: true }).click();
        await expect(workspace).toHaveAttribute("data-density", count);
        const dates = demo.locator(".quno-calendar-date-label");
        await expect(dates.first()).toHaveCSS("font-size", width === 390 ? "9.6px" : "13px");
        const geometry = await dates.evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(element);
            const text = range.getBoundingClientRect();
            return {
              whiteSpace: style.whiteSpace,
              overflow: style.overflow,
              ellipsis: style.textOverflow,
              lineHeight: Number.parseFloat(style.lineHeight),
              size: Number.parseFloat(style.fontSize),
              height: box.height,
              scrollHeight: element.scrollHeight,
              clientHeight: element.clientHeight,
              textTop: text.top - box.top,
              textBottom: box.bottom - text.bottom
            };
          })
        );
        expect(geometry.length).toBeGreaterThan(0);
        for (const date of geometry) {
          expect(date.whiteSpace).toBe("nowrap");
          expect(date.overflow).toBe("hidden");
          expect(date.ellipsis).toBe("ellipsis");
          expect(date.lineHeight).toBe(date.size);
          expect(date.height).toBeGreaterThan(date.lineHeight);
          expect(date.scrollHeight).toBeLessThanOrEqual(date.clientHeight);
          expect(date.textTop).toBeGreaterThanOrEqual(0);
          expect(date.textBottom).toBeGreaterThanOrEqual(0);
        }
      }
      expect((await demo.locator(".quno-calendar-viewport").boundingBox())!.height).toBeGreaterThan(450);
      expect(await demo.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
}
