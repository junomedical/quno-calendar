import { expect, test, type Page } from "@playwright/test";
import { goToWorkday, horizontalDrawTarget, selectPageText, topVisibleDayDate, waitForDemoEvents } from "../helpers";

async function expectDraftFadeoutThenGone(page: Page) {
  const exitingDraft = page.locator('[data-testid="draft-event"][data-exiting="true"]');
  await expect(exitingDraft.first()).toBeVisible();
  await expect(exitingDraft.first()).toHaveCSS("animation-name", "ic-draft-fade-out");
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
}

async function cancelAndKeepRowAnchored(page: Page, selector: string, before: number) {
  await page.getByTestId("draft-cancel-button").click();
  await expectDraftFadeoutThenGone(page);
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        ({ selector, before }) => {
          const viewport = document.querySelector<HTMLElement>(".ic-viewport");
          const row = document.querySelector<HTMLElement>(selector);
          return viewport && row
            ? Math.abs(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top - before)
            : Number.POSITIVE_INFINITY;
        },
        { selector, before }
      )
    )
    .toBeLessThanOrEqual(4);
}

const rowViewportOffset = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const row = document.querySelector<HTMLElement>(selector);
    return viewport && row ? row.getBoundingClientRect().top - viewport.getBoundingClientRect().top : null;
  }, selector);

async function topVisibleDayDateOrNull(page: Page) {
  try {
    return await topVisibleDayDate(page);
  } catch {
    return null;
  }
}

for (const scale of [5_000, 20_000]) {
  test(`keeps the drawn day anchored after excluding weekends with ${scale.toLocaleString()} events`, async ({
    page
  }) => {
    const dateKey = "2026-06-22";
    const calendarId = "marco-eggens";
    const rowSelector = `[data-testid="calendar-day"][data-date="${dateKey}"] [data-testid="calendar-row"][data-calendar-id="${calendarId}"]`;
    await page.goto("/");
    await page.getByTestId("api-latency-select").selectOption("0");
    await page.getByTestId("scale-select").selectOption(String(scale));
    await page.getByTestId("jump-date-input").fill(dateKey);
    await page.getByTestId("jump-time-input").fill("12:00");
    await page.getByTestId("go-date-button").click();
    await waitForDemoEvents(page);
    await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe(dateKey);

    await page.getByTestId("exclude-weekends").check();
    await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe(dateKey);
    await waitForDemoEvents(page);

    const rowAnchor = await rowViewportOffset(page, rowSelector);
    expect(rowAnchor).not.toBeNull();
    if (rowAnchor === null) return;
    const drawTarget = await horizontalDrawTarget(page, { calendarId, dateKey, distance: 120 });
    await page.mouse.move(drawTarget.startX, drawTarget.y);
    await page.mouse.down();
    await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 8 });
    await expect(page.getByTestId("draft-event")).toBeVisible();
    await page.mouse.up();
    await expect(page.getByTestId("external-event-popup")).toBeVisible();

    await expect
      .poll(async () => {
        const offset = await rowViewportOffset(
          page,
          `[data-testid="calendar-row"]:has([data-testid="draft-event"][data-calendar-id="${calendarId}"])`
        );
        return offset === null ? Number.POSITIVE_INFINITY : Math.abs(offset - rowAnchor);
      })
      .toBeLessThanOrEqual(4);

    await cancelAndKeepRowAnchored(page, rowSelector, rowAnchor);
    await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe(dateKey);
  });
}

test("keeps the calendar row position when cancelling external create", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const viewport = page.locator(".ic-viewport");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await selectPageText(page);
  await page.mouse.move(box.x + 310, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 650, box.y + 90);
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  const possibleRowAnchor = await rowViewportOffset(
    page,
    '[data-testid="calendar-row"]:has([data-testid="draft-event"])'
  );
  expect(possibleRowAnchor).not.toBeNull();
  if (possibleRowAnchor === null) return;

  await cancelAndKeepRowAnchored(
    page,
    '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-row"][data-calendar-id="dr-kirillov"]',
    possibleRowAnchor
  );
});

