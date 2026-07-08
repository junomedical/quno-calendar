import { expect, test } from "@playwright/test";
import {
  firstDuplicatedViewportEvent,
  firstViewportEventBox,
  goToWorkday,
  selectPageText,
  topVisibleDayDate,
  viewportRelativeEventBox
} from "../helpers";

test("supports drawing a new event area", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const initialEventCount = await page.getByTestId("calendar-event").count();
  const viewport = page.locator(".ic-viewport");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const targetRowBeforeDraft = await page.evaluate(
    ({ x, y }) => {
      const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-testid="calendar-row"]');
      const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
      return row && grid
        ? {
            height: row.getBoundingClientRect().height,
            eventCount: grid.dataset.eventCount ?? ""
          }
        : null;
    },
    { x: box.x + 310, y: box.y + 90 }
  );
  expect(targetRowBeforeDraft).not.toBeNull();
  if (!targetRowBeforeDraft) return;

  await selectPageText(page);
  await page.mouse.move(box.x + 310, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 650, box.y + 90);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await expect(page.getByTestId("draft-event").locator(".demo-event-card")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("draft-event").locator(".demo-event-card")).toHaveCSS(
    "background-color",
    "rgb(220, 252, 231)"
  );
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
  const targetRowDuringDraft = await page.evaluate(
    ({ x, y }) => {
      const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-testid="calendar-row"]');
      const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
      return row && grid
        ? {
            height: row.getBoundingClientRect().height,
            eventCount: grid.dataset.eventCount ?? ""
          }
        : null;
    },
    { x: box.x + 310, y: box.y + 90 }
  );
  expect(targetRowDuringDraft).toEqual(targetRowBeforeDraft);
  const hoverTarget = await firstViewportEventBox(page);
  await page.mouse.move(hoverTarget.x + Math.min(hoverTarget.width / 2, 20), hoverTarget.y + hoverTarget.height / 2);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  expect(await page.locator('[data-render-status="hovered"]').count()).toBe(0);
  const drawnDraftBoxBeforePopup = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  expect(drawnDraftBoxBeforePopup).not.toBeNull();
  await page.evaluate(() => {
    const samples: number[] = [];
    const visibleCommittedEventCount = () => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport")?.getBoundingClientRect();
      if (!viewport) {
        return 0;
      }
      return Array.from(
        document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"], [data-testid="availability-event"]')
      ).filter((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.right > viewport.left &&
          box.left < viewport.right &&
          box.bottom > viewport.top &&
          box.top < viewport.bottom
        );
      }).length;
    };
    const sample = (remainingFrames: number) => {
      samples.push(visibleCommittedEventCount());
      if (remainingFrames > 0) {
        requestAnimationFrame(() => sample(remainingFrames - 1));
      }
    };
    (window as typeof window & { __drawHandoffVisibleEventSamples?: number[] }).__drawHandoffVisibleEventSamples =
      samples;
    sample(18);
  });
  await page.mouse.up();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  if (drawnDraftBoxBeforePopup) {
    const firstFrameBox = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
    expect(
      firstFrameBox ? Math.abs(firstFrameBox.y - drawnDraftBoxBeforePopup.y) : Number.POSITIVE_INFINITY
    ).toBeLessThanOrEqual(4);
  }
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.getByTestId("demo-message")).toContainText("delegated to external popup");
  await page.waitForTimeout(160);
  const drawHandoffVisibleEventSamples = await page.evaluate(
    () => (window as typeof window & { __drawHandoffVisibleEventSamples?: number[] }).__drawHandoffVisibleEventSamples
  );
  expect(Math.min(...(drawHandoffVisibleEventSamples ?? [0]))).toBeGreaterThan(0);
  await expect
    .poll(async () =>
      page
        .getByTestId("calendar-row")
        .evaluateAll((rows) =>
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
  const draftBoxBeforeVisibleTimeEdit = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
  await page.getByTestId("draft-start-input").fill("09:15");
  if (draftBoxBeforeVisibleTimeEdit) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, '[data-testid="draft-event"]');
        return box ? Math.abs(box.y - draftBoxBeforeVisibleTimeEdit.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(4);
  }
  await page.getByTestId("draft-title-input").fill("Popup appointment");
  await page.getByTestId("draft-participant-dr-thakker").check();
  await expect
    .poll(async () =>
      page
        .getByTestId("calendar-row")
        .evaluateAll((rows) =>
          Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
        )
    )
    .toEqual(["dr-kirillov", "dr-thakker"]);
  await expect(page.getByTestId("draft-event")).toHaveCount(2);
  await expect(
    page.locator('[data-testid="draft-event"][data-calendar-id="dr-kirillov"]:has-text("Popup appointment")')
  ).toBeVisible();
  await page
    .getByTestId("draft-event")
    .first()
    .evaluate((element) => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      if (!viewport) {
        return;
      }
      const viewportBox = viewport.getBoundingClientRect();
      const draftBox = element.getBoundingClientRect();
      viewport.scrollTop += draftBox.top - viewportBox.top - 120;
      viewport.scrollLeft += draftBox.left - viewportBox.left - 260;
    });
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const viewport = document.querySelector<HTMLElement>(".ic-viewport");
        const popup = document.querySelector<HTMLElement>('[data-testid="external-event-popup"]');
        const drafts = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="draft-event"]'));
        if (!viewport || drafts.length === 0) {
          return false;
        }
        const viewportBox = viewport.getBoundingClientRect();
        const popupBox = popup?.getBoundingClientRect();
        for (const draft of drafts) {
          const box = draft.getBoundingClientRect();
          const visibleLeft = Math.max(box.left, viewportBox.left);
          const visibleRight = Math.min(box.right, viewportBox.right, (popupBox?.left ?? box.right) - 8);
          const visibleTop = Math.max(box.top, viewportBox.top);
          const visibleBottom = Math.min(box.bottom, viewportBox.bottom);
          if (visibleRight <= visibleLeft + 8 || visibleBottom <= visibleTop + 8) {
            continue;
          }
          const x = (visibleLeft + visibleRight) / 2;
          const y = (visibleTop + visibleBottom) / 2;
          if (document.elementFromPoint(x, y)?.closest('[data-testid="draft-event"]') === draft) {
            return true;
          }
        }
        const firstBox = drafts[0].getBoundingClientRect();
        if (popupBox && firstBox.right > popupBox.left - 16) {
          viewport.scrollLeft += firstBox.right - popupBox.left + 120;
        }
        if (firstBox.left < viewportBox.left + 240) {
          viewport.scrollLeft -= viewportBox.left + 240 - firstBox.left;
        }
        if (firstBox.bottom > viewportBox.bottom - 24) {
          viewport.scrollTop += firstBox.bottom - viewportBox.bottom + 80;
        }
        if (firstBox.top < viewportBox.top + 80) {
          viewport.scrollTop -= viewportBox.top + 80 - firstBox.top;
        }
        return false;
      })
    )
    .toBe(true);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const viewport = document.querySelector<HTMLElement>(".ic-viewport");
        const popup = document.querySelector<HTMLElement>('[data-testid="external-event-popup"]');
        const drafts = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="draft-event"]'));
        if (!viewport || drafts.length === 0) {
          return false;
        }
        const viewportBox = viewport.getBoundingClientRect();
        const popupBox = popup?.getBoundingClientRect();
        for (const draft of drafts) {
          const box = draft.getBoundingClientRect();
          const visibleLeft = Math.max(box.left, viewportBox.left);
          const visibleRight = Math.min(box.right, viewportBox.right, (popupBox?.left ?? box.right) - 8);
          const visibleTop = Math.max(box.top, viewportBox.top);
          const visibleBottom = Math.min(box.bottom, viewportBox.bottom);
          if (visibleRight <= visibleLeft + 8 || visibleBottom <= visibleTop + 8) {
            continue;
          }
          const x = (visibleLeft + visibleRight) / 2;
          const y = (visibleTop + visibleBottom) / 2;
          if (document.elementFromPoint(x, y)?.closest('[data-testid="draft-event"]') === draft) {
            return true;
          }
        }
        const firstBox = drafts[0].getBoundingClientRect();
        if (popupBox && firstBox.right > popupBox.left - 16) {
          viewport.scrollLeft += firstBox.right - popupBox.left + 120;
        }
        if (firstBox.left < viewportBox.left + 240) {
          viewport.scrollLeft -= viewportBox.left + 240 - firstBox.left;
        }
        if (firstBox.bottom > viewportBox.bottom - 24) {
          viewport.scrollTop += firstBox.bottom - viewportBox.bottom + 80;
        }
        if (firstBox.top < viewportBox.top + 80) {
          viewport.scrollTop -= viewportBox.top + 80 - firstBox.top;
        }
        return false;
      })
    )
    .toBe(true);
  const blockDragStartValue = await page.getByTestId("draft-start-input").inputValue();
  type DraftBoxSnapshot = {
    x: number;
    y: number;
    calendarId: string;
    width: number;
    height: number;
    dragX: number;
    dragY: number;
    dragDeltaX: number;
    isVisible: boolean;
    isHitTestable: boolean;
  };
  let blockDraftBoxesBefore: Record<string, DraftBoxSnapshot> | null = null;
  let blockDragSource: (DraftBoxSnapshot & { isHitTestable: true }) | undefined;
  for (let attempt = 0; attempt < 8 && !blockDragSource; attempt += 1) {
    blockDraftBoxesBefore = await page.getByTestId("draft-event").evaluateAll((elements) => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      const viewportBox = viewport?.getBoundingClientRect();
      const popupBox = document
        .querySelector<HTMLElement>('[data-testid="external-event-popup"]')
        ?.getBoundingClientRect();
      const boxes = Object.fromEntries(
        elements.map((element) => {
          const draftElement = element as HTMLElement;
          const box = draftElement.getBoundingClientRect();
          const gridBox = draftElement
            .closest('[data-testid="calendar-row"]')
            ?.querySelector(".ic-row-grid")
            ?.getBoundingClientRect();
          const visibleLeft = Math.max(box.left, gridBox?.left ?? box.left, viewportBox?.left ?? box.left);
          const visibleRight = Math.min(
            box.right,
            gridBox?.right ?? box.right,
            viewportBox?.right ?? box.right,
            (popupBox?.left ?? box.right) - 8
          );
          const visibleTop = Math.max(box.top, viewportBox?.top ?? box.top);
          const visibleBottom = Math.min(box.bottom, viewportBox?.bottom ?? box.bottom);
          const dragX = (visibleLeft + visibleRight) / 2;
          const dragY = Math.min(Math.max(visibleTop + 2, box.top + box.height / 2), visibleBottom - 2);
          const gridLeft = gridBox?.left ?? viewportBox?.left ?? box.left;
          const isRightBlocked = Boolean(popupBox && dragX + 180 > popupBox.left - 8);
          const dragDeltaX = isRightBlocked && dragX - 180 > gridLeft + 8 ? -180 : 180;
          const calendarId = draftElement.dataset.calendarId ?? "";
          const isVisible = Boolean(viewportBox && visibleRight > visibleLeft + 8 && visibleBottom > visibleTop);
          const isHitTestable = Boolean(
            isVisible &&
            document
              .elementFromPoint(dragX, dragY)
              ?.closest(`[data-testid="draft-event"][data-calendar-id="${calendarId}"]`)
          );
          return [
            calendarId,
            {
              x: box.x,
              y: box.y,
              calendarId,
              width: box.width,
              height: box.height,
              dragX,
              dragY,
              dragDeltaX,
              isVisible,
              isHitTestable
            }
          ];
        })
      );
      if (viewport && viewportBox) {
        const source = Object.values(boxes).find((box) => box.isVisible);
        if (source && !Object.values(boxes).some((box) => box.isHitTestable)) {
          if (popupBox && source.x + source.width > popupBox.left - 16) {
            viewport.scrollLeft += source.x + source.width - popupBox.left + 120;
          }
          if (source.y < viewportBox.top + 80) {
            viewport.scrollTop -= viewportBox.top + 80 - source.y;
          }
          if (source.y + source.height > viewportBox.bottom - 24) {
            viewport.scrollTop += source.y + source.height - viewportBox.bottom + 80;
          }
        }
      }
      return boxes;
    });
    blockDragSource = Object.values(blockDraftBoxesBefore).find((source) => source.isHitTestable) as
      (DraftBoxSnapshot & { isHitTestable: true }) | undefined;
    if (!blockDragSource) {
      await page.waitForTimeout(100);
    }
  }
  if (!blockDragSource || !blockDraftBoxesBefore) {
    throw new Error("No visible draft instance available for block drag");
  }
  for (
    let attempt = 0;
    attempt < 3 && (await page.getByTestId("draft-start-input").inputValue()) === blockDragStartValue;
    attempt += 1
  ) {
    const currentBlockDragSource = await page.getByTestId("draft-event").evaluateAll((elements) => {
      const viewportBox = document.querySelector<HTMLElement>(".ic-viewport")?.getBoundingClientRect();
      const popupBox = document
        .querySelector<HTMLElement>('[data-testid="external-event-popup"]')
        ?.getBoundingClientRect();
      for (const element of elements) {
        const draftElement = element as HTMLElement;
        const box = draftElement.getBoundingClientRect();
        const gridBox = draftElement
          .closest('[data-testid="calendar-row"]')
          ?.querySelector(".ic-row-grid")
          ?.getBoundingClientRect();
        const visibleLeft = Math.max(box.left, gridBox?.left ?? box.left, viewportBox?.left ?? box.left);
        const visibleRight = Math.min(
          box.right,
          gridBox?.right ?? box.right,
          viewportBox?.right ?? box.right,
          (popupBox?.left ?? box.right) - 8
        );
        const visibleTop = Math.max(box.top, viewportBox?.top ?? box.top);
        const visibleBottom = Math.min(box.bottom, viewportBox?.bottom ?? box.bottom);
        const dragX = (visibleLeft + visibleRight) / 2;
        const dragY = Math.min(Math.max(visibleTop + 2, box.top + box.height / 2), visibleBottom - 2);
        const gridLeft = gridBox?.left ?? viewportBox?.left ?? box.left;
        const gridRight = gridBox?.right ?? viewportBox?.right ?? box.right;
        const rightLimit = Math.min(gridRight, viewportBox?.right ?? gridRight, (popupBox?.left ?? gridRight) - 8);
        const leftLimit = Math.max(gridLeft, viewportBox?.left ?? gridLeft) + 8;
        const rightDelta = Math.min(180, rightLimit - dragX - 8);
        const leftDelta = Math.max(-180, leftLimit - dragX + 8);
        const dragDeltaX = rightDelta >= 48 ? rightDelta : leftDelta <= -48 ? leftDelta : 0;
        const calendarId = draftElement.dataset.calendarId ?? "";
        const isHitTestable = Boolean(
          dragDeltaX !== 0 &&
          visibleRight > visibleLeft + 8 &&
          visibleBottom > visibleTop &&
          document
            .elementFromPoint(dragX, dragY)
            ?.closest(`[data-testid="draft-event"][data-calendar-id="${calendarId}"]`)
        );
        if (isHitTestable) {
          return { dragX, dragY, dragDeltaX };
        }
      }
      return null;
    });
    if (!currentBlockDragSource) {
      await page.waitForTimeout(100);
      continue;
    }
    await page.mouse.move(currentBlockDragSource.dragX, currentBlockDragSource.dragY);
    await page.mouse.down();
    await page.mouse.move(
      currentBlockDragSource.dragX + Math.sign(currentBlockDragSource.dragDeltaX) * 2,
      currentBlockDragSource.dragY,
      { steps: 2 }
    );
    await page.mouse.move(
      currentBlockDragSource.dragX + currentBlockDragSource.dragDeltaX,
      currentBlockDragSource.dragY,
      {
        steps: 10
      }
    );
    await page.mouse.up();
  }
  await expect(page.getByTestId("draft-event")).toHaveCount(2);
  if ((await page.getByTestId("draft-start-input").inputValue()) !== blockDragStartValue) {
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
  }
  await page.getByTestId("draft-participant-dr-kirillov").uncheck();
  await expect
    .poll(async () =>
      page
        .getByTestId("calendar-row")
        .evaluateAll((rows) =>
          Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
        )
    )
    .toEqual(["dr-thakker"]);
  await expect(
    page.locator('[data-testid="draft-event"][data-calendar-id="dr-thakker"]:has-text("Popup appointment")')
  ).toBeVisible();
  const draftBoxBeforeEmptyParticipants = await viewportRelativeEventBox(
    page,
    '[data-testid="draft-event"][data-calendar-id="dr-thakker"]'
  );
  expect(draftBoxBeforeEmptyParticipants).not.toBeNull();
  await page.getByTestId("draft-participant-dr-thakker").uncheck();
  await expect(page.getByTestId("draft-save-button")).toBeDisabled();
  await expect
    .poll(async () =>
      page
        .getByTestId("calendar-row")
        .evaluateAll((rows) =>
          Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
        )
    )
    .toEqual(["dr-thakker"]);
  await expect(page.locator('[data-testid="calendar-row"][data-calendar-id="dr-thakker"]').first()).toHaveAttribute(
    "data-retained-hidden",
    "true"
  );
  await expect(page.locator('[data-testid="draft-event"][data-calendar-id="dr-thakker"]')).toHaveCount(0);
  await page.getByTestId("draft-participant-dr-thakker").check();
  await expect(page.getByTestId("draft-save-button")).toBeEnabled();
  await expect(page.locator('[data-testid="calendar-row"][data-calendar-id="dr-thakker"]').first()).not.toHaveAttribute(
    "data-retained-hidden",
    "true"
  );
  if (draftBoxBeforeEmptyParticipants) {
    await expect
      .poll(async () => {
        const box = await viewportRelativeEventBox(page, '[data-testid="draft-event"][data-calendar-id="dr-thakker"]');
        return box ? Math.abs(box.y - draftBoxBeforeEmptyParticipants.y) : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(12);
  }
  const draftBoxBeforeSave = await viewportRelativeEventBox(
    page,
    '[data-testid="draft-event"][data-calendar-id="dr-thakker"]'
  );
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

test("does not pull the viewport back after cancel when the user scrolls immediately", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const viewport = page.locator(".ic-viewport");
  const eventBox = await firstViewportEventBox(page);

  await page.mouse.click(eventBox.x + Math.min(16, eventBox.width / 2), eventBox.y + eventBox.height / 2);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  await page.getByTestId("draft-cancel-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);

  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  await page.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
  await page.mouse.wheel(0, 2_000);
  const userVisibleDate = await topVisibleDayDate(page);

  await page.waitForTimeout(2800);
  await expect.poll(async () => topVisibleDayDate(page)).toBe(userVisibleDate);
});

test("keeps expanded calendar rows populated immediately after create cancel", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add event" }).click();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect
    .poll(async () =>
      page
        .getByTestId("calendar-row")
        .evaluateAll((rows) =>
          Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
        )
    )
    .toEqual(["dr-kirillov"]);

  await page.getByTestId("jump-date-input").fill("2026-04-27");
  await page.getByTestId("jump-time-input").fill("09:00");
  await page.getByTestId("go-date-button").click();
  await expect.poll(async () => topVisibleDayDate(page)).toBe("2026-04-27");
  await page.waitForTimeout(120);

  await page.evaluate(() => {
    type CancelSample = {
      visibleCalendarIds: string[];
      nonDraftVisibleEventCount: number;
      topDate: string | null;
    };
    const samples: CancelSample[] = [];
    const isVisibleInViewport = (element: HTMLElement, viewportBox: DOMRect) => {
      const box = element.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        box.right > viewportBox.left &&
        box.left < viewportBox.right &&
        box.bottom > viewportBox.top &&
        box.top < viewportBox.bottom
      );
    };
    const sample = (remainingFrames: number) => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      const viewportBox = viewport?.getBoundingClientRect();
      if (!viewport || !viewportBox) {
        samples.push({ visibleCalendarIds: [], nonDraftVisibleEventCount: 0, topDate: null });
      } else {
        const visibleRows = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-row"]')).filter(
          (row) => row.dataset.retainedHidden !== "true" && isVisibleInViewport(row, viewportBox)
        );
        const visibleCalendarIds = Array.from(
          new Set(
            visibleRows
              .map((row) => row.dataset.calendarId)
              .filter((calendarId): calendarId is string => Boolean(calendarId))
          )
        );
        const nonDraftVisibleEventCount = Array.from(
          document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"], [data-testid="availability-event"]')
        ).filter(
          (event) => event.dataset.calendarId !== "dr-kirillov" && isVisibleInViewport(event, viewportBox)
        ).length;
        const topDay = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find(
          (day) => {
            const box = day.getBoundingClientRect();
            return box.bottom > viewportBox.top + 4;
          }
        );
        samples.push({
          visibleCalendarIds,
          nonDraftVisibleEventCount,
          topDate: topDay?.querySelector(".ic-day-label")?.textContent?.trim() ?? null
        });
      }
      if (remainingFrames > 0) {
        requestAnimationFrame(() => sample(remainingFrames - 1));
      }
    };
    (window as typeof window & { __cancelExpandedCalendarSamples?: CancelSample[] }).__cancelExpandedCalendarSamples =
      samples;
    sample(20);
  });

  await page.getByTestId("draft-cancel-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await page.waitForTimeout(180);

  const samples = await page.evaluate(
    () => (window as typeof window & { __cancelExpandedCalendarSamples?: unknown[] }).__cancelExpandedCalendarSamples
  );
  expect(samples).toBeTruthy();
  const expandedSamples = (samples ?? []).filter((sample) => {
    const candidate = sample as { visibleCalendarIds?: string[] };
    return (candidate.visibleCalendarIds ?? []).length > 1;
  }) as { nonDraftVisibleEventCount: number; topDate: string | null }[];
  expect(expandedSamples.length).toBeGreaterThan(0);
  expect(Math.min(...expandedSamples.map((sample) => sample.nonDraftVisibleEventCount))).toBeGreaterThan(0);
  expect(new Set(expandedSamples.map((sample) => sample.topDate)).size).toBe(1);
});

