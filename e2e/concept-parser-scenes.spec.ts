import { expect, test } from "@playwright/test";
import { selectCalendarScene, pauseCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
const examples = [
  ["next Friday", "2026-10-30", "2026-10-30", null],
  ["tomorrow 10:30", "2026-10-20", "2026-10-20", "10:30"],
  ["past 3 days", "2026-10-17", "2026-10-19", null],
  ["22 July 1980", "1980-07-22", "1980-07-22", null],
  ["12 Oct 2026 - 16 Oct 2026", "2026-10-12", "2026-10-16", null],
  ["next month", "2026-11-01", "2026-11-30", null]
] as const;
for (const width of [1440, 390]) {
  test(`parser introduction keeps its recognized date and time ready at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Date Parser", exact: true }).click();
    const field = page.locator('[data-action="phrase"]');
    const result = page.getByRole("status", { name: "Resolved dates" });
    await expect(field).toHaveValue("12/01 10:00");
    await expect(result).toContainText("2027-01-12 10:00");
    await expect(page.locator(".concept-tour-content")).toHaveAttribute("data-introduction", "true");
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
    await page.waitForTimeout(2200);
    await expect(field).toHaveValue("12/01 10:00");
    await expect(page.locator(".concept-cursor")).toBeHidden();
    await expect(field).toBeInViewport();
    await expect(result).toBeInViewport();
    const tokens = page.getByRole("list", { name: "Parsed tokens" });
    await expect(tokens.locator('[data-token-type="time"] code')).toHaveText("10:00");
    await page.screenshot({ path: info.outputPath("parser-ready-date-time.png") });
    await field.fill("tomorrow 11:30");
    await expect(result).toContainText("2026-10-20 11:30");
    await selectCalendarScene(page, "Resolve a phrase");
    await expect(field).toHaveValue("next Friday", { timeout: 10000 });
    await pauseCalendarScene(page);
    await page.getByRole("button", { name: "Previous demo", exact: true }).click();
    await expect(field).toHaveValue("12/01 10:00");
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
  });
  test(`parser phrase chapter resolves six examples and repeats at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Date Parser", exact: true }).click();
    await selectCalendarScene(page, "Resolve a phrase");
    const field = page.locator('[data-action="phrase"]');
    const result = page.getByRole("status", { name: "Resolved dates" });
    for (const [text, start, end, clock] of examples) {
      await expect(field).toHaveValue(text, { timeout: 10000 });
      await expect(result.locator("strong").first()).toHaveText(`Start · ${start}${clock ? ` ${clock}` : ""}`);
      await expect(result).toBeInViewport();
      await expect(result.locator("strong").last()).toHaveText(`End · ${end}${clock ? ` ${clock}` : ""}`);
    }
    await expect(page.locator(".concept-canvas")).toHaveAttribute("data-playback-cycle", "1", { timeout: 10000 });
    await expect(field).toHaveValue("next Friday", { timeout: 10000 });
    await expect(page.locator(".concept")).toHaveAttribute("data-scene", "phrase");
    await pauseCalendarScene(page);
    await field.fill("next week");
    await expect(result).toContainText("2026-10-26");
    await expect(result).toContainText("2026-11-01");
  });
}
