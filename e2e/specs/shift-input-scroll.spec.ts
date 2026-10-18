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
      // Momentum continues after key release and finger lift. Each sample renews the quiet-period lock.
      for (let index = 0; index < 12; index++) {
        const momentum = delta * 0.8 ** index;
        await page.mouse.wheel(index % 2 ? momentum : 0, index % 2 ? 0 : momentum);
        await page.waitForTimeout(90);
        await expect(viewport).toHaveCSS("overflow", "hidden");
        const position = await viewport.evaluate((element) => ({ top: element.scrollTop, left: element.scrollLeft }));
        expect(Math.abs(position.top - before.top)).toBeLessThanOrEqual(1);
        expect(Math.abs(position.left - before.left)).toBeLessThanOrEqual(1);
        await expect(slider).toHaveValue(String(zoom));
      }
      await page.waitForTimeout(350);
      await expect(viewport).toHaveCSS("overflow", "auto");
      await page.mouse.wheel(0, 100);
      await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(before.top + 20);
    });
  }
}

for (const view of ["infinite-horizontal", "infinite-vertical"]) {
  test(`${view} keeps a scrolling gesture from becoming zoom when Shift is pressed`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}&zoomStart=3`);
    const viewport = page.locator(".quno-calendar-viewport");
    const slider = page.getByRole("slider", { name: "Zoom" });
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + 300, box.y + 180);
    const initialTop = await viewport.evaluate((element) => element.scrollTop);
    await page.mouse.wheel(0, 100);
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(initialTop);
    await page.keyboard.down("Shift");
    for (let index = 0; index < 12; index++) {
      await page.mouse.wheel(0, 100 * 0.8 ** index);
      await page.waitForTimeout(90);
      await expect(slider).toHaveValue("3");
      await expect(viewport).toHaveCSS("overflow", "auto");
    }
    await page.waitForTimeout(350);
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Shift");
    await expect(slider).toHaveValue("3.2");
    await expect(viewport).toHaveCSS("overflow", "hidden");
  });
}
