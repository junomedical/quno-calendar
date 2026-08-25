import { expect, test } from "@playwright/test";
import { goToWorkday, horizontalDrawTarget, openDrawnExternalDraft, viewportRelativeEventBox } from "../helpers";

async function createOverlappingEvent(page: import("@playwright/test").Page, title: string, time = "22:00") {
  await page.getByRole("spinbutton", { name: "Start" }).fill("8");
  await page.getByRole("spinbutton", { name: "End" }).fill("24");
  await goToWorkday(page, "2026-07-06");
  await openDrawnExternalDraft(page, { dateKey: "2026-07-06" });
  await page.getByTestId("draft-participant-dr-kirillov").check();
  for (const calendarId of [
    "dr-thakker",
    "marco-eggens",
    "room-201",
    "room-202",
    "room-203",
    "surgery-a",
    "surgery-b"
  ]) {
    await page.getByTestId(`draft-participant-${calendarId}`).uncheck();
  }
  await page.getByTestId("draft-start-input").fill(time);
  await page.getByTestId("draft-title-input").fill(title);
  await page.getByTestId("draft-duration-input").fill("45");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.locator(`[data-testid="calendar-event"]:has-text("${title}")`)).toBeVisible();
}

async function visualOverlapOrder(page: import("@playwright/test").Page, titles: string[]) {
  const positions = await Promise.all(
    titles.map(async (title) => ({
      title,
      top: await page
        .locator(`[data-testid="calendar-event"]:has-text("${title}")`)
        .first()
        .evaluate((element) => element.getBoundingClientRect().top)
    }))
  );
  return positions.sort((left, right) => left.top - right.top).map(({ title }) => title);
}

test("keeps equal-start overlap order when the last appointment is modified", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page, "2026-07-06");
  const titles = ["Stable overlap A", "Stable overlap B", "Stable overlap C"];
  for (const title of titles) {
    await createOverlappingEvent(page, title);
  }

  await expect.poll(() => visualOverlapOrder(page, titles)).toEqual(titles);
  const lastEvent = page.locator('[data-testid="calendar-event"]:has-text("Stable overlap C")').first();
  const lastEventBox = await lastEvent.boundingBox();
  expect(lastEventBox).not.toBeNull();
  if (!lastEventBox) return;
  await page.mouse.click(lastEventBox.x + 12, lastEventBox.y + lastEventBox.height / 2);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await page.getByTestId("draft-duration-input").fill("30");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);

  await expect.poll(() => visualOverlapOrder(page, titles)).toEqual(titles);
});

test("does not let an edit draft source increase overlap row height", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page);

  await createOverlappingEvent(page, "Overlap draft fixture A");
  await createOverlappingEvent(page, "Overlap draft fixture B");
  await createOverlappingEvent(page, "Overlap draft fixture C");

  const source = page.locator('[data-testid="calendar-event"]:has-text("Overlap draft fixture C")').first();
  await expect
    .poll(() =>
      source.evaluate((element) => {
        return element.closest<HTMLElement>('[data-testid="calendar-row"]')?.getBoundingClientRect().height ?? 0;
      })
    )
    .toBe(75);

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
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page, "2026-07-06");

  await createOverlappingEvent(page, "Draw overlap fixture A", "22:00");
  await createOverlappingEvent(page, "Draw overlap fixture B", "22:00");

  const target = await page.evaluate(() => {
    const event = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find((element) =>
      element.textContent?.includes("Draw overlap fixture A")
    );
    const row = event?.closest<HTMLElement>('[data-testid="calendar-row"]');
    const grid = row?.querySelector<HTMLElement>(".quno-calendar-row-grid");
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

test("keeps a drawn external draft focused with the 5,000 event dataset", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await page.getByTestId("scale-select").selectOption("5000");
  await goToWorkday(page, "2026-07-06");

  const drawTarget = await horizontalDrawTarget(page, { distance: 340 });
  await page.mouse.move(drawTarget.startX, drawTarget.y);
  await page.mouse.down();
  await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 5 });
  await expect(page.getByTestId("draft-event")).toBeVisible();
  const drawnDraftBox = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(drawnDraftBox).not.toBeNull();

  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  if (!drawnDraftBox) return;
  await expect
    .poll(async () => {
      const box = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
      return box ? Math.abs(box.y - drawnDraftBox.y) : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(4);
});

test("keeps the first drawn draft at its pointer position while the initial calendar settles", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");

  const drawTarget = await horizontalDrawTarget(page, { distance: 240 });
  await page.mouse.move(drawTarget.startX, drawTarget.y);
  await page.mouse.down();
  await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 5 });
  await expect(page.getByTestId("draft-event")).toBeVisible();
  const pointerDraftBox = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(pointerDraftBox).not.toBeNull();

  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  if (!pointerDraftBox) return;
  await expect
    .poll(async () => {
      const box = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
      return box ? Math.abs(box.y - pointerDraftBox.y) : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(4);
});

