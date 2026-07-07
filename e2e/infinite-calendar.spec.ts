import { expect, test, type Page } from "@playwright/test";

async function firstViewportEventBox(page: Page) {
  await page.waitForSelector('[data-testid="calendar-event"]');
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  const calendarViewport = await page.locator(".ic-viewport").boundingBox();
  const safeTop = (calendarViewport?.y ?? 0) + 92;
  const handles = await page.getByTestId("calendar-event").elementHandles();

  for (const handle of handles) {
    const box = await handle.boundingBox();
    if (box && box.y >= safeTop && box.y + box.height <= viewport.height && box.x >= 0 && box.x < viewport.width) {
      return box;
    }
  }

  throw new Error("No viewport-visible calendar event found");
}

async function goToWorkday(page: Page, date = "2026-07-06") {
  await page.getByTestId("jump-date-input").fill(date);
  await page.getByTestId("go-date-button").click();
  await expect.poll(async () => topVisibleDayDate(page)).toBe(date);
}

function todayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mutedAccentColor(accentColor: string) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(accentColor);
  if (!match) {
    throw new Error(`Unsupported CSS color: ${accentColor}`);
  }
  const [, red, green, blue] = match.map(Number);
  const mix = 0.14;
  const blend = (channel: number) => Math.round(channel * mix + 255 * (1 - mix));
  return `rgb(${blend(red)}, ${blend(green)}, ${blend(blue)})`;
}

async function firstViewportEventForPrefix(page: Page, prefix: string) {
  await expect
    .poll(async () => {
      return page.evaluate((eventPrefix) => {
        return Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).some((element) =>
          element.dataset.eventId?.startsWith(eventPrefix)
        );
      }, prefix);
    })
    .toBe(true);

  const eventBox = await page.evaluate((eventPrefix) => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const safeTop = viewport.y + 92;

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const id = element.dataset.eventId;
      const box = element.getBoundingClientRect();
      if (
        id?.startsWith(eventPrefix) &&
        box.y >= safeTop &&
        box.y + box.height <= viewport.y + viewport.height &&
        box.x >= viewport.x &&
        box.x < viewport.right
      ) {
        return { id, x: box.x, y: box.y, width: box.width, height: box.height };
      }
    }

    return null;
  }, prefix);

  if (!eventBox) {
    throw new Error(`No viewport-visible calendar event found for ${prefix}`);
  }
  return eventBox;
}

async function firstCompactSingleLaneEvent(page: Page) {
  await page.waitForSelector('[data-testid="calendar-event"][data-lane-count="1"]');
  const eventBox = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const safeTop = viewport.y + 92;

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"][data-lane-count="1"]'))) {
      const box = element.getBoundingClientRect();
      const rowBox = element.closest<HTMLElement>('[data-testid="calendar-row"]')?.getBoundingClientRect();
      const timeLine = element.querySelector<HTMLElement>(".demo-event-time");
      if (
        element.dataset.eventId &&
        element.dataset.calendarId &&
        rowBox &&
        timeLine &&
        window.getComputedStyle(timeLine).display === "none" &&
        box.height < 52 &&
        box.y >= safeTop &&
        box.y + box.height <= viewport.y + viewport.height &&
        box.x >= viewport.x &&
        box.x < viewport.right
      ) {
        return {
          id: element.dataset.eventId,
          calendarId: element.dataset.calendarId,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          rowHeight: rowBox.height,
          laneHeight: rowBox.height
        };
      }
    }

    return null;
  });

  if (!eventBox) {
    throw new Error("No compact single-lane event found");
  }
  return eventBox;
}

async function firstExpandableOverlappedEvent(page: Page) {
  await page.waitForSelector('[data-testid="calendar-event"][data-lane-count]');
  const eventBox = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const safeTop = viewport.y + 92;

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const box = element.getBoundingClientRect();
      const rowBox = element.closest<HTMLElement>('[data-testid="calendar-row"]')?.getBoundingClientRect();
      const laneCount = Number(element.dataset.laneCount ?? "1");
      const laneHeight = rowBox ? rowBox.height / Math.max(1, laneCount) : 0;
      if (
        element.dataset.eventId &&
        element.dataset.calendarId &&
        rowBox &&
        laneCount > 1 &&
        laneHeight > 0 &&
        box.height < laneHeight - 0.5 &&
        box.y >= safeTop &&
        box.y + box.height <= viewport.y + viewport.height &&
        box.x >= viewport.x &&
        box.x < viewport.right
      ) {
        return {
          id: element.dataset.eventId,
          calendarId: element.dataset.calendarId,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          laneHeight,
          rowHeight: rowBox.height
        };
      }
    }

    return null;
  });

  if (!eventBox) {
    throw new Error("No hover-expandable overlapped event found");
  }
  return eventBox;
}

async function firstDuplicatedViewportEvent(page: Page) {
  await page.waitForSelector('[data-testid="calendar-event"]');
  const duplicate = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const safeTop = viewport.y + 92;

    const groups = new Map<string, { id: string; boxes: { x: number; y: number; width: number; height: number }[] }>();
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const id = element.dataset.eventId;
      const box = element.getBoundingClientRect();
      if (!id || box.y < safeTop || box.y + box.height > viewport.y + viewport.height || box.x < viewport.x || box.x > viewport.right) {
        continue;
      }
      const group = groups.get(id) ?? { id, boxes: [] };
      group.boxes.push({ x: box.x, y: box.y, width: box.width, height: box.height });
      groups.set(id, group);
    }

    return Array.from(groups.values()).find((group) => group.boxes.length > 1) ?? null;
  });

  if (!duplicate) {
    throw new Error("No visible duplicated event found");
  }
  return duplicate;
}

async function topVisibleDayDate(page: Page) {
  const handles = await page.getByTestId("calendar-day").elementHandles();
  const viewportBox = await page.locator(".ic-viewport").boundingBox();
  if (!viewportBox) {
    throw new Error("Calendar viewport not found");
  }
  let bestAtTop: { date: string; y: number } | null = null;
  let bestBelowTop: { date: string; distance: number } | null = null;

  for (const handle of handles) {
    const box = await handle.boundingBox();
    const date = await handle.getAttribute("data-date");
    if (!box || !date || box.y + box.height < viewportBox.y || box.y > viewportBox.y + viewportBox.height) {
      continue;
    }
    if (box.y <= viewportBox.y + 2) {
      if (!bestAtTop || box.y > bestAtTop.y) {
        bestAtTop = { date, y: box.y };
      }
      continue;
    }
    const distance = box.y - viewportBox.y;
    if (!bestBelowTop || distance < bestBelowTop.distance) {
      bestBelowTop = { date, distance };
    }
  }

  const best = bestAtTop ?? bestBelowTop;
  if (!best) {
    throw new Error("No visible calendar day found");
  }
  return best.date;
}