test("keeps edit cancel anchored to the original first person", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const duplicate = await firstDuplicatedViewportEvent(page);
  const firstPersonParticipant = duplicate.boxes.find((box) => !box.calendarId.includes("room"));
  expect(firstPersonParticipant).toBeTruthy();
  if (!firstPersonParticipant) return;
  const firstParticipantId = firstPersonParticipant.calendarId;
  const alternateParticipant = duplicate.boxes.find((box) => box.calendarId !== firstParticipantId);
  expect(alternateParticipant).toBeTruthy();
  if (!alternateParticipant) return;

  await page.mouse.click(
    alternateParticipant.x + Math.min(18, alternateParticipant.width / 2),
    alternateParticipant.y + alternateParticipant.height / 2
  );
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  const firstDraftSelector = `[data-testid="draft-event"][data-event-id="${duplicate.id}"][data-calendar-id="${firstParticipantId}"]`;
  const firstDraftBeforeParticipantEdit = await viewportRelativeEventBox(page, firstDraftSelector);
  expect(firstDraftBeforeParticipantEdit).not.toBeNull();
  if (!firstDraftBeforeParticipantEdit) return;

  await page.getByTestId(`draft-participant-${firstParticipantId}`).uncheck();
  await expect(page.locator(firstDraftSelector)).toHaveCount(0);
  await expect(page.locator(`[data-testid="draft-event"][data-event-id="${duplicate.id}"]`)).toBeVisible();

  await page.getByTestId("draft-cancel-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);

  const firstSourceSelector = `[data-testid="calendar-event"][data-event-id="${duplicate.id}"][data-calendar-id="${firstParticipantId}"]`;
  await expect(page.locator(firstSourceSelector)).toBeVisible();
  await expect
    .poll(async () => {
      const box = await viewportRelativeEventBox(page, firstSourceSelector);
      if (!box) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.max(
        Math.abs(box.y - firstDraftBeforeParticipantEdit.y),
        Math.abs(box.x - firstDraftBeforeParticipantEdit.x)
      );
    })
    .toBeLessThanOrEqual(8);
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
      page
        .getByTestId("calendar-row")
        .evaluateAll((rows) =>
          Array.from(new Set(rows.map((row) => (row as HTMLElement).dataset.calendarId).filter(Boolean)))
        )
    )
    .toEqual(["dr-kirillov", "dr-thakker", "marco-eggens", "room-201", "room-202", "room-203"]);
  const draftBoxBeforeScrollAway = await viewportRelativeEventBox(
    page,
    `[data-testid="draft-event"][data-event-id="${eventId}"]`
  );
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
  await expect(
    page.locator(`[data-testid="draft-event"][data-event-id="${eventId}"]:has-text("Externally edited appointment")`)
  ).toBeVisible();
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
  const draftBoxBeforeFutureDate = await viewportRelativeEventBox(
    page,
    `[data-testid="draft-event"][data-event-id="${eventId}"]`
  );
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

  const draftBoxBeforePastDate = await viewportRelativeEventBox(
    page,
    `[data-testid="draft-event"][data-event-id="${eventId}"]`
  );
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
        for (const element of Array.from(
          document.querySelectorAll<HTMLElement>(`[data-testid="draft-event"][data-event-id="${activeEventId}"]`)
        )) {
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
        page.evaluate(
          ({ activeEventId, before }) => {
            const viewport = document.querySelector<HTMLElement>(".ic-viewport");
            const event = document.querySelector<HTMLElement>(
              `[data-testid="calendar-event"][data-event-id="${activeEventId}"]`
            );
            const row = event?.closest<HTMLElement>('[data-testid="calendar-row"]');
            if (!viewport || !row) {
              return Number.POSITIVE_INFINITY;
            }
            return Math.abs(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top - before);
          },
          { activeEventId: eventId, before: draftRowAnchorBeforeCancel }
        )
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

    await page.mouse.move(
      targetBox.x + Math.min(24, targetBox.width / 2),
      targetBox.y + Math.min(20, targetBox.height / 2)
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox.x + Math.min(90, targetBox.width - 2),
      targetBox.y + Math.min(20, targetBox.height / 2)
    );
    await expect(page.getByTestId("draft-event")).toHaveCount(0);
    await page.mouse.up();
  }

  await expect(page.getByTestId("demo-message")).not.toContainText("Created new event");
});
