import { expect, test } from "@playwright/test";
import { goToWorkday, selectPageText, topVisibleDayDate, topVisibleDayState, verticalTopVisibleGeometry } from "../helpers";

test("switches to the vertical calendar view with sticky time pane and vertical zoom", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  await expect(page.getByTestId("infinite-calendar")).toHaveAttribute("data-view", "infinite-vertical");
  await expect(page.getByTestId("vertical-time-pane").first()).toBeVisible();
  await expect(page.getByTestId("calendar-column").first()).toBeVisible();
  await expect(page.getByTestId("time-scale-header")).toHaveCount(0);

  const firstColumnWidth = await page.getByTestId("calendar-column").first().evaluate((element) => {
    return element.getBoundingClientRect().width;
  });
  expect(firstColumnWidth).toBeGreaterThanOrEqual(240);
  const leftPaneMetrics = await page.evaluate(() => {
    const timePane = document.querySelector<HTMLElement>('[data-testid="vertical-time-pane"]');
    const dateLabel = document.querySelector<HTMLElement>(".icv-date-label");
    const dateMain = dateLabel?.querySelector<HTMLElement>(".icv-date-main");
    const dateWeekday = dateLabel?.querySelector<HTMLElement>(".icv-date-weekday");
    const firstHour = Array.from(document.querySelectorAll<HTMLElement>(".icv-time-tick.is-hour")).find((element) =>
      element.textContent?.includes(":00")
    );
    const hourTicks = Array.from(document.querySelectorAll<HTMLElement>(".icv-time-tick.is-hour"));
    const lastHour = hourTicks.at(-1);
    const minuteTick = Array.from(document.querySelectorAll<HTMLElement>(".icv-time-tick:not(.is-hour)")).find((element) =>
      /^\d+$/.test(element.textContent ?? "")
    );
    const board = document.querySelector<HTMLElement>('[data-testid="vertical-day-board"]');
    return timePane && dateLabel
      ? {
          timePaneWidth: timePane.getBoundingClientRect().width,
          dateLabelWidth: dateLabel.getBoundingClientRect().width,
          boardHeight: board?.getBoundingClientRect().height ?? 0,
          firstHourTop: Number.parseFloat(firstHour?.style.top ?? "NaN"),
          lastHourTop: Number.parseFloat(lastHour?.style.top ?? "NaN"),
          dateMainFontSize: dateMain ? Number.parseFloat(window.getComputedStyle(dateMain).fontSize) : 0,
          dateWeekdayFontSize: dateWeekday ? Number.parseFloat(window.getComputedStyle(dateWeekday).fontSize) : 0,
          dateMainY: dateMain?.getBoundingClientRect().y ?? 0,
          dateWeekdayY: dateWeekday?.getBoundingClientRect().y ?? 0,
          dateMainText: dateMain?.textContent ?? "",
          dateWeekdayText: dateWeekday?.textContent ?? "",
          firstHourText: firstHour?.textContent ?? "",
          minuteText: minuteTick?.textContent ?? ""
        }
      : null;
  });
  expect(leftPaneMetrics).not.toBeNull();
  if (!leftPaneMetrics) return;
  expect(leftPaneMetrics.timePaneWidth).toBeCloseTo(leftPaneMetrics.dateLabelWidth, 0);
  expect(leftPaneMetrics.timePaneWidth).toBeCloseTo(161, 0);
  expect(leftPaneMetrics.firstHourTop).toBeCloseTo(8, 0);
  expect(leftPaneMetrics.boardHeight - leftPaneMetrics.lastHourTop).toBeCloseTo(8, 0);
  expect(leftPaneMetrics.dateMainFontSize).toBeCloseTo(14, 0);
  expect(leftPaneMetrics.dateWeekdayFontSize).toBeCloseTo(12, 0);
  expect(leftPaneMetrics.dateWeekdayY).toBeGreaterThan(leftPaneMetrics.dateMainY);
  expect(leftPaneMetrics.dateMainText).toMatch(/^[A-Za-z]+ \d/);
  expect(leftPaneMetrics.dateWeekdayText).toMatch(/^[A-Za-z]+$/);
  expect(leftPaneMetrics.firstHourText).toMatch(/^\d{1,2}:00$/);
  expect(leftPaneMetrics.minuteText).toMatch(/^\d+$/);

  const firstBoardHeight = await page.getByTestId("vertical-day-board").first().evaluate((element) => element.getBoundingClientRect().height);
  await page.getByTestId("zoom-slider").fill("2");
  const zoomedBoardHeight = await page.getByTestId("vertical-day-board").first().evaluate((element) => element.getBoundingClientRect().height);
  expect(zoomedBoardHeight).toBeGreaterThan(firstBoardHeight);

  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = input.max;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const viewport = page.locator(".ic-viewport");
  const timePaneBefore = await page.locator(".icv-time-pane-content").first().boundingBox();
  const paceBefore = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const tick = Array.from(document.querySelectorAll<HTMLElement>(".icv-time-tick.is-hour")).find((element) => {
      const box = element.getBoundingClientRect();
      return box.y > viewport.y + 80 && box.y < viewport.bottom - 80;
    });
    const day = tick?.closest<HTMLElement>('[data-testid="calendar-day"]');
    const column = day?.querySelector<HTMLElement>('[data-testid="calendar-column"]');
    if (!tick || !column) return null;
    tick.dataset.paceProbe = "true";
    column.dataset.paceProbe = "true";
    return {
      tickY: tick.getBoundingClientRect().y,
      columnY: column.getBoundingClientRect().y
    };
  });
  expect(timePaneBefore).not.toBeNull();
  expect(paceBefore).not.toBeNull();
  if (!timePaneBefore || !paceBefore) return;
  await viewport.evaluate((element) => {
    element.scrollLeft = 500;
    element.scrollTop += 160;
  });
  await page.waitForTimeout(50);
  const timePaneAfter = await page.locator(".icv-time-pane-content").first().boundingBox();
  const stickyHeaderOffset = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return Number.POSITIVE_INFINITY;
    const headers = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day-header"]'))
      .map((element) => element.getBoundingClientRect())
      .filter((box) => box.bottom > viewport.y && box.y < viewport.bottom);
    return Math.min(...headers.map((box) => Math.abs(box.y - viewport.y)));
  });
  const paceAfter = await page.evaluate(() => {
    const tick = document.querySelector<HTMLElement>('.icv-time-tick[data-pace-probe="true"]');
    const column = document.querySelector<HTMLElement>('[data-testid="calendar-column"][data-pace-probe="true"]');
    return tick && column
      ? {
          tickY: tick.getBoundingClientRect().y,
          columnY: column.getBoundingClientRect().y
        }
      : null;
  });
  expect(timePaneAfter).not.toBeNull();
  expect(paceAfter).not.toBeNull();
  if (!timePaneAfter || !paceAfter) return;
  expect(Math.abs(timePaneAfter.x - timePaneBefore.x)).toBeLessThanOrEqual(1);
  expect(stickyHeaderOffset).toBeLessThanOrEqual(2);
  expect(Math.round(paceAfter.tickY - paceBefore.tickY)).toBe(Math.round(paceAfter.columnY - paceBefore.columnY));

  await page.getByTestId("today-button").click();
  await expect(page.getByTestId("current-time-line")).toHaveCount(1);
  const markerMetrics = await page.getByTestId("current-time-line").evaluate((element) => {
    const marker = element.getBoundingClientRect();
    const board = element.closest<HTMLElement>('[data-testid="vertical-day-board"]')?.getBoundingClientRect();
    return board
      ? {
          markerY: marker.y,
          markerWidth: marker.width,
          boardY: board.y,
          boardBottom: board.bottom
        }
      : null;
  });
  expect(markerMetrics).not.toBeNull();
  if (!markerMetrics) return;
  expect(markerMetrics.markerWidth).toBeGreaterThan(200);
  expect(markerMetrics.markerY).toBeGreaterThanOrEqual(markerMetrics.boardY);
  expect(markerMetrics.markerY).toBeLessThanOrEqual(markerMetrics.boardBottom);

  await page.getByTestId("view-infinite-horizontal").check();
  await expect(page.getByTestId("time-scale-header")).toBeVisible();
});

