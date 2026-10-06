import { expect, test } from "@playwright/test";
import { goToWorkday, openDrawnExternalDraft, viewportRelativeEventBox } from "#quno-e2e/helpers";

test("three-participant edit keeps a surviving instance fixed through repeated toggles", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page);
  await openDrawnExternalDraft(page, { dateKey: "2026-07-06", calendarId: "dr-kirillov" });
  for (const id of ["dr-kirillov", "dr-thakker", "marco-eggens"]) {
    await page.getByTestId(`draft-participant-${id}`).check();
  }
  await page.getByTestId("draft-title-input").fill("Participant focus regression");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  const saved = page.locator(
    '[data-testid="calendar-event"][data-calendar-id="dr-kirillov"]:has-text("Participant focus regression")'
  );
  await expect(saved).toBeVisible();
  await saved.click({ position: { x: 12, y: 12 } });
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  const draftSelector = '[data-testid="draft-event"][data-calendar-id="dr-kirillov"]';
  const before = await viewportRelativeEventBox(page, draftSelector);
  expect(before).not.toBeNull();
  for (const id of ["dr-thakker", "marco-eggens", "dr-thakker", "marco-eggens"]) {
    const checkbox = page.getByTestId(`draft-participant-${id}`);
    await checkbox.uncheck();
    await expect(checkbox).toBeFocused();
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, draftSelector);
        return box ? Math.abs(box.y - before!.y) : Infinity;
      })
      .toBeLessThanOrEqual(8);
    await checkbox.check();
    await expect(checkbox).toBeFocused();
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, draftSelector);
        return box ? Math.abs(box.y - before!.y) : Infinity;
      })
      .toBeLessThanOrEqual(8);
  }
  const survivor = '[data-testid="draft-event"][data-calendar-id="dr-thakker"]';
  const survivorBefore = await viewportRelativeEventBox(page, survivor);
  await page.getByTestId("draft-participant-dr-kirillov").uncheck();
  await expect
    .poll(async () => {
      const box = await viewportRelativeEventBox(page, survivor);
      return box ? Math.abs(box.y - survivorBefore!.y) : Infinity;
    })
    .toBeLessThanOrEqual(8);
  await page.getByTestId("draft-participant-dr-kirillov").check();
  await page.getByTestId("draft-participant-marco-eggens").uncheck();
  await expect
    .poll(async () => {
      const box = await viewportRelativeEventBox(page, survivor);
      return box ? Math.abs(box.y - survivorBefore!.y) : Infinity;
    })
    .toBeLessThanOrEqual(8);
  const samples = await page.locator(survivor).evaluate(async (element) => {
    const positions: number[] = [];
    for (let frame = 0; frame < 60; frame += 1) {
      await new Promise(requestAnimationFrame);
      positions.push(element.getBoundingClientRect().top);
    }
    return positions;
  });
  expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(2);
  await page.waitForTimeout(2200);
  const after = await viewportRelativeEventBox(page, survivor);
  expect(Math.abs(after!.y - survivorBefore!.y)).toBeLessThanOrEqual(8);
});
