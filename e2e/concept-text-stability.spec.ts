import { selectCalendarScene, pauseCalendarScene } from "#quno-e2e/concept-helpers";
import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
for (const width of [1440, 950, 390])
  test(`floating explanation keeps its text layout during playback at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Date Input", exact: true }).click();
    await selectCalendarScene(page, "Edit with keyboard", false);
    const guide = page.locator(".concept-tour-guide");
    const original = await guide.boundingBox();
    const geometry = () =>
      guide.evaluate((element) => {
        const parent = element.getBoundingClientRect();
        return [...element.querySelectorAll("h1, p")].map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x - parent.x, y: rect.y - parent.y, width: rect.width, height: rect.height };
        });
      });
    const before = await geometry();
    await selectCalendarScene(page, "Edit with keyboard");
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
    expect(await geometry()).toEqual(before);
    expect(await guide.boundingBox()).toEqual(original);
    await pauseCalendarScene(page);
    expect(await geometry()).toEqual(before);
  });