async function topVisibleDayState(page: Page) {
  return page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) {
      throw new Error("Calendar viewport not found");
    }

    let bestAtTop: { date: string; y: number; offsetWithinDate: number } | null = null;
    let bestBelowTop: { date: string; distance: number; offsetWithinDate: number } | null = null;

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'))) {
      const box = element.getBoundingClientRect();
      const date = element.dataset.date;
      if (!date || box.y + box.height < viewport.y || box.y > viewport.y + viewport.height) {
        continue;
      }
      if (box.y <= viewport.y + 2) {
        if (!bestAtTop || box.y > bestAtTop.y) {
          bestAtTop = { date, y: box.y, offsetWithinDate: viewport.y - box.y };
        }
        continue;
      }
      const distance = box.y - viewport.y;
      if (!bestBelowTop || distance < bestBelowTop.distance) {
        bestBelowTop = { date, distance, offsetWithinDate: 0 };
      }
    }

    const best = bestAtTop ?? bestBelowTop;
    if (!best) {
      throw new Error("No visible calendar day found");
    }
    return {
      date: best.date,
      offsetWithinDate: Math.round(best.offsetWithinDate)
    };
  });
}

async function verticalTopVisibleGeometry(page: Page) {
  return page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) {
      throw new Error("Calendar viewport not found");
    }

    let best: { date: string; y: number; offsetWithinDate: number; dayHeight: number; headerHeight: number } | null = null;
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'))) {
      const box = element.getBoundingClientRect();
      const date = element.dataset.date;
      if (!date || box.y > viewport.y + 2 || box.bottom <= viewport.y) {
        continue;
      }
      if (!best || box.y > best.y) {
        best = {
          date,
          y: box.y,
          offsetWithinDate: viewport.y - box.y,
          dayHeight: box.height,
          headerHeight: element.querySelector<HTMLElement>(".icv-day-header")?.getBoundingClientRect().height ?? 0
        };
      }
    }
    if (!best) {
      throw new Error("No top visible vertical day found");
    }
    return best;
  });
}

async function selectPageText(page: Page) {
  await page.evaluate(() => {
    const target = document.querySelector("main") ?? document.body;
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await expect
    .poll(async () => page.evaluate(() => window.getSelection()?.toString().length ?? 0))
    .toBeGreaterThan(0);
}

async function visibleDayDates(page: Page) {
  return page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) {
      return [];
    }

    return Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'))
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.y < viewport.bottom && box.bottom > viewport.y;
      })
      .map((element) => element.dataset.date)
      .filter((date): date is string => Boolean(date))
      .sort();
  });
}

async function verticalScrollRatio(page: Page) {
  return page.locator(".ic-viewport").evaluate((element) => {
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    return maxScrollTop <= 0 ? 0 : element.scrollTop / maxScrollTop;
  });
}

async function renderedDayOverscanFailures(page: Page, maxDistanceDays: number) {
  return page.evaluate((distanceLimit) => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) {
      return ["missing viewport"];
    }

    const dayNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]'));
    const visibleDates = dayNodes
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.bottom > viewport.top && box.top < viewport.bottom;
      })
      .map((element) => element.dataset.date)
      .filter((date): date is string => Boolean(date));
    if (visibleDates.length === 0) {
      return ["missing visible day"];
    }

    const toDayNumber = (dateKey: string) => new Date(`${dateKey}T00:00:00`).getTime() / 86_400_000;
    const visibleDayNumbers = visibleDates.map(toDayNumber);
    const firstVisibleDay = Math.min(...visibleDayNumbers);
    const lastVisibleDay = Math.max(...visibleDayNumbers);

    return dayNodes.flatMap((element) => {
      const dateKey = element.dataset.date;
      if (!dateKey) {
        return ["missing rendered day date"];
      }
      const dayNumber = toDayNumber(dateKey);
      const distance = dayNumber < firstVisibleDay ? firstVisibleDay - dayNumber : Math.max(0, dayNumber - lastVisibleDay);
      return distance > distanceLimit ? [`${dateKey}: ${distance}d`] : [];
    });
  }, maxDistanceDays);
}

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
  const afterButtonZoom = await page.getByTestId("zoom-value").textContent();
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  const scrollTopBeforeShiftWheel = await viewport.evaluate((element) => element.scrollTop);
  const scrollLeftBeforeShiftWheel = await viewport.evaluate((element) => element.scrollLeft);
  await page.evaluate(() => {
    document.body.style.minHeight = "2400px";
    window.scrollTo(0, 120);
  });
  const windowScrollBeforeShiftWheel = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  await page.mouse.move(viewportBox.x + 520, viewportBox.y + 160);
  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, -500);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("zoom-value")).not.toHaveText(afterButtonZoom ?? "");
  await expect.poll(async () => viewport.evaluate((element) => element.scrollTop)).toBe(scrollTopBeforeShiftWheel);
  await expect.poll(async () => viewport.evaluate((element) => element.scrollLeft)).toBe(scrollLeftBeforeShiftWheel);
  await expect.poll(async () => page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))).toEqual(windowScrollBeforeShiftWheel);
  await page.evaluate(() => {
    document.body.style.minHeight = "";
    window.scrollTo(0, 0);
  });

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