test("keeps a later participant calendar row anchored when cancelling external create", async ({ page }) => {
  await page.goto("/");
  await page.locator(".time-range label").filter({ hasText: "Start" }).locator("input").fill("1");
  await page.getByTestId("jump-date-input").fill("2026-07-08");
  await page.getByTestId("jump-time-input").fill("01:00");
  await page.getByTestId("go-date-button").click();

  const drawTarget = await page.evaluate(() => {
    const row = document.querySelector<HTMLElement>(
      '[data-testid="calendar-day"][data-date="2026-07-08"] [data-testid="calendar-row"][data-calendar-id="room-203"]'
    );
    const gridBox = row?.querySelector<HTMLElement>(".ic-row-grid")?.getBoundingClientRect();
    const rowBox = row?.getBoundingClientRect();
    if (!gridBox || !rowBox) {
      return null;
    }
    return {
      startX: gridBox.left + 40,
      endX: gridBox.left + 260,
      y: rowBox.top + rowBox.height / 2
    };
  });
  expect(drawTarget).not.toBeNull();
  if (!drawTarget) return;

  await page.mouse.move(drawTarget.startX, drawTarget.y);
  await page.mouse.down();
  await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  const possibleRowAnchor = await rowViewportOffset(
    page,
    '[data-testid="calendar-row"]:has([data-testid="draft-event"][data-calendar-id="room-203"])'
  );
  expect(possibleRowAnchor).not.toBeNull();
  if (possibleRowAnchor === null) return;

  await cancelAndKeepRowAnchored(
    page,
    '[data-testid="calendar-day"][data-date="2026-07-08"] [data-testid="calendar-row"][data-calendar-id="room-203"]',
    possibleRowAnchor
  );
});

test("keeps the drawn Marco date focused after adding participants and cancelling external create", async ({
  page
}) => {
  await page.goto("/");
  await page.getByTestId("scale-select").selectOption("5000");
  await page.getByTestId("jump-date-input").fill("2026-06-22");
  await page.getByTestId("jump-time-input").fill("12:00");
  await page.getByTestId("go-date-button").click();

  const drawTarget = await horizontalDrawTarget(page, {
    calendarId: "marco-eggens",
    dateKey: "2026-06-22",
    distance: 200
  });

  await page.mouse.move(drawTarget.startX, drawTarget.y);
  await page.mouse.down();
  await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  await page.getByTestId("draft-participant-dr-kirillov").check();
  await page.getByTestId("draft-participant-dr-thakker").check();
  await expect(page.getByTestId("draft-event")).toHaveCount(3);

  const marcoRowAnchor = await rowViewportOffset(
    page,
    '[data-testid="calendar-day"][data-date="2026-06-22"] [data-testid="calendar-row"][data-calendar-id="marco-eggens"]'
  );
  expect(marcoRowAnchor).not.toBeNull();
  if (marcoRowAnchor === null) return;

  await cancelAndKeepRowAnchored(
    page,
    '[data-testid="calendar-day"][data-date="2026-06-22"] [data-testid="calendar-row"][data-calendar-id="marco-eggens"]',
    marcoRowAnchor
  );
});

test("keeps the drawn Bhuvin date focused after adding Marco and Surgery B then cancelling external create", async ({
  page
}) => {
  await page.goto("/");
  await page.getByTestId("scale-select").selectOption("5000");
  await page.getByTestId("jump-date-input").fill("2026-05-23");
  await page.getByTestId("jump-time-input").fill("08:30");
  await page.getByTestId("go-date-button").click();

  const drawTarget = await horizontalDrawTarget(page, {
    calendarId: "dr-thakker",
    dateKey: "2026-05-23",
    distance: 285
  });

  await page.mouse.move(drawTarget.startX, drawTarget.y);
  await page.mouse.down();
  await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  await page.getByTestId("draft-participant-marco-eggens").check();
  await page.getByTestId("draft-participant-surgery-b").check();
  await expect(page.getByTestId("draft-event")).toHaveCount(3);

  const bhuvinRowAnchor = await rowViewportOffset(
    page,
    '[data-testid="calendar-day"][data-date="2026-05-23"] [data-testid="calendar-row"][data-calendar-id="dr-thakker"]'
  );
  expect(bhuvinRowAnchor).not.toBeNull();
  if (bhuvinRowAnchor === null) return;

  await cancelAndKeepRowAnchored(
    page,
    '[data-testid="calendar-day"][data-date="2026-05-23"] [data-testid="calendar-row"][data-calendar-id="dr-thakker"]',
    bhuvinRowAnchor
  );
});