test("grows vertical columns after three overlap lanes and keeps headers aligned", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = input.max;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByTestId("scale-select").selectOption("20000");
  await goToWorkday(page);

  const denseColumn = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;

    for (const column of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-column"]'))) {
      const columnBox = column.getBoundingClientRect();
      if (columnBox.bottom < viewport.y || columnBox.y > viewport.bottom || columnBox.right < viewport.x || columnBox.x > viewport.right) {
        continue;
      }
      const event = Array.from(column.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find(
        (element) => Number(element.dataset.laneCount ?? "1") >= 4
      );
      if (!event) {
        continue;
      }
      const eventBox = event.getBoundingClientRect();
      const columnIndex = Array.from(column.parentElement?.querySelectorAll<HTMLElement>('[data-testid="calendar-column"]') ?? []).indexOf(column);
      const day = column.closest<HTMLElement>('[data-testid="calendar-day"]');
      const header = day?.querySelectorAll<HTMLElement>(".icv-calendar-header-cell")[columnIndex];
      const headerBox = header?.getBoundingClientRect();
      return {
        columnWidth: columnBox.width,
        eventWidth: eventBox.width,
        laneCount: Number(event.dataset.laneCount ?? "1"),
        headerWidth: headerBox?.width ?? 0
      };
    }

    return null;
  });

  expect(denseColumn).not.toBeNull();
  if (!denseColumn) return;
  expect(denseColumn.columnWidth).toBeGreaterThanOrEqual(240 + (denseColumn.laneCount - 3) * 80);
  expect(denseColumn.eventWidth).toBeGreaterThanOrEqual(79);
  expect(Math.abs(denseColumn.headerWidth - denseColumn.columnWidth)).toBeLessThanOrEqual(1);
});

