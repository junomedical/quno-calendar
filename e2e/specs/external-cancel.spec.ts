import { expect, test } from "@playwright/test";
import { goToWorkday, selectPageText } from "../helpers";

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

  const possibleRowAnchor = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const draft = document.querySelector<HTMLElement>('[data-testid="draft-event"]');
    const row = draft?.closest<HTMLElement>('[data-testid="calendar-row"]');
    if (!viewport || !row) return null;
    return row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  });
  expect(possibleRowAnchor).not.toBeNull();
  if (possibleRowAnchor === null) return;

  await page.getByTestId("draft-cancel-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
  await expect
    .poll(async () =>
      page.evaluate((before) => {
        const viewport = document.querySelector<HTMLElement>(".ic-viewport");
        const day = document.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date="2026-07-06"]');
        const row = day?.querySelector<HTMLElement>('[data-testid="calendar-row"][data-calendar-id="dr-kirillov"]');
        if (!viewport || !row) return Number.POSITIVE_INFINITY;
        return Math.abs(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top - before);
      }, possibleRowAnchor)
    )
    .toBeLessThanOrEqual(4);
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

  const possibleRowAnchor = await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const draft = document.querySelector<HTMLElement>('[data-testid="draft-event"][data-calendar-id="room-203"]');
    const row = draft?.closest<HTMLElement>('[data-testid="calendar-row"]');
    if (!viewport || !row) return null;
    return row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  });
  expect(possibleRowAnchor).not.toBeNull();
  if (possibleRowAnchor === null) return;

  await page.getByTestId("draft-cancel-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
  await expect
    .poll(async () =>
      page.evaluate((before) => {
        const viewport = document.querySelector<HTMLElement>(".ic-viewport");
        const row = document.querySelector<HTMLElement>(
          '[data-testid="calendar-day"][data-date="2026-07-08"] [data-testid="calendar-row"][data-calendar-id="room-203"]'
        );
        if (!viewport || !row) return Number.POSITIVE_INFINITY;
        return Math.abs(row.getBoundingClientRect().top - viewport.getBoundingClientRect().top - before);
      }, possibleRowAnchor)
    )
    .toBeLessThanOrEqual(4);
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
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.getByTestId("draft-event")).toHaveCount(0);
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
