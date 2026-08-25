import { expect, test } from "@playwright/test";
import { goToWorkday, openDrawnExternalDraft, viewportRelativeEventBox } from "../helpers";

async function showOneCalendar(page: import("@playwright/test").Page) {
  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "1";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function openExternalCreate(page: import("@playwright/test").Page, date: string) {
  await goToWorkday(page, date);
  await openDrawnExternalDraft(page, { dateKey: date });
  await expect(page.getByTestId("draft-event")).toBeVisible();
}

async function draftDateInCalendar(page: import("@playwright/test").Page) {
  return page.getByTestId("draft-event").evaluate((element) => {
    return element.closest<HTMLElement>('[data-testid="calendar-day"]')?.dataset.date ?? null;
  });
}

test("moves a draft to a visible date without scrolling", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await showOneCalendar(page);
  await goToWorkday(page, "2026-07-06");
  await openExternalCreate(page, "2026-07-06");

  const scrollTopBefore = await page.locator(".quno-calendar-viewport").evaluate((element) => element.scrollTop);
  await expect.poll(async () => draftDateInCalendar(page)).toBe("2026-07-06");

  await page.getByTestId("draft-date-input").fill("2026-07-07");
  await expect(page.getByTestId("draft-date-input")).toHaveValue("2026-07-07");

  await expect.poll(async () => draftDateInCalendar(page)).toBe("2026-07-07");
  await expect
    .poll(async () =>
      page
        .locator(".quno-calendar-viewport")
        .evaluate((element, before) => Math.abs(element.scrollTop - before), scrollTopBefore)
    )
    .toBeLessThanOrEqual(4);
});

test("keeps the last screen position when a draft date moves offscreen", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await showOneCalendar(page);
  await goToWorkday(page, "2026-07-06");
  await openExternalCreate(page, "2026-07-06");

  const draftBoxBefore = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(draftBoxBefore).not.toBeNull();
  if (!draftBoxBefore) return;

  await page.getByTestId("draft-date-input").fill("2026-08-20");
  await expect(page.getByTestId("draft-date-input")).toHaveValue("2026-08-20");
  await expect.poll(async () => draftDateInCalendar(page)).toBe("2026-08-20");
  await expect
    .poll(async () => {
      const box = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
      return box ? Math.abs(box.y - draftBoxBefore.y) : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(4);
});

test("does not reuse stale offscreen focus after a draft moves back to a visible date", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await showOneCalendar(page);
  await goToWorkday(page, "2026-07-06");
  await openExternalCreate(page, "2026-07-06");

  await page.getByTestId("draft-date-input").fill("2026-08-20");
  await expect(page.getByTestId("draft-date-input")).toHaveValue("2026-08-20");
  await expect.poll(async () => draftDateInCalendar(page)).toBe("2026-08-20");

  const recenteredBox = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(recenteredBox).not.toBeNull();
  if (!recenteredBox) return;
  const scrollTopAfterRecenter = await page.locator(".quno-calendar-viewport").evaluate((element) => element.scrollTop);

  await page.getByTestId("draft-date-input").fill("2026-08-21");
  await expect(page.getByTestId("draft-date-input")).toHaveValue("2026-08-21");
  await expect.poll(async () => draftDateInCalendar(page)).toBe("2026-08-21");

  const movedBox = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(movedBox).not.toBeNull();
  if (!movedBox) return;
  expect(movedBox.y).toBeGreaterThan(recenteredBox.y + 40);

  await page.waitForTimeout(800);
  await expect
    .poll(async () =>
      page
        .locator(".quno-calendar-viewport")
        .evaluate((element, before) => Math.abs(element.scrollTop - before), scrollTopAfterRecenter)
    )
    .toBeLessThanOrEqual(4);
});
