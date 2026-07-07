import { expect, test } from "@playwright/test";
import { firstViewportEventBox, goToWorkday, firstViewportEventForPrefix, topVisibleDayDate, topVisibleDayState, renderedDayOverscanFailures, visibleDayDates, verticalScrollRatio } from "../helpers";

test("renders, scrolls vertically, zooms, and changes dataset scale", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("infinite-calendar")).toBeVisible();
  await goToWorkday(page);
  await firstViewportEventBox(page);
  expect(await renderedDayOverscanFailures(page, 5)).toEqual([]);
  await expect(page.getByTestId("stat-frame-ms")).toContainText(/\d+\.\d ms/);
  await expect
    .poll(async () => {
      const text = await page.getByTestId("stat-visible-events").textContent();
      return Number.parseInt(text?.replace(/,/g, "") ?? "0", 10);
    })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => {
      const text = await page.getByTestId("stat-total-calendar-nodes").textContent();
      return Number.parseInt(text?.replace(/,/g, "") ?? "0", 10);
    })
    .toBeGreaterThan(0);
  const compactRowHeights = await page.getByTestId("calendar-row").evaluateAll((rows) =>
    rows.map((row) => Math.round(row.getBoundingClientRect().height)).filter((height) => height > 0)
  );
  expect(Math.min(...compactRowHeights)).toBe(50);

  const viewport = page.locator(".ic-viewport");
  const firstDate = await topVisibleDayDate(page);
  await viewport.evaluate((element) => {
    element.scrollTop += 1_800;
  });
  await page.waitForTimeout(150);
  await expect
    .poll(async () => topVisibleDayDate(page))
    .not.toBe(firstDate);

  await viewport.evaluate((element) => {
    element.scrollTop += 50_000;
  });
  await page.waitForTimeout(32);
  expect(await page.getByTestId("calendar-row").count()).toBeGreaterThan(0);
  expect(await renderedDayOverscanFailures(page, 5)).toEqual([]);

  const beforeZoom = await page.getByTestId("zoom-value").textContent();
  await page.getByTestId("zoom-slider").fill("2");
  await expect(page.getByTestId("zoom-value")).not.toHaveText(beforeZoom ?? "");
  await expect(page.getByTestId("zoom-value")).toHaveText("2.00");
  await page.getByTestId("zoom-slider").fill("8");
  await expect(page.getByTestId("zoom-value")).toHaveText("8.00");
  await expect(page.getByTestId("calendar-row").first().locator(".ic-row-grid")).toHaveCSS("background-size", "40px 100%");
  await expect(page.getByTestId("calendar-row").first().locator(".ic-row-grid")).toHaveCSS("background-position-x", "8px");
  await expect(page.getByTestId("calendar-row").first().locator(".ic-row-grid")).toHaveCSS("background-repeat", "repeat");
  await page.getByTestId("zoom-slider").fill("6");
  await expect(page.getByTestId("calendar-row").first().locator(".ic-row-grid")).toHaveCSS("background-size", "90px 100%");
  await page.getByTestId("zoom-slider").fill("0.5");
  await expect(page.getByTestId("zoom-value")).toHaveText("0.50");
  await page.getByTestId("zoom-slider").fill("2");
  await expect(page.getByTestId("zoom-value")).toHaveText("2.00");
  const afterButtonZoom = await page.getByTestId("zoom-value").textContent();
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  await viewport.evaluate((element) => {
    element.scrollLeft = 240;
  });
  await expect.poll(async () => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  const scrollTopBeforeShiftWheel = await viewport.evaluate((element) => element.scrollTop);
  const pointerX = 520;
  const timelineNodeNearPointer = async () => {
    const zoom = Number(await page.getByTestId("zoom-value").textContent());
    return viewport.evaluate(
      (element, { x, zoomValue }) => {
        const labelWidth = 230;
        const timelineGutter = 8;
        const startMinute = 8 * 60;
        const endMinute = 18 * 60;
        const cadence = zoomValue > 6 ? 5 : 15;
        const cursorMinute = startMinute + (x + element.scrollLeft - labelWidth - timelineGutter) / zoomValue;
        const minute = Math.min(endMinute, Math.max(startMinute, Math.round(cursorMinute / cadence) * cadence));
        return {
          minute,
          screenX: labelWidth + timelineGutter + (minute - startMinute) * zoomValue - element.scrollLeft
        };
      },
      { x: pointerX, zoomValue: zoom }
    );
  };
  const anchoredNodeBeforeShiftWheel = await timelineNodeNearPointer();
  expect(Math.abs(anchoredNodeBeforeShiftWheel.screenX - pointerX)).toBeLessThanOrEqual(16);
  await page.evaluate(() => {
    document.body.style.minHeight = "2400px";
    window.scrollTo(0, 120);
  });
  const windowScrollBeforeShiftWheel = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  await page.mouse.move(viewportBox.x + pointerX, viewportBox.y + 160);
  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, -500);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("zoom-value")).not.toHaveText(afterButtonZoom ?? "");
  await expect(page.getByTestId("zoom-value")).toHaveText("2.15");
  await expect.poll(async () => viewport.evaluate((element) => element.scrollTop)).toBe(scrollTopBeforeShiftWheel);
  await expect.poll(async () => (await timelineNodeNearPointer()).minute).toBe(anchoredNodeBeforeShiftWheel.minute);
  await expect.poll(async () => (await timelineNodeNearPointer()).screenX).toBeCloseTo(anchoredNodeBeforeShiftWheel.screenX, 0);
  await expect.poll(async () => page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))).toEqual(windowScrollBeforeShiftWheel);
  await page.evaluate(() => {
    document.body.style.minHeight = "";
    window.scrollTo(0, 0);
  });

  await page.getByTestId("zoom-slider").fill("3");
  await expect(page.getByTestId("zoom-value")).toHaveText("3.00");
  const horizontalZoomFloor = await viewport.evaluate((element) => {
    const labelWidth = 230;
    const timelineGutter = 8;
    const zoom = Number(document.querySelector<HTMLElement>('[data-testid="zoom-value"]')?.textContent ?? "1");
    const virtualSpace = document.querySelector<HTMLElement>(".ic-virtual-space");
    const minWidth = Number.parseFloat(window.getComputedStyle(virtualSpace ?? element).minWidth);
    const totalMinutes = (minWidth - labelWidth - timelineGutter) / zoom;
    const availableTimelineWidth = Math.max(0, element.clientWidth - labelWidth - timelineGutter);
    return Math.min(8, Math.max(0.5, Math.ceil((availableTimelineWidth / totalMinutes) * 100) / 100));
  });
  await page.mouse.move(viewportBox.x + pointerX, viewportBox.y + 160);
  await page.keyboard.down("Shift");
  for (let index = 0; index < 20; index += 1) {
    await page.mouse.wheel(0, 500);
  }
  await page.keyboard.up("Shift");
  await expect
    .poll(async () => Number(await page.getByTestId("zoom-value").textContent()))
    .toBe(0.5);
  expect(0.5).toBeLessThan(horizontalZoomFloor);
  await expect
    .poll(async () =>
      viewport.evaluate((element) => {
        const virtualSpace = document.querySelector<HTMLElement>(".ic-virtual-space");
        return Number.parseFloat(window.getComputedStyle(virtualSpace ?? element).minWidth) - element.clientWidth;
      })
    )
    .toBeGreaterThanOrEqual(0);
  const logicalZoomBeforeExtraWheel = Number(await page.getByTestId("zoom-value").textContent());
  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, 500);
  await page.keyboard.up("Shift");
  await expect
    .poll(async () => Number(await page.getByTestId("zoom-value").textContent()))
    .toBe(logicalZoomBeforeExtraWheel);
  await expect
    .poll(async () =>
      viewport.evaluate((element) => {
        const virtualSpace = document.querySelector<HTMLElement>(".ic-virtual-space");
        return Number.parseFloat(window.getComputedStyle(virtualSpace ?? element).minWidth) - element.clientWidth;
      })
    )
    .toBeGreaterThanOrEqual(0);

  await page.getByTestId("scale-select").selectOption("20000");
  await expect(page.getByTestId("demo-message")).toContainText("20,000");
  await goToWorkday(page);
  await expect
    .poll(async () => {
      return page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).some((element) =>
          element.dataset.eventId?.startsWith("event-20000-")
        )
      );
    })
    .toBe(true);
});

