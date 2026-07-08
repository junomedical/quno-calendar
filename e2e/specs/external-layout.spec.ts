import { expect, test } from "@playwright/test";
import { goToWorkday } from "../helpers";

async function createOverlappingEvent(page: import("@playwright/test").Page, title: string, time = "22:00") {
  await page.getByTestId("jump-date-input").fill("2026-07-06");
  await page.getByTestId("jump-time-input").fill(time);
  await page.getByRole("spinbutton", { name: "Start" }).fill("8");
  await page.getByRole("spinbutton", { name: "End" }).fill("24");
  await page.getByRole("button", { name: "Add event" }).click();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await page.getByTestId("draft-title-input").fill(title);
  await page.getByTestId("draft-duration-input").fill("45");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.locator(`[data-testid="calendar-event"]:has-text("${title}")`)).toBeVisible();
}

test("does not let an edit draft source increase overlap row height", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);

  await createOverlappingEvent(page, "Overlap draft fixture A");
  await createOverlappingEvent(page, "Overlap draft fixture B");
  await createOverlappingEvent(page, "Overlap draft fixture C");

  const source = page.locator('[data-testid="calendar-event"]:has-text("Overlap draft fixture C")').first();
  const rowHeightBeforeEdit = await source.evaluate((element) => {
    return element.closest<HTMLElement>('[data-testid="calendar-row"]')?.getBoundingClientRect().height ?? 0;
  });
  expect(rowHeightBeforeEdit).toBe(75);

  const sourceBox = await source.boundingBox();
  expect(sourceBox).not.toBeNull();
  if (!sourceBox) return;
  await page.mouse.click(sourceBox.x + Math.min(16, sourceBox.width / 2), sourceBox.y + sourceBox.height / 2);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.locator('[data-testid="draft-event"]:has-text("Overlap draft fixture C")')).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const draft = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="draft-event"]')).find(
          (element) => element.textContent?.includes("Overlap draft fixture C")
        );
        const row = draft?.closest<HTMLElement>('[data-testid="calendar-row"]');
        if (!row) return null;
        const committedLaneCounts = Array.from(row.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).map(
          (event) => Number(event.dataset.laneCount ?? "1")
        );
        return {
          rowHeight: row.getBoundingClientRect().height,
          maxCommittedLaneCount: Math.max(1, ...committedLaneCounts)
        };
      })
    )
    .toEqual({ rowHeight: 50, maxCommittedLaneCount: 2 });
});

test("does not duplicate committed events or grow a two-overlap row when drawing a create draft", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page, "2026-07-06");

  await createOverlappingEvent(page, "Draw overlap fixture A", "22:00");
  await createOverlappingEvent(page, "Draw overlap fixture B", "22:00");

  const target = await page.evaluate(() => {
    const event = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find((element) =>
      element.textContent?.includes("Draw overlap fixture A")
    );
    const row = event?.closest<HTMLElement>('[data-testid="calendar-row"]');
    const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
    if (!event || !row || !grid) return null;
    const rowBox = row.getBoundingClientRect();
    const gridBox = grid.getBoundingClientRect();
    const eventBox = event.getBoundingClientRect();
    return {
      startX: Math.max(gridBox.left + 12, eventBox.left - 160),
      endX: Math.max(gridBox.left + 72, eventBox.left - 40),
      y: rowBox.top + rowBox.height / 2,
      rowHeight: rowBox.height
    };
  });
  expect(target).not.toBeNull();
  if (!target) return;
  expect(target.rowHeight).toBe(50);

  await page.mouse.move(target.startX, target.y);
  await page.mouse.down();
  await page.mouse.move(target.endX, target.y);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const event = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find(
          (element) => element.textContent?.includes("Draw overlap fixture A")
        );
        return event?.closest<HTMLElement>('[data-testid="calendar-row"]')?.getBoundingClientRect().height ?? 0;
      })
    )
    .toBe(50);

  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const savedEvent = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find(
          (event) => event.textContent?.includes("Draw overlap fixture A")
        );
        const row = savedEvent?.closest<HTMLElement>('[data-testid="calendar-row"]');
        if (!row) return null;
        const committedIds = Array.from(row.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).map(
          (event) => event.dataset.eventId ?? ""
        );
        return {
          rowHeight: row.getBoundingClientRect().height,
          duplicateCommittedIds: committedIds.length - new Set(committedIds).size
        };
      })
    )
    .toEqual({ rowHeight: 50, duplicateCommittedIds: 0 });
});