test("keeps the visible day when calendar count changes and supports date navigation", async ({ page }) => {
  await page.goto("/");
  const viewport = page.locator(".ic-viewport");

  await page.getByTestId("zoom-slider").fill("4");
  await page.getByTestId("jump-date-input").fill("2026-08-12");
  await page.getByTestId("jump-time-input").fill("15:30");
  await page.getByTestId("go-date-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("2026-08-12 15:30");
  await expect
    .poll(async () => topVisibleDayDate(page))
    .toBe("2026-08-12");
  await expect
    .poll(async () => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(400);

  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "3";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect
    .poll(async () => topVisibleDayDate(page))
    .toBe("2026-08-12");

  const visibleDate = await topVisibleDayDate(page);
  await viewport.evaluate((element) => {
    element.scrollTop += 90;
  });
  await page.waitForTimeout(40);
  const visibleStateBeforeCountChange = await topVisibleDayState(page);
  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "9";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect
    .poll(async () => topVisibleDayDate(page))
    .toBe(visibleDate);
  const visibleStateAfterCountChange = await topVisibleDayState(page);
  expect(visibleStateAfterCountChange.date).toBe(visibleStateBeforeCountChange.date);
  expect(Math.abs(visibleStateAfterCountChange.offsetWithinDate - visibleStateBeforeCountChange.offsetWithinDate)).toBeLessThanOrEqual(2);

  await page.getByTestId("today-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("today");
  await expect
    .poll(async () => topVisibleDayDate(page))
    .toBe(todayDateKey());
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
  await page.waitForTimeout(260);
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
  await page.waitForTimeout(260);
  const afterRecenter = await topVisibleDayState(page);

  expect(afterRecenter.date).toBe(beforeRecenter.date);
  expect(Math.abs(afterRecenter.offsetWithinDate - beforeRecenter.offsetWithinDate)).toBeLessThanOrEqual(2);
});

test("keeps the time scale fixed and day dates css-sticky", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("zoom-slider").fill("1.7");
  const viewport = page.locator(".ic-viewport");
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;

  await expect(page.getByTestId("time-scale-header")).toBeVisible();
  expect(await page.locator(".ic-day .ic-time-header").count()).toBe(0);
  expect(await page.locator(".ic-now-pin").count()).toBe(1);
  expect(await page.getByTestId("current-time-line").count()).toBeGreaterThan(1);
  expect(await page.getByTestId("current-time-day-header-line").count()).toBeGreaterThan(1);
  const referenceLineOpacity = await page.locator(".ic-now-line.is-reference").first().evaluate((element) => {
    return window.getComputedStyle(element).opacity;
  });
  expect(referenceLineOpacity).toBe("0.5");
  const referenceHeaderLineOpacity = await page.locator(".ic-now-day-header-line.is-reference").first().evaluate((element) => {
    return window.getComputedStyle(element).opacity;
  });
  expect(referenceHeaderLineOpacity).toBe("0.5");

  const topDate = await topVisibleDayDate(page);
  const timeHeaderBox = await page.getByTestId("time-scale-header").boundingBox();
  expect(timeHeaderBox).not.toBeNull();
  if (!timeHeaderBox) return;
  expect(Math.abs(timeHeaderBox.y - viewportBox.y)).toBeLessThanOrEqual(2);
  await expect(page.locator(".ic-time-tick").first()).toBeVisible();
  const firstTickAlignment = await page.locator(".ic-time-tick").first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const headerRect = element.closest(".ic-time-header")?.getBoundingClientRect();
    return headerRect ? Math.abs(rect.left - headerRect.left - Number.parseFloat((element as HTMLElement).style.left)) : Number.POSITIVE_INFINITY;
  });
  expect(firstTickAlignment).toBeLessThanOrEqual(1);

  const topDateHeader = page.locator(`[data-testid="calendar-day-header"][data-date="${topDate}"]`);
  const topDateBand = page.locator(`[data-testid="calendar-day-header-band"][data-date="${topDate}"]`);
  const topDateHeaderLine = page.locator(`[data-testid="current-time-day-header-line"][data-date="${topDate}"]`);
  await expect(topDateHeader).toBeVisible();
  await expect(topDateBand).toBeVisible();
  await expect(topDateHeaderLine).toBeVisible();
  const dateLabelBox = await topDateHeader.locator(".ic-date-label").boundingBox();
  const timelineHeaderBox = await page.locator(".ic-time-header").boundingBox();
  expect(dateLabelBox).not.toBeNull();
  expect(timelineHeaderBox).not.toBeNull();
  if (!dateLabelBox || !timelineHeaderBox) return;
  expect(timelineHeaderBox.x).toBeGreaterThanOrEqual(dateLabelBox.x + dateLabelBox.width - 1);
  const pinBeforeScroll = await page.locator(".ic-now-pin").boundingBox();
  const lineBeforeScroll = await page.locator(".ic-now-line.is-current").first().boundingBox();
  expect(pinBeforeScroll).not.toBeNull();
  expect(lineBeforeScroll).not.toBeNull();
  if (!pinBeforeScroll || !lineBeforeScroll) return;
  expect(Math.abs(pinBeforeScroll.x + pinBeforeScroll.width / 2 - (lineBeforeScroll.x + lineBeforeScroll.width / 2))).toBeLessThanOrEqual(2);
  await viewport.evaluate((element) => {
    element.scrollLeft += 60;
  });
  const pinAfterScroll = await page.locator(".ic-now-pin").boundingBox();
  const lineAfterScroll = await page.locator(".ic-now-line.is-current").first().boundingBox();
  expect(pinAfterScroll).not.toBeNull();
  expect(lineAfterScroll).not.toBeNull();
  if (!pinAfterScroll || !lineAfterScroll) return;
  expect(pinAfterScroll.x).toBeLessThan(pinBeforeScroll.x);
  expect(Math.abs(pinAfterScroll.x + pinAfterScroll.width / 2 - (lineAfterScroll.x + lineAfterScroll.width / 2))).toBeLessThanOrEqual(2);

  const headerBackground = await topDateHeader.locator(".ic-date-label").evaluate((element) => {
    return window.getComputedStyle(element).backgroundColor;
  });
  expect(headerBackground).toBe("rgb(244, 247, 251)");
  const leftLabelBorders = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".ic-shell");
    const day = document.querySelector<HTMLElement>(".ic-day");
    const dayHeader = document.querySelector<HTMLElement>(".ic-day-header");
    const dayHeaderBand = document.querySelector<HTMLElement>(".ic-day-header-band");
    const dateLabel = document.querySelector<HTMLElement>(".ic-date-label");
    const row = document.querySelector<HTMLElement>(".ic-row");
    const rowLabel = document.querySelector<HTMLElement>(".ic-row-label");
    const timeHeader = document.querySelector<HTMLElement>(".ic-time-header");
    const rowGrid = document.querySelector<HTMLElement>(".ic-row-grid");
    if (!shell || !day || !dayHeader || !dayHeaderBand || !dateLabel || !row || !rowLabel || !timeHeader || !rowGrid) {
      return null;
    }
    const shellStyles = window.getComputedStyle(shell);
    const dayStyles = window.getComputedStyle(day);
    const dayHeaderStyles = window.getComputedStyle(dayHeader);
    const dayHeaderBandStyles = window.getComputedStyle(dayHeaderBand);
    const dateStyles = window.getComputedStyle(dateLabel);
    const rowContainerStyles = window.getComputedStyle(row);
    const rowStyles = window.getComputedStyle(rowLabel);
    const timeStyles = window.getComputedStyle(timeHeader);
    const rowGridStyles = window.getComputedStyle(rowGrid);
    return {
      shellBorderColor: shellStyles.borderTopColor,
      shellBorderWidth: shellStyles.borderTopWidth,
      dayBorderBottomWidth: dayStyles.borderBottomWidth,
      dayHeaderBackgroundColor: dayHeaderStyles.backgroundColor,
      dayHeaderBandPosition: dayHeaderBandStyles.position,
      dayHeaderBandZIndex: dayHeaderBandStyles.zIndex,
      dayHeaderBandBackgroundColor: dayHeaderBandStyles.backgroundColor,
      dayHeaderBandBorderBottomColor: dayHeaderBandStyles.borderBottomColor,
      dayHeaderBandBorderBottomWidth: dayHeaderBandStyles.borderBottomWidth,
      dateBorderBottomWidth: dateStyles.borderBottomWidth,
      dateBorderRightColor: dateStyles.borderRightColor,
      dateBorderRightWidth: dateStyles.borderRightWidth,
      rowContainerBorderBottomWidth: rowContainerStyles.borderBottomWidth,
      rowBorderBottomColor: rowStyles.borderBottomColor,
      rowBorderBottomWidth: rowStyles.borderBottomWidth,
      rowBorderRightColor: rowStyles.borderRightColor,
      rowBorderRightWidth: rowStyles.borderRightWidth,
      timeBorderBottomColor: timeStyles.borderBottomColor,
      timeBorderBottomWidth: timeStyles.borderBottomWidth,
      rowGridBorderBottomColor: rowGridStyles.borderBottomColor,
      rowGridBorderBottomWidth: rowGridStyles.borderBottomWidth,
      rowGridBorderRightColor: rowGridStyles.borderRightColor,
      rowGridBorderRightWidth: rowGridStyles.borderRightWidth,
      rowGridBackgroundImage: rowGridStyles.backgroundImage,
      rowGridBackgroundPositionX: rowGridStyles.backgroundPositionX
    };
  });
  const cellBorderColor = "rgb(223, 229, 236)";
  expect(leftLabelBorders).toEqual({
    shellBorderColor: cellBorderColor,
    shellBorderWidth: "1px",
    dayBorderBottomWidth: "0px",
    dayHeaderBackgroundColor: "rgba(0, 0, 0, 0)",
    dayHeaderBandPosition: "absolute",
    dayHeaderBandZIndex: "0",
    dayHeaderBandBackgroundColor: "rgb(244, 247, 251)",
    dayHeaderBandBorderBottomColor: cellBorderColor,
    dayHeaderBandBorderBottomWidth: "1px",
    dateBorderBottomWidth: "0px",
    dateBorderRightColor: cellBorderColor,
    dateBorderRightWidth: "1px",
    rowContainerBorderBottomWidth: "0px",
    rowBorderBottomColor: cellBorderColor,
    rowBorderBottomWidth: "1px",
    rowBorderRightColor: cellBorderColor,
    rowBorderRightWidth: "1px",
    timeBorderBottomColor: cellBorderColor,
    timeBorderBottomWidth: "1px",
    rowGridBorderBottomColor: cellBorderColor,
    rowGridBorderBottomWidth: "1px",
    rowGridBorderRightColor: cellBorderColor,
    rowGridBorderRightWidth: "1px",
    rowGridBackgroundImage: expect.stringContaining(cellBorderColor),
    rowGridBackgroundPositionX: "8px"
  });
  const dayBandStyles = await topDateBand.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      backgroundColor: styles.backgroundColor,
      position: styles.position,
      pointerEvents: styles.pointerEvents,
      zIndex: styles.zIndex
    };
  });
  const timeHeaderZIndex = await page.locator(".ic-time-header").evaluate((element) => {
    return Number(window.getComputedStyle(element).zIndex);
  });
  const dateLabelZIndex = await topDateHeader.locator(".ic-date-label").evaluate((element) => {
    return Number(window.getComputedStyle(element).zIndex);
  });
  const rowLabelZIndex = await page.locator(".ic-row-label").first().evaluate((element) => {
    return Number(window.getComputedStyle(element).zIndex);
  });
  expect(dayBandStyles.backgroundColor).toBe("rgb(244, 247, 251)");
  expect(dayBandStyles.position).toBe("absolute");
  expect(dayBandStyles.pointerEvents).toBe("none");
  expect(dayBandStyles.zIndex).toBe("0");
  expect(timeHeaderZIndex).toBeGreaterThan(Number(dayBandStyles.zIndex));
  expect(dateLabelZIndex).toBeGreaterThan(rowLabelZIndex);
  expect(dateLabelZIndex).toBeGreaterThan(timeHeaderZIndex);
  const headerBandBox = await topDateBand.boundingBox();
  expect(headerBandBox).not.toBeNull();
  if (!headerBandBox) return;
  const headerLineBox = await topDateHeaderLine.boundingBox();
  expect(headerLineBox).not.toBeNull();
  if (!headerLineBox) return;
  expect(headerBandBox.width).toBeGreaterThanOrEqual(viewportBox.width - 1);
  expect(headerBandBox.x).toBeLessThanOrEqual(viewportBox.x + 1);
  expect(headerBandBox.x + headerBandBox.width).toBeGreaterThanOrEqual(viewportBox.x + viewportBox.width - 1);
  if (headerLineBox.x + headerLineBox.width >= timelineHeaderBox.x) {
    expect(headerLineBox.x).toBeGreaterThanOrEqual(timelineHeaderBox.x - 1);
  }
  expect(headerLineBox.y).toBeLessThanOrEqual(headerBandBox.y + 1);
  expect(headerLineBox.y + headerLineBox.height).toBeGreaterThanOrEqual(headerBandBox.y + headerBandBox.height - 1);
  const headerLineLayering = await topDateHeaderLine.evaluate((line) => {
    const band = document.querySelector<HTMLElement>(".ic-day-header-band");
    const dateLabel = document.querySelector<HTMLElement>(".ic-date-label");
    const timeHeader = document.querySelector<HTMLElement>(".ic-time-header");
    const zIndex = (element: Element) => {
      const parsed = Number.parseInt(window.getComputedStyle(element).zIndex || "0", 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    if (!band || !dateLabel || !timeHeader) {
      return null;
    }
    return {
      headerLineZ: zIndex(line),
      bandZ: zIndex(band),
      dateLabelZ: zIndex(dateLabel),
      timeHeaderZ: zIndex(timeHeader)
    };
  });
  expect(headerLineLayering).not.toBeNull();
  if (!headerLineLayering) return;
  expect(headerLineLayering.headerLineZ).toBeGreaterThan(headerLineLayering.bandZ);
  expect(headerLineLayering.headerLineZ).toBeGreaterThan(headerLineLayering.timeHeaderZ);
  expect(headerLineLayering.headerLineZ).toBeLessThan(headerLineLayering.dateLabelZ);
  await viewport.evaluate((element) => {
    element.scrollLeft += 420;
  });
  const horizontalStickyBox = await topDateHeader.locator(".ic-date-label").boundingBox();
  expect(horizontalStickyBox).not.toBeNull();
  if (!horizontalStickyBox) return;
  expect(Math.abs(horizontalStickyBox.x - viewportBox.x)).toBeLessThanOrEqual(2);
  const stickyLayering = await page.evaluate(() => {
    const dateLabel = document.querySelector<HTMLElement>(".ic-date-label");
    const dayHeaderBand = document.querySelector<HTMLElement>(".ic-day-header-band");
    const timeHeader = document.querySelector<HTMLElement>(".ic-time-header");
    if (!dateLabel || !dayHeaderBand || !timeHeader) {
      return null;
    }
    const dateBox = dateLabel.getBoundingClientRect();
    const timeBox = timeHeader.getBoundingClientRect();
    return {
      dateCoversTimeHeader: timeBox.left < dateBox.right,
      dayBandZ: window.getComputedStyle(dayHeaderBand).zIndex,
      dayBandPointerEvents: window.getComputedStyle(dayHeaderBand).pointerEvents,
      dateLayerZ: Number(window.getComputedStyle(dateLabel).zIndex),
      timeLayerZ: Number(window.getComputedStyle(timeHeader).zIndex),
      dateBackground: window.getComputedStyle(dateLabel).backgroundColor,
      timeHeaderClipPath: window.getComputedStyle(timeHeader).clipPath,
      clipVariable: window.getComputedStyle(timeHeader.closest(".ic-viewport") ?? timeHeader).getPropertyValue("--ic-time-header-clip-left")
    };
  });
  expect(stickyLayering).toEqual({
    dateCoversTimeHeader: true,
    dayBandZ: "0",
    dayBandPointerEvents: "none",
    dateLayerZ: expect.any(Number),
    timeLayerZ: expect.any(Number),
    dateBackground: "rgb(244, 247, 251)",
    timeHeaderClipPath: "none",
    clipVariable: ""
  });
  expect(stickyLayering?.dateLayerZ ?? 0).toBeGreaterThan(stickyLayering?.timeLayerZ ?? 0);

  const timeLabelVisibility = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport")?.getBoundingClientRect();
    const dateLabel = document.querySelector<HTMLElement>(".ic-date-label")?.getBoundingClientRect();
    const timeHeader = document.querySelector<HTMLElement>(".ic-time-header");
    const dayHeaderBand = document.querySelector<HTMLElement>(".ic-day-header-band");
    if (!viewport || !dateLabel || !timeHeader || !dayHeaderBand) {
      return null;
    }
    const visibleTick = Array.from(document.querySelectorAll<HTMLElement>(".ic-time-tick")).find((tick) => {
      const box = tick.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.left > dateLabel.right + 8 && box.left < viewport.right - 20;
    });
    if (!visibleTick) {
      return null;
    }
    return {
      text: visibleTick.textContent?.trim() ?? "",
      tickColor: window.getComputedStyle(visibleTick).color,
      tickOpacity: window.getComputedStyle(visibleTick).opacity,
      tickDisplay: window.getComputedStyle(visibleTick).display,
      tickVisibility: window.getComputedStyle(visibleTick).visibility,
      timeHeaderZ: Number(window.getComputedStyle(timeHeader).zIndex),
      dayBandZ: window.getComputedStyle(dayHeaderBand).zIndex,
      dayBandBackground: window.getComputedStyle(dayHeaderBand).backgroundColor
    };
  });
  expect(timeLabelVisibility).toEqual({
    text: expect.stringMatching(/\d+/),
    tickColor: "rgb(31, 41, 55)",
    tickOpacity: "1",
    tickDisplay: "block",
    tickVisibility: "visible",
    timeHeaderZ: expect.any(Number),
    dayBandZ: "0",
    dayBandBackground: "rgb(244, 247, 251)"
  });
  expect(timeLabelVisibility?.timeHeaderZ ?? 0).toBeGreaterThan(Number(timeLabelVisibility?.dayBandZ ?? 0));

  await viewport.evaluate((element) => {
    element.scrollTop += 80;
  });
  const stickyDateBox = await topDateHeader.boundingBox();
  expect(stickyDateBox).not.toBeNull();
  if (!stickyDateBox) return;
  expect(Math.abs(stickyDateBox.y - viewportBox.y)).toBeLessThanOrEqual(2);
  const dayHeaderPaintsAfterRows = await page.locator(`[data-testid="calendar-day"][data-date="${topDate}"]`).evaluate((element) => {
    return element.lastElementChild?.classList.contains("ic-day-header") ?? false;
  });
  expect(dayHeaderPaintsAfterRows).toBe(true);

  await page.getByTestId("zoom-slider").fill("4");
  await viewport.evaluate((element) => {
    const currentLine = document.querySelector<HTMLElement>(".ic-now-line.is-current") ?? document.querySelector<HTMLElement>(".ic-now-line");
    const rowLabel = document.querySelector<HTMLElement>(".ic-row-label");
    const rowGrid = currentLine?.closest<HTMLElement>(".ic-row-grid");
    if (!currentLine || !rowLabel || !rowGrid) {
      return;
    }
    element.scrollLeft = Math.max(
      0,
      Number.parseFloat(rowGrid.style.left) +
        Number.parseFloat(currentLine.style.left) -
        rowLabel.getBoundingClientRect().width / 2
    );
    element.dispatchEvent(new Event("scroll"));
  });

  const markerLayering = await page.evaluate(() => {
    const currentLine = document.querySelector<HTMLElement>(".ic-now-line.is-current") ?? document.querySelector<HTMLElement>(".ic-now-line");
    const rowLabel = document.querySelector<HTMLElement>(".ic-row-label");
    const rowGrid = document.querySelector<HTMLElement>(".ic-row-grid");
    const dayHeader = document.querySelector<HTMLElement>(".ic-day-header");
    const dateLabel = document.querySelector<HTMLElement>(".ic-date-label");
    const timeHeader = document.querySelector<HTMLElement>(".ic-time-header");
    const eventShell = document.querySelector<HTMLElement>('[data-testid="calendar-event"], [data-testid="availability-event"]');
    const timeTick = document.querySelector<HTMLElement>(".ic-time-tick");
    const nowPin = document.querySelector<HTMLElement>(".ic-now-pin");
    const nowHeaderLine = document.querySelector<HTMLElement>(".ic-now-header-line");
    if (!currentLine || !rowLabel || !rowGrid || !dayHeader || !dateLabel || !timeHeader || !timeTick || !nowPin || !nowHeaderLine) {
      return null;
    }

    const currentLineBox = currentLine.getBoundingClientRect();
    const rowLabelBox = rowLabel.getBoundingClientRect();
    const dateLabelBox = dateLabel.getBoundingClientRect();
    const zIndex = (element: Element) => {
      const parsed = Number.parseInt(window.getComputedStyle(element).zIndex || "0", 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    return {
      lineLeft: currentLineBox.left,
      lineRight: currentLineBox.right,
      rowLabelLeft: rowLabelBox.left,
      rowLabelRight: rowLabelBox.right,
      dateLabelRight: dateLabelBox.right,
      currentLineZ: zIndex(currentLine),
      rowLabelZ: zIndex(rowLabel),
      dateLabelZ: zIndex(dateLabel),
      rowGridZ: zIndex(rowGrid),
      eventShellZ: eventShell ? zIndex(eventShell) : 0,
      nowPinZ: zIndex(nowPin),
      nowHeaderLineZ: zIndex(nowHeaderLine),
      timeTickZ: zIndex(timeTick)
    };
  });
  expect(markerLayering).not.toBeNull();
  if (!markerLayering) return;
  if (markerLayering.lineLeft < markerLayering.rowLabelRight) {
    expect(markerLayering.lineRight).toBeGreaterThan(markerLayering.rowLabelLeft);
  }
  expect(markerLayering.currentLineZ).toBeLessThan(markerLayering.rowLabelZ);
  expect(markerLayering.currentLineZ).toBeLessThan(markerLayering.dateLabelZ);
  expect(markerLayering.currentLineZ).toBeGreaterThan(markerLayering.rowGridZ);
  expect(markerLayering.currentLineZ).toBeGreaterThan(markerLayering.eventShellZ);
  expect(markerLayering.nowPinZ).toBeLessThan(markerLayering.rowLabelZ);
  expect(markerLayering.nowHeaderLineZ).toBeLessThan(markerLayering.rowLabelZ);
  expect(markerLayering.nowPinZ).toBeGreaterThan(markerLayering.timeTickZ);
  expect(markerLayering.nowHeaderLineZ).toBeGreaterThan(markerLayering.timeTickZ);
});

