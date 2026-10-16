import { expect, test, type Page } from "@playwright/test";
import { goToWorkday, openDrawnExternalDraft, viewportRelativeEventBox } from "#quno-e2e/helpers";

async function sampleSettledDraft(page: Page, selector: string, durationMs: number) {
  return page.evaluate(
    async ({ selector, durationMs }) => {
      const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
      const start = performance.now();
      const positions: number[] = [];
      const datePositions: number[] = [];
      const dateKeys = new Set<string>();
      let lateMutations = 0;
      const observer = new MutationObserver((records) => {
        if (performance.now() - start > 3200) lateMutations += records.length;
      });
      observer.observe(viewport, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "style"]
      });
      while (performance.now() - start < durationMs) {
        await new Promise(requestAnimationFrame);
        const card = document.querySelector(selector);
        if (!card) {
          throw new Error("Surviving draft instance disappeared");
        }
        positions.push(card.getBoundingClientRect().top);
        const day = card.closest<HTMLElement>("[data-testid='calendar-day']");
        if (!day?.dataset.date) {
          throw new Error("Surviving draft lost its date");
        }
        datePositions.push(day.getBoundingClientRect().top - viewport.getBoundingClientRect().top);
        dateKeys.add(day.dataset.date);
      }
      observer.disconnect();
      return {
        cardMovement: Math.max(...positions) - Math.min(...positions),
        dateMovement: Math.max(...datePositions) - Math.min(...datePositions),
        dateKeys: [...dateKeys],
        lateMutations
      };
    },
    { selector, durationMs }
  );
}

for (const density of ["100", "20000"]) {
  test(`three-participant edit stays focused and settles after toggles (${density} events/year)`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.goto("/demo/infinite-calendar");
    await page.getByTestId("scale-select").selectOption(density);
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
    await saved.scrollIntoViewIfNeeded();
    const savedId = await saved.getAttribute("data-event-id");
    const sourceRowBeforeEdit = await viewportRelativeEventBox(
      page,
      `[data-testid="calendar-row"][data-calendar-id="dr-kirillov"]:has([data-event-id="${savedId}"])`
    );
    expect(sourceRowBeforeEdit).not.toBeNull();
    await saved.click({ position: { x: 12, y: 12 } });
    await expect(page.getByTestId("external-event-popup")).toBeVisible();
    const draftSelector = '[data-testid="draft-event"][data-calendar-id="dr-kirillov"]';
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, draftSelector);
        return box ? Math.abs(box.y - sourceRowBeforeEdit!.y) : Infinity;
      })
      .toBeLessThanOrEqual(8);
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
    if (density === "20000") {
      for (let iteration = 0; iteration < 15; iteration += 1) {
        for (const id of ["dr-kirillov", "marco-eggens"]) {
          const checkbox = page.getByTestId(`draft-participant-${id}`);
          await checkbox.setChecked(!(await checkbox.isChecked()));
          await expect(checkbox).toBeFocused();
        }
      }
    }
    const stability = await sampleSettledDraft(page, survivor, density === "20000" ? 8000 : 3200);
    expect(stability.cardMovement).toBeLessThanOrEqual(2);
    // Bounded-window maintenance may translate scrollTop while preserving the
    // same visible day and resource. Assert that semantic geometry directly.
    expect(stability.dateMovement).toBeLessThanOrEqual(2);
    expect(stability.dateKeys).toEqual(["2026-07-06"]);
    expect(stability.lateMutations).toBe(0);
    expect(browserErrors).toEqual([]);
    const after = await viewportRelativeEventBox(page, survivor);
    expect(Math.abs(after!.y - survivorBefore!.y)).toBeLessThanOrEqual(8);
  });
}
