import { expect, test } from "@playwright/test";
import { firstDuplicatedViewportEvent, firstViewportEventBox, goToWorkday, selectPageText, viewportRelativeEventBox } from "../helpers";

test("supports drawing a new event area", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const initialEventCount = await page.getByTestId("calendar-event").count();
  const viewport = page.locator(".ic-viewport");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const targetRowBeforeDraft = await page.evaluate(({ x, y }) => {
    const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-testid="calendar-row"]');
    const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
    return row && grid
      ? {
          height: row.getBoundingClientRect().height,
          eventCount: grid.dataset.eventCount ?? ""
        }
      : null;
  }, { x: box.x + 310, y: box.y + 90 });
  expect(targetRowBeforeDraft).not.toBeNull();
  if (!targetRowBeforeDraft) return;

  await selectPageText(page);
  await page.mouse.move(box.x + 310, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 650, box.y + 90);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await expect(page.getByTestId("draft-event").locator(".demo-event-card")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("draft-event").locator(".demo-event-card")).toHaveCSS("background-color", "rgb(220, 252, 231)");
  await expect(page.getByTestId("draft-event").locator(".demo-event-time")).toHaveCSS("display", "flex");
  await expect(page.locator("body")).toHaveCSS("user-select", "none");
  await expect(page.locator("html")).toHaveCSS("user-select", "none");
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toBe("");
  await expect
    .poll(async () => {
      const draftBox = await page.getByTestId("draft-event").boundingBox();
      return draftBox?.width ?? 0;
    })
    .toBeGreaterThan(250);
  const targetRowDuringDraft = await page.evaluate(({ x, y }) => {
    const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-testid="calendar-row"]');
    const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
    return row && grid
      ? {
          height: row.getBoundingClientRect().height,
          eventCount: grid.dataset.eventCount ?? ""
        }
      : null;
  }, { x: box.x + 310, y: box.y + 90 });
  expect(targetRowDuringDraft).toEqual(targetRowBeforeDraft);
  const hoverTarget = await firstViewportEventBox(page);
  await page.mouse.move(hoverTarget.x + Math.min(hoverTarget.width / 2, 20), hoverTarget.y + hoverTarget.height / 2);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  expect(await page.locator('[data-render-status="hovered"]').count()).toBe(0);
  const drawnDraftBoxBeforePopup = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(drawnDraftBoxBeforePopup).not.toBeNull();
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.getByTestId("demo-message")).toContainText("delegated to external popup");
  await expect
    .poll(async () =>
      page.getByTestId("calendar-row").evaluateAll((rows) =>
        Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
      )
    )
    .toEqual(["dr-kirillov"]);
  if (drawnDraftBoxBeforePopup) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
        return box ? Math.abs(box.y - drawnDraftBoxBeforePopup.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(4);
  }
  const viewportBeforeVisibleTimeEdit = await viewport.evaluate((element) => ({
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop
  }));
  await page.getByTestId("draft-start-input").fill("09:15");
  await expect
    .poll(async () =>
      viewport.evaluate(
        (element, before) => Math.abs(element.scrollLeft - before.scrollLeft) + Math.abs(element.scrollTop - before.scrollTop),
        viewportBeforeVisibleTimeEdit
      )
    )
    .toBeLessThanOrEqual(4);
  await page.getByTestId("draft-title-input").fill("Popup appointment");
  await page.getByTestId("draft-participant-dr-thakker").check();
  await expect
    .poll(async () =>
      page.getByTestId("calendar-row").evaluateAll((rows) =>
        Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
      )
    )
    .toEqual(["dr-kirillov", "dr-thakker"]);
  await expect(page.getByTestId("draft-event")).toHaveCount(2);
  const blockDragStartValue = await page.getByTestId("draft-start-input").inputValue();
  const blockDraftBoxesBefore = await page.getByTestId("draft-event").evaluateAll((elements) =>
    Object.fromEntries(
      elements.map((element) => {
        const draftElement = element as HTMLElement;
        const box = draftElement.getBoundingClientRect();
        const gridBox = draftElement.closest('[data-testid="calendar-row"]')?.querySelector(".ic-row-grid")?.getBoundingClientRect();
        const visibleLeft = gridBox ? Math.max(box.left, gridBox.left) : box.left;
        return [
          draftElement.dataset.calendarId ?? "",
          {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            dragX: Math.min(visibleLeft + 18, box.right - 4)
          }
        ];
      })
    )
  );
  const blockDragSource = blockDraftBoxesBefore["dr-kirillov"];
  expect(blockDragSource).toBeTruthy();
  await page.mouse.move(blockDragSource.dragX, blockDragSource.y + blockDragSource.height / 2);
  await page.mouse.down();
  await expect(page.locator('[data-testid="draft-event"] [data-render-status="dragging"]').first()).toBeVisible();
  await page.mouse.move(blockDragSource.dragX + 220, blockDragSource.y + blockDragSource.height / 2, { steps: 6 });
  await expect.poll(async () => page.getByTestId("draft-start-input").inputValue()).not.toBe(blockDragStartValue);
  await page.mouse.up();
  await expect(page.getByTestId("draft-event")).toHaveCount(2);
  const blockDraftBoxesAfter = await page.getByTestId("draft-event").evaluateAll((elements) =>
    Object.fromEntries(
      elements.map((element) => [
        (element as HTMLElement).dataset.calendarId ?? "",
        {
          x: element.getBoundingClientRect().x,
          y: element.getBoundingClientRect().y
        }
      ])
    )
  );
  const kirillovDelta = blockDraftBoxesAfter["dr-kirillov"].x - blockDraftBoxesBefore["dr-kirillov"].x;
  const thakkerDelta = blockDraftBoxesAfter["dr-thakker"].x - blockDraftBoxesBefore["dr-thakker"].x;
  expect(Math.abs(kirillovDelta - thakkerDelta)).toBeLessThanOrEqual(4);
  await page.getByTestId("draft-participant-dr-kirillov").uncheck();
  await expect
    .poll(async () =>
      page.getByTestId("calendar-row").evaluateAll((rows) =>
        Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
      )
    )
    .toEqual(["dr-thakker"]);
  await expect(page.locator('[data-testid="draft-event"][data-calendar-id="dr-thakker"]:has-text("Popup appointment")')).toBeVisible();
  const draftBoxBeforeEmptyParticipants = await viewportRelativeEventBox(
    page,
    '[data-testid="draft-event"][data-calendar-id="dr-thakker"]'
  );
  expect(draftBoxBeforeEmptyParticipants).not.toBeNull();
  await page.getByTestId("draft-participant-dr-thakker").uncheck();
  await expect(page.getByTestId("draft-save-button")).toBeDisabled();
  await expect
    .poll(async () =>
      page.getByTestId("calendar-row").evaluateAll((rows) =>
        Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
      )
    )
    .toEqual(["dr-kirillov", "dr-thakker", "marco-eggens", "room-201", "room-202", "room-203"]);
  if (draftBoxBeforeEmptyParticipants) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, '[data-testid="draft-event"][data-calendar-id="dr-thakker"]');
        return box ? Math.abs(box.y - draftBoxBeforeEmptyParticipants.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(4);
  }
  await page.getByTestId("draft-participant-dr-thakker").check();
  await expect(page.getByTestId("draft-save-button")).toBeEnabled();
  const draftBoxBeforeSave = await viewportRelativeEventBox(page, '[data-testid="draft-event"][data-calendar-id="dr-thakker"]');
  expect(draftBoxBeforeSave).not.toBeNull();
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.locator('[data-testid="calendar-event"]:has-text("Popup appointment")')).toBeVisible();
  if (draftBoxBeforeSave) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, '[data-testid="calendar-event"]', "Popup appointment");
        return box ? Math.abs(box.y - draftBoxBeforeSave.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(24);
  }
  expect(await page.getByTestId("calendar-event").count()).toBeGreaterThan(initialEventCount);
});

