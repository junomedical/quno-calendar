import { expect, test, type Page } from "@playwright/test";

async function revealLazyArticleDemo(page: Page, label: string, testId: string) {
  const placeholder = page.getByLabel(`Loading ${label}`);
  if (await placeholder.count()) {
    await placeholder.scrollIntoViewIfNeeded();
  }
  const demo = page.getByTestId(testId);
  await expect(demo).toBeVisible();
  return demo;
}

test("main demo links to the single example field guide", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "Read the integration field guide" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/examples/integration-walkthrough");
});

test("editorial table of contents navigates the internal article scroller", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const contents = page.getByRole("navigation", { name: "Table of contents" });
  await expect(contents.getByRole("link")).toHaveCount(14);
  const motionLink = contents.getByRole("link", { name: /Motion is part of the renderer/ });
  await expect(motionLink).toHaveAttribute("href", "#motion");
  await motionLink.click();
  await expect(page.locator("#motion")).toBeInViewport();
  await expect
    .poll(() => page.getByTestId("calendar-article").evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
});

test("editorial article preserves its inline calendar through full-screen expansion", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough?step=focus");
  const article = page.getByTestId("calendar-article");
  const demo = page.getByTestId("article-infinite-demo");
  const calendar = demo.getByTestId("infinite-calendar");
  const viewport = demo.locator(".ic-viewport");

  await expect(
    page.getByRole("heading", { name: "A calendar that keeps going, without getting in your way." })
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
  await page.goto("/examples/integration-walkthrough");
  const demo = page.getByTestId("article-infinite-demo");
  const dateLabel = demo.locator(".ic-date-label:not(.icv-date-label)").filter({ hasText: "July 6th, Monday" });
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

  const viewport = demo.locator(".ic-viewport");
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
  await page.goto("/examples/integration-walkthrough");
  for (const label of [
    "read-only calendar example",
    "event card examples",
    "availability interaction layer example",
    "drag and create calendar example",
    "controlled zoom example",
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
  await expect(page.locator(".article-calendar-demo")).toHaveCount(13);
  await expect(page.getByRole("button", { name: "Full screen" })).toHaveCount(13);
});

test("editorial read-only exhibit cannot start drag or creation", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
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
  await page.goto("/examples/integration-walkthrough");
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

  const added = demo.locator('[data-motion="added"]');
  await demo.getByRole("button", { name: "Replay added event animation" }).click();
  await expect(added).toHaveAttribute("data-playing", "true");
  await expect(added.locator(".article-event-card")).toHaveAttribute("data-render-status", "appearing");

  const cancelled = demo.locator('[data-motion="cancelled"]');
  await demo.getByRole("button", { name: "Replay cancelled draft animation" }).click();
  await expect(cancelled).toHaveAttribute("data-playing", "true");
  await expect(cancelled).toHaveCSS("animation-name", "article-card-cancelled");
});

test("editorial availability exhibit switches the only interactive event layer", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "availability interaction layer example", "article-availability-demo");
  const appointment = demo.locator('[data-event-id="follow-up-a"]');
  const availability = demo.locator('[data-event-id="availability-a"]');

  await expect(page.getByTestId("article-active-layer")).toHaveText("Appointments active");
  await expect(appointment).toHaveCSS("pointer-events", "auto");
  await expect(availability).toHaveCSS("pointer-events", "none");

  await demo.getByRole("button", { name: "Edit availability" }).click();
  await expect(page.getByTestId("article-active-layer")).toHaveText("Availability active");
  await expect(appointment).toHaveClass(/ic-background-event-shell/);
  await expect(appointment).toHaveCSS("pointer-events", "none");
  await expect(appointment).toHaveCSS("opacity", "0.42");
  await expect(availability).toHaveClass(/is-active-layer/);
  await expect(availability).toHaveCSS("pointer-events", "auto");

  const grid = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="provider-a"] .ic-row-grid'
  );
  const gridBox = await grid.boundingBox();
  expect(gridBox).not.toBeNull();
  if (!gridBox) return;
  const y = gridBox.y + gridBox.height / 2;
  await page.mouse.move(gridBox.x + gridBox.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(gridBox.x + gridBox.width * 0.84, y);
  await expect(demo.getByTestId("draft-event")).toBeVisible();
  await page.mouse.up();
  await expect(demo.locator('[data-event-id^="article-availability-created-"]')).toBeVisible();
  await expect(demo.getByText("New availability drawn; appointments were ignored")).toBeVisible();
});

