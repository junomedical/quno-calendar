import { expect, test } from "@playwright/test";
import { calendarInitial, pauseCalendarScene, selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
for (const vertical of [false, true])
  for (const save of [false, true])
    test(`creation draft drags with its editor before ${save ? "Save" : "Cancel"} in ${vertical ? "vertical" : "horizontal"} view`, async ({
      page
    }, info) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      if (vertical) await calendarInitial(page, { view: "infinite-vertical" });
      await page.goto("/concept");
      await selectCalendarScene(page, "Create an appointment");
      const editor = page.getByRole("form", { name: "Appointment editor" });
      await expect(editor).toBeVisible({ timeout: 12000 });
      await pauseCalendarScene(page);
      await editor.locator("input").fill("Dragged draft appointment");
      await page.getByRole("button", { name: "Collapse description", exact: true }).click();
      const draft = page.locator('[data-testid="draft-event"][data-event-id="concept-created-1"]');
      await expect(draft).toHaveClass(/is-draggable/);
      await expect(editor).toContainText("11:30–12:30");
      const before = (await draft.boundingBox())!;
      const point = { x: before.x + before.width / 2, y: before.y + before.height / 2 };
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await page.mouse.move(point.x + (vertical ? 0 : before.width / 2), point.y + (vertical ? before.height / 2 : 0), {
        steps: 12
      });
      await expect(editor).toContainText("12:00–13:00");
      await page.mouse.up();
      await expect(editor.locator("input")).toHaveValue("Dragged draft appointment");
      await expect(draft.locator("small")).toContainText("12:00 — 13:00");
      const after = (await draft.boundingBox())!;
      expect(vertical ? after.y - before.y : after.x - before.x).toBeGreaterThan(40);
      await page.screenshot({ path: info.outputPath("dragged-creation-draft.png") });
      const saved = page.locator('[data-testid="calendar-event"][data-event-id="concept-created-1"]');
      await expect(saved).toHaveCount(0);
      await editor.getByRole("button", { name: save ? "Save appointment" : "Cancel", exact: true }).click();
      await expect(editor).toHaveCount(0);
      if (save) {
        await expect(saved).toContainText("Dragged draft appointment");
        await expect(saved.locator("small")).toContainText("12:00 — 13:00");
      } else await expect(page.locator('[data-event-id="concept-created-1"]')).toHaveCount(0);
    });
