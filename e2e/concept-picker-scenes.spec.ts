import { expect, test } from "@playwright/test";
import { selectCalendarScene, pauseCalendarScene } from "#quno-e2e/concept-helpers";
import { expectProductResult } from "#quno-e2e/concept-product-results";
test.describe.configure({ mode: "parallel" });
const titles = [
  "Paint a range",
  "Adjust the end",
  "Move the range",
  "Guess the intent",
  "Access months",
  "Switch to start/end",
  "Single day"
];
for (const width of [1440, 390])
  test.describe(`${width}px Datepicker`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/concept");
      await page.getByRole("button", { name: "Datepicker", exact: true }).click();
    });
    test(`Datepicker contains the seven requested chapters with no surrounding controls at ${width}px`, async ({
      page
    }) => {
      await page.getByRole("button", { name: /^All .+ demos$/ }).click();
      const buttons = page.locator(".concept-tour-contents button");
      expect(await buttons.allTextContents()).toEqual([
        "01Datepicker",
        ...titles.map((title, index) => `0${index + 2}${title}`)
      ]);
      await buttons.last().click();
      await expect(
        page.locator(
          '.concept-product-card input[type="checkbox"], .concept-product-card output, .quno-date-picker-hint'
        )
      ).toHaveCount(0);
    });
    test(`intent cycles from extension to the other endpoint to one day at ${width}px`, async ({ page }, info) => {
      await selectCalendarScene(page, "Guess the intent");
      const ranges = ["2026-10-19 → 2026-10-27", "2026-10-23 → 2026-10-27", "2026-10-27 → 2026-10-27"];
      for (let index = 0; index < ranges.length; index++) {
        await expectProductResult(page, "Datepicker", ranges[index]);
        if (index < 2) {
          await expect(page.locator('[data-cycle-trigger="true"][data-demo-hover="true"]')).toBeVisible();
          const preview = page.locator('[data-slot="grid"] [data-cycle-preview-range-start="true"]');
          await expect(preview).toHaveAttribute("data-date", index === 0 ? "2026-10-23" : "2026-10-27");
          expect(await preview.evaluate((day) => getComputedStyle(day, "::after").borderTopWidth)).toBe("1px");
          if (width === 1440 && index === 0)
            await page.screenshot({ path: info.outputPath("datepicker-intent-preview.png") });
        }
      }
      await pauseCalendarScene(page);
      await selectCalendarScene(page, "Guess the intent", false);
      for (const range of ["2026-10-19 → 2026-10-27", "2026-10-23 → 2026-10-27", "2026-10-27 → 2026-10-27"]) {
        await page.locator('[data-slot="grid"] [data-date="2026-10-27"]').click();
        await expectProductResult(page, "Datepicker", range);
      }
    });
    test(`month access scrolls to 1980 and selects 22 July at ${width}px`, async ({ page }, info) => {
      await selectCalendarScene(page, "Access months");
      const months = page.locator('[data-slot="month-navigation"]');
      await expect(months).toBeVisible();
      const motion = await months.evaluate(async (element) => {
        const start = element.scrollTop;
        let previous = start;
        let first = 0;
        let last = 0;
        let samples = 0;
        while (element.isConnected) {
          if (element.scrollTop !== previous) {
            first ||= performance.now();
            last = performance.now();
            previous = element.scrollTop;
            samples++;
          }
          await new Promise(requestAnimationFrame);
        }
        return { duration: last - first, travel: start - previous, samples };
      });
      expect(motion.duration).toBeGreaterThan(8500);
      expect(motion.duration).toBeLessThan(10000);
      expect(motion.travel).toBeGreaterThan(9000);
      expect(motion.samples).toBeGreaterThan(30);
      await expect(page.locator('[data-slot="month-heading"]')).toContainText("July 1980", { timeout: 10000 });
      await expect(months).toHaveCount(0);
      await expectProductResult(page, "Datepicker", "1980-07-22");
      await expect(page.locator('[data-slot="grid"] [data-committed="true"]')).toHaveCount(1);
      await pauseCalendarScene(page);
      const guide = (await page.locator(".concept-tour-guide").boundingBox())!;
      const stage = (await page.locator(".concept-product-stage").boundingBox())!;
      if (width === 390) expect(stage.y + stage.height).toBeLessThan(guide.y);
      await page.screenshot({ path: info.outputPath("datepicker-birth-date.png") });
    });
    test(`manual takeover during year scrolling prevents a late birthday selection at ${width}px`, async ({ page }) => {
      await selectCalendarScene(page, "Access months");
      await expect(page.locator('.concept-cursor[data-gesture="scroll"]')).toBeVisible();
      await pauseCalendarScene(page);
      const months = page.locator('[data-slot="month-navigation"]');
      const top = await months.evaluate((element) => element.scrollTop);
      await page.waitForTimeout(3400);
      expect(await months.evaluate((element) => element.scrollTop)).toBe(top);
      await expect(page.locator('[data-slot="month-heading"]')).toContainText("October 2026");
      await expect(page.locator('[data-slot="selection-summary"]')).toHaveText("Choose a date");
    });
    test(`endpoint shortcuts preserve the range while visiting both ends at ${width}px`, async ({ page }) => {
      await selectCalendarScene(page, "Switch to start/end");
      const heading = page.locator('[data-slot="month-heading"]');
      for (const month of ["September 2026", "November 2026", "October 2026"])
        await expect(heading).toContainText(month, { timeout: 10000 });
      await expect(page.locator('[data-slot="selection-summary"]')).toHaveText("19 Sept 2026 – 23 Nov 2026");
    });
    test(`single-day scene replaces one date at a time at ${width}px`, async ({ page }) => {
      await selectCalendarScene(page, "Single day");
      for (const date of ["2026-10-21", "2026-10-24", "2026-10-19"])
        await expectProductResult(page, "Datepicker", date);
      await expect(page.locator('[data-slot="grid"] [data-committed="true"]')).toHaveCount(1);
    });
  });
