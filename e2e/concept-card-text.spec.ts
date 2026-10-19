import { calendarInitial } from "#quno-e2e/concept-helpers";
import { test, expect, type Locator, type Page } from "@playwright/test";
test.describe.configure({ mode: "parallel" });

async function openCalendar(page: Page, vertical: boolean) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await calendarInitial(page, {
    view: vertical ? "infinite-vertical" : "infinite-horizontal",
    controls: ["zoom", "density"]
  });
  await page.goto("/concept");
  await page.getByRole("button", { name: "Full screen demo", exact: true }).click();
}

async function setZoom(page: Page, zoom: string) {
  await page.locator('[data-action="zoom"]').fill(zoom);
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-zoom", zoom);
  // Controlled zoom commits its projection in the following layout frame.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function textGeometry(card: Locator) {
  return card.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [...element.children].map((child) => {
      const node = child as HTMLElement;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        tag: node.tagName,
        visible: style.display !== "none",
        nowrap: style.whiteSpace === "nowrap",
        ellipsis: style.textOverflow === "ellipsis",
        shrink: style.flexShrink,
        height: rect.height,
        lineHeight: Number.parseFloat(style.lineHeight),
        inside: rect.top >= bounds.top && rect.bottom <= bounds.bottom,
        fits: node.scrollWidth <= node.clientWidth
      };
    });
  });
}

for (const vertical of [false, true]) {
  const view = vertical ? "vertical" : "horizontal";
  test(`concept card lines stay intact and hover reveals details across ${view} zoom levels`, async ({ page }) => {
    await openCalendar(page, vertical);
    const event = page.locator('[data-event-id="2026-10-19-event-0"]');
    const card = event.locator(".concept-event");
    for (const zoom of ["0.5", "1.3", "3", "8"]) {
      await setZoom(page, zoom);
      await event.scrollIntoViewIfNeeded();
      const compact = await textGeometry(card);
      for (const line of compact.filter((line) => line.visible)) {
        expect(line.nowrap).toBe(true);
        expect(line.ellipsis).toBe(true);
        expect(line.shrink).toBe("0");
        expect(line.height).toBe(line.lineHeight);
        expect(line.inside).toBe(true);
      }
      const before = await event.boundingBox();
      await event.hover();
      await expect(event).toHaveAttribute("data-status", "hovered");
      const after = (await event.boundingBox())!;
      expect(after.width).toBeGreaterThanOrEqual(vertical ? before!.width : Math.max(before!.width, 240));
      const revealed = await textGeometry(card);
      expect(revealed).toHaveLength(3);
      for (const line of revealed) {
        expect(line.visible && line.inside && line.fits && line.nowrap).toBe(true);
        expect(line.height).toBe(line.lineHeight);
      }
      await expect(page.locator('[data-action="event-title"]')).toHaveCount(0);
      await page.locator('[data-action="zoom"]').hover();
      await expect(event).not.toHaveAttribute("data-status", "hovered");
      expect((await event.boundingBox())!.width).toBeCloseTo(before!.width, 1);
    }
  });

  test(`packed ${view} cards keep a readable title at minimum zoom`, async ({ page }) => {
    await openCalendar(page, vertical);
    await page.locator('[data-action="density-400"]').click();
    await setZoom(page, "0.5");
    const event = page.locator('[data-event-id="2026-10-19-event-4"]');
    await expect(event).toBeAttached();
    await event.scrollIntoViewIfNeeded();
    const card = event.locator(".concept-event");
    const compact = await textGeometry(card);
    const title = compact.find((line) => line.tag === "STRONG")!;
    expect(title.visible && title.inside && title.nowrap).toBe(true);
    expect(title.height).toBe(title.lineHeight);
    expect(compact.find((line) => line.tag === "SMALL")!.visible).toBe(false);
    await event.hover();
    await expect(event).toHaveAttribute("data-status", "hovered");
    for (const line of await textGeometry(card)) expect(line.visible && line.inside && line.fits).toBe(true);
  });
}
