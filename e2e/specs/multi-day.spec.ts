import { expect, test, type Locator, type Page } from "@playwright/test";

async function openDemo(page: Page, vertical: boolean) {
  await page.setViewportSize({ width: 1500, height: 1100 });
  await page.goto("/docs/infinite-calendar#multi-day-events");
  await page.locator("#multi-day-events").scrollIntoViewIfNeeded();
  const demo = page.getByTestId("article-multi-day-demo");
  await expect(demo).toBeVisible();
  await demo.getByRole("button", { name: "Full screen", exact: true }).click();
  if (vertical) await demo.getByLabel("Multi-day orientation").selectOption("infinite-vertical");
  await demo.getByRole("button", { name: "Show middle", exact: true }).click();
  await expect(demo.locator('[data-event-id="overnight"][data-date="2026-07-07"]')).toBeVisible();
  return demo;
}

async function values(demo: Locator, id: string) {
  return demo
    .locator(`[data-event-record-id="${id}"]`)
    .evaluate((element) => ({ start: element.getAttribute("data-start")!, end: element.getAttribute("data-end")! }));
}

async function moveFromMinute(
  page: Page,
  demo: Locator,
  vertical: boolean,
  source: Locator,
  minute: number,
  destinationDate: string,
  destinationMinute: number,
  destinationCalendar = "night-b"
) {
  await source.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  expect(sourceBox).not.toBeNull();
  const scale = await source.evaluate((element, vertical) => {
    const grid = element.closest(vertical ? ".icv-calendar-column-grid" : ".quno-calendar-row-grid")!;
    const size = getComputedStyle(grid).backgroundSize.split(" ");
    return parseFloat(size[vertical ? 1 : 0]) / 15;
  }, vertical);
  const x = vertical ? sourceBox!.x + sourceBox!.width / 2 : sourceBox!.x + minute * scale;
  const y = vertical ? sourceBox!.y + minute * scale : sourceBox!.y + sourceBox!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  // Native scroll while captured keeps the same logical grabbed point.
  const day = demo.locator(`[data-testid="calendar-day"][data-date="${destinationDate}"]`);
  const offset = await day.evaluate((element) => (element as HTMLElement).offsetTop);
  await demo.locator(".quno-calendar-viewport").evaluate((element, offset) => {
    element.scrollTop = offset;
  }, offset);
  const selector = vertical ? ".icv-calendar-column-grid" : ".quno-calendar-row-grid";
  const grid = day.locator(`${selector}[data-calendar-id="${destinationCalendar}"]`);
  await expect(grid).toBeVisible();
  const target = await grid.boundingBox();
  const targetX = vertical ? target!.x + target!.width / 2 : target!.x + 8 + destinationMinute * scale;
  const targetY = vertical ? target!.y + 8 + destinationMinute * scale : target!.y + target!.height / 2;
  await page.mouse.move(targetX, targetY, { steps: 8 });
  return { targetX, targetY, scale };
}

