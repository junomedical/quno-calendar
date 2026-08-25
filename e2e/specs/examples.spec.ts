import { expect, test, type Page } from "@playwright/test";

async function revealLazyArticleDemo(page: Page, label: string, testId: string) {
  const lazyRoot = page.locator(`.article-lazy-demo[data-demo-label="${label}"]`);
  await lazyRoot.evaluate((element) => {
    const article = element.closest<HTMLElement>(".calendar-article");
    if (article) article.style.scrollBehavior = "auto";
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
  const demo = page.getByTestId(testId);
  await expect(demo).toBeVisible();
  return demo;
}

test("legacy guides redirect to the infinite-calendar field guide", async ({ page }) => {
  for (const route of ["/story", "/examples/integration-walkthrough"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/guide\/infinite-calendar$/);
    await expect(
      page.getByRole("heading", { name: "A simple, fast calendar for businesses with complex schedules." })
    ).toBeVisible();
  }
});

test("date range field guide keeps picker geometry stable", async ({ page }) => {
  await page.goto("/guide/date-range-input");
  const picker = page.locator("#paint .quno-date-picker-grid").first();
  await expect(picker.locator('[data-slot="day"]')).toHaveCount(42);
  const boxes = await picker.locator('[data-slot="day"]').evaluateAll((days) =>
    days.map((day) => {
      const box = day.getBoundingClientRect();
      return { width: box.width, height: box.height };
    })
  );
  expect(Math.max(...boxes.map(({ width }) => width)) - Math.min(...boxes.map(({ width }) => width))).toBeLessThan(1);
  expect(Math.max(...boxes.map(({ height }) => height)) - Math.min(...boxes.map(({ height }) => height))).toBeLessThan(
    1
  );
});

test("project home links each component card to its dedicated field guide and demo", async ({ page }) => {
  await page.goto("/");
  const routes = [
    ["Explore the calendar guide", "/guide/infinite-calendar", "/demo/infinite-calendar", ".quno-calendar-viewport"],
    ["Explore the date range guide", "/guide/date-range-input", "/demo/date-range-input", ".quno-date-picker"],
    ["Explore the date input guide", "/guide/date-input-field", "/demo/date-input-field", ".quno-date-picker-input"]
  ] as const;
  const cards = page.locator(".project-home__card");
  await expect(cards).toHaveCount(3);
  const desktopBoxes = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect())
  );
  expect(
    Math.max(...desktopBoxes.map((box) => box.top)) - Math.min(...desktopBoxes.map((box) => box.top))
  ).toBeLessThan(2);
  for (const [label, guideHref, demoHref, demoSelector] of routes) {
    const card = page.getByRole("link", { name: label });
    await expect(card).toHaveAttribute("href", guideHref);
    await page.goto(guideHref);
    await expect(page.getByRole("link", { name: "All components" })).toHaveAttribute("href", "/");
    const demoLink = page.getByRole("link", { name: /^Demo/ });
    await expect(demoLink).toHaveAttribute("href", demoHref);
    await demoLink.click();
    await expect(page).toHaveURL(new RegExp(`${demoHref}$`));
    await expect(page.locator(demoSelector).first()).toBeVisible();
    await page.goto("/");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileBoxes = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect()));
  expect(mobileBoxes[1].top).toBeGreaterThan(mobileBoxes[0].bottom);
  expect(mobileBoxes[2].top).toBeGreaterThan(mobileBoxes[1].bottom);
});

test("date input field guide follows the task-oriented component contract", async ({ page }) => {
  await page.goto("/guide/date-input-field");
  const guide = page.locator(".date-input-guide");
  const contents = guide.getByRole("navigation", { name: "Explore the field guide" });
  await expect(contents.getByRole("link")).toHaveCount(12);
  expect(await contents.getByRole("link").allTextContents()).toEqual([
    "01Single date or range",
    "02Date formats",
    "03Preferred date order",
    "04Relative dates",
    "05Keyboard controls",
    "06Range input",
    "07Expected period",
    "08Localization",
    "09Multiple languages",
    "10Date range picker",
    "11Library size",
    "12Dependencies"
  ]);
  await guide.getByRole("button", { name: "range", exact: true }).click();
  await expect(guide.getByRole("textbox", { name: "range date input" })).toBeVisible();
  await guide.getByRole("button", { name: "2026-04-03" }).click();
  await expect(guide.locator("#date-formats .date-input-parser-example pre")).toContainText('"start": "2026-04-03"');
  await guide.getByRole("button", { name: "MDY" }).click();
  await expect(guide.locator("#preferred-date-order output")).toHaveText("2026-03-04");
  await guide.getByRole("button", { name: "this week" }).click();
  await expect(guide.locator("#relative-dates .date-input-parser-example pre")).toContainText('"start": "2026-08-23"');
  await expect(guide.locator("#relative-dates .date-input-parser-example pre")).toContainText('"end": "2026-08-29"');
  await guide.getByRole("button", { name: "1/1/30" }).click();
  await expect(guide.locator("#expected-period .date-input-parser-example pre")).toContainText('"start": "2030-01-01"');
  await guide.getByRole("button", { name: "Deutsch" }).click();
  await expect(guide.getByRole("textbox", { name: "Localized date" })).toHaveValue("25. August 2026");
  await guide.getByRole("button", { name: "12 Juni 2026" }).click();
  await expect(guide.locator("#multiple-languages .date-input-parser-example pre")).toContainText(
    '"start": "2026-06-12"'
  );
  const composedInput = guide.locator("#picker-composition").getByRole("textbox", { name: "Choose a period" });
  await composedInput.focus();
  await composedInput.fill("21 May 2026 – 18 December 2026");
  await composedInput.press("Enter");
  await expect(guide.locator("#picker-composition").getByRole("grid")).toHaveAccessibleName(
    "Date range picker: December 2026"
  );
  await expect(guide.getByText("6.72 KiB gzip", { exact: true })).toBeVisible();
});

test("editorial table of contents presents the feature chapters and navigates the article scroller", async ({
  page
}) => {
  await page.goto("/guide");
  const contents = page.getByRole("navigation", { name: "Table of contents" });
  await expect(contents.getByRole("link")).toHaveCount(25);
  await expect(contents.getByRole("link", { name: /Why build another calendar/ })).toHaveAttribute(
    "href",
    "#horizontal-first"
  );
  const horizontalSection = page.locator("#horizontal-first");
  await expect(page.getByRole("heading", { name: "Why build another calendar" })).toBeVisible();
  await expect(horizontalSection).toContainText(
    "Most calendars are built around a month, a week, or one person’s agenda"
  );
  await expect(horizontalSection).toContainText("Time runs horizontally");
  await expect(horizontalSection).toContainText("mouse wheel or touchpad");
  const motionLink = contents.getByRole("link", { name: /Supporting animations/ });
  await expect(motionLink).toHaveAttribute("href", "#motion");
  await motionLink.click();
  await expect(page.locator(".calendar-article #motion")).toBeVisible();
  await expect
    .poll(() => page.getByTestId("calendar-article").evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
});

test("editorial performance range explains the busy-schedule use case and responsive target", async ({ page }) => {
  await page.goto("/guide");
  const section = page.locator("#performance");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toContainText("60–120fps");
  await expect(section).toContainText("rendering cost follows the work on screen");
  const range = page.getByTestId("article-performance-range");
  const cards = range.locator("article");
  await expect(cards).toHaveCount(3);
  await expect(cards.locator("strong")).toHaveText(["4", "40", "400"]);
  const desktopBoxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom };
    })
  );
  expect(
    Math.max(...desktopBoxes.map((box) => box.top)) - Math.min(...desktopBoxes.map((box) => box.top))
  ).toBeLessThan(2);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileBoxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom };
    })
  );
  expect(mobileBoxes[1].top).toBeGreaterThan(mobileBoxes[0].bottom);
  expect(mobileBoxes[2].top).toBeGreaterThan(mobileBoxes[1].bottom);
});