test("editorial drag/create exhibit commits parent-owned moves and drawn events", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "drag and create calendar example", "article-drag-create-demo");
  const event = demo.locator(
    '[data-testid="calendar-event"][data-event-id="consultation-a"][data-calendar-id="provider-a"]'
  );
  const eventBox = await event.boundingBox();
  expect(eventBox).not.toBeNull();
  if (!eventBox) return;
  await page.mouse.move(eventBox.x + 12, eventBox.y + eventBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(eventBox.x + 70, eventBox.y + eventBox.height / 2);
  await expect(event).toHaveAttribute("data-status", "dragging");
  await page.mouse.up();
  await expect(demo.getByText(/Moved “Treatment consultation”/)).toBeVisible();

  const grid = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"] .ic-row-grid'
  );
  const gridBox = await grid.boundingBox();
  expect(gridBox).not.toBeNull();
  if (!gridBox) return;
  const y = gridBox.y + gridBox.height / 2;
  await page.mouse.move(gridBox.x + gridBox.width * 0.75, y);
  await page.mouse.down();
  await page.mouse.move(gridBox.x + gridBox.width * 0.88, y);
  await expect(demo.getByTestId("draft-event")).toBeVisible();
  await page.mouse.up();
  await expect(demo.locator('[data-event-id^="article-created-"]')).toBeVisible();
  await expect(demo.getByText("Parent accepted the drawn range and returned a saved event")).toBeVisible();
});

test("editorial zoom controls and gesture requests keep zoom parent-controlled", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "controlled zoom example", "article-zoom-demo");
  const slider = page.getByTestId("article-zoom-slider");
  const output = page.getByTestId("article-zoom-value");
  await slider.fill("2");
  await expect(output).toHaveText("2.00×");

  const viewport = demo.locator(".ic-viewport");
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
  await page.goto("/examples/integration-walkthrough");
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
  await expect(demo.getByTestId("infinite-calendar")).toHaveAttribute("data-view", "infinite-vertical");
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
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "underlying event hover example", "article-hover-demo");
  await expect(demo.getByTestId("infinite-calendar")).toHaveAttribute("data-view", "infinite-vertical");
  await expect(demo.getByText("Pre-op check")).toBeVisible();

  const lanePair = await demo.evaluate((element) => {
    const viewport = element.querySelector(".ic-viewport")?.getBoundingClientRect();
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
      .sort((a, b) => a.box.left - b.box.left);
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
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "event preloading example", "article-prefetch-demo");
  await expect(demo.getByText("Warm window accepted and cached")).toBeVisible({ timeout: 10_000 });
  const initialRange = await page.getByTestId("article-prefetch-range").textContent();
  expect(initialRange).toContain("2026-07");
  await demo.getByRole("button", { name: "Jump to prefetched date" }).click();
  await expect(demo.getByText("Prefetched consultation")).toBeVisible({ timeout: 500 });
  await expect(page.getByTestId("article-prefetch-count")).toContainText("request");
});

test("editorial stability lab retains stale events and row focus during delayed dense loading", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "delayed loading stability example", "article-stability-demo");
  await expect(demo.getByText("Shared consultation").first()).toBeVisible({ timeout: 10_000 });
  await demo.getByLabel("Room 4").check();
  await expect(demo.getByText("Settled")).toBeVisible({ timeout: 10_000 });
  await expect(demo.locator('[data-event-id="stability-shared-event"][data-calendar-id="room-1"]').first()).toBeVisible(
    {
      timeout: 10_000
    }
  );

  const before = await demo.evaluate((element) => {
    const viewport = element.querySelector<HTMLElement>(".ic-viewport");
    const room = element.querySelector<HTMLElement>(
      '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"]'
    );
    if (!viewport || !room) throw new Error("Missing stability geometry");
    viewport.scrollTop += room.getBoundingClientRect().top - viewport.getBoundingClientRect().top + 1;
    return room.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  });

  await demo.getByRole("button", { name: "Load dense update" }).click();
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
    const viewport = element.querySelector<HTMLElement>(".ic-viewport");
    const room = element.querySelector<HTMLElement>(
      '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="room-1"]'
    );
    if (!viewport || !room) throw new Error("Missing stability geometry");
    return room.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  });
  expect(Math.abs(after - before)).toBeLessThanOrEqual(3);
});