test("renders route-specific demo treatments", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-demo-id="default"]')).toBeVisible();
  await expect(page.getByTestId("demo-route-default")).toHaveAttribute("aria-current", "page");
  await goToWorkday(page);
  await expect(page.locator(".demo-event-card").first()).toBeVisible();

  await page.goto("/demo1");
  await expect(page.locator('[data-demo-id="demo1"]')).toBeVisible();
  await expect(page.getByTestId("demo-route-demo1")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("view-infinite-horizontal")).toBeChecked();
  await expect(page.getByTestId("zoom-value")).toHaveText("1.40");
  await goToWorkday(page);
  await expect(page.locator(".demo1-event-card").first()).toBeVisible();
  const compactMetrics = await page.evaluate(() => {
    const row = document.querySelector<HTMLElement>('[data-testid="calendar-row"]');
    const label = document.querySelector<HTMLElement>(".ic-row-label");
    const card = document.querySelector<HTMLElement>(".demo1-event-card");
    if (!row || !label || !card) return null;
    const cardStyles = window.getComputedStyle(card);
    return {
      rowHeight: Math.round(row.getBoundingClientRect().height),
      labelWidth: Math.round(label.getBoundingClientRect().width),
      borderLeftWidth: cardStyles.borderLeftWidth,
      display: cardStyles.display
    };
  });
  expect(compactMetrics).toEqual({
    rowHeight: 42,
    labelWidth: 190,
    borderLeftWidth: "4px",
    display: "grid"
  });
  await page.getByTestId("view-infinite-vertical").check();
  await expect(page.getByTestId("calendar-column").first()).toBeVisible();

  await page.goto("/demo2");
  await expect(page.locator('[data-demo-id="demo2"]')).toBeVisible();
  await expect(page.getByTestId("view-infinite-vertical")).toBeChecked();
  await expect(page.getByTestId("zoom-value")).toHaveText("2.40");
  await goToWorkday(page);
  await expect(page.locator(".demo2-event-card").first()).toBeVisible();
  const plannerMetrics = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".icv-day-header");
    const timePane = document.querySelector<HTMLElement>(".icv-time-pane");
    const column = document.querySelector<HTMLElement>('[data-testid="calendar-column"]');
    const card = document.querySelector<HTMLElement>(".demo2-event-card");
    if (!header || !timePane || !column || !card) return null;
    const cardStyles = window.getComputedStyle(card);
    return {
      headerHeight: Math.round(header.getBoundingClientRect().height),
      timePaneWidth: Math.round(timePane.getBoundingClientRect().width),
      columnWidth: Math.round(column.getBoundingClientRect().width),
      borderTopWidth: cardStyles.borderTopWidth,
      borderRadius: cardStyles.borderRadius
    };
  });
  expect(plannerMetrics).toEqual({
    headerHeight: 52,
    timePaneWidth: 196,
    columnWidth: 280,
    borderTopWidth: "4px",
    borderRadius: "7px"
  });
  await page.getByTestId("view-infinite-horizontal").check();
  await expect(page.getByTestId("calendar-row").first()).toBeVisible();

  await page.goto("/demo3");
  await expect(page.locator('[data-demo-id="demo3"]')).toBeVisible();
  await expect(page.getByTestId("view-infinite-vertical")).toBeChecked();
  await expect(page.getByTestId("availability-mode")).toBeChecked();
  await expect(page.getByTestId("calendar-count")).toHaveValue("3");
  await goToWorkday(page);
  await expect(page.locator(".demo3-event-card").first()).toBeVisible();
  await expect(page.locator(".ic-availability-shell.is-active-layer").first()).toBeVisible();
  const availabilityMetrics = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".icv-day-header");
    const timePane = document.querySelector<HTMLElement>(".icv-time-pane");
    const column = document.querySelector<HTMLElement>('[data-testid="calendar-column"]');
    const availabilityCard = document.querySelector<HTMLElement>(".demo3-event-card.kind-availability");
    if (!header || !timePane || !column || !availabilityCard) return null;
    const cardStyles = window.getComputedStyle(availabilityCard);
    return {
      headerHeight: Math.round(header.getBoundingClientRect().height),
      timePaneWidth: Math.round(timePane.getBoundingClientRect().width),
      columnWidth: Math.round(column.getBoundingClientRect().width),
      borderLeftWidth: cardStyles.borderLeftWidth,
      opacity: cardStyles.opacity
    };
  });
  expect(availabilityMetrics).toEqual({
    headerHeight: 48,
    timePaneWidth: 182,
    columnWidth: expect.any(Number),
    borderLeftWidth: "7px",
    opacity: "0.94"
  });
  expect(availabilityMetrics?.columnWidth ?? 0).toBeGreaterThanOrEqual(320);
  expect(((availabilityMetrics?.columnWidth ?? 0) - 320) % 120).toBe(0);
  expect(availabilityMetrics?.columnWidth ?? 0).toBeGreaterThan(plannerMetrics?.columnWidth ?? 0);
  await page.getByTestId("availability-mode").uncheck();
  await expect(page.locator(".ic-availability-shell.is-active-layer")).toHaveCount(0);
  await page.getByTestId("view-infinite-horizontal").check();
  await expect(page.getByTestId("calendar-row").first()).toBeVisible();
});

