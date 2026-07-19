import { expect, test, type Page } from "@playwright/test";
import { firstViewportEventBox, goToWorkday } from "../helpers";

async function visibleTimelineCenterMinuteOffset(page: Page) {
  return page.locator(".ic-viewport").evaluate((viewport) => {
    const label = viewport.querySelector<HTMLElement>(".ic-row-label");
    const zoomText = document.querySelector<HTMLElement>('[data-testid="zoom-value"]')?.textContent;
    if (!label || !zoomText) throw new Error("Missing horizontal zoom geometry");
    const zoom = Number(zoomText);
    const timelineGutter = 8;
    const visibleTimelineWidth = Math.max(
      0,
      viewport.clientWidth - label.getBoundingClientRect().width - timelineGutter
    );
    return (viewport.scrollLeft + visibleTimelineWidth / 2) / zoom;
  });
}

test("keeps horizontal slider zoom continuous without replacing rendered content", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  await firstViewportEventBox(page);

  const viewport = page.locator(".ic-viewport");
  const zoom = page.getByTestId("zoom-slider");
  await zoom.fill("2");
  await expect(page.getByTestId("zoom-value")).toHaveText("2.00");
  await viewport.evaluate((element) => {
    element.scrollLeft = 360;
    const event = Array.from(element.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find(
      (candidate) => candidate.getBoundingClientRect().width > 0
    );
    const content = event?.firstElementChild;
    if (!event || !(content instanceof HTMLElement)) throw new Error("Missing event content to track");
    event.dataset.zoomStableShell = "true";
    content.dataset.zoomStableContent = "true";
  });

  const centerMinuteOffset = await visibleTimelineCenterMinuteOffset(page);
  for (const value of [2.6, 3.2, 2.4, 1.8]) {
    await zoom.fill(String(value));
    await expect(page.getByTestId("zoom-value")).toHaveText(value.toFixed(2));
    await expect
      .poll(async () => Math.abs((await visibleTimelineCenterMinuteOffset(page)) - centerMinuteOffset))
      .toBeLessThanOrEqual(1);
    await expect(page.locator('[data-zoom-stable-shell="true"]')).toHaveCount(1);
    await expect(page.locator('[data-zoom-stable-content="true"]')).toHaveCount(1);
    await expect(page.getByTestId("calendar-day")).not.toHaveCount(0);
    await expect(page.getByTestId("calendar-event")).not.toHaveCount(0);
  }
});