test("editorial CSS-native exhibit keeps stable chrome browser-positioned", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "CSS-native sticky calendar example", "article-css-native-demo");
  const viewport = demo.locator(".quno-calendar-viewport");
  const dateHeader = demo.locator(".quno-calendar-day-header").first();
  const dateLabel = demo.locator(".quno-calendar-date-label").first();
  const resourceLabel = demo.locator(".quno-calendar-row-label").first();
  await expect(dateHeader).toHaveCSS("position", "sticky");
  await expect(dateLabel).toHaveCSS("position", "sticky");
  await expect(resourceLabel).toHaveCSS("position", "sticky");
  const [dateXBefore, resourceXBefore] = await Promise.all([
    dateLabel.evaluate((element) => element.getBoundingClientRect().x),
    resourceLabel.evaluate((element) => element.getBoundingClientRect().x)
  ]);

  await viewport.evaluate((element) => {
    element.scrollLeft = Math.min(320, element.scrollWidth - element.clientWidth);
  });
  await expect
    .poll(async () =>
      Math.abs((await dateLabel.evaluate((element) => element.getBoundingClientRect().x)) - dateXBefore)
    )
    .toBeLessThanOrEqual(1);
  await expect
    .poll(async () =>
      Math.abs((await resourceLabel.evaluate((element) => element.getBoundingClientRect().x)) - resourceXBefore)
    )
    .toBeLessThanOrEqual(1);
});

test("editorial payload leads with gzip size and separates external dependencies", async ({ page }) => {
  await page.goto("/guide");
  const footprint = page.getByTestId("article-package-footprint");
  await footprint.scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Payload size" })).toBeVisible();
  await expect(footprint.locator("dt").filter({ hasText: "JavaScript" })).toBeVisible();
  await expect(footprint).toContainText("31.12 KiB gzip");
  await expect(footprint).toContainText("126.21 KiB raw");
  await expect(footprint.locator("dt").filter({ hasText: "Total package" })).toBeVisible();
  await expect(footprint).toContainText("32.91 KiB gzip");
  await expect(footprint.locator("dt").filter({ hasText: "External runtime" })).toBeVisible();
  await expect(footprint).toContainText("@tanstack/react-virtual");
  await expect(footprint).toContainText("React + React DOM");
  await expect(footprint.locator("dt").filter({ hasText: "Bundled copies" })).toBeVisible();
});

test("editorial current-time marker provides a shared reference and can be restored", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "current-time marker example", "article-time-marker-demo");
  const viewport = demo.locator(".quno-calendar-viewport");
  const marker = demo.locator(".quno-calendar-now-pin.is-current");
  const currentRowLine = demo.locator(".quno-calendar-now-line.is-current").first();
  await expect(marker).toBeInViewport();
  const [markerBox, lineBox] = await Promise.all([marker.boundingBox(), currentRowLine.boundingBox()]);
  expect(markerBox).not.toBeNull();
  expect(lineBox).not.toBeNull();
  expect(Math.abs((markerBox?.x ?? 0) + (markerBox?.width ?? 0) / 2 - ((lineBox?.x ?? 0) + 1))).toBeLessThanOrEqual(2);
  expect(lineBox?.height ?? 0).toBeGreaterThan(20);

  await viewport.evaluate((element) => {
    element.scrollLeft = 0;
  });
  await expect(marker).not.toBeInViewport();
  await demo.getByRole("button", { name: "Keep current time visible" }).click();
  await expect(marker).toBeInViewport();
});

test("editorial Quno date input navigates directly to a selected date", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "date navigation example", "article-navigation-demo");
  await expect(demo.getByRole("button", { name: "Go", exact: true })).toHaveCount(0);
  await demo.getByLabel("Destination date").fill("8 July 2026");
  await expect(demo.getByLabel("Destination date")).toHaveValue("8 July 2026");
  await demo.getByLabel("Destination date").press("Enter");
  await expect(demo.getByLabel("Destination date")).toHaveAttribute("data-recognition", "recognized");
  await expect(demo.getByText("Showing 2026-07-08")).toBeVisible();
  await expect(demo.getByText("Wednesday procedure")).toBeInViewport();
  await expect(demo.locator('[data-testid="calendar-day"][data-date="2026-07-08"]')).toBeInViewport();

  await demo.getByRole("button", { name: "Next day" }).click();
  await expect(demo.getByLabel("Destination date")).toHaveValue("9 July 2026");
  await expect(demo.getByText("Showing 2026-07-09")).toBeVisible();
  await demo.getByRole("button", { name: "Previous day" }).click();
  await expect(demo.getByLabel("Destination date")).toHaveValue("8 July 2026");
  await expect(demo.getByText("Wednesday procedure")).toBeInViewport();

  await demo.getByRole("button", { name: "Today", exact: true }).click();
  await expect(demo.locator(".quno-calendar-now-pin.is-current")).toBeInViewport();
});

test("editorial time reveal progressively shows minute labels without replacing ticks", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "progressive time reveal example", "article-time-precision-demo");
  const ticks = demo.locator(".quno-calendar-time-tick");
  const visibleMinorTicks = demo.locator(".quno-calendar-time-tick:not(.is-hour):not(.is-label-hidden)");
  const stableTickCount = await ticks.count();
  const overviewCount = await visibleMinorTicks.count();
  const precisionLabel = demo.getByTestId("article-precision-level");
  const precisionControls = demo.getByLabel("Time-label precision");
  await expect(precisionLabel).toHaveText("Hours + half hours");
  const [labelBox, controlsBox] = await Promise.all([precisionLabel.boundingBox(), precisionControls.boundingBox()]);
  expect(labelBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(labelBox?.x ?? 0).toBeLessThan(controlsBox?.x ?? 0);
  expect((labelBox?.x ?? 0) + (labelBox?.width ?? 0)).toBeLessThanOrEqual(controlsBox?.x ?? 0);

  await demo.getByRole("button", { name: "Quarter hour" }).click();
  await expect(precisionLabel).toHaveText("Quarter hours");
  await expect.poll(() => visibleMinorTicks.count()).toBeGreaterThan(overviewCount);
  const quarterCount = await visibleMinorTicks.count();

  await demo.getByRole("button", { name: "5 minutes" }).click();
  await expect(precisionLabel).toHaveText("Every 5 minutes");
  await expect.poll(() => visibleMinorTicks.count()).toBeGreaterThan(quarterCount);
  await expect(demo.locator(".quno-calendar-time-tick:not(.is-hour):not(.is-label-hidden) sup").first()).toHaveText(
    "5"
  );
  await expect(ticks).toHaveCount(stableTickCount);
});

