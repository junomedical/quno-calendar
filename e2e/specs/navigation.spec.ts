import { expect, test, type Page } from "@playwright/test";
import { goToWorkday, setDemoZoom, todayDateKey, topVisibleDayDate, waitForDemoEvents } from "#quno-e2e/helpers";

async function setCalendarCount(page: Page, count: string) {
  await page.getByTestId("calendar-count").fill(count);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );
}

async function topVisibleDayDateOrNull(page: Page) {
  try {
    return await topVisibleDayDate(page);
  } catch {
    return null;
  }
}

const rowViewportOffset = (page: Page, dateKey: string, calendarId: string) =>
  page.evaluate(
    ({ dateKey, calendarId }) => {
      const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport");
      const row = document.querySelector<HTMLElement>(
        `[data-testid="calendar-day"][data-date="${dateKey}"] [data-testid="calendar-row"][data-calendar-id="${calendarId}"]`
      );
      return viewport && row ? row.getBoundingClientRect().top - viewport.getBoundingClientRect().top : null;
    },
    { dateKey, calendarId }
  );

test("default sidebar navigates with Quno Date Input and omits time and add controls", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  const input = page.getByTestId("jump-date-input");
  await expect(input).toHaveClass(/quno-date-picker-input/);
  await expect(input).toHaveJSProperty("type", "text");
  await expect(page.getByTestId("jump-time-input")).toHaveCount(0);
  await expect(page.getByTestId("external-add-button")).toHaveCount(0);
  await input.fill("12 August 2026");
  await expect(input).toHaveValue("12 August 2026");
  await input.press("Enter");
  await expect(input).toHaveAttribute("data-recognition", "recognized");
  await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe("2026-08-12");
});

test("retains visible workday and event nodes when weekends are excluded", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page, "2026-07-06");
  await waitForDemoEvents(page);
  const day = page.locator('[data-testid="calendar-day"][data-date="2026-07-06"]');
  const dayNode = await day.elementHandle();
  const eventNodes = await day.getByTestId("calendar-event").elementHandles();
  const beforeTop = await day.evaluate((element) => element.getBoundingClientRect().top);
  expect(dayNode).not.toBeNull();
  expect(eventNodes.length).toBeGreaterThan(0);

  await page.getByTestId("exclude-weekends").check();
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );

  expect(await dayNode?.evaluate((element) => element.isConnected)).toBe(true);
  for (const eventNode of eventNodes) {
    const state = await eventNode.evaluate((element) => ({
      connected: element.isConnected,
      calendarId: (element as HTMLElement).closest<HTMLElement>('[data-testid="calendar-row"]')?.dataset.calendarId,
      renderedCalendarId: (element as HTMLElement).dataset.calendarId,
      dateKey: (element as HTMLElement).closest<HTMLElement>('[data-testid="calendar-day"]')?.dataset.date
    }));
    expect(state).toMatchObject({ connected: true, dateKey: "2026-07-06" });
    expect(state.calendarId).toBe(state.renderedCalendarId);
  }
  const afterTop = await day.evaluate((element) => element.getBoundingClientRect().top);
  expect(Math.abs(afterTop - beforeTop)).toBeLessThanOrEqual(1);
});

test("reports settled viewport scrolling and programmatic repositioning", async ({ page }) => {
  // This scenario needs working-hour events, independently of the machine clock.
  await page.clock.setFixedTime(new Date("2026-07-06T09:00:00+02:00"));
  await page.goto("/demo/infinite-calendar");
  await waitForDemoEvents(page);
  const viewport = page.locator(".quno-calendar-viewport");
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;

  await page.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
  await page.mouse.wheel(0, 420);
  await expect(page.getByTestId("demo-activity-entry").filter({ hasText: "Viewport scrolled" }).last()).toBeVisible();

  await goToWorkday(page, "2026-08-12");
  await expect(
    page.getByTestId("demo-activity-entry").filter({ hasText: "Viewport repositioned" }).last()
  ).toBeVisible();
  await expect(page.getByRole("log", { name: "Demo activity" })).toContainText(/top \d+px, left \d+px/);
});

test("keeps the active day when calendar count changes and supports date navigation", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  const viewport = page.locator(".quno-calendar-viewport");

  await setDemoZoom(page, 4);
  await goToWorkday(page, "2026-08-12");
  await expect(page.getByTestId("demo-message")).toContainText("2026-08-12");
  await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe("2026-08-12");

  await setCalendarCount(page, "3");
  await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe("2026-08-12");

  const visibleDate = await topVisibleDayDate(page);
  await viewport.evaluate((element) => {
    element.scrollTop += 90;
  });
  await page.waitForTimeout(40);
  const rowBeforeIncrease = await rowViewportOffset(page, visibleDate, "dr-thakker");
  expect(rowBeforeIncrease).not.toBeNull();
  await setCalendarCount(page, "9");
  await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe(visibleDate);
  await expect
    .poll(async () => Math.abs((await rowViewportOffset(page, visibleDate, "dr-thakker"))! - rowBeforeIncrease!))
    .toBeLessThanOrEqual(1);

  const rowBeforeReduction = await rowViewportOffset(page, visibleDate, "dr-thakker");
  expect(rowBeforeReduction).not.toBeNull();
  await setCalendarCount(page, "2");
  await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe(visibleDate);
  await expect
    .poll(async () => Math.abs((await rowViewportOffset(page, visibleDate, "dr-thakker"))! - rowBeforeReduction!))
    .toBeLessThanOrEqual(1);

  await page.getByTestId("today-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("today");
  await expect.poll(async () => topVisibleDayDateOrNull(page)).toBe(todayDateKey());
});

test("recenters the horizontal virtual window after a large date scroll", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  const viewport = page.locator(".quno-calendar-viewport");

  await goToWorkday(page, "2026-07-06");
  await expect.poll(async () => topVisibleDayDate(page)).toBe("2026-07-06");

  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight - element.clientHeight - 5;
  });
  await expect
    .poll(async () => {
      try {
        return await topVisibleDayDate(page);
      } catch {
        return null;
      }
    })
    .not.toBeNull();

  await expect
    .poll(
      async () =>
        viewport.evaluate((element) => element.scrollTop / Math.max(1, element.scrollHeight - element.clientHeight)),
      { timeout: 5_000 }
    )
    .toBeLessThan(0.75);
  await expect.poll(async () => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(1_000);
  await expect
    .poll(async () => {
      try {
        return await topVisibleDayDate(page);
      } catch {
        return null;
      }
    })
    .not.toBeNull();
});