test("keeps sticky labels above the timeline after high-zoom horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("zoom-slider").fill("8");
  await goToWorkday(page, "2026-07-06");

  const viewport = page.locator(".ic-viewport");
  await viewport.evaluate((element) => {
    element.scrollLeft = 900;
    element.scrollTop += 90;
    element.dispatchEvent(new Event("scroll"));
  });

  const layering = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport")?.getBoundingClientRect();
    const timeHeader = document.querySelector<HTMLElement>(".ic-time-header");
    const dayHeaderBand = document.querySelector<HTMLElement>(".ic-day-header-band");
    const rowGrid = document.querySelector<HTMLElement>(".ic-row-grid");
    if (!viewport || !timeHeader || !dayHeaderBand || !rowGrid) {
      return null;
    }
    const dateLabel = Array.from(document.querySelectorAll<HTMLElement>(".ic-date-label")).find((label) => {
      const box = label.getBoundingClientRect();
      return box.bottom > viewport.top && box.top < viewport.top + 60;
    });
    const rowLabel = Array.from(document.querySelectorAll<HTMLElement>(".ic-row-label")).find((label) => {
      const box = label.getBoundingClientRect();
      return box.top > viewport.top + 45 && box.bottom < viewport.bottom;
    });
    if (!dateLabel || !rowLabel) {
      return null;
    }

    const dateBox = dateLabel.getBoundingClientRect();
    const rowBox = rowLabel.getBoundingClientRect();
    const topAtDate = document.elementFromPoint(dateBox.left + Math.min(dateBox.width / 2, 90), dateBox.top + dateBox.height / 2);
    const topAtRowLabel = document.elementFromPoint(rowBox.left + Math.min(rowBox.width / 2, 90), rowBox.top + rowBox.height / 2);
    const visibleTick = Array.from(document.querySelectorAll<HTMLElement>(".ic-time-tick")).find((tick) => {
      const tickBox = tick.getBoundingClientRect();
      const styles = window.getComputedStyle(tick);
      return (
        tick.textContent?.trim() &&
        styles.visibility === "visible" &&
        styles.display !== "none" &&
        tickBox.left > dateBox.right + 16 &&
        tickBox.left < viewport.right - 20 &&
        tickBox.top >= viewport.top &&
        tickBox.bottom <= viewport.top + dateBox.height
      );
    });
    const tickBox = visibleTick?.getBoundingClientRect();
    const zIndex = (element: Element) => {
      const parsed = Number.parseInt(window.getComputedStyle(element).zIndex || "0", 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      dateIsStickyLeft: Math.abs(dateBox.left - viewport.left) <= 2,
      rowLabelIsStickyLeft: Math.abs(rowBox.left - viewport.left) <= 2,
      dateLayerIsTop: Boolean(topAtDate?.closest(".ic-date-label")),
      rowLabelLayerIsTop: Boolean(topAtRowLabel?.closest(".ic-row-label")),
      dateLabelZ: zIndex(dateLabel),
      rowLabelZ: zIndex(rowLabel),
      timeHeaderZ: zIndex(timeHeader),
      dayBandZ: zIndex(dayHeaderBand),
      dayBandPosition: window.getComputedStyle(dayHeaderBand).position,
      dayBandBackground: window.getComputedStyle(dayHeaderBand).backgroundColor,
      rowGridZ: zIndex(rowGrid),
      visibleTickText: visibleTick?.textContent?.trim() ?? "",
      visibleTickLeft: tickBox?.left ?? 0,
      labelRight: dateBox.right
    };
  });

  expect(layering).toEqual({
    dateIsStickyLeft: true,
    rowLabelIsStickyLeft: true,
    dateLayerIsTop: true,
    rowLabelLayerIsTop: true,
    dateLabelZ: expect.any(Number),
    rowLabelZ: expect.any(Number),
    timeHeaderZ: expect.any(Number),
    dayBandZ: 0,
    dayBandPosition: "absolute",
    dayBandBackground: "rgb(244, 247, 251)",
    rowGridZ: expect.any(Number),
    visibleTickText: expect.stringMatching(/\d+/),
    visibleTickLeft: expect.any(Number),
    labelRight: expect.any(Number)
  });
  expect(layering?.dateLabelZ ?? 0).toBeGreaterThan(layering?.timeHeaderZ ?? 0);
  expect(layering?.rowLabelZ ?? 0).toBeGreaterThan(layering?.timeHeaderZ ?? 0);
  expect(layering?.timeHeaderZ ?? 0).toBeGreaterThan(layering?.dayBandZ ?? 0);
  expect(layering?.timeHeaderZ ?? 0).toBeGreaterThan(layering?.rowGridZ ?? 0);
  expect(layering?.visibleTickLeft ?? 0).toBeGreaterThan((layering?.labelRight ?? 0) + 16);

  const dateRowOverlaps = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) {
      return ["missing viewport"];
    }

    return Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).flatMap((day) => {
      const date = day.dataset.date ?? "";
      const dateLabel = day.querySelector<HTMLElement>(".ic-date-label");
      const firstRowLabel = day.querySelector<HTMLElement>(".ic-row-label");
      if (!dateLabel || !firstRowLabel) {
        return [];
      }
      const dateBox = dateLabel.getBoundingClientRect();
      const rowBox = firstRowLabel.getBoundingClientRect();
      const isVisible = dateBox.bottom > viewport.top && dateBox.top < viewport.bottom && rowBox.bottom > viewport.top && rowBox.top < viewport.bottom;
      const isPinnedAtViewportTop = Math.abs(dateBox.top - viewport.top) <= 2;
      const overlapsFirstRow = dateBox.bottom > rowBox.top + 1;
      return isVisible && !isPinnedAtViewportTop && overlapsFirstRow ? [`${date}: ${Math.round(dateBox.bottom - rowBox.top)}px`] : [];
    });
  });
  expect(dateRowOverlaps).toEqual([]);
});

