import { expect, type Page } from "@playwright/test";

export async function waitForDemoEvents(page: Page) {
  await expect(page.getByTestId("calendar-event").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("api-loading-status")).toHaveText("API idle", { timeout: 10_000 });
}

export async function firstViewportEventBox(page: Page) {
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

export async function goToWorkday(page: Page, date = "2026-07-06") {
  await page.getByTestId("jump-date-input").fill(date);
  await page.getByTestId("go-date-button").click();
  await expect
    .poll(async () => {
      try {
        return await topVisibleDayDate(page);
      } catch {
        return null;
      }
    })
    .toBe(date);
}

type HorizontalDrawTargetOptions = {
  calendarId?: string;
  dateKey?: string;
  distance?: number;
};

/** Finds empty, visibly exposed timeline grid space instead of sticky chrome or an event card. */
export async function horizontalDrawTarget(page: Page, options: HorizontalDrawTargetOptions = {}) {
  const daySelector = options.dateKey ? `[data-testid="calendar-day"][data-date="${options.dateKey}"] ` : "";
  const calendarSelector = options.calendarId ? `[data-calendar-id="${options.calendarId}"]` : "";
  const rowSelector = `${daySelector}[data-testid="calendar-row"]${calendarSelector}`;
  await expect.poll(async () => page.locator(rowSelector).count()).toBeGreaterThan(0);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );
  const target = await page.evaluate(({ calendarId, dateKey, distance = 120 }) => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    if (!viewport) return null;
    const viewportBox = viewport.getBoundingClientRect();
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-row"]'));

    for (const row of rows) {
      const day = row.closest<HTMLElement>('[data-testid="calendar-day"]');
      if (calendarId && row.dataset.calendarId !== calendarId) continue;
      if (dateKey && day?.dataset.date !== dateKey) continue;

      const grid = row.querySelector<HTMLElement>(".ic-row-grid");
      const label = row.querySelector<HTMLElement>(".ic-row-label");
      if (!grid || !label) continue;
      const rowBox = row.getBoundingClientRect();
      const gridBox = grid.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const left = Math.max(gridBox.left, labelBox.right, viewportBox.left) + 8;
      const right = Math.min(gridBox.right, viewportBox.right) - 8;
      if (rowBox.bottom <= viewportBox.top + 80 || rowBox.top >= viewportBox.bottom || right - left < distance)
        continue;

      const visibleTop = Math.max(rowBox.top, viewportBox.top + 80) + 8;
      const visibleBottom = Math.min(rowBox.bottom, viewportBox.bottom) - 8;
      const centerY = Math.min(visibleBottom, Math.max(visibleTop, rowBox.top + rowBox.height / 2));
      const yCandidates = [centerY];
      for (let y = visibleTop; y < visibleBottom; y += 8) {
        if (Math.abs(y - centerY) > 4) yCandidates.push(y);
      }
      for (const y of yCandidates) {
        for (let x = left; x + distance <= right; x += 8) {
          const pointElement = document.elementFromPoint(x, y) as HTMLElement | null;
          if (pointElement?.closest(".ic-row-grid") === grid && !pointElement.closest("[data-event-id]")) {
            return { startX: x, endX: x + distance, y };
          }
        }
      }
    }
    return null;
  }, options);

  if (!target) {
    throw new Error("No visible empty horizontal timeline grid space found");
  }
  return target;
}

export async function viewportRelativeEventBox(page: Page, selector: string, textIncludes?: string) {
  return page.evaluate(
    ({ eventSelector, text }) => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      if (!viewport) {
        return null;
      }
      const viewportBox = viewport.getBoundingClientRect();
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(eventSelector)).filter(
        (candidate) => !text || candidate.textContent?.includes(text)
      );
      const element =
        candidates.find((candidate) => {
          const box = candidate.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.height > 0 &&
            box.right > viewportBox.left &&
            box.left < viewportBox.right &&
            box.bottom > viewportBox.top &&
            box.top < viewportBox.bottom
          );
        }) ?? candidates[0];
      if (!element) {
        return null;
      }
      const eventBox = element.getBoundingClientRect();
      return {
        x: eventBox.left - viewportBox.left,
        y: eventBox.top - viewportBox.top,
        width: eventBox.width,
        height: eventBox.height
      };
    },
    { eventSelector: selector, text: textIncludes }
  );
}

export function todayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mutedAccentColor(accentColor: string) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(accentColor);
  if (!match) {
    throw new Error(`Unsupported CSS color: ${accentColor}`);
  }
  const [, red, green, blue] = match.map(Number);
  const mix = 0.14;
  const blend = (channel: number) => Math.round(channel * mix + 255 * (1 - mix));
  return `rgb(${blend(red)}, ${blend(green)}, ${blend(blue)})`;
}

export async function firstViewportEventForPrefix(page: Page, prefix: string) {
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

export async function firstCompactSingleLaneEvent(page: Page) {
  await page.waitForSelector('[data-testid="calendar-event"][data-lane-count="1"]');
  const eventBox = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const safeTop = viewport.y + 92;

    for (const element of Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"][data-lane-count="1"]')
    )) {
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

export async function firstExpandableOverlappedEvent(page: Page) {
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

export async function firstDuplicatedViewportEvent(page: Page) {
  await page.waitForSelector('[data-testid="calendar-event"]');
  const duplicate = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const safeTop = viewport.y + 92;

    const groups = new Map<
      string,
      { id: string; boxes: { x: number; y: number; width: number; height: number; calendarId: string }[] }
    >();
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))) {
      const id = element.dataset.eventId;
      const box = element.getBoundingClientRect();
      if (
        !id ||
        box.y < safeTop ||
        box.y + box.height > viewport.y + viewport.height ||
        box.x < viewport.x ||
        box.x > viewport.right
      ) {
        continue;
      }
      const group = groups.get(id) ?? { id, boxes: [] };
      group.boxes.push({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        calendarId: element.dataset.calendarId ?? ""
      });
      groups.set(id, group);
    }

    const duplicates = Array.from(groups.values()).filter((group) => group.boxes.length > 1);
    return (
      duplicates.find((group) => group.boxes.some((box) => !box.calendarId.includes("room"))) ?? duplicates[0] ?? null
    );
  });

  if (!duplicate) {
    throw new Error("No visible duplicated event found");
  }
  return duplicate;
}

export async function topVisibleDayDate(page: Page) {
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

export async function topVisibleDayState(page: Page) {
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

export async function verticalTopVisibleGeometry(page: Page) {
  return page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) {
      throw new Error("Calendar viewport not found");
    }

    let best: { date: string; y: number; offsetWithinDate: number; dayHeight: number; headerHeight: number } | null =
      null;
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

export async function selectPageText(page: Page) {
  await page.evaluate(() => {
    const target = document.querySelector("main") ?? document.body;
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await expect.poll(async () => page.evaluate(() => window.getSelection()?.toString().length ?? 0)).toBeGreaterThan(0);
}

export async function visibleDayDates(page: Page) {
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

export async function verticalScrollRatio(page: Page) {
  return page.locator(".ic-viewport").evaluate((element) => {
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    return maxScrollTop <= 0 ? 0 : element.scrollTop / maxScrollTop;
  });
}

export async function renderedDayOverscanFailures(page: Page, maxDistanceDays: number) {
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
      const distance =
        dayNumber < firstVisibleDay ? firstVisibleDay - dayNumber : Math.max(0, dayNumber - lastVisibleDay);
      return distance > distanceLimit ? [`${dateKey}: ${distance}d`] : [];
    });
  }, maxDistanceDays);
}
