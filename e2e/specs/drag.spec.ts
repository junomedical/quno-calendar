import { expect, test } from "@playwright/test";
import { firstDuplicatedViewportEvent, goToWorkday, selectPageText, waitForDemoEvents } from "#quno-e2e/helpers";

test("supports dragging an event to another time", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page);
  await waitForDemoEvents(page);
  const initialEventCount = await page.getByTestId("calendar-event").count();
  const duplicate = await firstDuplicatedViewportEvent(page);
  const [box] = duplicate.boxes;
  const gridBox = await page
    .locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"]`)
    .first()
    .evaluate((element) => {
      const grid = element.closest(".quno-calendar-row-grid");
      const rect = grid?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right } : null;
    });
  expect(gridBox).not.toBeNull();
  if (!gridBox) return;
  const targetX = Math.max(gridBox.left + 12, Math.min(box.x + 80, gridBox.right - 12));

  await selectPageText(page);
  await page.mouse.move(box.x + 12, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(targetX, box.y + 12);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await expect(
    page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"] [data-render-status="dragging"]`)
  ).toHaveCount(duplicate.boxes.length);
  expect(await page.getByTestId("drag-preview-event").count()).toBeGreaterThanOrEqual(duplicate.boxes.length);
  await expect(page.locator('[data-render-status="dragging"]').first()).toHaveCSS("opacity", "0.5");
  for (const selector of [".quno-calendar-viewport", "body", "html"]) {
    const selectionStyle = await page.locator(selector).evaluate((element) => {
      const style = getComputedStyle(element);
      return style.userSelect || style.webkitUserSelect;
    });
    expect(selectionStyle).toBe("none");
  }
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toBe("");
  expect(await page.locator('[data-render-status="hovered"]').count()).toBe(0);
  expect(await page.getByTestId("calendar-event").count()).toBe(initialEventCount);
  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText(/Move accepted|Move rejected/);
});

test("keeps visible event cache populated after dropping on another day", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page);
  await waitForDemoEvents(page);

  const dragTarget = await page.evaluate(() => {
    const viewportBox = document.querySelector<HTMLElement>(".quno-calendar-viewport")?.getBoundingClientRect();
    if (!viewportBox) {
      return null;
    }
    const visibleEvents = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]'));
    for (const event of visibleEvents) {
      const eventBox = event.getBoundingClientRect();
      const sourceRow = event.closest<HTMLElement>('[data-testid="calendar-row"]');
      const sourceDay = event.closest<HTMLElement>('[data-testid="calendar-day"]');
      const calendarId = event.dataset.calendarId;
      if (
        !sourceRow ||
        !sourceDay ||
        !calendarId ||
        event.textContent?.startsWith("Locked") ||
        calendarId === "blocked-calendar" ||
        eventBox.top < viewportBox.top + 92 ||
        eventBox.bottom > viewportBox.bottom - 8
      ) {
        continue;
      }
      const sourceDate = sourceDay.dataset.date;
      const laterDays = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).filter(
        (day) => day.dataset.date && day.dataset.date !== sourceDate
      );
      for (const day of laterDays) {
        const targetRow = day.querySelector<HTMLElement>(
          `[data-testid="calendar-row"][data-calendar-id="${calendarId}"]`
        );
        const targetGrid = targetRow?.querySelector<HTMLElement>(".quno-calendar-row-grid");
        if (!targetRow || !targetGrid) {
          continue;
        }
        const rowBox = targetRow.getBoundingClientRect();
        const gridBox = targetGrid.getBoundingClientRect();
        if (rowBox.top < viewportBox.top + 92 || rowBox.bottom > viewportBox.bottom - 8) {
          continue;
        }
        const targetX = Math.min(Math.max(eventBox.left + 72, gridBox.left + 24), gridBox.right - 24);
        return {
          sourceX: eventBox.left + Math.min(16, eventBox.width / 2),
          sourceY: eventBox.top + Math.min(16, eventBox.height / 2),
          targetX,
          targetY: rowBox.top + Math.min(24, rowBox.height / 2),
          baselineVisibleEvents: visibleEvents.filter((candidate) => {
            const box = candidate.getBoundingClientRect();
            return (
              box.width > 0 &&
              box.height > 0 &&
              box.right > viewportBox.left &&
              box.left < viewportBox.right &&
              box.bottom > viewportBox.top &&
              box.top < viewportBox.bottom
            );
          }).length
        };
      }
    }
    return null;
  });
  expect(dragTarget).not.toBeNull();
  if (!dragTarget) return;

  await page.mouse.move(dragTarget.sourceX, dragTarget.sourceY);
  await page.mouse.down();
  await page.mouse.move(dragTarget.targetX, dragTarget.targetY, { steps: 12 });
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();

  await page.evaluate(() => {
    const samples: number[] = [];
    const visibleCommittedEventCount = () => {
      const viewportBox = document.querySelector<HTMLElement>(".quno-calendar-viewport")?.getBoundingClientRect();
      if (!viewportBox) {
        return 0;
      }
      return Array.from(
        document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"], [data-testid="availability-event"]')
      ).filter((event) => {
        const box = event.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.right > viewportBox.left &&
          box.left < viewportBox.right &&
          box.bottom > viewportBox.top &&
          box.top < viewportBox.bottom
        );
      }).length;
    };
    const sample = (remainingFrames: number) => {
      samples.push(visibleCommittedEventCount());
      if (remainingFrames > 0) {
        requestAnimationFrame(() => sample(remainingFrames - 1));
      }
    };
    (window as typeof window & { __dropVisibleEventSamples?: number[] }).__dropVisibleEventSamples = samples;
    sample(18);
  });

  await page.mouse.up();
  await expect(page.getByTestId("demo-message")).toContainText("Move accepted");
  await page.waitForTimeout(160);
  const samples = await page.evaluate(
    () => (window as typeof window & { __dropVisibleEventSamples?: number[] }).__dropVisibleEventSamples
  );
  expect(Math.min(...(samples ?? [0]))).toBeGreaterThanOrEqual(Math.max(1, dragTarget.baselineVisibleEvents - 2));
});

