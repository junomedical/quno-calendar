import { expect, test } from "@playwright/test";
import { goToWorkday, mutedAccentColor, topVisibleDayDate } from "../helpers";

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
  const referenceLineOpacity = await page
    .locator(".ic-now-line.is-reference")
    .first()
    .evaluate((element) => {
      return window.getComputedStyle(element).opacity;
    });
  expect(referenceLineOpacity).toBe("0.5");
  const referenceHeaderLineOpacity = await page
    .locator(".ic-now-day-header-line.is-reference")
    .first()
    .evaluate((element) => {
      return window.getComputedStyle(element).opacity;
    });
  expect(referenceHeaderLineOpacity).toBe("0.5");

  const topDate = await topVisibleDayDate(page);
  const timeHeaderBox = await page.getByTestId("time-scale-header").boundingBox();
  expect(timeHeaderBox).not.toBeNull();
  if (!timeHeaderBox) return;
  expect(Math.abs(timeHeaderBox.y - viewportBox.y)).toBeLessThanOrEqual(2);
  await expect(page.locator(".ic-time-tick").first()).toBeVisible();
  const firstTickAlignment = await page
    .locator(".ic-time-tick")
    .first()
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const headerRect = element.closest(".ic-time-header")?.getBoundingClientRect();
      return headerRect
        ? Math.abs(rect.left - headerRect.left - Number.parseFloat((element as HTMLElement).style.left))
        : Number.POSITIVE_INFINITY;
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
  expect(
    Math.abs(pinBeforeScroll.x + pinBeforeScroll.width / 2 - (lineBeforeScroll.x + lineBeforeScroll.width / 2))
  ).toBeLessThanOrEqual(2);
  await viewport.evaluate((element) => {
    element.scrollLeft += 60;
  });
  const pinAfterScroll = await page.locator(".ic-now-pin").boundingBox();
  const lineAfterScroll = await page.locator(".ic-now-line.is-current").first().boundingBox();
  expect(pinAfterScroll).not.toBeNull();
  expect(lineAfterScroll).not.toBeNull();
  if (!pinAfterScroll || !lineAfterScroll) return;
  expect(pinAfterScroll.x).toBeLessThan(pinBeforeScroll.x);
  expect(
    Math.abs(pinAfterScroll.x + pinAfterScroll.width / 2 - (lineAfterScroll.x + lineAfterScroll.width / 2))
  ).toBeLessThanOrEqual(2);

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
  const rowLabelZIndex = await page
    .locator(".ic-row-label")
    .first()
    .evaluate((element) => {
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
      clipVariable: window
        .getComputedStyle(timeHeader.closest(".ic-viewport") ?? timeHeader)
        .getPropertyValue("--ic-time-header-clip-left")
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
  const dayHeaderPaintsAfterRows = await page
    .locator(`[data-testid="calendar-day"][data-date="${topDate}"]`)
    .evaluate((element) => {
      return element.lastElementChild?.classList.contains("ic-day-header") ?? false;
    });
  expect(dayHeaderPaintsAfterRows).toBe(true);

  await page.getByTestId("zoom-slider").fill("4");
  await viewport.evaluate((element) => {
    const currentLine =
      document.querySelector<HTMLElement>(".ic-now-line.is-current") ??
      document.querySelector<HTMLElement>(".ic-now-line");
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
    const currentLine =
      document.querySelector<HTMLElement>(".ic-now-line.is-current") ??
      document.querySelector<HTMLElement>(".ic-now-line");
    const rowLabel = document.querySelector<HTMLElement>(".ic-row-label");
    const rowGrid = document.querySelector<HTMLElement>(".ic-row-grid");
    const dayHeader = document.querySelector<HTMLElement>(".ic-day-header");
    const dateLabel = document.querySelector<HTMLElement>(".ic-date-label");
    const timeHeader = document.querySelector<HTMLElement>(".ic-time-header");
    const eventShell = document.querySelector<HTMLElement>(
      '[data-testid="calendar-event"], [data-testid="availability-event"]'
    );
    const timeTick = document.querySelector<HTMLElement>(".ic-time-tick");
    const nowPin = document.querySelector<HTMLElement>(".ic-now-pin");
    const nowHeaderLine = document.querySelector<HTMLElement>(".ic-now-header-line");
    if (
      !currentLine ||
      !rowLabel ||
      !rowGrid ||
      !dayHeader ||
      !dateLabel ||
      !timeHeader ||
      !timeTick ||
      !nowPin ||
      !nowHeaderLine
    ) {
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
    const topAtDate = document.elementFromPoint(
      dateBox.left + Math.min(dateBox.width / 2, 90),
      dateBox.top + dateBox.height / 2
    );
    const topAtRowLabel = document.elementFromPoint(
      rowBox.left + Math.min(rowBox.width / 2, 90),
      rowBox.top + rowBox.height / 2
    );
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
      const isVisible =
        dateBox.bottom > viewport.top &&
        dateBox.top < viewport.bottom &&
        rowBox.bottom > viewport.top &&
        rowBox.top < viewport.bottom;
      const isPinnedAtViewportTop = Math.abs(dateBox.top - viewport.top) <= 2;
      const overlapsFirstRow = dateBox.bottom > rowBox.top + 1;
      return isVisible && !isPinnedAtViewportTop && overlapsFirstRow
        ? [`${date}: ${Math.round(dateBox.bottom - rowBox.top)}px`]
        : [];
    });
  });
  expect(dateRowOverlaps).toEqual([]);
});