test("editorial styling presets change both settings geometry and scoped CSS", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "calendar styling presets", "article-styling-demo");
  const calendar = demo.getByTestId("quno-calendar-timeline");
  const rowLabel = demo
    .locator(
      '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"] .quno-calendar-row-label'
    )
    .first();
  await expect(calendar).toHaveClass(/theme-clinical/);
  await expect(rowLabel).toBeVisible();
  const clinicalWidth = (await rowLabel.boundingBox())?.width ?? 0;

  await demo.getByRole("button", { name: "Compact" }).click();
  await expect(calendar).toHaveClass(/theme-compact/);
  await expect.poll(async () => (await rowLabel.boundingBox())?.width ?? 0).toBeLessThan(clinicalWidth);

  await demo.getByRole("button", { name: "Night" }).click();
  await expect(calendar).toHaveClass(/theme-night/);
  await expect(demo.locator(".quno-calendar-row-grid").first()).toHaveCSS("background-color", "rgb(27, 41, 37)");
  await expect(demo.locator(".quno-calendar-time-tick").first()).toHaveCSS("color", "rgb(220, 233, 227)");
});

test("editorial date localization compares human and robot day-name strategies", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "date localization example", "article-date-localization-demo");
  const specimens = demo.getByLabel("Day-name strategy examples");
  await expect(specimens.locator("article")).toHaveCount(4);
  await expect(specimens.locator("strong")).toHaveText([
    "July 6th, Monday",
    "7月6日, 月曜日",
    "Yesterday · Today · Tomorrow",
    "011111 · 100000 · 100001"
  ]);

  const viewport = demo.locator(".quno-calendar-viewport");
  const dateLabel = (dateKey: string) =>
    demo.locator(`[data-testid="calendar-day"][data-date="${dateKey}"] .quno-calendar-date-label`).first();
  await viewport.evaluate((element) => {
    element.dataset.localizationIdentity = "preserved";
  });

  await expect(dateLabel("2026-07-06")).toHaveText("July 6th, Monday");
  await demo.getByRole("button", { name: "日本語" }).click();
  await expect(dateLabel("2026-07-06")).toHaveText("7月6日, 月曜日");

  await demo.getByRole("button", { name: "Human" }).click();
  await expect(dateLabel("2026-07-06")).toHaveText("Today");
  await expect(dateLabel("2026-07-05")).toHaveText("Yesterday");
  await expect(dateLabel("2026-07-07")).toHaveText("Tomorrow");
  await expect(dateLabel("2026-07-08")).toHaveText("Wednesday");

  const humanSpecimen = specimens.locator("article").filter({ hasText: "Yesterday · Today · Tomorrow" });
  expect(await humanSpecimen.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await demo.getByRole("button", { name: "Robot" }).click();
  await expect(dateLabel("2026-07-06")).toHaveText("100000");
  await expect(dateLabel("2026-07-07")).toHaveText("100001");
  await expect(viewport).toHaveAttribute("data-localization-identity", "preserved");

  await demo.getByLabel("Date label orientation").selectOption("infinite-vertical");
  const verticalLabel = demo.locator('[data-testid="calendar-day"][data-date="2026-07-06"] .icv-date-label');
  await expect(verticalLabel.locator(".icv-date-main")).toHaveText("100000");
  await expect(verticalLabel.locator(".icv-date-weekday")).toHaveCount(0);
});

test("editorial final calendar composes navigation, zoom, styling, and animated insertion", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "complete scheduling workflow example", "article-summary-demo");
  await expect(demo.locator(".quno-calendar-now-pin.is-current")).toBeInViewport();
  await demo.getByRole("button", { name: "Summary zoom in" }).click();
  await expect(page.getByTestId("article-summary-zoom")).toHaveText("1.50×");

  await expect(demo.getByLabel("Summary calendar theme")).toHaveCount(0);
  await expect(demo.getByTestId("quno-calendar-timeline")).toHaveClass(/theme-clinical/);
  await demo.getByRole("button", { name: "Insert event" }).click();
  await expect(demo.getByText("Priority consultation")).toBeVisible();
  await expect(demo.getByText("Inserted an event without rebuilding the calendar")).toBeVisible();
});

test("editorial code blocks use selectable TSX syntax colors", async ({ page }) => {
  await page.goto("/guide");
  const source = page.getByLabel("Complete minimal integration TSX source");
  await source.scrollIntoViewIfNeeded();
  await expect(source).toContainText('import { useState } from "react"');
  await expect(source.locator(".syntax-keyword").first()).toBeVisible();
  await expect(source.locator(".syntax-string").first()).toBeVisible();
  await expect(source.locator(".syntax-tag").first()).toBeVisible();
  await expect(source.locator(".syntax-type").first()).toBeVisible();
  const colors = await source
    .locator('[class^="syntax-"]')
    .evaluateAll((tokens) => [...new Set(tokens.map((token) => getComputedStyle(token).color))]);
  expect(colors.length).toBeGreaterThanOrEqual(6);
  await expect(source).toHaveCSS("user-select", "auto");
});

