import { expect, test } from "@playwright/test";
import { selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });

test("Zoom explains Shift-scroll with a keyboard tag", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Zoom", false);
  const zoom = page.getByRole("group", { name: "Zoom controls" });
  await expect(zoom.locator("legend")).toHaveCount(0);
  await expect(zoom).not.toContainText(/Zoom|[0-9]×/);
  await expect(page.getByRole("slider", { name: "Zoom level" })).toBeVisible();
  const tag = page.locator(".concept-tour-guide kbd");
  await expect(tag).toHaveText("Shift + scroll");
  expect(await tag.evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe("solid");
});

for (const width of [1440, 390])
  test(`scenario controls sit directly left of fullscreen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    for (const scene of ["Zoom", "Horizontal / vertical", "Theming", "Event density"]) {
      await selectCalendarScene(page, scene, false);
      await expect(page.locator(".concept-controls legend")).toHaveCount(0);
      const dock = (await page.locator(".concept-controls").boundingBox())!;
      const full = (await page.locator(".concept-tour-fullscreen").boundingBox())!;
      expect(dock.height).toBe(full.height);
      expect(dock.height).toBe(40);
      expect(full.x - dock.x - dock.width).toBeCloseTo(8, 0);
      expect(dock.y + dock.height).toBeCloseTo(full.y + full.height, 0);
      for (const selector of [
        ".concept-tour-fullscreen",
        ".concept-controls button",
        ".concept-tour-pagination button"
      ])
        expect(
          await page.locator(selector).evaluateAll((buttons) =>
            buttons.every((button) => {
              const box = button.getBoundingClientRect();
              return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
            })
          )
        ).toBe(true);
    }
  });

test("saved appointments glint and cancelled drafts fade away", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Create an appointment", false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const event = page.locator('[data-testid="calendar-event"][data-event-id="2026-10-19-event-0"]');
  await event.click();
  const editor = page.getByRole("form", { name: "Appointment editor" });
  await editor.locator("input").fill("Updated planning session");
  await editor.getByRole("button", { name: "Save appointment", exact: true }).click();
  const card = event.locator(".concept-event");
  await expect(card).toHaveAttribute("data-state", "appearing");
  const glint = await card.evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return { animation: style.animationName, duration: style.animationDuration, pointer: style.pointerEvents };
  });
  expect(glint).toEqual({ animation: "concept-event-glint", duration: "0.485s", pointer: "none" });
  await expect(card).toHaveAttribute("data-state", "existing");
  await event.click();
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  const exit = page.locator('.concept-calendar [data-exiting="true"]');
  await expect(exit).toBeAttached();
  expect(await exit.evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))).toBeGreaterThan(0);
  await expect(exit).toHaveCount(0);
  await expect(event).toContainText("Updated planning session");
});