test("does not transiently jump before recenter after cancelling a future multi-participant create", async ({
  page
}) => {
  const future = new Date();
  future.setDate(future.getDate() + 22);
  const futureDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  await page.goto("/");
  await page.getByTestId("scale-select").selectOption("5000");
  await page.getByTestId("jump-date-input").fill(futureDate);
  await page.getByTestId("jump-time-input").fill("08:45");
  await page.getByTestId("go-date-button").click();

  const drawTarget = await horizontalDrawTarget(page, {
    calendarId: "marco-eggens",
    dateKey: futureDate,
    distance: 200
  });

  await page.mouse.move(drawTarget.startX, drawTarget.y);
  await page.mouse.down();
  await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();

  await page.getByTestId("draft-participant-room-202").check();
  await page.getByTestId("draft-participant-surgery-a").check();
  await expect(page.getByTestId("draft-event")).toHaveCount(3);

  await page.getByTestId("draft-cancel-button").click();
  const immediateFocus = await page.evaluate((futureDate) => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const day = document.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${futureDate}"]`);
    const row = day?.querySelector<HTMLElement>('[data-testid="calendar-row"][data-calendar-id="marco-eggens"]');
    if (!viewport || !day || !row) return null;
    const viewportBox = viewport.getBoundingClientRect();
    const dayBox = day.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    return {
      dayVisible: dayBox.bottom > viewportBox.top && dayBox.top < viewportBox.bottom,
      rowOffset: Math.round(rowBox.top - viewportBox.top)
    };
  }, futureDate);
  expect(immediateFocus).not.toBeNull();
  expect(immediateFocus?.dayVisible).toBe(true);
  expect(immediateFocus?.rowOffset).toBeGreaterThanOrEqual(0);
  expect(immediateFocus?.rowOffset).toBeLessThan(260);

  await expectDraftFadeoutThenGone(page);
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
});

test("keeps the same calendar row anchored when drawing again after cancelling external create", async ({ page }) => {
  await page.goto("/");
  await page.locator(".time-range label").filter({ hasText: "Start" }).locator("input").fill("1");
  await page.getByTestId("jump-date-input").fill("2026-07-08");
  await page.getByTestId("jump-time-input").fill("01:00");
  await page.getByTestId("go-date-button").click();

  const rowOffset = async () =>
    page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      const row = document.querySelector<HTMLElement>(
        '[data-testid="calendar-day"][data-date="2026-07-09"] [data-testid="calendar-row"][data-calendar-id="dr-kirillov"]'
      );
      if (!viewport || !row) return null;
      return row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    });

  const draftOffset = async () =>
    page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      const draft = document.querySelector<HTMLElement>('[data-testid="draft-event"][data-calendar-id="dr-kirillov"]');
      if (!viewport || !draft) return null;
      return draft.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    });

  const drawOnKirillovJuly9 = async () => {
    const drawTarget = await page.evaluate(() => {
      const row = document.querySelector<HTMLElement>(
        '[data-testid="calendar-day"][data-date="2026-07-09"] [data-testid="calendar-row"][data-calendar-id="dr-kirillov"]'
      );
      const gridBox = row?.querySelector<HTMLElement>(".ic-row-grid")?.getBoundingClientRect();
      const rowBox = row?.getBoundingClientRect();
      if (!gridBox || !rowBox) {
        return null;
      }
      return {
        startX: gridBox.left + 50,
        endX: gridBox.left + 270,
        y: rowBox.top + rowBox.height / 2
      };
    });
    expect(drawTarget).not.toBeNull();
    if (!drawTarget) return;

    await page.mouse.move(drawTarget.startX, drawTarget.y);
    await page.mouse.down();
    await page.mouse.move(drawTarget.endX, drawTarget.y, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByTestId("external-event-popup")).toBeVisible();
  };

  const firstRowAnchor = await rowOffset();
  expect(firstRowAnchor).not.toBeNull();
  if (firstRowAnchor === null) return;

  await drawOnKirillovJuly9();
  await expect
    .poll(async () => Math.abs(((await draftOffset()) ?? Number.POSITIVE_INFINITY) - firstRowAnchor))
    .toBeLessThanOrEqual(4);

  await page.getByTestId("draft-cancel-button").click();
  await expectDraftFadeoutThenGone(page);
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect
    .poll(async () => Math.abs(((await rowOffset()) ?? Number.POSITIVE_INFINITY) - firstRowAnchor))
    .toBeLessThanOrEqual(4);

  const secondRowAnchor = await rowOffset();
  expect(secondRowAnchor).not.toBeNull();
  if (secondRowAnchor === null) return;

  await drawOnKirillovJuly9();
  for (const delay of [0, 100, 500, 1500, 2500]) {
    if (delay > 0) {
      await page.waitForTimeout(delay);
    }
    const nextDraftOffset = await draftOffset();
    expect(nextDraftOffset).not.toBeNull();
    if (nextDraftOffset !== null) {
      expect(Math.abs(nextDraftOffset - secondRowAnchor)).toBeLessThanOrEqual(4);
    }
  }
});