test("editorial article preserves its inline calendar through full-screen expansion", async ({ page }) => {
  await page.goto("/guide?step=focus");
  const article = page.getByTestId("calendar-article");
  const demo = page.getByTestId("article-infinite-demo");
  const calendar = demo.getByTestId("quno-calendar-timeline");
  const viewport = demo.locator(".quno-calendar-viewport");

  await expect(
    page.getByRole("heading", { name: "A simple, fast calendar for businesses with complex schedules." })
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Integration walkthrough steps" })).toHaveCount(0);
  await expect(article).toHaveCSS("overflow-y", "auto");
  await expect(calendar).toBeVisible();
  await expect(demo.getByText("Treatment consultation").first()).toBeVisible();
  expect(await article.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);

  await viewport.evaluate((element) => {
    element.dataset.articleCalendarIdentity = "preserved";
    element.scrollTop += 86;
  });
  const before = await viewport.evaluate((element) => ({
    scrollTop: element.scrollTop,
    firstDate: element.querySelector<HTMLElement>('[data-testid="calendar-day"]')?.dataset.date
  }));

  const expand = demo.getByRole("button", { name: "Full screen" });
  await expand.click();
  await expect(demo).toHaveAttribute("role", "dialog");
  await expect(demo).toHaveCSS("position", "fixed");
  const expandedBox = await demo.boundingBox();
  const windowSize = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  expect(Math.abs((expandedBox?.width ?? 0) - windowSize.width)).toBeLessThanOrEqual(1);
  expect(Math.abs((expandedBox?.height ?? 0) - windowSize.height)).toBeLessThanOrEqual(1);
  await expect(viewport).toHaveAttribute("data-article-calendar-identity", "preserved");
  expect(await viewport.evaluate((element) => element.scrollTop)).toBe(before.scrollTop);
  await page.keyboard.press("Tab");
  await expect(demo.getByRole("button", { name: "Exit full screen" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(demo).not.toHaveAttribute("role", "dialog");
  await expect(demo.getByRole("button", { name: "Full screen" })).toBeFocused();
  await expect(viewport).toHaveAttribute("data-article-calendar-identity", "preserved");
  expect(
    await viewport.evaluate(
      (element) => element.querySelector<HTMLElement>('[data-testid="calendar-day"]')?.dataset.date
    )
  ).toBe(before.firstDate);
});

test("editorial calendars keep date typography compact and expose scroll settlement", async ({ page }) => {
  await page.goto("/guide");
  const demo = page.getByTestId("article-infinite-demo");
  const dateLabel = demo
    .locator(".quno-calendar-date-label:not(.icv-date-label)")
    .filter({ hasText: "July 6th, Monday" });
  await expect(dateLabel).toBeVisible();
  await expect(dateLabel).toHaveCSS("font-size", "13px");
  await expect(dateLabel).toHaveCSS("white-space", "nowrap");
  expect(
    await dateLabel.evaluate((element) => ({
      fits: element.scrollWidth <= element.clientWidth,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      height: element.getBoundingClientRect().height
    }))
  ).toMatchObject({ fits: true });

  const chip = page.getByTestId("article-settlement-chip");
  const toolbarBox = await chip.boundingBox();
  const calendarBox = await demo.locator(".article-calendar-frame").boundingBox();
  expect((toolbarBox?.y ?? 0) + (toolbarBox?.height ?? 0) <= (calendarBox?.y ?? 0)).toBe(true);
  await expect(chip).toHaveText("repositioned");

  const viewport = demo.locator(".quno-calendar-viewport");
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  await viewport.dispatchEvent("wheel", { bubbles: true, cancelable: true, deltaY: 180 });
  await viewport.evaluate((element) => {
    element.scrollTop += 120;
  });
  await expect(chip).toHaveText("scrolled");
  await expect(chip).toHaveText("repositioned", { timeout: 3_000 });
});

test("every editorial calendar example offers the shared full-screen control", async ({ page }) => {
  await page.goto("/guide");
  for (const label of [
    "read-only calendar example",
    "event card examples",
    "custom card structure example",
    "availability interaction layer example",
    "drag and create calendar example",
    "controlled zoom example",
    "date localization example",
    "overlap lane comparison",
    "underlying event hover example",
    "event preloading example",
    "delayed loading stability example",
    "single-lane creation example",
    "visual focus lane-change example",
    "appearing event example"
  ]) {
    const placeholder = page.getByLabel(`Loading ${label}`);
    if (await placeholder.count()) await placeholder.scrollIntoViewIfNeeded();
  }
  const mounted = page.locator(".article-calendar-demo");
  await expect.poll(async () => page.locator(".article-lazy-demo").count()).toBeGreaterThanOrEqual(14);
  await expect
    .poll(async () => (await page.getByRole("button", { name: "Full screen" }).count()) - (await mounted.count()))
    .toBe(0);
});

test("editorial read-only exhibit cannot start drag or creation", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "read-only calendar example", "article-read-only-demo");
  const event = demo.locator(
    '[data-testid="calendar-event"][data-event-id="consultation-a"][data-calendar-id="provider-a"]'
  );
  const box = await event.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + 12, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + box.height / 2);
  await expect(event).not.toHaveAttribute("data-status", "dragging");
  await expect(demo.getByTestId("drag-preview-event")).toHaveCount(0);
  await page.mouse.up();
});

test("editorial article uses one external card renderer for specimens and calendar events", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "event card examples", "article-card-demo");
  await expect(demo.locator(".article-card-specimen .article-event-card")).toHaveCount(8);
  await expect(demo.getByTestId("calendar-event").first().locator(".article-event-card")).toBeVisible();

  const regularHeight = await demo
    .locator(".article-card-specimen")
    .first()
    .locator(".article-card-specimen__shell")
    .evaluate((element) => element.getBoundingClientRect().height);
  const compactHeight = await demo
    .locator(".article-card-specimen.is-compact .article-card-specimen__shell")
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(compactHeight).toBeLessThan(regularHeight);
  await expect(demo.locator(".article-card-specimen.is-compact .article-event-card__subtitle")).toHaveCSS(
    "display",
    "none"
  );

  const containerExample = demo.getByTestId("article-card-container-example");
  const roomy = containerExample.locator('[data-card-container="roomy"]');
  const narrow = containerExample.locator('[data-card-container="narrow"]');
  const short = containerExample.locator('[data-card-container="short"]');
  await expect(containerExample.locator(".article-event-card strong")).toHaveText([
    "Post-op follow-up",
    "Post-op follow-up",
    "Post-op follow-up"
  ]);

  const [roomyBox, narrowBox, shortBox] = await Promise.all(
    [roomy, narrow, short].map((sample) =>
      sample.locator(".article-card-container-sample__shell").evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { width: box.width, height: box.height };
      })
    )
  );
  expect(narrowBox.width).toBeLessThan(roomyBox.width);
  expect(narrowBox.height).toBe(roomyBox.height);
  expect(shortBox.width).toBeGreaterThan(narrowBox.width);
  expect(shortBox.height).toBeLessThan(roomyBox.height);

  await expect(roomy.locator(".article-event-card__kicker")).not.toHaveCSS("display", "none");
  await expect(roomy.locator(".article-event-card__subtitle")).not.toHaveCSS("display", "none");
  await expect(roomy.locator(".article-event-card__time")).not.toHaveCSS("display", "none");
  await expect(narrow.locator(".article-event-card__kicker")).toHaveCSS("display", "none");
  await expect(narrow.locator(".article-event-card__subtitle")).toHaveCSS("display", "none");
  await expect(narrow.locator(".article-event-card__time")).toHaveCSS("display", "none");
  await expect(short.locator(".article-event-card__kicker")).not.toHaveCSS("display", "none");
  await expect(short.locator(".article-event-card__subtitle")).toHaveCSS("display", "none");
  await expect(short.locator(".article-event-card__time")).toHaveCSS("display", "none");

  const added = demo.locator('[data-motion="added"]');
  await demo.getByRole("button", { name: "Replay added event animation" }).click();
  await expect(added).toHaveAttribute("data-playing", "true");
  await expect(added.locator(".article-event-card")).toHaveAttribute("data-render-status", "appearing");

  const cancelled = demo.locator('[data-motion="cancelled"]');
  await demo.getByRole("button", { name: "Replay cancelled draft animation" }).click();
  await expect(cancelled).toHaveAttribute("data-playing", "true");
  await expect(cancelled).toHaveCSS("animation-name", "article-card-cancelled");
});

test("editorial custom card structure switches its primary product field without moving events", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "custom card structure example", "article-card-structure-demo");
  const cards = demo.locator(".article-structured-event-card");
  const groupingState = demo.getByTestId("article-card-grouping");
  const groupingControls = demo.locator('.article-segmented-control[aria-label="Card primary field"]');
  await expect(cards).toHaveCount(4);
  await expect(groupingState).toHaveText("Grouped by product");
  expect(
    await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-card-primary")))
  ).toEqual(["product", "product", "product", "product"]);
  await expect(cards.locator("strong")).toHaveText(["IV Drip", "Botox", "Sculptra", "Skin treatment"]);

  const [stateBox, controlsBox] = await Promise.all([groupingState.boundingBox(), groupingControls.boundingBox()]);
  expect(stateBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect((stateBox?.x ?? 0) + (stateBox?.width ?? 0)).toBeLessThanOrEqual(controlsBox?.x ?? 0);

  const shells = demo.locator('[data-testid="calendar-event"]');
  const boxesBefore = await shells.evaluateAll((elements) =>
    elements.map((element) => {
      element.setAttribute("data-structure-shell", "preserved");
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    })
  );

  await demo.getByRole("button", { name: "Patient name" }).click();
  await expect(groupingState).toHaveText("Grouped by patient");
  expect(
    await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-card-primary")))
  ).toEqual(["patient", "patient", "patient", "patient"]);
  await expect(cards.locator("strong")).toHaveText(["Maya Green", "Noah Schneider", "Ava Miller", "Lina Hoffmann"]);
  expect(
    await shells.evaluateAll((elements) =>
      elements.every((element) => element.getAttribute("data-structure-shell") === "preserved")
    )
  ).toBe(true);

  const boxesAfter = await shells.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    })
  );
  boxesAfter.forEach((box, index) => {
    expect(Math.abs(box.x - boxesBefore[index].x)).toBeLessThan(0.1);
    expect(Math.abs(box.y - boxesBefore[index].y)).toBeLessThan(0.1);
    expect(Math.abs(box.width - boxesBefore[index].width)).toBeLessThan(0.1);
    expect(Math.abs(box.height - boxesBefore[index].height)).toBeLessThan(0.1);
  });

  await demo.getByRole("button", { name: "Room number" }).click();
  await expect(groupingState).toHaveText("Grouped by room");
  expect(
    await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-card-primary")))
  ).toEqual(["room", "room", "room", "room"]);
  await expect(cards.locator("strong")).toHaveText(["Room 2", "Room 4", "Room 6", "Room 3"]);
  expect(
    await cards.evaluateAll((elements) =>
      elements.every((element) => {
        const primary = element.querySelector("strong");
        return primary ? primary.scrollWidth <= primary.clientWidth : false;
      })
    )
  ).toBe(true);
});

