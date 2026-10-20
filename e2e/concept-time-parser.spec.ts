import { expect, test } from "@playwright/test";
import { selectCalendarScene, pauseCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
for (const width of [1440, 390]) {
  test(`ambiguity resolves numeric and abbreviated dates without preferences at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Parser", exact: true }).click();
    await selectCalendarScene(page, "Resolve ambiguity");
    const result = page.getByRole("status", { name: "Resolved dates" });
    const field = page.locator('[data-action="phrase"]');
    const tokens = page.getByRole("list", { name: "Parsed tokens" });
    for (const [text, date] of [
      ["10-11-12", "2012-11-10"],
      ["01/02", "2027-02-01"],
      ["feb 11 80", "1980-02-11"],
      ["10-11-12", "2012-11-10"]
    ]) {
      await expect(field).toHaveValue(text, { timeout: 10000 });
      await expect(result.locator("strong").first()).toHaveText(`Start · ${date}`);
      await expect(result.locator("strong").last()).toHaveText(`End · ${date}`);
      await expect(tokens).toBeInViewport();
      await expect(result).toBeInViewport();
    }
    await expect(page.locator(".concept-canvas")).toHaveAttribute("data-playback-cycle", "1", { timeout: 10000 });
    await expect(field).toHaveValue("01/02", { timeout: 10000 });
    await pauseCalendarScene(page);
    await expect(
      page.locator(
        ".concept-product-card details, .concept-product-card fieldset, .concept-product-card input[type=checkbox]"
      )
    ).toHaveCount(0);
    await expect(result).toBeInViewport();
    await field.fill("feb 11 80");
    await expect(tokens.locator("small")).toHaveText(["month name", "number", "year"]);
    await expect(result).toContainText("1980-02-11");
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
  });
  test(`time choices compose with calendar days and return to their starting value at ${width}px`, async ({
    page
  }, info) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Timepicker", exact: true }).click();
    await selectCalendarScene(page, "Works with datepicker");
    const summary = page.locator('[data-slot="selection-summary"]');
    for (const [date, time] of [
      ["21 Oct 2026", "10:45"],
      ["24 Oct 2026", "14:30"],
      ["19 Oct 2026", "09:00"]
    ]) {
      await expect(summary).toContainText(`${date} ${time}`, { timeout: 15000 });
      await expect(page.locator('[data-slot="grid"]')).toBeVisible();
    }
    await pauseCalendarScene(page);
    const guide = (await page.locator(".concept-tour-guide").boundingBox())!;
    const stage = (await page.locator(".concept-product-stage").boundingBox())!;
    if (width === 390) expect(stage.y + stage.height).toBeGreaterThan(guide.y);
    else expect((await page.locator(".concept-product-card").boundingBox())!.x).toBeGreaterThan(guide.x + guide.width);
    const day = page.locator('[data-slot="grid"] [data-date="2026-10-22"]');
    await day.click();
    await expect(page.locator('[data-slot="time-navigation"]')).toBeVisible();
    const hour = page.locator('[data-hour="9"] [data-slot="hour-heading"]');
    const minute = page.locator('[data-time="09:00"]');
    await expect(hour).toHaveCSS("font-size", "16px");
    await expect(minute).toHaveCSS("font-size", "13px");
    await expect(minute).toHaveCSS("font-weight", "400");
    await page.screenshot({ path: info.outputPath("datepicker-time-choices.png") });
    await minute.click();
    await expect(summary).toContainText("22 Oct 2026 09:00");
    await page.screenshot({ path: info.outputPath("timepicker-with-datepicker.png") });
  });
  test(`phrase resolution exposes tokens and resolved dates at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Parser", exact: true }).click();
    await selectCalendarScene(page, "Resolve a phrase");
    await expect(
      page.locator(
        ".concept-product-card details, .concept-product-card fieldset, .concept-product-card input[type=checkbox]"
      )
    ).toHaveCount(0);
    const field = page.locator('[data-action="phrase"]');
    const tokens = page.getByRole("list", { name: "Parsed tokens" });
    const result = page.getByRole("status", { name: "Resolved dates" });
    await expect(field).toHaveValue("next Friday", { timeout: 10000 });
    await expect(tokens.locator("code")).toHaveText(["next", "Friday"]);
    await expect(tokens.locator("small")).toHaveText(["relative", "weekday"]);
    await expect(tokens.locator('[data-known="true"]')).toHaveCount(2);
    await expect(tokens.locator("li").first()).toHaveCSS("background-color", "rgb(236, 248, 239)");
    await expect(result).toContainText("2026-10-30");
    await pauseCalendarScene(page);
    await field.fill("next month");
    await expect(tokens.locator("code")).toHaveText(["next", "month"]);
    await expect(tokens.locator("small")).toHaveText(["relative", "month unit"]);
    await expect(result).toContainText("2026-11-01");
    await expect(result).toContainText("2026-11-30");
    await pauseCalendarScene(page);
    await expect(tokens).toBeInViewport();
    await expect(result).toBeInViewport();
    const tokenBox = (await tokens.boundingBox())!;
    const resultBox = (await result.boundingBox())!;
    expect(resultBox.y).toBeGreaterThan(tokenBox.y + tokenBox.height);
    await page.screenshot({ path: info.outputPath("parser-tokens.png") });
    await field.fill("July 22 1980 mystery");
    await expect(tokens.locator("small")).toHaveText(["month name", "number", "year", "unknown word"]);
    await expect(tokens.locator("li").last()).toHaveAttribute("data-known", "false");
    await field.fill("60 61 1980 9999 10000");
    await expect(tokens.locator("small")).toHaveText(["number", "year", "year", "year", "number"]);
    await field.fill("10:");
    await expect(tokens.locator("small")).toHaveText(["number", "time separator"]);
    await field.fill("past 61 days");
    await expect(tokens.locator("small")).toHaveText(["relative", "number", "day unit"]);
    await field.fill("past 3 days");
    await expect(tokens.locator("small")).toHaveText(["relative", "number", "day unit"]);
    await selectCalendarScene(page, "Cross midnight", false);
    await field.fill("tomorrow 23:00–01:00");
    await expect(tokens.locator('[data-token-type="time"]')).toHaveCount(2);
    await expect(result).toContainText("23:00");
    await expect(result).toContainText("01:00");
  });
}
