import { expect, test } from "@playwright/test";
import { selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
for (const width of [1440, 390])
  test(`choosing a visible time preserves the option under the cursor at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Timepicker", exact: true }).click();
    await selectCalendarScene(page, "Choose a time", false);
    const panel = page.locator('[data-slot="time-navigation"]');
    await panel.evaluate((node) => {
      node.scrollTop = 35;
    });
    const option = page.getByRole("button", { name: "10:45", exact: true });
    const before = (await option.boundingBox())!;
    const scroll = await panel.evaluate((node) => node.scrollTop);
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "true");
    expect(await panel.evaluate((node) => node.scrollTop)).toBe(scroll);
    expect(await option.boundingBox()).toEqual(before);
    expect(
      await option.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      })
    ).toBe(true);
    const next = page.getByRole("button", { name: "10:30", exact: true });
    await next.focus();
    const keyboardBefore = await next.boundingBox();
    await next.press("Enter");
    await expect(next).toHaveAttribute("aria-pressed", "true");
    await expect(next).toBeFocused();
    expect(await next.boundingBox()).toEqual(keyboardBefore);
    expect(await panel.evaluate((node) => node.scrollTop)).toBe(scroll);
  });