test("keeps the vertical current date anchored when zoom changes", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  await page.getByRole("spinbutton", { name: "Start" }).fill("8");
  await page.getByRole("spinbutton", { name: "End" }).fill("18");
  await page.getByTestId("zoom-slider").fill("8");
  await page.getByTestId("jump-date-input").fill("2026-08-12");
  await page.getByTestId("jump-time-input").fill("17:00");
  await page.getByTestId("go-date-button").click();

  await expect.poll(async () => topVisibleDayDate(page)).toBe("2026-08-12");
  const beforeZoom = await topVisibleDayState(page);
  expect(beforeZoom.date).toBe("2026-08-12");
  expect(beforeZoom.offsetWithinDate).toBeGreaterThan(3_000);

  await page.getByTestId("zoom-slider").fill("0.5");
  await expect(page.getByTestId("zoom-value")).toHaveText("0.50");

  await expect.poll(async () => topVisibleDayDate(page)).toBe("2026-08-12");
  const afterZoom = await topVisibleDayState(page);
  expect(afterZoom.date).toBe("2026-08-12");

  const viewport = page.locator(".ic-viewport");
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  const pointer = { x: viewportBox.x + 520, y: viewportBox.y + 180 };
  const timelineNodeNearMouse = async () =>
    page.evaluate(({ x, y }) => {
      const zoomText = document.querySelector<HTMLElement>('[data-testid="zoom-value"]')?.textContent ?? "1";
      const zoom = Number(zoomText);
      const day = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find((element) => {
        const box = element.getBoundingClientRect();
        return y >= box.top && y <= box.bottom;
      });
      if (!day) {
        return null;
      }
      const dayBox = day.getBoundingClientRect();
      const dayHeaderHeight = 42;
      const timelineGutter = 8;
      const startMinute = 8 * 60;
      const endMinute = 18 * 60;
      const cadence = zoom > 6 ? 5 : 15;
      const cursorMinute = startMinute + (y - dayBox.top - dayHeaderHeight - timelineGutter) / Math.max(0.5, zoom);
      const minute = Math.min(endMinute, Math.max(startMinute, Math.round(cursorMinute / cadence) * cadence));
      return {
        date: day.dataset.date ?? "",
        minute,
        screenY: dayBox.top + dayHeaderHeight + timelineGutter + (minute - startMinute) * Math.max(0.5, zoom)
      };
    }, pointer);

  const beforeGestureZoomIn = await timelineNodeNearMouse();
  expect(beforeGestureZoomIn).not.toBeNull();
  await page.mouse.move(pointer.x, pointer.y);
  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, -500);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("zoom-value")).toHaveText("0.65");
  await expect.poll(async () => (await timelineNodeNearMouse())?.date ?? null).toBe(beforeGestureZoomIn?.date);
  await expect.poll(async () => (await timelineNodeNearMouse())?.minute ?? null).toBe(beforeGestureZoomIn?.minute);
  await expect.poll(async () => (await timelineNodeNearMouse())?.screenY ?? Number.POSITIVE_INFINITY).toBeCloseTo(beforeGestureZoomIn?.screenY ?? 0, 0);

  const beforeGestureZoomOut = await timelineNodeNearMouse();
  expect(beforeGestureZoomOut).not.toBeNull();
  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, 500);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("zoom-value")).toHaveText("0.50");
  await expect.poll(async () => (await timelineNodeNearMouse())?.date ?? null).toBe(beforeGestureZoomOut?.date);
  await expect.poll(async () => (await timelineNodeNearMouse())?.minute ?? null).toBe(beforeGestureZoomOut?.minute);
  await expect.poll(async () => (await timelineNodeNearMouse())?.screenY ?? Number.POSITIVE_INFINITY).toBeCloseTo(beforeGestureZoomOut?.screenY ?? 0, 0);
});

