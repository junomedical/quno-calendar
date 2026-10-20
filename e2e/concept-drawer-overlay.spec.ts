import { expect, test } from "@playwright/test";
import { productTabLabel } from "#quno-e2e/concept-helpers";

test.describe.configure({ mode: "parallel" });
for (const size of [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 844, height: 390 }
]) {
  test(`mobile drawer overlays a stable full-height product canvas at ${size.width}×${size.height}`, async ({
    page
  }) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    for (const product of ["Datepicker", "Date Input", "Timepicker", "Date Parser"]) {
      await page.getByRole("button", { name: productTabLabel(product), exact: true }).click();
      const guide = page.locator(".concept-tour-guide");
      const stage = page.locator(".concept-product-stage");
      const card = page.locator(".concept-product-card");
      await expect(card).toBeVisible();
      const mounted = await card.elementHandle();
      const canvas = (await page.locator(".concept-canvas").boundingBox())!;
      const original = (await stage.boundingBox())!;
      const content = (await card.boundingBox())!;
      const expanded = (await guide.boundingBox())!;
      expect(original.y).toBe(canvas.y);
      expect(original.height).toBe(canvas.height);
      expect(original.y + original.height).toBe(size.height);
      expect(original.y + original.height).toBeGreaterThan(expanded.y);
      if (product === "Datepicker") {
        expect(content.y + content.height).toBeGreaterThan(expanded.y);
        const covered = await guide.evaluate((element) => {
          const sheet = element.getBoundingClientRect();
          const card = document.querySelector(".concept-product-card")!.getBoundingClientRect();
          const x = Math.max(sheet.left, card.left) + 20;
          const y = Math.max(sheet.top, card.top) + 10;
          return y < card.bottom && element.contains(document.elementFromPoint(x, y));
        });
        expect(covered).toBe(true);
        if (size.width === 390)
          await page.screenshot({ path: test.info().outputPath("datepicker-drawer-overlay.png") });
      }
      await guide.getByRole("button", { name: "Collapse description" }).click();
      expect(await stage.boundingBox()).toEqual(original);
      expect(await card.boundingBox()).toEqual(content);
      await guide.getByRole("button", { name: "Expand description" }).click();
      await guide.getByRole("button", { name: /^All .+ demos$/ }).click();
      expect(await stage.boundingBox()).toEqual(original);
      expect(await card.boundingBox()).toEqual(content);
      await page.keyboard.press("Escape");
      await guide.getByRole("button", { name: /^Full screen/ }).click();
      const fullscreen = (await stage.boundingBox())!;
      expect(fullscreen.height).toBe(size.height);
      await guide.getByRole("button", { name: "Collapse description" }).click();
      expect(await stage.boundingBox()).toEqual(fullscreen);
      await page.keyboard.press("Escape");
      expect(await stage.boundingBox()).toEqual(original);
      expect(await mounted!.evaluate((element) => element.isConnected)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
    }
  });
}
