import { expect, test } from "@playwright/test";
import { selectCalendarScene } from "#quno-e2e/concept-helpers";

test.describe.configure({ mode: "parallel" });

for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [375, 667],
  [320, 667]
]) {
  test(`calendar introduction and larger cadence controls remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await expect(page.locator(".concept-explanation p").first()).toHaveText(
      "When I explored calendar concepts, I found that many approaches make calendars feel unfocused: too much mouse movement to navigate, loss of focus during interactions, and poor visibility when many participants and meetings share the view."
    );
    await page.getByRole("button", { name: "Timepicker", exact: true }).click();
    await selectCalendarScene(page, "Keep an existing time", false);
    if (width < 851) await page.getByRole("button", { name: "Collapse description" }).click();
    const cadence = page.getByRole("group", { name: "Cadence", exact: true });
    await expect(page.getByRole("group", { name: "Minute cadence", exact: true })).toHaveCount(0);
    const buttons = cadence.getByRole("button");
    await expect(buttons).toHaveText(["5 min", "15 min", "20 min"]);
    const boxes = await buttons.evaluateAll((buttons) =>
      buttons.map((button) => button.getBoundingClientRect().toJSON())
    );
    for (const [index, box] of boxes.entries()) {
      expect(box.width).toBeGreaterThanOrEqual(80);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.y).toBeCloseTo(boxes[0].y, 0);
      if (index) expect(box.x - boxes[index - 1].right).toBeGreaterThanOrEqual(8);
    }
    expect(await cadence.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    for (const step of [5, 15, 20]) {
      const button = cadence.getByRole("button", { name: `${step} min`, exact: true });
      await expect(button).toHaveCSS("font-size", "14px");
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('[data-hour="10"] [data-slot="minute-option"]')).toHaveCount(60 / step);
      await expect(page.locator('.quno-time-picker [data-slot="selection-summary"]')).toContainText("10:35");
    }
    await cadence.getByRole("button", { name: "5 min", exact: true }).press("Space");
    await expect(cadence.getByRole("button", { name: "5 min", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.locator('[data-time="10:40"]').click();
    await expect(page.locator('.quno-time-picker [data-slot="selection-summary"]')).toHaveText("10:40");
  });
}
