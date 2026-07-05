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

test("renders, scrolls vertically, zooms, and changes dataset scale", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("infinite-calendar")).toBeVisible();
  await goToWorkday(page);
  await firstViewportEventBox(page);
  await expect(page.getByTestId("stat-frame-ms")).toContainText(/\d+\.\d ms/);
  await expect
    .poll(async () => {
      const text = await page.getByTestId("stat-visible-events").textContent();
      return Number.parseInt(text?.replace(/,/g, "") ?? "0", 10);
    })
    .toBeGreaterThan(0);

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

  const beforeZoom = await page.getByTestId("zoom-value").textContent();
  await page.getByTestId("zoom-slider").fill("2");
  await expect(page.getByTestId("zoom-value")).not.toHaveText(beforeZoom ?? "");
  await expect(page.getByTestId("zoom-value")).toHaveText("2.00");
  await page.getByTestId("zoom-slider").fill("8");
  await expect(page.getByTestId("zoom-value")).toHaveText("8.00");
  await expect(page.getByTestId("calendar-row").first().locator(".ic-row-grid")).toHaveCSS("background-size", "40px 100%");
  await page.getByTestId("zoom-slider").fill("6");
  await expect(page.getByTestId("calendar-row").first().locator(".ic-row-grid")).toHaveCSS("background-size", "90px 100%");
  await page.getByTestId("zoom-slider").fill("0.5");
  await expect(page.getByTestId("zoom-value")).toHaveText("0.50");
  const afterButtonZoom = await page.getByTestId("zoom-value").textContent();
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  const scrollTopBeforeShiftWheel = await viewport.evaluate((element) => element.scrollTop);
  await page.mouse.move(viewportBox.x + 520, viewportBox.y + 160);
  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, -500);
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("zoom-value")).not.toHaveText(afterButtonZoom ?? "");
  await expect.poll(async () => viewport.evaluate((element) => element.scrollTop)).toBe(scrollTopBeforeShiftWheel);

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

  const bottomLaneEvent = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const row = element.closest<HTMLElement>('[data-testid="calendar-row"]');
      if (!row) continue;
      const box = element.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const isVisible = box.y >= viewport.y + 92 && box.y + box.height <= viewport.bottom && box.x >= viewport.x && box.x < viewport.right;
      const isBottomLane = rowBox.bottom - (box.y + box.height) <= 12 || box.y > rowBox.y + rowBox.height / 2;
      const canExpand = box.height < rowBox.height / 2;
      if (isVisible && isBottomLane && canExpand) {
        return { id: element.dataset.eventId, x: box.x, y: box.y, width: box.width, height: box.height };
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
    expect(expandedHeight).toBeGreaterThan(bottomLaneEvent.height * 2);
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

  await page.getByTestId("jump-date-input").fill("2026-08-12");
  await page.getByTestId("go-date-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("2026-08-12");
  await expect
    .poll(async () => topVisibleDayDate(page))
    .toBe("2026-08-12");

  const visibleDate = await topVisibleDayDate(page);
  await viewport.evaluate((element) => {
    element.scrollTop += 90;
  });
  await page.getByTestId("calendar-count").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "9";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect
    .poll(async () => topVisibleDayDate(page))
    .toBe(visibleDate);

  await page.getByTestId("today-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("today");
  await expect
    .poll(async () => topVisibleDayDate(page))
    .toBe("2026-07-04");
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
  const referenceLineOpacity = await page.locator(".ic-now-line.is-reference").first().evaluate((element) => {
    return window.getComputedStyle(element).opacity;
  });
  expect(referenceLineOpacity).toBe("0.5");

  const topDate = await topVisibleDayDate(page);
  const timeHeaderBox = await page.getByTestId("time-scale-header").boundingBox();
  expect(timeHeaderBox).not.toBeNull();
  if (!timeHeaderBox) return;
  expect(Math.abs(timeHeaderBox.y - viewportBox.y)).toBeLessThanOrEqual(2);
  await expect(page.locator(".ic-time-tick").first()).toBeVisible();

  const topDateHeader = page.locator(`[data-testid="calendar-day-header"][data-date="${topDate}"]`);
  await expect(topDateHeader).toBeVisible();
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
  const headerBandBox = await topDateHeader.boundingBox();
  expect(headerBandBox).not.toBeNull();
  if (!headerBandBox) return;
  expect(headerBandBox.width).toBeGreaterThanOrEqual(viewportBox.width - 1);
  await viewport.evaluate((element) => {
    element.scrollLeft += 420;
  });
  const horizontalStickyBox = await topDateHeader.locator(".ic-date-label").boundingBox();
  expect(horizontalStickyBox).not.toBeNull();
  if (!horizontalStickyBox) return;
  expect(Math.abs(horizontalStickyBox.x - viewportBox.x)).toBeLessThanOrEqual(2);

  await viewport.evaluate((element) => {
    element.scrollTop += 80;
  });
  const stickyDateBox = await topDateHeader.boundingBox();
  expect(stickyDateBox).not.toBeNull();
  if (!stickyDateBox) return;
  expect(Math.abs(stickyDateBox.y - viewportBox.y)).toBeLessThanOrEqual(2);
});

test("drops minor time labels at dense zoom levels", async ({ page }) => {
  await page.goto("/");
  const minuteLabelsAtDefaultZoom = await page.locator(".ic-time-tick:not(.is-hour)").evaluateAll((elements) =>
    elements.map((element) => element.textContent?.trim()).filter(Boolean)
  );
  expect(minuteLabelsAtDefaultZoom).toContain("15");
  expect(minuteLabelsAtDefaultZoom).toContain("30");
  expect(minuteLabelsAtDefaultZoom).toContain("45");

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
  const eventTransitionDuration = await page.getByTestId("calendar-event").first().evaluate((element) => {
    return window.getComputedStyle(element).transitionDuration;
  });

  expect(rowBorderLeftWidth).toBe("0px");
  expect(cardBorderWidths).toEqual({ left: "6px", top: "1px" });
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
      const hasEmptySpaceAfter = availabilityBox.right + 160 < gridBox.right;
      if (!isVisible || !hasEmptySpaceAfter) continue;

      const startX = availabilityBox.right + 24;
      return {
        startX,
        endX: startX + 120,
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

  await page.mouse.move(box.x + 310, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 650, box.y + 90);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await expect
    .poll(async () => {
      const draftBox = await page.getByTestId("draft-event").boundingBox();
      return draftBox?.width ?? 0;
    })
    .toBeGreaterThan(250);
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText("Created new event");
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
  await expect(page.locator('[data-testid="calendar-event"]:has-text("New appointment")')).toBeVisible();
  expect(await page.getByTestId("calendar-event").count()).toBeGreaterThan(initialEventCount);
});

test("does not start event creation from calendar labels", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const labelBox = await page.locator(".ic-row-label").first().boundingBox();
  expect(labelBox).not.toBeNull();
  if (!labelBox) return;

  await page.mouse.move(labelBox.x + 20, labelBox.y + 20);
  await page.mouse.down();
  await page.mouse.move(labelBox.x + 80, labelBox.y + 20);
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).not.toContainText("Created new event");
});

test("supports dragging an event to another time", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const initialEventCount = await page.getByTestId("calendar-event").count();
  const duplicate = await firstDuplicatedViewportEvent(page);
  const [box] = duplicate.boxes;

  await page.mouse.move(box.x + 12, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(box.x + 110, box.y + 12);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"] [data-render-status="dragging"]`)).toHaveCount(
    duplicate.boxes.length
  );
  expect(await page.getByTestId("drag-preview-event").count()).toBeGreaterThanOrEqual(duplicate.boxes.length);
  await expect(page.locator('[data-render-status="dragging"]').first()).toHaveCSS("opacity", "0.5");
  await expect(page.locator(".ic-viewport")).toHaveCSS("user-select", "none");
  expect(await page.locator('[data-render-status="hovered"]').count()).toBe(0);
  expect(await page.getByTestId("calendar-event").count()).toBe(initialEventCount);
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText(/Move accepted|Move rejected/);
});