for (const vertical of [false, true]) {
  const orientation = vertical ? "vertical" : "horizontal";
  test(`${orientation}: renders daily geometry, continuation flags and independent layers`, async ({ page }) => {
    const demo = await openDemo(page, vertical);
    const middle = demo.locator(
      '[data-testid="calendar-event"][data-event-id="multi-day"][data-date="2026-07-07"][data-calendar-id="night-a"]'
    );
    await expect(middle).toHaveAttribute("data-continues-before", "true");
    await expect(middle).toHaveAttribute("data-continues-after", "true");
    const bounds = await middle.boundingBox();
    expect(vertical ? bounds!.height : bounds!.width).toBeGreaterThanOrEqual(720);
    const availability = demo.locator('[data-testid="availability-event"][data-date="2026-07-07"]');
    expect(Number(await middle.evaluate((element) => getComputedStyle(element).zIndex))).toBeGreaterThan(
      Number(await availability.evaluate((element) => getComputedStyle(element).zIndex))
    );
    const original = await values(demo, "multi-day");
    await demo.getByLabel("Working hours only").check();
    await demo.getByRole("button", { name: "Show middle", exact: true }).click();
    const clipped = await middle.boundingBox();
    expect(vertical ? clipped!.height : clipped!.width).toBeGreaterThanOrEqual(300);
    expect(await values(demo, "multi-day")).toEqual(original);
    await expect(demo.locator('[data-event-id="overnight"]')).toHaveCount(0);
  });

  test(`${orientation}: uses the shared guide card appearance and segment clocks`, async ({ page }) => {
    const demo = await openDemo(page, vertical);
    const shell = demo.locator(
      '[data-testid="calendar-event"][data-event-id="multi-day"][data-date="2026-07-07"][data-calendar-id="night-a"]'
    );
    const card = shell.locator(".article-event-card");
    await expect(card).toBeVisible();
    await expect(card.locator(".article-event-card__time")).toHaveText("← 00:00–24:00 →");
    await expect(card).toHaveCSS("border-radius", "6px");
    await expect(card).toHaveCSS("border-left-width", "5px");
    await expect(card).toHaveCSS("border-left-style", "solid");
    const appearance = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        fontFamily: style.fontFamily,
        borderRadius: style.borderRadius,
        borderLeftWidth: style.borderLeftWidth
      };
    });
    await expect(
      demo.locator('[data-testid="availability-event"][data-date="2026-07-07"] .article-event-card')
    ).toHaveClass(/kind-availability/);
    await demo.getByRole("button", { name: "Exit full screen", exact: true }).click();
    await page.locator("#read-only").scrollIntoViewIfNeeded();
    const reference = page
      .getByTestId("article-read-only-demo")
      .locator('[data-event-id="follow-up-a"] .article-event-card');
    await expect(reference).toBeAttached();
    expect(
      await reference.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          boxShadow: style.boxShadow,
          fontFamily: style.fontFamily,
          borderRadius: style.borderRadius,
          borderLeftWidth: style.borderLeftWidth
        };
      })
    ).toEqual(appearance);
  });

  test(`${orientation}: dragging a later-day hour preserves the grabbed anchor and full duration`, async ({ page }) => {
    const demo = await openDemo(page, vertical);
    const before = await values(demo, "overnight");
    const source = demo.locator('[data-testid="calendar-event"][data-event-id="overnight"][data-date="2026-07-07"]');
    const { targetX, targetY, scale } = await moveFromMinute(
      page,
      demo,
      vertical,
      source,
      60,
      "2026-07-08",
      180,
      "night-a"
    );
    const preview = demo.locator('[data-testid="drag-preview-event"][data-date="2026-07-08"]');
    await expect(preview).toBeVisible();
    const box = await preview.boundingBox();
    expect(
      Math.abs((vertical ? box!.y + 180 * scale : box!.x + 180 * scale) - (vertical ? targetY : targetX))
    ).toBeLessThan(2);
    await page.mouse.up();
    await expect.poll(async () => (await values(demo, "overnight")).start).not.toBe(before.start);
    const after = await values(demo, "overnight");
    expect(Date.parse(after.end) - Date.parse(after.start)).toBe(4 * 3600000);
    const clocks = await page.evaluate(
      ({ start, end }) => ({
        start: new Date(start).getHours(),
        end: new Date(end).getHours(),
        date: new Date(start).getDate()
      }),
      after
    );
    expect(clocks).toEqual({ start: 0, end: 4, date: 8 });
    await expect(demo.locator('[data-event-id="overnight"][data-date="2026-07-07"]')).toHaveCount(0);
    await expect(demo.getByTestId("drag-preview-event")).toHaveCount(0);
  });

  for (const anchor of ["beginning", "ending"] as const) {
    test(`${orientation}: keeps the ${anchor} grab anchored across dates and resource changes`, async ({ page }) => {
      const demo = await openDemo(page, vertical);
      await demo.getByRole("button", { name: `Show ${anchor}`, exact: true }).click();
      const date = anchor === "beginning" ? "2026-07-06" : "2026-07-08";
      const source = demo.locator(
        `[data-testid="calendar-event"][data-event-id="multi-day"][data-date="${date}"][data-calendar-id="night-a"]`
      );
      const before = await values(demo, "multi-day");
      await moveFromMinute(
        page,
        demo,
        vertical,
        source,
        anchor === "beginning" ? 30 : 600,
        "2026-07-09",
        180,
        "night-b"
      );
      await page.mouse.up();
      await expect.poll(async () => (await values(demo, "multi-day")).start).not.toBe(before.start);
      const after = await values(demo, "multi-day");
      const result = await page.evaluate(
        ({ start, end }) => ({
          startDay: new Date(start).getDate(),
          startHour: new Date(start).getHours(),
          startMinute: new Date(start).getMinutes(),
          endDay: new Date(end).getDate(),
          endHour: new Date(end).getHours()
        }),
        after
      );
      expect(result).toEqual(
        anchor === "beginning"
          ? { startDay: 9, startHour: 2, startMinute: 30, endDay: 10, endHour: 21 }
          : { startDay: 7, startHour: 9, startMinute: 0, endDay: 9, endHour: 4 }
      );
      expect(Date.parse(after.end) - Date.parse(after.start)).toBe(43 * 3600000);
      await expect(
        demo.locator('[data-testid="calendar-event"][data-event-id="multi-day"][data-calendar-id="night-b"]')
      ).not.toHaveCount(0);
    });
  }

  test(`${orientation}: rejected moves and controlled multi-day drafts preserve saved data`, async ({ page }) => {
    const demo = await openDemo(page, vertical);
    const original = await values(demo, "overnight");
    await demo.getByLabel("Reject moves").check();
    await moveFromMinute(
      page,
      demo,
      vertical,
      demo.locator('[data-event-id="overnight"][data-date="2026-07-07"]'),
      60,
      "2026-07-08",
      180
    );
    await page.mouse.up();
    await expect(demo).toContainText("Move rejected");
    expect(await values(demo, "overnight")).toEqual(original);
    await demo.getByRole("button", { name: "Show middle", exact: true }).click();
    await demo.getByRole("button", { name: "Edit multi-day draft", exact: true }).click();
    const source = demo.locator(
      '[data-testid="draft-event"][data-event-id="multi-day"][data-date="2026-07-07"][data-calendar-id="night-a"]'
    );
    await expect(source).toBeVisible();
    const before = await values(demo, "multi-day");
    await moveFromMinute(page, demo, vertical, source, 60, "2026-07-08", 180, "night-a");
    await page.mouse.up();
    const after = await values(demo, "multi-day");
    expect(Date.parse(after.end) - Date.parse(after.start)).toBe(Date.parse(before.end) - Date.parse(before.start));
    expect(after.start).not.toBe(before.start);
    await demo.getByRole("button", { name: "Cancel multi-day draft", exact: true }).click();
    expect(await values(demo, "multi-day")).toEqual(before);
  });
}
