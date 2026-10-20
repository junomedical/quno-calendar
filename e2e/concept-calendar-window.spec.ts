import { expect, test } from "@playwright/test";
import { selectCalendarScene } from "#quno-e2e/concept-helpers";

test.describe.configure({ mode: "parallel" });

for (const width of [1440, 390]) {
  test(`busy-schedule guide fills its embedded calendar at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/guide/infinite-calendar");
    await page.locator('[data-demo-label="event density comparison"]').scrollIntoViewIfNeeded();
    const demo = page.getByTestId("density-guide-demo");
    const workspace = demo.locator(".concept-calendar-workspace");
    const viewport = demo.locator(".quno-calendar-viewport");
    await expect(workspace).toHaveCSS("height", "560px");
    const container = (await demo.boundingBox())!;
    for (const density of [4, 20, 60]) {
      await demo.locator(`[data-action="density-${density}"]`).click();
      await expect(workspace).toHaveAttribute("data-density", String(density));
      const events = demo.locator(
        '[data-testid="calendar-day"][data-date="2026-10-19"] [data-testid="calendar-event"]'
      );
      await expect(events).toHaveCount(density);
      for (let resource = 0; resource < 4; resource++)
        await expect(events.and(demo.locator(`[data-calendar-id="person-${resource}"]`))).toHaveCount(density / 4);
      const calendar = (await viewport.boundingBox())!;
      expect(calendar.height).toBeGreaterThanOrEqual(550);
      expect(calendar.width).toBeCloseTo(container.width - 2, 0);
      expect(calendar.y).toBeCloseTo(container.y + 1, 0);
      const controls = (await demo.locator(".concept-controls").boundingBox())!;
      expect(controls.y + controls.height).toBeLessThanOrEqual(container.y + container.height);
    }
  });

  for (const path of ["/concept", "/guide/infinite-calendar"]) {
    test(`${path} keeps a smaller scroll window and recenters without moving dates at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const viewport =
        path === "/concept"
          ? page.locator(".quno-calendar-viewport")
          : page.getByTestId("article-infinite-demo").locator(".quno-calendar-viewport");
      await viewport.scrollIntoViewIfNeeded();
      await expect(viewport.locator('[data-testid="calendar-event"]').first()).toBeVisible();
      const dimensions = await viewport.evaluate((node) => ({
        total: node.scrollHeight,
        day: node.querySelector('[data-testid="calendar-day"]')!.getBoundingClientRect().height
      }));
      expect(dimensions.total / dimensions.day).toBeCloseTo(15, 0);
      const before = await viewport.evaluate(async (node) => {
        node.scrollTop += node.clientHeight * 2;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const top = node.getBoundingClientRect().top;
        const day = [...node.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')].find((day) => {
          const box = day.getBoundingClientRect();
          return box.top <= top + 1 && box.bottom > top + 1;
        })!;
        return { date: day.dataset.date!, offset: day.getBoundingClientRect().top - top };
      });
      await expect
        .poll(() => viewport.evaluate((node) => node.scrollTop / (node.scrollHeight - node.clientHeight)))
        .toBeGreaterThan(0.35);
      await expect
        .poll(() => viewport.evaluate((node) => node.scrollTop / (node.scrollHeight - node.clientHeight)))
        .toBeLessThan(0.65);
      const restored = viewport.locator(`[data-testid="calendar-day"][data-date="${before.date}"]`);
      expect((await restored.boundingBox())!.y - (await viewport.boundingBox())!.y).toBeCloseTo(before.offset, 0);
    });
  }

  test(`autoplay scrolling recenters its scrollbar during the pause at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await selectCalendarScene(page, "Infinite scroll");
    const viewport = page.locator(".quno-calendar-viewport");
    const ratio = () => viewport.evaluate((node) => node.scrollTop / (node.scrollHeight - node.clientHeight));
    await expect.poll(ratio, { timeout: 10000 }).toBeGreaterThan(0.65);
    await expect.poll(ratio, { timeout: 3000 }).toBeLessThan(0.65);
    await expect.poll(ratio).toBeGreaterThan(0.35);
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  });
}
