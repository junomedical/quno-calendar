import { expect, test } from "@playwright/test";
import { firstViewportEventBox, goToWorkday } from "../helpers";

test("shows delayed external save errors in the edit popup", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  const eventBox = await firstViewportEventBox(page);

  await page.mouse.click(eventBox.x + Math.min(20, eventBox.width / 2), eventBox.y + eventBox.height / 2);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await page.getByTestId("draft-title-input").fill("fail delayed save");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("draft-save-button")).toBeDisabled();
  await expect(page.getByTestId("draft-save-button")).toContainText("Saving...");
  await expect(page.getByTestId("demo-message")).toContainText("Saving external edit");

  await expect(page.getByTestId("draft-save-error")).toContainText("Simulated save failed");
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.getByTestId("draft-title-input")).toHaveValue("fail delayed save");
  await expect(page.getByTestId("demo-message")).toContainText("External save failed");

  await page.getByTestId("draft-title-input").fill("Recovered delayed save");
  await expect(page.getByTestId("draft-save-error")).toHaveCount(0);
  await expect(page.getByTestId("draft-save-button")).toBeEnabled();
});

test("renders a saved external create in the vertical view", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  await goToWorkday(page, "2026-07-06");

  const draw = await page.evaluate(() => {
    const column = document.querySelector<HTMLElement>(
      '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-column"][data-calendar-id="dr-thakker"]'
    );
    if (!column) {
      return null;
    }
    const box = column.getBoundingClientRect();
    const zoomText = document.querySelector<HTMLElement>('[data-testid="zoom-value"]')?.textContent ?? "1";
    const zoom = Number.parseFloat(zoomText);
    const yForMinute = (minute: number) => box.top + 8 + (minute - 8 * 60) * zoom;
    return {
      x: box.left + box.width / 2,
      startY: yForMinute(10 * 60),
      endY: yForMinute(12 * 60)
    };
  });
  expect(draw).not.toBeNull();
  if (!draw) return;

  await page.mouse.move(draw.x, draw.startY);
  await page.mouse.down();
  await page.mouse.move(draw.x, draw.endY, { steps: 8 });
  await expect(page.getByTestId("draft-event")).toBeVisible();
  await page.mouse.up();

  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  await expect(page.getByTestId("draft-start-input")).toHaveValue("10:00");
  await expect(page.getByTestId("draft-duration-input")).toHaveValue("120");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("demo-message")).toContainText("Saved external create");

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const column = document.querySelector<HTMLElement>(
          '[data-testid="calendar-day"][data-date="2026-07-06"] [data-testid="calendar-column"][data-calendar-id="dr-thakker"]'
        );
        const columnBox = column?.getBoundingClientRect();
        if (!column || !columnBox) {
          return null;
        }
        const saved = Array.from(column.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find((event) =>
          event.textContent?.includes("New appointment")
        );
        if (!saved) {
          return null;
        }
        const eventBox = saved.getBoundingClientRect();
        return {
          calendarId: saved.dataset.calendarId,
          top: Math.round(eventBox.top - columnBox.top),
          height: Math.round(eventBox.height)
        };
      })
    )
    .toMatchObject({
      calendarId: "dr-thakker",
      top: expect.any(Number),
      height: expect.any(Number)
    });
});