test("drops minor time labels at dense zoom levels", async ({ page }) => {
  await page.goto("/");
  const minuteLabelsAtDefaultZoom = await page.locator(".ic-time-tick:not(.is-hour)").evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim()).filter(Boolean)
  );
  expect(minuteLabelsAtDefaultZoom).toContain("30");
  expect(minuteLabelsAtDefaultZoom).not.toContain("15");
  expect(minuteLabelsAtDefaultZoom).not.toContain("45");
  await expect(page.locator(".ic-time-tick sup").first()).toHaveText("30");

  await page.getByTestId("zoom-slider").fill("2");
  const minuteLabelsAtReadableZoom = await page.locator(".ic-time-tick:not(.is-hour)").evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim()).filter(Boolean)
  );
  expect(minuteLabelsAtReadableZoom).toContain("15");
  expect(minuteLabelsAtReadableZoom).toContain("30");
  expect(minuteLabelsAtReadableZoom).toContain("45");

  await page.getByTestId("zoom-slider").fill("0.5");

  const minuteLabelsAtDenseZoom = await page.locator(".ic-time-tick:not(.is-hour)").evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim()).filter(Boolean)
  );
  expect(minuteLabelsAtDenseZoom).toEqual([]);
  await expect(page.locator(".ic-time-tick.is-hour").first()).toBeVisible();

  await page.getByTestId("zoom-slider").fill("8");
  const highZoomLabels = await page.locator(".ic-time-tick").evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim()).filter(Boolean)
  );
  expect(highZoomLabels[0]).toMatch(/^\d{1,2}$/);
  expect(highZoomLabels.slice(1, 12)).toEqual(["5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]);
});