test("supports external event editing popup without blocking calendar scroll", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const editableEvent = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const popupSafeRight = window.innerWidth - 430;
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const box = element.getBoundingClientRect();
      if (
        element.dataset.eventId &&
        box.y >= viewport.y + 92 &&
        box.y + box.height <= viewport.y + viewport.height &&
        box.x >= viewport.x &&
        box.x + Math.min(24, box.width / 2) < popupSafeRight
      ) {
        return {
          id: element.dataset.eventId,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        };
      }
    }
    return null;
  });
  expect(editableEvent).not.toBeNull();
  if (!editableEvent) return;
  const eventBox = editableEvent;
  const eventId = editableEvent.id;

  await page.mouse.click(eventBox.x + Math.min(20, eventBox.width / 2), eventBox.y + eventBox.height / 2);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.getByTestId("demo-message")).toContainText("Editing");
  await expect
    .poll(async () =>
      page.getByTestId("calendar-row").evaluateAll((rows) =>
        Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
      )
    )
    .toEqual(["dr-kirillov", "dr-thakker", "marco-eggens", "room-201", "room-202", "room-203"]);
  const draftBoxBeforeScrollAway = await viewportRelativeEventBox(page, `[data-testid="draft-event"][data-event-id="${eventId}"]`);
  expect(draftBoxBeforeScrollAway).not.toBeNull();

  const viewport = page.locator(".ic-viewport");
  const scrollTopBefore = await viewport.evaluate((element) => element.scrollTop);
  await viewport.evaluate((element) => {
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    element.scrollTop += element.scrollTop > maxScrollTop - 480 ? -420 : 420;
  });
  await expect.poll(async () => viewport.evaluate((element) => element.scrollTop)).not.toBe(scrollTopBefore);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  await page.getByTestId("draft-title-input").fill("Externally edited appointment");
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${eventId}"]`)).toHaveCount(0);
  await expect(page.getByTestId("draft-title-input")).toHaveValue("Externally edited appointment");
  await expect(page.locator(`[data-testid="draft-event"][data-event-id="${eventId}"]:has-text("Externally edited appointment")`)).toBeVisible();
  if (draftBoxBeforeScrollAway) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, `[data-testid="draft-event"][data-event-id="${eventId}"]`);
        return box ? Math.abs(box.y - draftBoxBeforeScrollAway.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(4);
  }

  const originalDraftDate = await page.getByTestId("draft-date-input").inputValue();
  const nextDraftDate = await page.evaluate((date) => {
    const next = new Date(`${date}T00:00:00`);
    next.setDate(next.getDate() + 1);
    return next.toISOString().slice(0, 10);
  }, originalDraftDate);
  const draftBoxBeforeFutureDate = await viewportRelativeEventBox(page, `[data-testid="draft-event"][data-event-id="${eventId}"]`);
  await page.getByTestId("draft-date-input").fill(nextDraftDate);
  await expect(page.getByTestId("draft-date-input")).toHaveValue(nextDraftDate);
  if (draftBoxBeforeFutureDate) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, `[data-testid="draft-event"][data-event-id="${eventId}"]`);
        return box ? Math.abs(box.y - draftBoxBeforeFutureDate.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(4);
  }

  const draftBoxBeforePastDate = await viewportRelativeEventBox(page, `[data-testid="draft-event"][data-event-id="${eventId}"]`);
  await page.getByTestId("draft-date-input").fill(originalDraftDate);
  await expect(page.getByTestId("draft-date-input")).toHaveValue(originalDraftDate);
  if (draftBoxBeforePastDate) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, `[data-testid="draft-event"][data-event-id="${eventId}"]`);
        return box ? Math.abs(box.y - draftBoxBeforePastDate.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(4);
  }

  const editDraftStartBeforeDrag = await page.getByTestId("draft-start-input").inputValue();
  const editDraftBoxes: Array<{ x: number; y: number; width: number; height: number }> = [];
  await expect
    .poll(async () => {
      const box = await page.evaluate((activeEventId) => {
        for (const element of Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="draft-event"][data-event-id="${activeEventId}"]`))) {
          const box = element.getBoundingClientRect();
          const target = document.elementFromPoint(box.x + 18, box.y + box.height / 2);
          if (target?.closest<HTMLElement>("[data-event-id]")?.dataset.eventId === activeEventId) {
            return { x: box.x, y: box.y, width: box.width, height: box.height };
          }
        }
        return null;
      }, eventId);
      if (box) {
        editDraftBoxes[0] = box;
      }
      return Boolean(box);
    })
    .toBe(true);
  const activeEditDraftBox = editDraftBoxes[0];
  if (!activeEditDraftBox) {
    return;
  }
  await page.mouse.move(activeEditDraftBox.x + 18, activeEditDraftBox.y + activeEditDraftBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(activeEditDraftBox.x + 118, activeEditDraftBox.y + activeEditDraftBox.height / 2);
  await expect.poll(async () => page.getByTestId("draft-start-input").inputValue()).not.toBe(editDraftStartBeforeDrag);
  await page.mouse.up();

  const emptyGridPoint = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    for (const grid of Array.from(document.querySelectorAll<HTMLElement>(".ic-row-grid"))) {
      const gridBox = grid.getBoundingClientRect();
      if (gridBox.bottom < viewport.top || gridBox.top > viewport.bottom) {
        continue;
      }
      const y = Math.max(gridBox.top + 8, viewport.top + 96);
      for (let x = gridBox.left + 40; x < Math.min(gridBox.right - 180, viewport.right - 180); x += 80) {
        const target = document.elementFromPoint(x, y);
        if (target?.closest(".ic-row-grid") && !target.closest("[data-event-id]")) {
          return { startX: x, endX: x + 120, y };
        }
      }
    }
    return null;
  });
  expect(emptyGridPoint).not.toBeNull();
  if (!emptyGridPoint) return;
  const activeDraftCountBeforeBlockedDraw = await page.getByTestId("draft-event").count();
  await page.mouse.move(emptyGridPoint.startX, emptyGridPoint.y);
  await page.mouse.down();
  await page.mouse.move(emptyGridPoint.endX, emptyGridPoint.y);
  await page.mouse.up();
  await expect(page.getByTestId("draft-event")).toHaveCount(activeDraftCountBeforeBlockedDraw);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  const draftBoxBeforeCancel = await viewportRelativeEventBox(
    page,
    `[data-testid="draft-event"][data-event-id="${eventId}"]`
  );
  const draftRowAnchorBeforeCancel = await page.evaluate((activeEventId) => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const draft = document.querySelector<HTMLElement>(`[data-testid="draft-event"][data-event-id="${activeEventId}"]`);
    const row = draft?.closest<HTMLElement>('[data-testid="calendar-row"]');
    if (!viewport || !row) {
      return null;
    }
    return row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  }, eventId);
  expect(draftBoxBeforeCancel).not.toBeNull();
  expect(draftRowAnchorBeforeCancel).not.toBeNull();

  await page.getByTestId("draft-cancel-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.locator("text=Externally edited appointment")).toHaveCount(0);
  if (draftRowAnchorBeforeCancel !== null) {
    await expect
      .poll(async () =>
        page.evaluate(({ activeEventId, before }) => {
          const viewport = document.querySelector<HTMLElement>(".ic-viewport");
          const event = document.querySelector<HTMLElement>(`[data-testid="calendar-event"][data-event-id="${activeEventId}"]`);
          const row = event?.closest<HTMLElement>('[data-testid="calendar-row"]');
          if (!viewport || !row) {
            return Number.POSITIVE_INFINITY;
          }
          return Math.abs(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top - before);
        }, { activeEventId: eventId, before: draftRowAnchorBeforeCancel })
      )
      .toBeLessThanOrEqual(4);
  }
  await page.getByTestId("jump-date-input").fill("2026-07-06");
  await page.getByTestId("jump-time-input").fill("14:45");
  await page.getByTestId("go-date-button").click();
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${eventId}"]`).first()).toBeVisible();
});