test("keeps large dataset events visible and hoverable", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("scale-select").selectOption("5000");
  await goToWorkday(page);
  const event5000 = await firstViewportEventForPrefix(page, "event-5000-");
  await page.mouse.move(event5000.x + Math.min(event5000.width / 2, 20), event5000.y + event5000.height / 2);
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${event5000.id}"]:has([data-render-status="hovered"])`)).toBeVisible();
  const hoveredBox = await page.locator(`[data-testid="calendar-event"][data-event-id="${event5000.id}"]:has([data-render-status="hovered"])`).boundingBox();
  expect(hoveredBox).not.toBeNull();
  expect(hoveredBox?.height ?? 0).toBeGreaterThan(0);

  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = input.max;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByTestId("scale-select").selectOption("20000");
  await goToWorkday(page);
  const event20000 = await firstViewportEventForPrefix(page, "event-20000-");
  expect(event20000.width).toBeGreaterThan(0);
  expect(event20000.height).toBeGreaterThan(0);
  await page.mouse.move(event20000.x + Math.min(event20000.width / 2, 20), event20000.y + event20000.height / 2);
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${event20000.id}"]:has([data-render-status="hovered"])`)).toBeVisible();

  const visibleRowHeights = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return [];
    return Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-row"]'))
      .map((element) => element.getBoundingClientRect())
      .filter((box) => box.y < viewport.bottom && box.y + box.height > viewport.y)
      .map((box) => Math.round(box.height));
  });
  expect(Math.min(...visibleRowHeights)).toBeLessThan(Math.max(...visibleRowHeights));
  const visibleEventMetrics = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return [];
    const safeTop = viewport.y + 92;
    return Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))
      .map((element) => {
        const box = element.getBoundingClientRect();
        const row = element.closest<HTMLElement>('[data-testid="calendar-row"]');
        const rowBox = row?.getBoundingClientRect();
        const laneCount = Number(element.dataset.laneCount ?? "1");
        return {
          box,
          height: Math.round(box.height),
          laneHeight: rowBox ? rowBox.height / Math.max(1, laneCount) : 0
        };
      })
      .filter(({ box }) => box.y >= safeTop && box.y + box.height <= viewport.bottom && box.x >= viewport.x && box.x < viewport.right);
  });
  expect(Math.min(...visibleEventMetrics.map((metric) => metric.height))).toBeGreaterThanOrEqual(20);
  expect(Math.min(...visibleEventMetrics.map((metric) => metric.laneHeight))).toBeGreaterThanOrEqual(24);

  const bottomLaneEvent = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const row = element.closest<HTMLElement>('[data-testid="calendar-row"]');
      if (!row) continue;
      const box = element.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const laneCount = Number(element.dataset.laneCount ?? "1");
      const isVisible = box.y >= viewport.y + 92 && box.y + box.height <= viewport.bottom && box.x >= viewport.x && box.x < viewport.right;
      const isBottomLane = rowBox.bottom - (box.y + box.height) <= 12 || box.y > rowBox.y + rowBox.height / 2;
      const canExpand = box.height < rowBox.height / 2;
      if (isVisible && isBottomLane && canExpand) {
        return {
          id: element.dataset.eventId,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          laneHeight: rowBox.height / Math.max(1, laneCount),
          rowHeight: rowBox.height
        };
      }
    }

    return null;
  });
  expect(bottomLaneEvent).not.toBeNull();
  if (bottomLaneEvent) {
    await page.mouse.move(bottomLaneEvent.x + Math.min(bottomLaneEvent.width / 2, 20), bottomLaneEvent.y + bottomLaneEvent.height / 2);
    const expandedHeight = await page
      .locator(`[data-testid="calendar-event"][data-event-id="${bottomLaneEvent.id}"]:has([data-render-status="hovered"])`)
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(expandedHeight).toBeGreaterThan(bottomLaneEvent.height);
    expect(expandedHeight).toBeCloseTo(bottomLaneEvent.rowHeight, 0);
  }

  const dayBoundaryIssues = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return [];
    const days = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'))
      .map((day) => ({ date: day.dataset.date, box: day.getBoundingClientRect() }))
      .filter((day) => day.box.y < viewport.bottom && day.box.bottom > viewport.y)
      .sort((a, b) => a.box.y - b.box.y);

    const issues: string[] = [];
    for (const day of days) {
      const dayElement = document.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${day.date}"]`);
      const rowBottoms = Array.from(dayElement?.querySelectorAll<HTMLElement>('[data-testid="calendar-row"]') ?? []).map(
        (row) => row.getBoundingClientRect().bottom
      );
      if (rowBottoms.length > 0 && Math.max(...rowBottoms) > day.box.bottom + 1) {
        issues.push(`${day.date}: row exceeds day`);
      }
    }
    for (let index = 0; index < days.length - 1; index += 1) {
      if (days[index].box.bottom > days[index + 1].box.y + 1) {
        issues.push(`${days[index].date}: overlaps ${days[index + 1].date}`);
      }
    }
    return issues;
  });
  expect(dayBoundaryIssues).toEqual([]);
});

