import { expect, test } from "@playwright/test";
import { selectCalendarScene, pauseCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
for (const width of [1440, 390])
  test.describe(`${width}px input`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.clock.setFixedTime(new Date("2026-10-19T12:00:00"));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/concept");
      await page.getByRole("button", { name: "Date Input", exact: true }).click();
    });
    test(`format guessing writes out different numeric date orders at ${width}px`, async ({ page }) => {
      await selectCalendarScene(page, "Format guessing");
      const field = page.locator('[data-action="date-input"]');
      for (const value of ["1 January 2021", "1 December 2012", "31 December 2021"])
        await expect(field).toHaveValue(value, { timeout: 10000 });
      await pauseCalendarScene(page);
      const guide = (await page.locator(".concept-tour-guide").boundingBox())!;
      const card = (await page.locator(".concept-product-card").boundingBox())!;
      if (width === 1440) expect(card.x).toBeGreaterThan(guide.x + guide.width);
      else {
        const stage = (await page.locator(".concept-product-stage").boundingBox())!;
        expect(stage.y + stage.height).toBeGreaterThan(guide.y);
      }
    });
    test(`focused picker shares typed and selected ranges at ${width}px`, async ({ page }, info) => {
      await selectCalendarScene(page, "Works with datepicker");
      const field = page.locator('[data-action="date-input"]');
      const picker = page.locator("#concept-input-picker");
      await expect(field).toHaveValue("19 October 2026 – 25 October 2026", { timeout: 15000 });
      await pauseCalendarScene(page);
      await expect(picker).toBeVisible();
      await expect(picker.locator('[data-slot="selection-header"]')).toBeHidden();
      const inputBox = (await field.boundingBox())!;
      const monthBox = (await picker.locator('[data-slot="month-heading"]').boundingBox())!;
      expect(monthBox.y - inputBox.y - inputBox.height).toBeLessThan(80);
      await expect(page.getByRole("button", { name: /^(Open|Close) picker$/ })).toHaveCount(0);
      await expect(field).toHaveAttribute("aria-expanded", "true");
      await field.fill("1 Nov 2026 - 5 Nov 2026");
      await field.press("Enter");
      await expect(picker.locator('[data-slot="month-heading"]')).toContainText("November 2026");
      await picker.locator('[data-slot="grid"] [data-date="2026-11-07"]').click();
      await expect(field).toHaveValue("1 November 2026 – 7 November 2026");
      await expect(picker).toBeVisible();
      const guide = (await page.locator(".concept-tour-guide").boundingBox())!;
      const stage = (await page.locator(".concept-product-stage").boundingBox())!;
      const card = (await page.locator(".concept-product-card").boundingBox())!;
      if (width === 1440) expect(card.x).toBeGreaterThan(guide.x + guide.width);
      else expect(stage.y + stage.height).toBeGreaterThan(guide.y);
      await page.screenshot({ path: info.outputPath("date-input-with-picker.png") });
      await page.getByRole("button", { name: /^All .+ demos$/ }).click();
      await expect(picker).toHaveCount(0);
      await field.focus();
      await expect(picker).toBeVisible();
      await field.press("Shift+Tab");
      await expect(picker).toHaveCount(0);
    });
    test(`natural input accepts native typing after a range dash at ${width}px`, async ({ page }) => {
      await selectCalendarScene(page, "Type naturally", false);
      const field = page.locator('[data-action="date-input"]');
      await field.pressSequentially("19 Oct 2026 -");
      await expect(field).toHaveValue("19 October 2026 – ");
      await field.pressSequentially("23 Oct 2026");
      await field.press("Enter");
      await expect(field).toHaveValue("19 October 2026 – 23 October 2026");
      await expect(field).not.toHaveAttribute("aria-invalid");
    });
  });