test("lets external event renderers adapt content to short heights with CSS", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.style.position = "fixed";
    fixture.style.left = "20px";
    fixture.style.bottom = "20px";
    fixture.style.width = "120px";
    fixture.style.height = "24px";
    fixture.className = "ic-event-shell";
    fixture.innerHTML = `
      <article class="demo-event-card" data-testid="small-event-fixture">
        <strong class="demo-event-title">Long event title</strong>
        <span class="demo-event-patient">Patient Name</span>
        <span class="demo-event-time">9:00–19:30</span>
      </article>
    `;
    document.body.append(fixture);

    const iconFixture = document.createElement("div");
    iconFixture.style.position = "fixed";
    iconFixture.style.left = "160px";
    iconFixture.style.bottom = "20px";
    iconFixture.style.width = "130px";
    iconFixture.style.height = "16px";
    iconFixture.className = "ic-event-shell";
    iconFixture.innerHTML = `
      <article class="demo-event-card" data-testid="icon-event-fixture">
        <strong class="demo-event-title">
          <svg data-testid="compact-event-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h10v12H4z"></path>
          </svg>
          Phone Consultation
        </strong>
      </article>
    `;
    document.body.append(iconFixture);
  });

  const patientDisplay = await page.locator(".demo-event-patient").last().evaluate((element) => {
    return window.getComputedStyle(element).display;
  });
  const titleFontSize = await page.locator(".demo-event-title").last().evaluate((element) => {
    return window.getComputedStyle(element).fontSize;
  });
  const timeDisplay = await page.locator(".demo-event-time").last().evaluate((element) => {
    return window.getComputedStyle(element).display;
  });

  expect(patientDisplay).toBe("none");
  expect(timeDisplay).toBe("none");
  expect(Number.parseFloat(titleFontSize)).toBeLessThanOrEqual(11);

  await page.evaluate(() => {
    const fixture = document.querySelector<HTMLElement>('[data-testid="small-event-fixture"]')?.parentElement;
    if (fixture) {
      fixture.style.height = "76px";
    }
  });
  await expect(page.locator(".demo-event-time").last()).toHaveCSS("display", "flex");
  const compactIconBox = await page.getByTestId("compact-event-icon").boundingBox();
  expect(compactIconBox).not.toBeNull();
  expect(compactIconBox?.width ?? 0).toBeGreaterThanOrEqual(9);
  expect(compactIconBox?.height ?? 0).toBeGreaterThanOrEqual(9);
});