test("editorial stability lab reveals and focuses a shared participant", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "delayed loading stability example", "article-stability-demo");
  await expect(demo.getByText("Shared consultation").first()).toBeVisible({ timeout: 10_000 });
  await demo.getByRole("button", { name: "Reveal shared room" }).click();
  const focused = demo
    .locator('[data-event-id="stability-shared-event"][data-calendar-id="room-1"][data-status="focused"]')
    .first();
  await expect(focused).toBeVisible({ timeout: 10_000 });
  await expect(demo.getByText("Focus request focused")).toBeVisible();
});

test("repeated shared-room focus remains inside the viewport without accumulating drift", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
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

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await reveal.click();
    await expect(roomEvent).toBeVisible();
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    );
    const [eventBox, viewportBox] = await Promise.all([
      roomEvent.boundingBox(),
      demo.locator(".ic-viewport").boundingBox()
    ]);
    expect(eventBox).not.toBeNull();
    expect(viewportBox).not.toBeNull();
    expect(Math.abs((eventBox?.x ?? 0) - (firstBox?.x ?? 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((eventBox?.y ?? 0) - (firstBox?.y ?? 0))).toBeLessThanOrEqual(2);
    expect(eventBox?.y ?? 0).toBeGreaterThanOrEqual(viewportBox?.y ?? 0);
    expect((eventBox?.y ?? 0) + (eventBox?.height ?? 0)).toBeLessThanOrEqual(
      (viewportBox?.y ?? 0) + (viewportBox?.height ?? 0)
    );
  }
});

test("editorial creation demo narrows to one doctor lane without adding an overlap lane", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "single-lane creation example", "article-creation-lane-demo");
  const currentDateRows = demo.locator(
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"]'
  );
  await expect(page.getByTestId("article-visible-lane-count")).toHaveText("2 lanes");
  await expect(currentDateRows).toHaveCount(2);
  await demo.getByRole("button", { name: "Start creation" }).click();
  await expect(page.getByTestId("article-visible-lane-count")).toHaveText("1 lane");
  await expect(currentDateRows).toHaveCount(1);
  const draft = demo.getByTestId("draft-event");
  await expect(draft).toBeVisible();
  await expect(draft).toHaveAttribute("data-lane-count", "1");
  await expect(demo.getByText("Available", { exact: true }).first()).toBeVisible();
  await demo.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(draft).toHaveCount(0);
  await expect(page.getByTestId("article-visible-lane-count")).toHaveText("2 lanes");
});

test("editorial visual focus follows a saved event through overlap lane changes", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "visual focus lane-change example", "article-event-focus-demo");
  await expect(demo.getByTestId("draft-event")).toBeVisible();
  await demo.getByRole("button", { name: "Save draft" }).click();

  const saved = demo.locator('[data-event-id="article-focus-event"]');
  await expect(saved).toBeVisible();
  await expect(saved).toHaveAttribute("data-status", "focused");
  const before = await saved.boundingBox();
  expect(before).not.toBeNull();

  await demo.getByRole("button", { name: "Add collisions" }).click();
  await expect(saved).toHaveAttribute("data-lane-count", "5");
  await expect(saved).toHaveAttribute("data-status", "focused");
  await expect(page.getByTestId("article-focus-state")).toHaveText("5 overlap lanes");
  const after = await saved.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(2);
});

test("editorial motion demo animates both add and cancel outcomes", async ({ page }) => {
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "appearing event example", "article-motion-demo");
  await expect(demo.getByText("Treatment consultation")).toBeVisible();
  await expect(demo.getByTestId("draft-event")).toBeVisible();
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
  await page.goto("/examples/integration-walkthrough");
  const demo = await revealLazyArticleDemo(page, "event card examples", "article-card-demo");
  await demo.getByRole("button", { name: "Replay added event animation" }).click();
  const card = demo.locator('[data-motion="added"] .article-event-card');
  await expect(card).toHaveAttribute("data-render-status", "appearing");
  expect(
    await card.evaluate((element) => Number.parseFloat(getComputedStyle(element, "::before").animationDuration))
  ).toBeLessThanOrEqual(0.001);
});

test("showcase sidebars omit the example source link", async ({ page }) => {
  for (const path of ["/", "/demo1"]) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "View example source" })).toHaveCount(0);
  }
});

test("showcase sidebars align dataset size and API delay on one row", async ({ page }) => {
  for (const path of ["/", "/demo1"]) {
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