test("keeps the calendar mounted while a draw is held across a pending idle recenter", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    viewport.scrollTop += 1_200;
  });
  await page.waitForTimeout(50);

  const drawTarget = await horizontalDrawTarget(page, { distance: 240 });
  await page.mouse.move(drawTarget.startX, drawTarget.y);
  await page.mouse.down();
  await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 5 });
  const draft = page.getByTestId("draft-event");
  await expect(draft).toBeVisible();

  const draftNode = await draft.elementHandle();
  const visibleDay = page.getByTestId("calendar-day").filter({ visible: true }).first();
  const dayNode = await visibleDay.elementHandle();
  const heldDraftBox = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(draftNode).not.toBeNull();
  expect(dayNode).not.toBeNull();
  expect(heldDraftBox).not.toBeNull();

  await page.waitForTimeout(1_500);
  expect(await draftNode?.evaluate((element) => element.isConnected)).toBe(true);
  expect(await dayNode?.evaluate((element) => element.isConnected)).toBe(true);
  if (!heldDraftBox) return;
  const settledDraftBox = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(settledDraftBox).not.toBeNull();
  expect(Math.abs((settledDraftBox?.x ?? 0) - heldDraftBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs((settledDraftBox?.y ?? 0) - heldDraftBox.y)).toBeLessThanOrEqual(1);

  await page.mouse.up();
});

test("renders the external popup above the current-time marker", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await page.getByTestId("today-button").click();
  await openDrawnExternalDraft(page);

  const layering = await page.evaluate(() => {
    const popup = document.querySelector<HTMLElement>('[data-testid="external-event-popup"]');
    const marker =
      document.querySelector<HTMLElement>(".quno-calendar-now-line.is-current") ??
      document.querySelector<HTMLElement>(".quno-calendar-now-header-line") ??
      document.querySelector<HTMLElement>(".quno-calendar-now-pin");
    if (!popup || !marker) {
      return null;
    }
    const popupBox = popup.getBoundingClientRect();
    const markerBox = marker.getBoundingClientRect();
    const x = Math.min(Math.max(markerBox.left + markerBox.width / 2, popupBox.left + 4), popupBox.right - 4);
    const y = Math.min(Math.max(popupBox.top + 28, markerBox.top + markerBox.height / 2), popupBox.bottom - 4);
    return {
      popupZ: Number(window.getComputedStyle(popup).zIndex),
      markerZ: Number(window.getComputedStyle(marker).zIndex),
      topElementIsPopup: Boolean(document.elementFromPoint(x, y)?.closest('[data-testid="external-event-popup"]'))
    };
  });

  expect(layering).not.toBeNull();
  if (!layering) return;
  expect(layering.popupZ).toBeGreaterThan(layering.markerZ);
  expect(layering.topElementIsPopup).toBe(true);
});