test("expands compact single-lane events on hover so renderer details fit", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("scale-select").selectOption("100");
  await goToWorkday(page);

  const compactEvent = await firstCompactSingleLaneEvent(page);
  const eventSelector = `[data-testid="calendar-event"][data-event-id="${compactEvent.id}"][data-calendar-id="${compactEvent.calendarId}"]`;
  const cardSelector = `${eventSelector} .demo-event-card`;
  await expect(page.locator(`${eventSelector} .demo-event-time`)).toHaveCSS("display", "none");
  const titleFontSizeBeforeHover = await page.locator(`${eventSelector} .demo-event-title`).evaluate((element) => {
    return window.getComputedStyle(element).fontSize;
  });
  const justifyContentBeforeHover = await page.locator(cardSelector).evaluate((element) => {
    return window.getComputedStyle(element).justifyContent;
  });

  await page.mouse.move(compactEvent.x + Math.min(20, compactEvent.width / 2), compactEvent.y + compactEvent.height / 2);
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"])`)).toBeVisible();
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"]) .demo-event-time`)).toHaveCSS("display", "flex");
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"]) .demo-event-title`)).toHaveCSS("font-size", titleFontSizeBeforeHover);
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"]) .demo-event-card`)).toHaveCSS(
    "justify-content",
    justifyContentBeforeHover
  );
  const hoveredHeight = await page.locator(`${eventSelector}:has([data-render-status="hovered"])`).evaluate((element) => {
    return element.getBoundingClientRect().height;
  });
  expect(hoveredHeight).toBeLessThanOrEqual(compactEvent.rowHeight);
  expect(hoveredHeight).toBe(compactEvent.laneHeight);
  expect(hoveredHeight).toBeGreaterThan(compactEvent.height);
});

test("expands overlapped event shells to the full row lane height on hover", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("scale-select").selectOption("20000");
  await goToWorkday(page);

  const event = await firstExpandableOverlappedEvent(page);
  const eventSelector = `[data-testid="calendar-event"][data-event-id="${event.id}"][data-calendar-id="${event.calendarId}"]`;
  await page.mouse.move(event.x + Math.min(20, event.width / 2), event.y + event.height / 2);
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"])`)).toBeVisible();

  const hoveredHeight = await page.locator(`${eventSelector}:has([data-render-status="hovered"])`).evaluate((element) => {
    return element.getBoundingClientRect().height;
  });
  expect(hoveredHeight).toBeGreaterThan(event.height);
  expect(hoveredHeight).toBeGreaterThan(event.laneHeight);
  expect(hoveredHeight).toBeCloseTo(event.rowHeight, 0);
});

test("uses card left accent borders without calendar row color strips", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  await page.waitForSelector('[data-testid="calendar-event"]');

  const rowBorderLeftWidth = await page.locator(".ic-row-label").first().evaluate((element) => {
    return window.getComputedStyle(element).borderLeftWidth;
  });
  const cardBorderWidths = await page.getByTestId("calendar-event").first().evaluate((element) => {
    const card = element.querySelector(".demo-event-card");
    if (!card) return null;
    const styles = window.getComputedStyle(card);
    return {
      left: styles.borderLeftWidth,
      top: styles.borderTopWidth
    };
  });
  const standardCardColors = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"] .demo-event-card')).find(
      (element) =>
        !element.classList.contains("kind-availability") &&
        !element.classList.contains("kind-blocked") &&
        !element.classList.contains("status-new")
    );
    if (!card) return null;
    const styles = window.getComputedStyle(card);
    const shell = card.closest<HTMLElement>(".ic-event-shell");
    const shellStyles = shell ? window.getComputedStyle(shell) : null;
    return {
      backgroundColor: styles.backgroundColor,
      borderLeftColor: styles.borderLeftColor,
      mutedAccentVariable: shellStyles?.getPropertyValue("--event-accent-muted").trim() ?? ""
    };
  });
  const eventTransitionDuration = await page.getByTestId("calendar-event").first().evaluate((element) => {
    return window.getComputedStyle(element).transitionDuration;
  });

  expect(rowBorderLeftWidth).toBe("0px");
  expect(cardBorderWidths).toEqual({ left: "6px", top: "1px" });
  expect(standardCardColors).not.toBeNull();
  if (!standardCardColors) return;
  expect(standardCardColors.backgroundColor).toBe(mutedAccentColor(standardCardColors.borderLeftColor));
  expect(standardCardColors.backgroundColor).toBe(standardCardColors.mutedAccentVariable);
  expect(eventTransitionDuration).toBe("0s");
  await expect(page.locator(".demo-event-time").first()).toContainText(/\d{1,2}:\d{2}–\d{1,2}:\d{2}/);
});

