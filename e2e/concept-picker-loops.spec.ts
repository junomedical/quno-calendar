import { expect, test } from "@playwright/test";
import { pauseCalendarScene, selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
const scenes = [
  [
    "Paint a range",
    [
      ["2026-10-12", "2026-10-16"],
      ["2026-10-19", "2026-10-23"]
    ]
  ],
  [
    "Adjust the end",
    [
      ["2026-10-19", "2026-10-25"],
      ["2026-10-19", "2026-10-23"]
    ]
  ],
  [
    "Move the range",
    [
      ["2026-10-26", "2026-11-01"],
      ["2026-10-19", "2026-10-25"]
    ]
  ]
] as const;
for (const width of [1440, 390])
  for (const [scene, ranges] of scenes)
    test(`${scene} repeats both gestures without remounting or clearing at ${width}px`, async ({ page }) => {
      test.setTimeout(45000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/concept");
      await page.getByRole("button", { name: "Datepicker", exact: true }).click();
      await selectCalendarScene(page, scene);
      const card = await page.locator(".concept-product-card").elementHandle();
      const dates = page.locator('[data-slot="grid"] [data-committed="true"]');
      for (let cycle = 0; cycle < 2; cycle++)
        for (const [start, end] of ranges) {
          await expect(dates.first()).toHaveAttribute("data-date", start, { timeout: 10000 });
          await expect(dates.last()).toHaveAttribute("data-date", end, { timeout: 10000 });
        }
      await pauseCalendarScene(page);
      const settled = await dates.first().getAttribute("data-date");
      await page.waitForTimeout(1800);
      expect(await card!.evaluate((element) => element.isConnected)).toBe(true);
      await expect(dates.first()).toHaveAttribute("data-date", settled!);
      await expect(page.locator(".concept-tour-guide")).toHaveAttribute("data-collapsed", "false");
      await expect(page.locator('[data-slot="grid"]')).not.toHaveAttribute("data-interaction-active", "true");
    });