test("editorial availability exhibit switches the only interactive event layer", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "availability interaction layer example", "article-availability-demo");
  const appointment = demo.locator('[data-event-id="follow-up-a"]');
  const availability = demo.locator('[data-testid="availability-event"][data-event-id="availability-a"]');
  const activeLayerLabel = demo.getByTestId("article-active-layer");
  const layerButtons = demo.locator('.article-segmented-control[aria-label="Editable calendar layer"]');

  await expect(activeLayerLabel).toHaveText("Appointments active");
  await expect(appointment).toHaveCSS("pointer-events", "auto");
  await expect(availability).toHaveCSS("pointer-events", "none");
  const [labelBox, buttonsBox] = await Promise.all([activeLayerLabel.boundingBox(), layerButtons.boundingBox()]);
  expect(labelBox).not.toBeNull();
  expect(buttonsBox).not.toBeNull();
  expect((labelBox?.x ?? 0) + (labelBox?.width ?? 0)).toBeLessThanOrEqual(buttonsBox?.x ?? 0);

  const grid = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="provider-a"] .quno-calendar-row-grid'
  );
  const gridBox = await grid.boundingBox();
  expect(gridBox).not.toBeNull();
  if (!gridBox) return;
  const y = gridBox.y + gridBox.height / 2;
  await page.mouse.move(gridBox.x + gridBox.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(gridBox.x + gridBox.width * 0.78, y);
  await expect(demo.getByTestId("draft-event").first()).toBeVisible();
  await page.mouse.up();
  await expect(demo.locator('[data-event-id^="article-appointment-created-"]')).toBeVisible();
  await expect(demo.getByText("New appointment drawn")).toBeVisible();

  await demo.getByRole("button", { name: "Edit availability" }).click();
  await expect(activeLayerLabel).toHaveText("Availability active");
  await expect(appointment).toHaveClass(/quno-calendar-background-event-shell/);
  await expect(appointment).toHaveCSS("pointer-events", "none");
  await expect(appointment).toHaveCSS("opacity", "0.42");
  await expect(availability).toHaveClass(/is-active-layer/);
  await expect(availability).toHaveCSS("pointer-events", "auto");
  await expect(availability.locator(".article-event-card")).toHaveCSS("opacity", "1");

  const availabilityBoxBefore = await availability.boundingBox();
  expect(availabilityBoxBefore).not.toBeNull();
  if (!availabilityBoxBefore) return;
  await page.mouse.move(
    availabilityBoxBefore.x + availabilityBoxBefore.width / 2,
    availabilityBoxBefore.y + availabilityBoxBefore.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    availabilityBoxBefore.x + availabilityBoxBefore.width / 2 + 60,
    availabilityBoxBefore.y + availabilityBoxBefore.height / 2
  );
  await expect(availability).toHaveAttribute("data-status", "dragging");
  await page.mouse.up();
  await expect(availability).not.toHaveAttribute("data-status", "dragging");
  await expect(demo.getByText("Availability moved")).toBeVisible();
  await expect
    .poll(async () => (await availability.boundingBox())?.x ?? 0)
    .toBeGreaterThan(availabilityBoxBefore.x + 20);

  await page.mouse.move(gridBox.x + gridBox.width * 0.83, y);
  await page.mouse.down();
  await page.mouse.move(gridBox.x + gridBox.width * 0.92, y);
  await expect(demo.getByTestId("draft-event")).toBeVisible();
  await page.mouse.up();
  await expect(demo.locator('[data-event-id^="article-availability-created-"]')).toBeVisible();
  await expect(demo.getByText("New availability drawn")).toBeVisible();
});

test("editorial drag/create exhibit stages parent-owned changes for accept or cancel", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "drag and create calendar example", "article-drag-create-demo");
  const mutationState = demo.getByTestId("article-mutation-state");
  const event = demo.locator(
    '[data-testid="calendar-event"][data-event-id="consultation-a"][data-calendar-id="provider-a"]'
  );
  await expect(mutationState).toHaveText("No pending change");
  await expect(demo.getByRole("button", { name: "Accept change" })).toHaveCount(0);
  const eventBox = await event.boundingBox();
  expect(eventBox).not.toBeNull();
  if (!eventBox) return;
  await page.mouse.move(eventBox.x + 12, eventBox.y + eventBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(eventBox.x + 70, eventBox.y + eventBox.height / 2);
  await expect(event).toHaveAttribute("data-status", "dragging");
  await page.mouse.up();
  await expect(mutationState).toHaveText("Move pending");
  await expect(demo.getByText(/Review the move for “Treatment consultation”/)).toBeVisible();
  await expect(demo.getByTestId("draft-event").first()).toBeVisible();
  const acceptButton = demo.getByRole("button", { name: "Accept change" });
  const cancelButton = demo.getByRole("button", { name: "Cancel change" });
  await expect(acceptButton).toBeVisible();
  await expect(cancelButton).toBeVisible();
  const [stateBox, acceptBox] = await Promise.all([mutationState.boundingBox(), acceptButton.boundingBox()]);
  expect(stateBox).not.toBeNull();
  expect(acceptBox).not.toBeNull();
  expect((stateBox?.x ?? 0) + (stateBox?.width ?? 0)).toBeLessThanOrEqual(acceptBox?.x ?? 0);
  await cancelButton.click();
  await expect(mutationState).toHaveText("No pending change");
  const exitingDraft = demo.locator('[data-testid="draft-event"][data-exiting="true"]').first();
  await expect(exitingDraft).toBeVisible();
  await expect(exitingDraft).toHaveCSS("animation-name", "quno-calendar-draft-fade-out");
  await expect(exitingDraft).toHaveCSS("animation-duration", "0.32s");
  await expect(demo.getByTestId("draft-event")).toHaveCount(0);
  await expect(demo.getByText(/Cancelled the move for “Treatment consultation”/)).toBeVisible();
  await expect.poll(async () => Math.abs(((await event.boundingBox())?.x ?? 0) - eventBox.x)).toBeLessThan(3);

  const grid = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"] .quno-calendar-row-grid'
  );
  const gridBox = await grid.boundingBox();
  expect(gridBox).not.toBeNull();
  if (!gridBox) return;
  const y = gridBox.y + gridBox.height / 2;
  await page.mouse.move(gridBox.x + gridBox.width * 0.75, y);
  await page.mouse.down();
  await page.mouse.move(gridBox.x + gridBox.width * 0.88, y);
  await expect(demo.getByTestId("draft-event").first()).toBeVisible();
  await page.mouse.up();
  await expect(mutationState).toHaveText("New event pending");
  await expect(demo.getByText("Review the new appointment. Saved data is unchanged.")).toBeVisible();
  const committedCreatedEvents = demo.locator(
    '[data-testid="calendar-event"][data-event-id^="article-created-"], [data-testid="calendar-event"][data-event-id^="created-local-"]'
  );
  await expect(committedCreatedEvents).toHaveCount(0);
  await acceptButton.click();
  await expect(mutationState).toHaveText("No pending change");
  const acceptedEvent = demo.locator('[data-testid="calendar-event"][data-event-id^="article-created-"]');
  await expect(committedCreatedEvents).toHaveCount(1);
  await expect(acceptedEvent).toHaveCount(1);
  await expect(demo.getByTestId("draft-event")).toHaveCount(0);
  await expect(acceptedEvent).toHaveAttribute("data-status", "appearing");
  const acceptedCard = acceptedEvent.locator(".article-event-card");
  await expect(acceptedCard).toHaveAttribute("data-render-status", "appearing");
  expect(await acceptedCard.evaluate((element) => getComputedStyle(element, "::before").animationName)).toBe(
    "article-event-appearing-glint"
  );
  await expect(acceptedEvent).toHaveAttribute("data-status", "existing", { timeout: 3_000 });
  await expect(
    demo.getByText("Accepted the new appointment. Parent state and the visible calendar now match.")
  ).toBeVisible();
});