test("does not open an editor or move an event dragged back to its starting slot", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page);
  await waitForDemoEvents(page);
  const duplicate = await firstDuplicatedViewportEvent(page);
  const [box] = duplicate.boxes;
  const x = box.x + 12;
  const y = box.y + 12;
  const source = page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"]`).first();
  const initialBox = await source.boundingBox();
  const initialCount = await page.getByTestId("calendar-event").count();

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y, { steps: 5 });
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await page.mouse.move(x, y, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByTestId("drag-preview-event")).toHaveCount(0);
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await expect(page.getByTestId("demo-message")).not.toContainText(/Move accepted|Move rejected/);
  expect(await page.getByTestId("calendar-event").count()).toBe(initialCount);
  const finalBox = await source.boundingBox();
  expect(finalBox).not.toBeNull();
  expect(Math.abs(finalBox!.x - initialBox!.x)).toBeLessThan(2);
  expect(Math.abs(finalBox!.y - initialBox!.y)).toBeLessThan(2);

  await page.mouse.click(x, y);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
});

test("activates instead of moving after one-pixel jitter across a snap boundary", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page);
  await page.getByTestId("snap-select").selectOption("5");
  await waitForDemoEvents(page);
  const duplicate = await firstDuplicatedViewportEvent(page);
  const source = page.locator(`[data-testid="calendar-event"][data-event-id="${duplicate.id}"]`).first();
  const press = await source.evaluate((element) => {
    const grid = element.closest(".quno-calendar-row-grid");
    if (!grid) return null;
    const style = getComputedStyle(grid);
    const origin = grid.getBoundingClientRect().left + parseFloat(style.backgroundPositionX);
    // The default visual grid has fifteen-minute cells; snapping is set to five minutes above.
    const snapWidth = parseFloat(style.backgroundSize) / 3;
    const box = element.getBoundingClientRect();
    const boundary = origin + (Math.ceil((box.left + 8 - origin) / snapWidth - 0.5) + 0.5) * snapWidth;
    return { x: boundary - 0.5, y: box.top + 12, right: box.right };
  });
  expect(press).not.toBeNull();
  if (!press) return;
  expect(press.x + 1).toBeLessThan(press.right);
  await page.mouse.move(press.x, press.y);
  await page.mouse.down();
  await page.mouse.move(press.x + 1, press.y);
  await expect(page.getByTestId("drag-preview-event").first()).toBeVisible();
  await page.mouse.up();
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.getByTestId("drag-preview-event")).toHaveCount(0);
  await expect(page.getByTestId("demo-message")).not.toContainText(/Move accepted|Move rejected/);
});
