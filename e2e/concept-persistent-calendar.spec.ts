import { selectCalendarScene } from "#quno-e2e/concept-helpers";
import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
for (const mobile of [false, true]) {
  test(`calendar stays mounted and fixed while ${mobile ? "mobile" : "desktop"} scenes change`, async ({ page }) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    const viewport = page.locator(".quno-calendar-viewport");
    await expect(page.locator(".concept-event").first()).toBeVisible();
    const original = await viewport.elementHandle();
    const bounds = (await viewport.boundingBox())!;
    const first = page.locator('[data-event-id="2026-10-19-event-0"]');
    const text = await first.textContent();
    await selectCalendarScene(page, "Zoom", false);
    expect(await viewport.boundingBox()).toEqual(bounds);
    expect(await original!.evaluate((node) => node === document.querySelector(".quno-calendar-viewport"))).toBe(true);
    expect(await first.textContent()).toBe(text);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-visible-date", "2026-10-19");
    await expect(page.locator(".concept-calendar-workspace > .concept-result")).toHaveCount(0);
    await expect(page.locator(".concept-calendar-workspace")).not.toContainText("events / day");
  });
}
test("each scenario exposes only its JSON-selected control in the calendar bottom right", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  for (const [title, label] of [
    ["Infinite scroll", ""],
    ["Zoom", "Zoom controls"],
    ["Overlapping events", ""],
    ["Horizontal / vertical", "Calendar view"],
    ["Theming", "Calendar theme"],
    ["Event density", "Event density"],
    ["Create an appointment", ""],
    ["Reschedule", ""]
  ]) {
    await selectCalendarScene(page, title, false);
    const controls = page.locator(".concept-controls");
    if (!label) {
      await expect(controls).toHaveCount(0);
      continue;
    }
    await expect(controls.locator("fieldset")).toHaveCount(1);
    await expect(controls.getByRole("group", { name: label, exact: true })).toBeVisible();
    await expect(controls.locator("legend")).toHaveCount(0);
    const box = (await controls.boundingBox())!;
    const calendar = (await page.locator(".concept-calendar").boundingBox())!;
    expect(calendar.x + calendar.width - box.x - box.width).toBeCloseTo(64, 0);
    expect(calendar.y + calendar.height - box.y - box.height).toBeCloseTo(16, 0);
  }
});
test("date and time labels have seventy percent more room in both orientations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await expect(page.locator(".quno-calendar-left-label").first()).toHaveCSS("width", "238px");
  await selectCalendarScene(page, "Horizontal / vertical", false);
  await page.locator('[data-action="vertical"]').click();
  await expect(page.locator(".icv-time-pane").first()).toHaveCSS("width", "167px");
});