test("editorial zoom controls and gesture requests keep zoom parent-controlled", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "controlled zoom example", "article-zoom-demo");
  const zoomSection = page.locator("#zoom");
  await expect(zoomSection.getByRole("heading", { name: "Zoom into the calendar" })).toBeVisible();
  await expect(zoomSection).toContainText("Zoom out to compare the shape of the day");
  await expect(zoomSection).toContainText("zoom in to read cards");
  await expect(zoomSection).toContainText("without losing the part of the schedule");
  const slider = page.getByTestId("article-zoom-slider");
  const output = page.getByTestId("article-zoom-value");
  const marker = demo.locator(".quno-calendar-now-pin.is-current");
  await expect(marker).toBeVisible();
  const markerXBefore = (await marker.boundingBox())?.x ?? 0;
  await slider.fill("2");
  await expect(output).toHaveText("2.00×");
  await expect
    .poll(async () => Math.abs(((await marker.boundingBox())?.x ?? 0) - markerXBefore))
    .toBeLessThanOrEqual(2);

  const viewport = demo.locator(".quno-calendar-viewport");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  await viewport.dispatchEvent("wheel", {
    bubbles: true,
    cancelable: true,
    shiftKey: true,
    deltaY: -100,
    clientX: (box?.x ?? 0) + (box?.width ?? 0) * 0.7,
    clientY: (box?.y ?? 0) + (box?.height ?? 0) * 0.5
  });
  await expect(output).not.toHaveText("2.00×");
});

test("editorial lane comparison grows only the dense resource and supports vertical projection", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "overlap lane comparison", "article-lane-demo");
  await expect(demo.getByText("Pre-op check")).toBeVisible();

  const providerRow = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="provider-a"]'
  );
  const roomRow = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"]'
  );
  const [providerBox, roomBox] = await Promise.all([providerRow.boundingBox(), roomRow.boundingBox()]);
  expect(providerBox?.height ?? 0).toBeGreaterThan(roomBox?.height ?? 0);

  const denseEvent = demo.locator('[data-event-id="overlap-1"]').first();
  const restingHeight = (await denseEvent.boundingBox())?.height ?? 0;
  await denseEvent.hover();
  await expect.poll(async () => (await denseEvent.boundingBox())?.height ?? 0).toBeGreaterThan(restingHeight);

  await demo.getByRole("button", { name: "Vertical" }).click();
  await expect(demo.getByTestId("quno-calendar-timeline")).toHaveAttribute("data-view", "infinite-vertical");
  const verticalCollision = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-event"][data-event-id="overlap-1"]'
  );
  await expect(verticalCollision).toBeInViewport();
  const [verticalCollisionBox, verticalViewportBox] = await Promise.all([
    verticalCollision.boundingBox(),
    demo.locator(".icv-viewport").boundingBox()
  ]);
  expect(verticalCollisionBox).not.toBeNull();
  expect(verticalViewportBox).not.toBeNull();
  expect(verticalCollisionBox?.y ?? 0).toBeGreaterThanOrEqual(verticalViewportBox?.y ?? 0);
  expect((verticalCollisionBox?.y ?? 0) + (verticalCollisionBox?.height ?? 0)).toBeLessThanOrEqual(
    (verticalViewportBox?.y ?? 0) + (verticalViewportBox?.height ?? 0)
  );
  const providerColumn = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-column"][data-calendar-id="provider-a"]'
  );
  const roomColumn = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-column"][data-calendar-id="room-1"]'
  );
  await expect(providerColumn).toBeVisible();
  const [providerColumnBox, roomColumnBox] = await Promise.all([
    providerColumn.boundingBox(),
    roomColumn.boundingBox()
  ]);
  expect(providerColumnBox?.width ?? 0).toBeGreaterThan(roomColumnBox?.width ?? 0);
});

test("editorial hover demo reveals underlying overlap lanes in turn", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "underlying event hover example", "article-hover-demo");
  await expect(demo.getByTestId("quno-calendar-timeline")).toHaveAttribute("data-view", "infinite-horizontal");
  await expect(demo.getByText("Pre-op check")).toBeVisible();

  const lanePair = await demo.evaluate((element) => {
    const viewport = element.querySelector(".quno-calendar-viewport")?.getBoundingClientRect();
    if (!viewport) return null;
    const events = Array.from(element.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'))
      .map((event) => ({ event, box: event.getBoundingClientRect() }))
      .filter(
        ({ event, box }) =>
          Number(event.dataset.laneCount ?? "1") > 1 &&
          box.top > viewport.top + 80 &&
          box.bottom < viewport.bottom &&
          box.left >= viewport.left &&
          box.right <= viewport.right
      )
      .sort((a, b) => a.box.top - b.box.top);
    if (events.length < 2) return null;
    return events.slice(0, 2).map(({ event, box }) => ({
      id: event.dataset.eventId,
      x: box.left + box.width / 2,
      y: box.top + box.height / 2
    }));
  });
  expect(lanePair).not.toBeNull();
  if (!lanePair?.[0].id || !lanePair[1].id) return;

  await page.mouse.move(lanePair[0].x, lanePair[0].y);
  await expect(demo.locator(`[data-event-id="${lanePair[0].id}"][data-status="hovered"]`)).toBeVisible();
  await page.mouse.move(lanePair[1].x, lanePair[1].y);
  await expect(demo.locator(`[data-event-id="${lanePair[1].id}"][data-status="hovered"]`)).toBeVisible();
  await expect(demo.locator(`[data-event-id="${lanePair[0].id}"][data-status="hovered"]`)).toHaveCount(0);
});

test("editorial prefetch exhibit reveals a warm event before the next delayed range settles", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "event preloading example", "article-prefetch-demo");
  await expect(demo.getByText("Warm window accepted and cached")).toBeVisible({ timeout: 10_000 });
  const initialRange = await page.getByTestId("article-prefetch-range").textContent();
  expect(initialRange).toContain("2026-07");
  const loadedEvents = demo.getByTestId("article-prefetch-loaded-events");
  const prefetchedLoadedEvent = loadedEvents.locator('[data-loaded-event-id="article-prefetched-event"]');
  await expect(prefetchedLoadedEvent).toBeVisible();
  await expect(prefetchedLoadedEvent).toContainText("Prefetched consultation");
  await expect(prefetchedLoadedEvent).toContainText("2026-07-13 · 09:30–10:30");
  const [loadedEventsBox, calendarFrameBox] = await Promise.all([
    loadedEvents.boundingBox(),
    demo.locator(".article-calendar-frame").boundingBox()
  ]);
  expect(loadedEventsBox).not.toBeNull();
  expect(calendarFrameBox).not.toBeNull();
  expect((loadedEventsBox?.y ?? 0) + (loadedEventsBox?.height ?? 0)).toBeLessThanOrEqual(calendarFrameBox?.y ?? 0);
  expect(
    await prefetchedLoadedEvent.evaluate(
      (element) => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight
    )
  ).toBe(true);
  await expect(demo.locator('[data-testid="calendar-event"][data-event-id="article-prefetched-event"]')).toHaveCount(0);
  await demo.getByRole("button", { name: "Jump to prefetched date" }).click();
  await expect(demo.locator('[data-testid="calendar-event"][data-event-id="article-prefetched-event"]')).toBeVisible({
    timeout: 500
  });
  await expect(page.getByTestId("article-prefetch-count")).toContainText("request");
});