test("supports draft creation and dragging in the vertical view", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  await goToWorkday(page);
  const viewport = page.locator(".ic-viewport");
  const drawPoint = await page.evaluate(() => {
    const viewportRect = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewportRect) return null;
    for (const column of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-column"]'))) {
      const box = column.getBoundingClientRect();
      if (box.bottom <= viewportRect.y + 120 || box.y >= viewportRect.bottom - 120 || box.x < viewportRect.x || box.x >= viewportRect.right) {
        continue;
      }
      const x = box.x + box.width / 2;
      for (let y = Math.max(box.y + 80, viewportRect.y + 120); y < Math.min(box.bottom - 80, viewportRect.bottom - 80); y += 20) {
        const target = document.elementFromPoint(x, y);
        if (target?.closest('[data-testid="calendar-column"]') === column && !target.closest("[data-event-id]")) {
          return { x, y };
        }
      }
    }
    return null;
  });
  expect(drawPoint).not.toBeNull();
  if (!drawPoint) return;

  await page.evaluate(async ({ x, y }) => {
    const target = document.elementFromPoint(x, y);
    target?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: y, pointerId: 1, buttons: 1 }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y + 80, pointerId: 1, buttons: 1 }));
  }, drawPoint);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  const draftBox = await page.getByTestId("draft-event").boundingBox();
  expect(draftBox).not.toBeNull();
  expect(draftBox?.height ?? 0).toBeGreaterThan(40);
  await page.evaluate(({ x, y }) => {
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: x, clientY: y + 80, pointerId: 1 }));
  }, drawPoint);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("Saved external create");

  const eventBox = await page.evaluate(() => {
    const viewportRect = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewportRect) return null;
    for (const event of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const box = event.getBoundingClientRect();
      if (box.y >= viewportRect.y + 90 && box.bottom <= viewportRect.bottom && box.x >= viewportRect.x && box.x < viewportRect.right) {
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      }
    }
    return null;
  });
  expect(eventBox).not.toBeNull();
  if (!eventBox) return;

  await page.mouse.move(eventBox.x + Math.min(eventBox.width / 2, 20), eventBox.y + eventBox.height / 2);
  await expect(page.locator('[data-render-status="hovered"]').first()).toBeVisible();
  const hoverMetrics = await page.locator('[data-testid="calendar-event"]:has([data-render-status="hovered"])').first().evaluate((element) => {
    const box = element.getBoundingClientRect();
    const column = element.closest<HTMLElement>('[data-testid="calendar-column"]')?.getBoundingClientRect();
    const title = element.querySelector<HTMLElement>(".demo-event-title");
    const titleStyle = title ? window.getComputedStyle(title) : null;
    return column
      ? {
          eventWidth: box.width,
          eventHeight: box.height,
          columnWidth: column.width,
          titleFontSize: titleStyle ? Number.parseFloat(titleStyle.fontSize) : 0,
          titleLineHeight: titleStyle ? Number.parseFloat(titleStyle.lineHeight) : 0
        }
      : null;
  });
  expect(hoverMetrics).not.toBeNull();
  if (!hoverMetrics) return;
  expect(Math.abs(hoverMetrics.eventWidth - hoverMetrics.columnWidth)).toBeLessThanOrEqual(1);
  expect(hoverMetrics.eventHeight).toBeGreaterThanOrEqual(64);
  expect(hoverMetrics.titleFontSize).toBeCloseTo(13, 0);
  expect(hoverMetrics.titleLineHeight).toBeGreaterThan(15);

  await selectPageText(page);
  await page.mouse.move(eventBox.x + Math.min(eventBox.width / 2, 20), eventBox.y + 10);
  await page.mouse.down();
  await page.mouse.move(eventBox.x + Math.min(eventBox.width / 2, 20), eventBox.y + 70);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await expect(page.locator('[data-render-status="dragging"]').first()).toBeVisible();
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toBe("");
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText(/Move accepted|Move rejected/);

  await viewport.evaluate((element) => {
    element.scrollTop += 200;
  });
  await expect(page.getByTestId("calendar-column").first()).toBeVisible();
});