test("supports availability editing mode", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("scale-select").selectOption("5000");
  await goToWorkday(page);
  await expect(page.getByTestId("availability-event").first()).toBeVisible();
  await expect(page.getByTestId("calendar-event").first()).toBeVisible();

  const inactiveAvailabilityPointerEvents = await page.getByTestId("availability-event").first().evaluate((element) => {
    return window.getComputedStyle(element).pointerEvents;
  });
  expect(inactiveAvailabilityPointerEvents).toBe("none");

  await page.getByTestId("availability-mode").check();
  await expect(page.getByTestId("demo-message")).toContainText("Availability editing enabled");
  await expect(page.locator(".ic-availability-shell.is-active-layer").first()).toHaveCSS("pointer-events", "auto");
  await expect(page.locator(".ic-background-event-shell").first()).toHaveCSS("pointer-events", "none");

  const availabilityBeforeCreate = await page.getByTestId("availability-event").count();
  const emptyAvailabilitySpace = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;

    for (const availability of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="availability-event"]'))) {
      const row = availability.closest<HTMLElement>('[data-testid="calendar-row"]');
      const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
      if (!row || !grid) continue;
      const availabilityBox = availability.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const gridBox = grid.getBoundingClientRect();
      const isVisible = rowBox.y >= viewport.y + 90 && rowBox.bottom <= viewport.bottom;
      const hasEmptySpaceAfter = availabilityBox.right + 40 < gridBox.right;
      if (!isVisible || !hasEmptySpaceAfter) continue;

      const startX = availabilityBox.right + 24;
      return {
        startX,
        endX: startX + 30,
        y: rowBox.y + rowBox.height / 2
      };
    }
    return null;
  });
  expect(emptyAvailabilitySpace).not.toBeNull();
  if (!emptyAvailabilitySpace) return;

  await page.mouse.move(emptyAvailabilitySpace.startX, emptyAvailabilitySpace.y);
  await page.mouse.down();
  await page.mouse.move(emptyAvailabilitySpace.endX, emptyAvailabilitySpace.y);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText("Created availability");
  expect(await page.getByTestId("availability-event").count()).toBeGreaterThan(availabilityBeforeCreate);

  const availabilityBox = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    for (const availability of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="availability-event"]'))) {
      const box = availability.getBoundingClientRect();
      if (box.y >= viewport.y + 90 && box.bottom <= viewport.bottom && box.x >= viewport.x && box.x < viewport.right) {
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      }
    }
    return null;
  });
  expect(availabilityBox).not.toBeNull();
  if (!availabilityBox) return;
  await page.mouse.move(availabilityBox.x + 16, availabilityBox.y + availabilityBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(availabilityBox.x + 80, availabilityBox.y + availabilityBox.height / 2);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await expect(page.locator('[data-testid="availability-event"] [data-render-status="dragging"]').first()).toBeVisible();
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText("Availability move accepted");
});

test("focuses only the hovered row instance of a multi-calendar event", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const duplicate = await firstDuplicatedViewportEvent(page);
  const [box] = duplicate.boxes;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(180);

  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"] [data-render-status="hovered"]`)).toHaveCount(1);
});

test("does not widen hovered cards when their text already fits", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const event = page.locator('[data-testid="calendar-event"]:has-text("PRP Treatment")').first();
  await expect(event).toBeVisible();
  const before = await event.boundingBox();
  expect(before).not.toBeNull();
  if (!before) return;

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.waitForTimeout(180);
  const after = await event.boundingBox();
  expect(after).not.toBeNull();
  if (!after) return;

  expect(Math.round(after.width)).toBe(Math.round(before.width));
});

test("keeps overflowing hovered cards expanded without width oscillation", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  await page.waitForSelector('[data-testid="calendar-event"]');
  const overflowingBox = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const safeTop = viewport.y + 92;

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const box = element.getBoundingClientRect();
      if (box.y < safeTop || box.y + box.height > viewport.y + viewport.height) {
        continue;
      }
      const hasOverflow = Array.from(element.querySelectorAll<HTMLElement>("*")).some(
        (child) => child.scrollWidth > child.clientWidth + 1
      );
      if (hasOverflow && box.width < 250) {
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      }
    }

    return null;
  });
  expect(overflowingBox).not.toBeNull();
  if (!overflowingBox) return;

  await page.mouse.move(overflowingBox.x + 4, overflowingBox.y + overflowingBox.height / 2);
  await page.waitForTimeout(180);
  const expandedWidth = await page
    .locator('[data-render-status="hovered"]')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  await page.waitForTimeout(360);
  const laterWidth = await page
    .locator('[data-render-status="hovered"]')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);

  expect(expandedWidth).toBeGreaterThan(overflowingBox.width);
  expect(Math.round(laterWidth)).toBe(Math.round(expandedWidth));
});

test("allows already-wide hovered cards to use a wider max width", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.style.position = "fixed";
    fixture.style.left = "20px";
    fixture.style.bottom = "70px";
    fixture.style.width = "320px";
    fixture.style.height = "44px";
    fixture.style.setProperty("--event-width", "320px");
    fixture.style.setProperty("--event-hover-width", "420px");
    fixture.className = "ic-event-shell is-hovered";
    fixture.innerHTML = `
      <article class="demo-event-card" data-testid="wide-hover-fixture">
        <strong class="demo-event-title">Very long appointment title that can use the wider cap</strong>
      </article>
    `;
    document.body.append(fixture);
  });

  const width = await page.getByTestId("wide-hover-fixture").evaluate((element) => {
    return element.getBoundingClientRect().width;
  });

  expect(width).toBeGreaterThan(250);
});

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
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText("Created new event");
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
  await expect(page.locator('[data-testid="calendar-event"]:has-text("New appointment")')).toBeVisible();
  expect(await page.getByTestId("calendar-event").count()).toBeGreaterThan(initialEventCount);
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

  const beforeGestureZoomIn = await verticalTopVisibleGeometry(page);
  await page.mouse.move(viewportBox.x + 520, viewportBox.y + 180);
  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, -500);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("zoom-value")).toHaveText("0.65");
  await expect.poll(async () => topVisibleDayDate(page)).toBe(beforeGestureZoomIn.date);
  const afterGestureZoomIn = await verticalTopVisibleGeometry(page);
  const expectedZoomInOffset =
    afterGestureZoomIn.headerHeight +
    ((beforeGestureZoomIn.offsetWithinDate - beforeGestureZoomIn.headerHeight) /
      Math.max(1, beforeGestureZoomIn.dayHeight - beforeGestureZoomIn.headerHeight)) *
      Math.max(1, afterGestureZoomIn.dayHeight - afterGestureZoomIn.headerHeight);
  expect(Math.abs(afterGestureZoomIn.offsetWithinDate - expectedZoomInOffset)).toBeLessThanOrEqual(4);

  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, 500);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("zoom-value")).toHaveText("0.50");
  await expect.poll(async () => topVisibleDayDate(page)).toBe(beforeGestureZoomIn.date);
  const afterGestureZoomOut = await verticalTopVisibleGeometry(page);
  const expectedZoomOutOffset =
    afterGestureZoomOut.headerHeight +
    ((afterGestureZoomIn.offsetWithinDate - afterGestureZoomIn.headerHeight) /
      Math.max(1, afterGestureZoomIn.dayHeight - afterGestureZoomIn.headerHeight)) *
      Math.max(1, afterGestureZoomOut.dayHeight - afterGestureZoomOut.headerHeight);
  expect(Math.abs(afterGestureZoomOut.offsetWithinDate - expectedZoomOutOffset)).toBeLessThanOrEqual(4);
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
  await expect(page.getByTestId("demo-message")).toContainText("Created new event");

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