test("editorial stability lab retains stale events and row focus during delayed dense loading", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "delayed loading stability example", "article-stability-demo");
  const loadingStatus = demo.locator(".article-loading-status");
  const denseButton = demo.getByRole("button", { name: "Load dense update" });
  const [loadingBox, denseButtonBox] = await Promise.all([loadingStatus.boundingBox(), denseButton.boundingBox()]);
  expect(loadingBox).not.toBeNull();
  expect(denseButtonBox).not.toBeNull();
  expect((loadingBox?.x ?? 0) + (loadingBox?.width ?? 0)).toBeLessThanOrEqual(denseButtonBox?.x ?? 0);
  await expect(demo.getByText("Shared consultation").first()).toBeVisible({ timeout: 10_000 });
  await demo.getByLabel("Room 4").check();
  await expect(demo.getByText("Settled")).toBeVisible({ timeout: 10_000 });
  await expect(demo.locator('[data-event-id="stability-shared-event"][data-calendar-id="room-1"]').first()).toBeVisible(
    {
      timeout: 10_000
    }
  );

  const before = await demo.evaluate((element) => {
    const viewport = element.querySelector<HTMLElement>(".quno-calendar-viewport");
    const room = element.querySelector<HTMLElement>(
      '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"]'
    );
    if (!viewport || !room) throw new Error("Missing stability geometry");
    viewport.scrollTop += room.getBoundingClientRect().top - viewport.getBoundingClientRect().top + 1;
    return room.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  });

  await denseButton.click();
  await expect(demo.getByText("Loading", { exact: true })).toBeVisible();
  await expect(
    demo.locator('[data-event-id="stability-shared-event"][data-calendar-id="room-1"]').first()
  ).toBeVisible();
  await expect(demo.getByText("Settled")).toBeVisible({ timeout: 10_000 });
  const narrowShells = await demo.evaluate((element) =>
    ["stability-shared-event", "follow-up-a"].map((eventId) => {
      const shell = element.querySelector<HTMLElement>(
        `[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="provider-a"] [data-testid="calendar-event"][data-event-id="${eventId}"]`
      );
      const card = shell?.querySelector<HTMLElement>(".article-event-card");
      const title = card?.querySelector<HTMLElement>("strong");
      if (!shell || !card || !title) throw new Error(`Missing narrow event shell ${eventId}`);
      const shellBox = shell.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      return {
        cardContained:
          cardBox.top >= shellBox.top &&
          cardBox.bottom <= shellBox.bottom &&
          cardBox.left >= shellBox.left &&
          cardBox.right <= shellBox.right,
        metadataHidden: Array.from(card.querySelectorAll("span")).every(
          (node) => getComputedStyle(node).display === "none"
        ),
        titleContained: titleBox.top >= shellBox.top && titleBox.bottom <= shellBox.bottom,
        titleFits: title.scrollHeight <= title.clientHeight,
        titleWhiteSpace: getComputedStyle(title).whiteSpace
      };
    })
  );
  expect(narrowShells).toEqual([
    {
      cardContained: true,
      metadataHidden: true,
      titleContained: true,
      titleFits: true,
      titleWhiteSpace: "normal"
    },
    {
      cardContained: true,
      metadataHidden: true,
      titleContained: true,
      titleFits: true,
      titleWhiteSpace: "normal"
    }
  ]);
  const after = await demo.evaluate((element) => {
    const viewport = element.querySelector<HTMLElement>(".quno-calendar-viewport");
    const room = element.querySelector<HTMLElement>(
      '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"]'
    );
    if (!viewport || !room) throw new Error("Missing stability geometry");
    return room.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  });
  expect(Math.abs(after - before)).toBeLessThanOrEqual(3);
});

test("editorial stability lab reveals and focuses a shared participant", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "delayed loading stability example", "article-stability-demo");
  await expect(demo.getByText("Shared consultation").first()).toBeVisible({ timeout: 10_000 });
  await demo.getByRole("button", { name: "Reveal shared room" }).click();
  const focused = demo
    .locator('[data-event-id="stability-shared-event"][data-calendar-id="room-1"][data-status="focused"]')
    .first();
  await expect(focused).toBeVisible({ timeout: 10_000 });
  const [focusedBox, viewportBox, timeHeaderBox] = await Promise.all([
    focused.boundingBox(),
    demo.locator(".quno-calendar-viewport").boundingBox(),
    demo.locator(".quno-calendar-time-header").boundingBox()
  ]);
  expect(focusedBox).not.toBeNull();
  expect(viewportBox).not.toBeNull();
  expect(timeHeaderBox).not.toBeNull();
  expect(focusedBox?.x ?? 0).toBeGreaterThanOrEqual(timeHeaderBox?.x ?? 0);
  expect(focusedBox?.y ?? 0).toBeGreaterThanOrEqual((timeHeaderBox?.y ?? 0) + (timeHeaderBox?.height ?? 0));
  expect((focusedBox?.x ?? 0) + (focusedBox?.width ?? 0)).toBeLessThanOrEqual(
    (viewportBox?.x ?? 0) + (viewportBox?.width ?? 0)
  );
  expect((focusedBox?.y ?? 0) + (focusedBox?.height ?? 0)).toBeLessThanOrEqual(
    (viewportBox?.y ?? 0) + (viewportBox?.height ?? 0)
  );
  await expect(demo.getByText("Focus request focused")).toBeVisible();
});

test("repeated focus leaves a fully visible shared-room event and viewport in place", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "delayed loading stability example", "article-stability-demo");
  await expect(demo.getByText("Shared consultation").first()).toBeVisible({ timeout: 10_000 });
  const reveal = demo.getByRole("button", { name: "Reveal shared room" });
  await reveal.click();
  const roomEvent = demo.locator(
    '[data-event-id="stability-shared-event"][data-calendar-id="room-1"][data-status="focused"]'
  );
  await expect(roomEvent).toBeVisible({ timeout: 10_000 });
  const firstBox = await roomEvent.boundingBox();
  expect(firstBox).not.toBeNull();
  const viewport = demo.locator(".quno-calendar-viewport");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const scrollBefore = await viewport.evaluate((element) => ({
      left: element.scrollLeft,
      top: element.scrollTop
    }));
    await reveal.click();
    await expect(roomEvent).toBeVisible();
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    );
    const [eventBox, viewportBox, timeHeaderBox, scrollAfter] = await Promise.all([
      roomEvent.boundingBox(),
      viewport.boundingBox(),
      demo.locator(".quno-calendar-time-header").boundingBox(),
      viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }))
    ]);
    expect(eventBox).not.toBeNull();
    expect(viewportBox).not.toBeNull();
    expect(timeHeaderBox).not.toBeNull();
    expect(scrollAfter).toEqual(scrollBefore);
    expect(Math.abs((eventBox?.x ?? 0) - (firstBox?.x ?? 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((eventBox?.y ?? 0) - (firstBox?.y ?? 0))).toBeLessThanOrEqual(2);
    expect(eventBox?.x ?? 0).toBeGreaterThanOrEqual(timeHeaderBox?.x ?? 0);
    expect(eventBox?.y ?? 0).toBeGreaterThanOrEqual((timeHeaderBox?.y ?? 0) + (timeHeaderBox?.height ?? 0));
    expect((eventBox?.x ?? 0) + (eventBox?.width ?? 0)).toBeLessThanOrEqual(
      (viewportBox?.x ?? 0) + (viewportBox?.width ?? 0)
    );
    expect((eventBox?.y ?? 0) + (eventBox?.height ?? 0)).toBeLessThanOrEqual(
      (viewportBox?.y ?? 0) + (viewportBox?.height ?? 0)
    );
  }
});

