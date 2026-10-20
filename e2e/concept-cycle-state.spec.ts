import { expect, test } from "@playwright/test";
import { calendarInitial, pauseCalendarScene, selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });

test("density opens horizontally after leaving a vertical scene and clears hover before scrolling", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Horizontal / vertical", false);
  await page.locator('[data-action="vertical"]').click();
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-view", "infinite-vertical");
  await selectCalendarScene(page, "Event density");
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-view", "infinite-horizontal");
  const event = page.locator('[data-event-id="2026-10-19-density-0"]');
  await expect(event).toHaveAttribute("data-status", "hovered", { timeout: 12000 });
  await expect(page.locator('.concept-cursor[data-gesture="scroll"]')).toBeVisible();
  await expect(page.locator('.concept-calendar [data-status="hovered"]')).toHaveCount(0);
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await pauseCalendarScene(page);
});

for (const mode of ["horizontal", "vertical", "phone"] as const)
  test(`reschedule moves three appointments and returns them before the next ${mode} cycle`, async ({ page }, info) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (mode === "vertical") await calendarInitial(page, { view: "infinite-vertical" });
    if (mode === "phone") await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/concept");
    await selectCalendarScene(page, "Reschedule");
    const events = [0, 1, 2].map((index) =>
      page.locator(`[data-testid="calendar-event"][data-event-id="2026-10-19-event-${index}"]`)
    );
    for (let index = 0; index < events.length; index++)
      await expect(events[index]).toHaveAttribute("data-calendar-id", `person-${index + 1}`, { timeout: 15000 });
    for (let index = events.length - 1; index >= 0; index--)
      await expect(events[index]).toHaveAttribute("data-calendar-id", `person-${index}`, { timeout: 15000 });
    for (let index = 0; index < events.length; index++)
      await expect(events[index].locator("small")).toContainText(["10:00", "10:30", "11:00"][index]);
    await expect(page.locator(".concept-calendar-message")).toHaveCount(0);
    if (mode === "horizontal") await page.screenshot({ path: info.outputPath("reschedule-round-trip.png") });
    await expect(page.locator(".concept-canvas")).toHaveAttribute("data-playback-cycle", "1", { timeout: 10000 });
    await expect(page.locator(".concept-cursor")).toBeVisible();
    await expect(page.locator(".concept")).toHaveAttribute("data-scene", "move");
    await expect(events[0]).toHaveAttribute("data-calendar-id", "person-1", { timeout: 10000 });
    await pauseCalendarScene(page);
    await page.waitForTimeout(1500);
    await expect(events[0]).toHaveAttribute("data-calendar-id", "person-1");
  });
