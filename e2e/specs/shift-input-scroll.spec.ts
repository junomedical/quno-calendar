import { expect, test } from "@playwright/test";

for (const view of ["infinite-horizontal", "infinite-vertical"]) {
  for (const zoom of [0.5, 8]) {
    test(`${view} captures Shift scrolling at zoom ${zoom} and releases scrolling immediately on keyup`, async ({
      page
    }) => {
      await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}&zoomStart=${zoom}`);
      const slider = page.getByRole("slider", { name: "Zoom" });
      const viewport = page.locator(".quno-calendar-viewport");
      await viewport.evaluate((element) => {
        element.scrollTop += 300;
      });
      await page.waitForTimeout(100);
      const box = (await viewport.boundingBox())!;
      await page.mouse.move(box.x + 300, box.y + 180);
      const before = await viewport.evaluate((element) => ({ top: element.scrollTop, left: element.scrollLeft }));
      await page.keyboard.down("Shift");
      const delta = zoom === 8 ? -100 : 100;
      for (const [x, y] of [
        [0, delta],
        [delta, 0],
        [delta, delta]
      ]) {
        await page.mouse.wheel(x, y);
        await expect(viewport).toHaveCSS("overflow", "hidden");
        const position = await viewport.evaluate((element) => ({ top: element.scrollTop, left: element.scrollLeft }));
        expect(Math.abs(position.top - before.top)).toBeLessThanOrEqual(1);
        expect(Math.abs(position.left - before.left)).toBeLessThanOrEqual(1);
        await expect(slider).toHaveValue(String(zoom));
      }
      await page.keyboard.up("Shift");
      // No quiet-period wait: remaining momentum now follows the current modifier state.
      expect(await viewport.evaluate((element) => getComputedStyle(element).overflow)).toBe("auto");
      await page.mouse.wheel(0, delta);
      await expect
        .poll(async () => ((await viewport.evaluate((element) => element.scrollTop)) - before.top) * Math.sign(delta))
        .toBeGreaterThan(20);
      await expect(slider).toHaveValue(String(zoom));
    });
  }
  test(`${view} switches ongoing scrolling to zoom immediately on Shift`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}&zoomStart=3`);
    const viewport = page.locator(".quno-calendar-viewport");
    const slider = page.getByRole("slider", { name: "Zoom" });
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + 300, box.y + 180);
    await page.mouse.wheel(0, 100);
    await page.keyboard.down("Shift");
    await page.mouse.wheel(0, -100);
    await expect(slider).toHaveValue("3.2");
    await expect(viewport).toHaveCSS("overflow", "hidden");
    await page.keyboard.up("Shift");
    expect(await viewport.evaluate((element) => getComputedStyle(element).overflow)).toBe("auto");
  });
  test(`${view} delivers unshifted input once if no keyup was received`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-engine.html?view=${view}&zoomStart=8`);
    const viewport = page.locator(".quno-calendar-viewport");
    await viewport.evaluate((element) => {
      element.scrollTop += 300;
    });
    await page.waitForTimeout(100);
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + 300, box.y + 180);
    await page.keyboard.down("Shift");
    await page.mouse.wheel(0, -100);
    await expect(viewport).toHaveCSS("overflow", "hidden");
    const result = await viewport.evaluate((element) => {
      const before = element.scrollTop;
      const allowed = element.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -40, shiftKey: false, cancelable: true, bubbles: true })
      );
      return { allowed, distance: element.scrollTop - before, overflow: getComputedStyle(element).overflow };
    });
    expect(result).toEqual({ allowed: false, distance: -40, overflow: "auto" });
    await expect(page.getByRole("slider", { name: "Zoom" })).toHaveValue("8");
    await page.keyboard.up("Shift");
  });
}