test("editorial creation demo narrows to one doctor lane without adding an overlap lane", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "single-lane creation example", "article-creation-lane-demo");
  const laneCount = demo.getByTestId("article-visible-lane-count");
  const creationButton = demo.getByRole("button", { name: "Start creation" });
  const currentDateRows = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"]'
  );
  await expect(laneCount).toHaveText("2 lanes");
  const [laneCountBox, creationButtonBox] = await Promise.all([laneCount.boundingBox(), creationButton.boundingBox()]);
  expect(laneCountBox).not.toBeNull();
  expect(creationButtonBox).not.toBeNull();
  expect((laneCountBox?.x ?? 0) + (laneCountBox?.width ?? 0)).toBeLessThanOrEqual(creationButtonBox?.x ?? 0);
  await expect(currentDateRows).toHaveCount(2);
  await creationButton.click();
  await expect(laneCount).toHaveText("1 lane");
  await expect(currentDateRows).toHaveCount(1);
  const draft = demo.getByTestId("draft-event");
  await expect(draft).toBeVisible();
  await expect(draft).toHaveAttribute("data-lane-count", "1");
  await expect(demo.getByText("Available", { exact: true }).first()).toBeVisible();
  await expect(demo.getByText("Tuesday review")).toBeInViewport();
  await expect(demo.getByText("Wednesday treatment")).toBeInViewport();
  await expect(demo.getByText("Thursday procedure")).toBeInViewport();
  await expect(demo.getByText("Post-op clinic")).toHaveCount(0);
  const visibleCardLines = await demo
    .locator('[data-event-id="creation-maya-tuesday"] .article-event-card')
    .evaluate((card) => {
      const cardBox = card.getBoundingClientRect();
      return Array.from(card.querySelectorAll<HTMLElement>("span, strong"))
        .filter((line) => getComputedStyle(line).display !== "none")
        .map((line) => {
          const lineBox = line.getBoundingClientRect();
          return {
            contained: lineBox.top >= cardBox.top && lineBox.bottom <= cardBox.bottom,
            overflowY: getComputedStyle(line).overflowY
          };
        });
    });
  expect(visibleCardLines).toEqual([
    { contained: true, overflowY: "visible" },
    { contained: true, overflowY: "visible" },
    { contained: true, overflowY: "visible" }
  ]);
  await demo.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(draft).toHaveCount(0);
  await expect(laneCount).toHaveText("2 lanes");
});

test("editorial event focus preserves a visible card through save and lane changes", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "visual focus lane-change example", "article-event-focus-demo");
  await expect(demo.getByTestId("draft-event")).toBeVisible();
  const viewport = demo.locator(".quno-calendar-viewport");
  const beforeSaveScroll = await viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
  await demo.getByRole("button", { name: "Save draft" }).click();

  const saved = demo.locator('[data-event-id="article-focus-event"]');
  await expect(saved).toBeVisible();
  await expect(saved).toHaveAttribute("data-status", "focused");
  await expect
    .poll(() => viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop })))
    .toEqual(beforeSaveScroll);

  const beforeCollisionsScroll = await viewport.evaluate((element) => ({
    left: element.scrollLeft,
    top: element.scrollTop
  }));
  await demo.getByRole("button", { name: "Add collisions" }).click();
  await expect(saved).toHaveAttribute("data-lane-count", "5");
  await expect(saved).toHaveAttribute("data-status", "focused");
  await expect(page.getByTestId("article-focus-state")).toHaveText("5 overlap lanes");
  await expect(saved).toBeVisible();
  await expect
    .poll(() => viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop })))
    .toEqual(beforeCollisionsScroll);
});

test("editorial motion demo animates both add and cancel outcomes", async ({ page }) => {
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "appearing event example", "article-motion-demo");
  await expect(demo.getByText("Treatment consultation")).toBeVisible();
  const initialDraft = demo.getByTestId("draft-event");
  await expect(initialDraft).toBeVisible();
  const initialDraftBox = await initialDraft.boundingBox();
  expect(initialDraftBox).not.toBeNull();
  expect(initialDraftBox?.width ?? 0).toBeGreaterThan(90);
  expect(initialDraftBox?.height ?? 0).toBeGreaterThan(55);
  await demo.locator(".quno-calendar-viewport").evaluate((element) => {
    element.scrollTop += 900;
  });
  await demo.getByRole("button", { name: "Add event" }).click();
  const inserted = demo.locator('[data-event-id^="article-appearing-"]').first();
  await expect(inserted).toBeVisible();
  await expect(inserted).toHaveAttribute("data-status", "appearing");
  await expect(inserted.locator(".article-event-card")).toHaveAttribute("data-render-status", "appearing");
  await expect(inserted).toHaveAttribute("data-status", "existing", { timeout: 3_000 });
  await demo.getByRole("button", { name: "New draft" }).click();
  const draft = demo.getByTestId("draft-event");
  await expect(draft).toBeVisible();
  await demo.getByRole("button", { name: "Cancel event" }).click();
  await expect(demo.locator('[data-testid="draft-event"][data-exiting="true"]')).toBeVisible();
  await expect(draft).toHaveCount(0, { timeout: 2_000 });
});

test("editorial card motion collapses for reduced-motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/guide");
  const demo = await revealLazyArticleDemo(page, "event card examples", "article-card-demo");
  await demo.getByRole("button", { name: "Replay added event animation" }).click();
  const card = demo.locator('[data-motion="added"] .article-event-card');
  await expect(card).toBeVisible();
  expect(
    await card.evaluate((element) => Number.parseFloat(getComputedStyle(element, "::before").animationDuration))
  ).toBeLessThanOrEqual(0.001);
});

test("showcase sidebars omit the example source link", async ({ page }) => {
  for (const path of ["/demo/infinite-calendar", "/demo1"]) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "View example source" })).toHaveCount(0);
  }
});

test("showcase sidebars align dataset size and API delay on one row", async ({ page }) => {
  for (const path of ["/demo/infinite-calendar", "/demo1"]) {
    await page.goto(path);
    const dataset = page.getByTestId("scale-select");
    const apiDelay = page.getByTestId("api-latency-select");
    const [datasetBox, apiDelayBox] = await Promise.all([dataset.boundingBox(), apiDelay.boundingBox()]);
    expect(datasetBox).not.toBeNull();
    expect(apiDelayBox).not.toBeNull();
    expect(Math.abs((datasetBox?.y ?? 0) - (apiDelayBox?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(datasetBox?.width ?? 0).toBeGreaterThan(70);
    expect(apiDelayBox?.width ?? 0).toBeGreaterThan(70);
  }
});