test("limits vertical scrollbar to one month around the visible date and recenters after scroll end", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page, "2026-07-06");
  const viewport = page.locator(".ic-viewport");

  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.waitForTimeout(260);
  const topBoundDate = await topVisibleDayDate(page);
  expect(topBoundDate >= "2026-06-06").toBe(true);
  expect(topBoundDate <= "2026-06-08").toBe(true);

  await goToWorkday(page, "2026-07-06");
  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scrollend"));
  });
  await page.waitForTimeout(300);
  expect(await verticalScrollRatio(page)).toBeGreaterThan(0.85);

  await page.waitForTimeout(2500);
  const bottomDates = await visibleDayDates(page);
  expect(bottomDates.length).toBeGreaterThan(0);
  expect(bottomDates[bottomDates.length - 1] >= "2026-08-01").toBe(true);
  expect(bottomDates[bottomDates.length - 1] <= "2026-08-06").toBe(true);

  const recenteredRatio = await verticalScrollRatio(page);
  expect(recenteredRatio).toBeGreaterThan(0.35);
  expect(recenteredRatio).toBeLessThan(0.65);
});

test("keeps intra-day scroll offset when the virtual window recenters", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page, "2026-07-06");
  const viewport = page.locator(".ic-viewport");

  await viewport.evaluate((element) => {
    const nextDay = document.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-07-07"]');
    if (!nextDay) {
      throw new Error("Next day was not rendered");
    }
    element.scrollTop = nextDay.offsetTop + 100;
  });
  await page.waitForTimeout(40);
  const beforeRecenter = await topVisibleDayState(page);
  await page.waitForTimeout(2800);
  const afterRecenter = await topVisibleDayState(page);

  expect(afterRecenter.date).toBe(beforeRecenter.date);
  expect(Math.abs(afterRecenter.offsetWithinDate - beforeRecenter.offsetWithinDate)).toBeLessThanOrEqual(2);
});
