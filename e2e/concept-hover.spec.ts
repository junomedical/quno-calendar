import { calendarInitial } from "#quno-e2e/concept-helpers";
import { test, expect, type Page } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
const ids = ["event-0", "overlap-1", "overlap-2"].map((id) => `2026-10-19-${id}`);
async function openOverlap(page: Page, vertical: boolean) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (vertical) await calendarInitial(page, { view: "infinite-vertical" });
  await page.goto("/concept");
  await page.locator(".concept-scenario button").filter({ hasText: "Overlapping events" }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "overlap");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator(`[data-event-id="${ids[2]}"]`)).toBeVisible();
}
for (const vertical of [false, true]) {
  test(`overlap preview reveals covered events during unpressed movement in ${vertical ? "vertical" : "horizontal"} view`, async ({
    page
  }) => {
    await openOverlap(page, vertical);
    const result = await page.evaluate(async () => {
      const calendar = document.querySelector(".concept-calendar")!;
      const cursor = document.querySelector<HTMLElement>(".concept-cursor")!;
      const moves: { buttons: number; button: number; correctHit: boolean }[] = [];
      const movingHovered = new Set<string>();
      const clicks: string[] = [];
      const gestures = new Set<string>();
      const movement = (event: Event) => {
        const pointer = event as PointerEvent;
        if (!pointer.isTrusted)
          moves.push({
            buttons: pointer.buttons,
            button: pointer.button,
            correctHit: document.elementFromPoint(pointer.clientX, pointer.clientY) === pointer.target
          });
      };
      const press = (event: Event) => clicks.push(event.type);
      calendar.addEventListener("pointermove", movement, true);
      ["pointerdown", "pointerup", "click"].forEach((name) => calendar.addEventListener(name, press, true));
      while (document.querySelector(".concept")?.getAttribute("data-playing") === "true") {
        gestures.add(cursor.dataset.gesture!);
        const hovered = calendar.querySelector<HTMLElement>('[data-status="hovered"]');
        if (hovered && cursor.dataset.gesture === "move") movingHovered.add(hovered.dataset.eventId!);
        await new Promise(requestAnimationFrame);
      }
      return { moves, movingHovered: [...movingHovered], clicks, gestures: [...gestures] };
    });
    expect(result.moves.length).toBeGreaterThan(20);
    expect(result.moves.every((move) => move.buttons === 0 && move.button === -1 && move.correctHit)).toBe(true);
    expect(result.movingHovered).toEqual(expect.arrayContaining(ids));
    expect(result.clicks).toEqual([]);
    expect(result.gestures).not.toEqual(expect.arrayContaining(["press"]));
    expect(result.gestures).not.toEqual(expect.arrayContaining(["release"]));
    await expect(page.locator(".concept-cursor")).toBeHidden();
    await expect(
      page.locator(
        '.concept-screen[data-active="true"] .concept-statusbar, .concept-fullscreen-dock .concept-statusbar'
      )
    ).not.toContainText("demonstration paused");
    await expect(page.locator('[data-action="event-title"]')).toHaveCount(0);
  });
  test(`real hover takes over and reaches appointments beneath expanded cards in ${vertical ? "vertical" : "horizontal"} view`, async ({
    page
  }) => {
    await openOverlap(page, vertical);
    await expect(page.locator(`[data-event-id="${ids[0]}"]`)).toHaveAttribute("data-status", "hovered");
    await expect(page.locator('.concept-cursor[data-gesture="hover"]')).toBeVisible();
    const points = await Promise.all(
      ids.slice(1).map(async (id) => {
        const box = (await page.locator(`[data-event-id="${id}"]`).boundingBox())!;
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      })
    );
    const covering = await page.evaluate(
      (point) => document.elementFromPoint(point.x, point.y)?.closest("[data-event-id]")?.getAttribute("data-event-id"),
      points[0]
    );
    expect(covering).toBe(ids[0]);
    // Moving into the covered lane takes over; the expanded card still receives the physical hit.
    for (let index = 0; index < points.length; index++) {
      await page.mouse.move(points[index].x, points[index].y, { steps: 10 });
      await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
      await expect(page.locator(`[data-event-id="${ids[index + 1]}"]`)).toHaveAttribute("data-status", "hovered");
    }
    await expect(page.locator('[data-action="event-title"]')).toHaveCount(0);
    await expect(page.locator(".concept-cursor")).toBeHidden();
  });
}