test("allows manual vertical scrolling after a drawn draft opens the popup", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  await goToWorkday(page, "2026-07-20");
  const drawPoint = await page.evaluate(() => {
    const viewportRect = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewportRect) return null;
    for (const column of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-column"]'))) {
      const box = column.getBoundingClientRect();
      if (box.bottom <= viewportRect.y + 120 || box.y >= viewportRect.bottom - 120 || box.x < viewportRect.x || box.x >= viewportRect.right) {
        continue;
      }
      const x = box.x + box.width / 2;
      for (let y = Math.max(box.y + 80, viewportRect.y + 120); y < Math.min(box.bottom - 80, viewportRect.bottom - 80); y += 20) {
        const target = document.elementFromPoint(x, y);
        if (target?.closest('[data-testid="calendar-column"]') === column && !target.closest("[data-event-id]")) {
          return { x, y };
        }
      }
    }
    return null;
  });
  expect(drawPoint).not.toBeNull();
  if (!drawPoint) return;

  await page.evaluate(async ({ x, y }) => {
    const target = document.elementFromPoint(x, y);
    target?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: y, pointerId: 1, buttons: 1 }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y + 80, pointerId: 1, buttons: 1 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: x, clientY: y + 80, pointerId: 1 }));
  }, drawPoint);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  await page.locator(".ic-viewport").evaluate((element) => {
    const nextScrollTop = Math.max(0, element.scrollTop - 180);
    element.scrollTop = nextScrollTop;
  });
  const visibleStateAfterScroll = await topVisibleDayState(page);
  await page.waitForTimeout(800);
  await expect
    .poll(async () => {
      const state = await topVisibleDayState(page);
      return state.date === visibleStateAfterScroll.date
        ? Math.abs(state.offsetWithinDate - visibleStateAfterScroll.offsetWithinDate)
        : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(4);
});

test("lets vertical hover pass through expanded cards to underlying overlap lanes", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = input.max;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByTestId("scale-select").selectOption("20000");
  await goToWorkday(page);

  const lanePair = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;

    for (const column of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-column"]'))) {
      const columnBox = column.getBoundingClientRect();
      if (columnBox.bottom < viewport.y || columnBox.y > viewport.bottom || columnBox.right < viewport.x || columnBox.x > viewport.right) {
        continue;
      }

      const grouped = new Map<number, HTMLElement[]>();
      for (const element of Array.from(column.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
        const laneCount = Number(element.dataset.laneCount ?? "1");
        if (laneCount < 2) continue;
        const box = element.getBoundingClientRect();
        if (box.y < viewport.y + 90 || box.bottom > viewport.bottom || box.width < 20 || box.height < 12) {
          continue;
        }
        const key = Math.round(box.y);
        grouped.set(key, [...(grouped.get(key) ?? []), element]);
      }

      for (const elements of grouped.values()) {
        const sorted = elements
          .map((element) => {
            const box = element.getBoundingClientRect();
            return {
              id: element.dataset.eventId,
              x: box.x + box.width / 2,
              y: box.y + box.height / 2,
              width: box.width,
              height: box.height
            };
          })
          .filter((item): item is { id: string; x: number; y: number; width: number; height: number } => Boolean(item.id))
          .sort((a, b) => a.x - b.x);
        if (sorted.length >= 2) {
          return { first: sorted[0], second: sorted[1] };
        }
      }
    }

    return null;
  });

  expect(lanePair).not.toBeNull();
  if (!lanePair) return;

  await page.mouse.move(lanePair.first.x, lanePair.first.y);
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${lanePair.first.id}"] [data-render-status="hovered"]`)).toBeVisible();
  await page.mouse.move(lanePair.second.x, lanePair.second.y);
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${lanePair.second.id}"] [data-render-status="hovered"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${lanePair.first.id}"] [data-render-status="hovered"]`)).toHaveCount(0);
});
