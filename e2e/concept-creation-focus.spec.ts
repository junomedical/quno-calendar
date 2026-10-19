import { expect, test, type Page } from "@playwright/test";
import { calendarInitial, pauseCalendarScene, selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
async function shownDoctors(page: Page) {
  return page
    .locator('.concept-calendar [data-slot="calendar-cell"]')
    .evaluateAll((cells) => [...new Set(cells.map((cell) => cell.getAttribute("data-calendar-id")))].sort());
}
const everyone = ["person-0", "person-1", "person-2", "person-3"];

for (const mode of ["horizontal", "vertical", "phone"] as const)
  test(`creation playback keeps only its doctor visible while editing in ${mode} view`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (mode === "vertical") await calendarInitial(page, { view: "infinite-vertical" });
    if (mode === "phone") await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/concept");
    await selectCalendarScene(page, "Create an appointment");
    await expect(page.getByRole("form", { name: "Appointment editor" })).toBeVisible({ timeout: 12000 });
    await expect.poll(() => shownDoctors(page)).toEqual(["person-0"]);
    await expect(page.locator('[data-event-id="concept-created-1"]')).toBeVisible();
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-visible-date", "2026-10-19");
    if (mode === "horizontal") await page.screenshot({ path: info.outputPath("creation-doctor-focus.png") });
    await expect(page.locator('[data-event-id="concept-created-1"]')).toContainText("Studio catch-up", {
      timeout: 12000
    });
    await expect(page.getByRole("form", { name: "Appointment editor" })).toHaveCount(0, { timeout: 12000 });
    await pauseCalendarScene(page);
    await expect.poll(() => shownDoctors(page)).toEqual(everyone);
    await expect(page.getByRole("form", { name: "Appointment editor" })).toHaveCount(0);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-visible-date", "2026-10-19");
  });

for (const vertical of [false, true])
  test(`manual editing focuses the chosen doctor and Cancel restores everyone in ${vertical ? "vertical" : "horizontal"} view`, async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (vertical) await calendarInitial(page, { view: "infinite-vertical" });
    await page.goto("/concept");
    await selectCalendarScene(page, "Create an appointment", false);
    const viewport = await page.locator(".quno-calendar-viewport").elementHandle();
    await page.locator('[data-testid="calendar-event"][data-event-id="2026-10-19-event-2"]').click();
    const editor = page.getByRole("form", { name: "Appointment editor" });
    await expect(editor).toBeVisible();
    await expect(editor).toContainText("Sofia Reyes");
    await expect.poll(() => shownDoctors(page)).toEqual(["person-2"]);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-visible-date", "2026-10-19");
    await editor.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect.poll(() => shownDoctors(page)).toEqual(everyone);
    await expect(editor).toHaveCount(0);
    expect(await viewport!.evaluate((node) => node === document.querySelector(".quno-calendar-viewport"))).toBe(true);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-visible-date", "2026-10-19");
  });