test("does not start event creation outside row grid cells", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const nonInteractiveTargets = [
    await page.locator(".ic-row-label").first().boundingBox(),
    await page.getByTestId("calendar-day-header").first().boundingBox(),
    await page.getByTestId("time-scale-header").boundingBox()
  ];

  for (const targetBox of nonInteractiveTargets) {
    expect(targetBox).not.toBeNull();
    if (!targetBox) return;

    await page.mouse.move(targetBox.x + Math.min(24, targetBox.width / 2), targetBox.y + Math.min(20, targetBox.height / 2));
    await page.mouse.down();
    await page.mouse.move(targetBox.x + Math.min(90, targetBox.width - 2), targetBox.y + Math.min(20, targetBox.height / 2));
    await expect(page.getByTestId("draft-event")).toHaveCount(0);
    await page.mouse.up();
  }

  await expect(page.getByTestId("demo-message")).not.toContainText("Created new event");
});

test("supports dragging an event to another time", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const initialEventCount = await page.getByTestId("calendar-event").count();
  const duplicate = await firstDuplicatedViewportEvent(page);
  const [box] = duplicate.boxes;
  const gridBox = await page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"]`).first().evaluate((element) => {
    const grid = element.closest(".ic-row-grid");
    const rect = grid?.getBoundingClientRect();
    return rect ? { left: rect.left, right: rect.right } : null;
  });
  expect(gridBox).not.toBeNull();
  if (!gridBox) return;
  const targetX = Math.max(gridBox.left + 12, Math.min(box.x + 80, gridBox.right - 12));

  await selectPageText(page);
  await page.mouse.move(box.x + 12, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(targetX, box.y + 12);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"] [data-render-status="dragging"]`)).toHaveCount(
    duplicate.boxes.length
  );
  expect(await page.getByTestId("drag-preview-event").count()).toBeGreaterThanOrEqual(duplicate.boxes.length);
  await expect(page.locator('[data-render-status="dragging"]').first()).toHaveCSS("opacity", "0.5");
  await expect(page.locator(".ic-viewport")).toHaveCSS("user-select", "none");
  await expect(page.locator("body")).toHaveCSS("user-select", "none");
  await expect(page.locator("html")).toHaveCSS("user-select", "none");
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toBe("");
  expect(await page.locator('[data-render-status="hovered"]').count()).toBe(0);
  expect(await page.getByTestId("calendar-event").count()).toBe(initialEventCount);
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText(/Move accepted|Move rejected/);
});
