import { expect, test } from "@playwright/test";
import {
  firstCompactSingleLaneEvent,
  firstExpandableOverlappedEvent,
  firstDuplicatedViewportEvent,
  goToWorkday,
  mutedAccentColor,
  setDemoZoom
} from "../helpers";

test("drops minor time labels at dense zoom levels", async ({ page }) => {
  await page.goto("/");
  const minuteLabelsAtDefaultZoom = await page.locator(".ic-time-tick:not(.is-hour)").evaluateAll((elements) =>
    elements
      .filter((element) => element.getAttribute("aria-hidden") !== "true")
      .map((element) => element.textContent?.trim())
      .filter(Boolean)
  );
  expect(minuteLabelsAtDefaultZoom).toContain("30");
  expect(minuteLabelsAtDefaultZoom).not.toContain("15");
  expect(minuteLabelsAtDefaultZoom).not.toContain("45");
  await expect(page.locator('.ic-time-tick:not([aria-hidden="true"]) sup').first()).toHaveText("30");

  await setDemoZoom(page, 2);
  const minuteLabelsAtReadableZoom = await page.locator(".ic-time-tick:not(.is-hour)").evaluateAll((elements) =>
    elements
      .filter((element) => element.getAttribute("aria-hidden") !== "true")
      .map((element) => element.textContent?.trim())
      .filter(Boolean)
  );
  expect(minuteLabelsAtReadableZoom).toContain("15");
  expect(minuteLabelsAtReadableZoom).toContain("30");
  expect(minuteLabelsAtReadableZoom).toContain("45");

  await setDemoZoom(page, 0.5);

  const minuteLabelsAtDenseZoom = await page.locator(".ic-time-tick:not(.is-hour)").evaluateAll((elements) =>
    elements
      .filter((element) => element.getAttribute("aria-hidden") !== "true")
      .map((element) => element.textContent?.trim())
      .filter(Boolean)
  );
  expect(minuteLabelsAtDenseZoom).toContain("30");
  expect(minuteLabelsAtDenseZoom).not.toContain("15");
  expect(minuteLabelsAtDenseZoom).not.toContain("45");
  await expect(page.locator(".ic-time-tick.is-hour").first()).toBeVisible();

  await setDemoZoom(page, 8);
  const highZoomLabels = await page.locator(".ic-time-tick").evaluateAll((elements) =>
    elements
      .filter((element) => element.getAttribute("aria-hidden") !== "true")
      .map((element) => element.textContent?.trim())
      .filter(Boolean)
  );
  expect(highZoomLabels[0]).toMatch(/^\d{1,2}$/);
  expect(highZoomLabels.slice(1, 12)).toEqual(["5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]);

  await setDemoZoom(page, 5.9);
  const stableTickCount = await page.locator(".ic-time-tick").count();
  await page.locator(".ic-time-tick").evaluateAll((ticks) => {
    ticks.forEach((tick) => tick.setAttribute("data-stable-tick", "true"));
  });
  await page.locator(".ic-time-tick-track").evaluate((track) => {
    const state = window as typeof window & { tickChildMutations?: number; tickObserver?: MutationObserver };
    state.tickChildMutations = 0;
    state.tickObserver = new MutationObserver((records) => {
      state.tickChildMutations =
        (state.tickChildMutations ?? 0) + records.filter((record) => record.type === "childList").length;
    });
    state.tickObserver.observe(track, { childList: true, subtree: true });
  });
  await setDemoZoom(page, 6.1);
  await expect(page.locator(".ic-time-tick")).toHaveCount(stableTickCount);
  await expect(page.locator('.ic-time-tick[data-stable-tick="true"]')).toHaveCount(stableTickCount);
  expect(
    await page.evaluate(() => {
      const state = window as typeof window & { tickChildMutations?: number; tickObserver?: MutationObserver };
      state.tickObserver?.disconnect();
      return state.tickChildMutations ?? -1;
    })
  ).toBe(0);
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

  const patientDisplay = await page
    .locator(".demo-event-patient")
    .last()
    .evaluate((element) => {
      return window.getComputedStyle(element).display;
    });
  const titleFontSize = await page
    .locator(".demo-event-title")
    .last()
    .evaluate((element) => {
      return window.getComputedStyle(element).fontSize;
    });
  const timeDisplay = await page
    .locator(".demo-event-time")
    .last()
    .evaluate((element) => {
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

  await page.mouse.move(
    compactEvent.x + Math.min(20, compactEvent.width / 2),
    compactEvent.y + compactEvent.height / 2
  );
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"])`)).toBeVisible();
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"]) .demo-event-time`)).toHaveCSS(
    "display",
    "flex"
  );
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"]) .demo-event-title`)).toHaveCSS(
    "font-size",
    titleFontSizeBeforeHover
  );
  await expect(page.locator(`${eventSelector}:has([data-render-status="hovered"]) .demo-event-card`)).toHaveCSS(
    "justify-content",
    justifyContentBeforeHover
  );
  const hoveredHeight = await page
    .locator(`${eventSelector}:has([data-render-status="hovered"])`)
    .evaluate((element) => {
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

  const hoveredHeight = await page
    .locator(`${eventSelector}:has([data-render-status="hovered"])`)
    .evaluate((element) => {
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

  const rowBorderLeftWidth = await page
    .locator(".ic-row-label")
    .first()
    .evaluate((element) => {
      return window.getComputedStyle(element).borderLeftWidth;
    });
  const cardBorderWidths = await page
    .getByTestId("calendar-event")
    .first()
    .evaluate((element) => {
      const card = element.querySelector(".demo-event-card");
      if (!card) return null;
      const styles = window.getComputedStyle(card);
      return {
        left: styles.borderLeftWidth,
        top: styles.borderTopWidth
      };
    });
  const standardCardColors = await page.evaluate(() => {
    const card = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"] .demo-event-card')
    ).find(
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
  const eventTransitionDuration = await page
    .getByTestId("calendar-event")
    .first()
    .evaluate((element) => {
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

  const inactiveAvailabilityPointerEvents = await page
    .getByTestId("availability-event")
    .first()
    .evaluate((element) => {
      return window.getComputedStyle(element).pointerEvents;
    });
  expect(inactiveAvailabilityPointerEvents).toBe("none");

  await page.getByTestId("availability-mode").check();
  await expect(page.getByTestId("demo-message")).toContainText("Availability editing enabled");
  await expect(page.locator(".ic-availability-shell.is-active-layer").first()).toHaveCSS("pointer-events", "auto");
  await expect(page.locator(".ic-background-event-shell").first()).toHaveCSS("pointer-events", "none");

  const emptyAvailabilitySpace = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;

    for (const availability of Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="availability-event"]')
    )) {
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
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await page.getByTestId("draft-title-input").fill("Popup availability");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("Saved external create");
  await expect(page.locator('[data-testid="availability-event"]:has-text("Popup availability")')).toBeVisible();

  const availabilityBox = await page.evaluate(() => {
    const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    for (const availability of Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="availability-event"]')
    )) {
      const row = availability.closest<HTMLElement>('[data-testid="calendar-row"]');
      const grid = row?.querySelector<HTMLElement>(".ic-row-grid");
      const label = row?.querySelector<HTMLElement>(".ic-row-label");
      const box = availability.getBoundingClientRect();
      const gridBox = grid?.getBoundingClientRect();
      const labelBox = label?.getBoundingClientRect();
      if (!grid || !gridBox || !labelBox) continue;
      const x = Math.max(box.left, gridBox.left, labelBox.right) + 16;
      const y = box.y + box.height / 2;
      const target = document.elementFromPoint(x, y) as HTMLElement | null;
      if (
        box.y >= viewport.y + 90 &&
        box.bottom <= viewport.bottom &&
        x + 64 < Math.min(box.right, viewport.right) &&
        target?.closest('[data-testid="availability-event"]') === availability &&
        target.closest(".ic-row-grid") === grid
      ) {
        return { x, y: box.y, width: box.width, height: box.height };
      }
    }
    return null;
  });
  expect(availabilityBox).not.toBeNull();
  if (!availabilityBox) return;
  await page.mouse.move(availabilityBox.x, availabilityBox.y + availabilityBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(availabilityBox.x + 64, availabilityBox.y + availabilityBox.height / 2);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await expect(
    page.locator('[data-testid="availability-event"] [data-render-status="dragging"]').first()
  ).toBeVisible();
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

  await expect(
    page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"] [data-render-status="hovered"]`)
  ).toHaveCount(1);
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
