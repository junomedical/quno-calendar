import { expect, test } from "@playwright/test";

for (const view of ["infinite-horizontal", "infinite-vertical"]) {
  for (const zoom of [0.5, 8]) {
    test(`${view} captures Shift scrolling at zoom ${zoom} and releases ordinary scrolling`, async ({ page }) => {
      await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}`);
      await page.getByTestId("calendar-event").first().waitFor({ state: "attached" });
      const slider = page.getByRole("slider", { name: "Zoom" });
      await slider.fill(String(zoom));
      await expect(slider).toHaveValue(String(zoom));
      const viewport = page.locator(".quno-calendar-viewport");
      await viewport.evaluate((element) => {
        element.scrollTop += 200;
        element.scrollLeft = Math.min(200, (element.scrollWidth - element.clientWidth) / 2);
      });
      await page.waitForTimeout(200);
      const box = (await viewport.boundingBox())!;
      await page.mouse.move(box.x + 300, box.y + 200);
      const before = await viewport.evaluate((element) => ({ top: element.scrollTop, left: element.scrollLeft }));
      await page.keyboard.down("Shift");
      const delta = zoom === 8 ? -100 : 100;
      for (const [x, y] of [
        [0, delta],
        [delta, 0],
        [delta, delta]
      ]) {
        // Real wheel input exercises the browser's default scroll action, unlike dispatchEvent.
        await page.mouse.wheel(x, y);
        await page.waitForTimeout(60);
        await expect(viewport).toHaveCSS("overflow", "hidden");
        const position = await viewport.evaluate((element) => ({ top: element.scrollTop, left: element.scrollLeft }));
        expect(Math.abs(position.top - before.top)).toBeLessThanOrEqual(1);
        expect(Math.abs(position.left - before.left)).toBeLessThanOrEqual(1);
        await expect(slider).toHaveValue(String(zoom));
      }
      await page.keyboard.up("Shift");
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(60);
      expect(await viewport.evaluate((element) => element.scrollTop)).toBeCloseTo(before.top, 0);
      await page.waitForTimeout(350);
      await expect(viewport).toHaveCSS("overflow", "auto");
      await page.mouse.wheel(0, 100);
      await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(before.top + 20);
    });
  }
}
