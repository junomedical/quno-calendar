import { expect, test, type Locator } from "@playwright/test";
import { calendarInitial, pauseCalendarScene, selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });

async function contrast(card: Locator) {
  return card.evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const luminance = (color: string) => {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const background = luminance(getComputedStyle(element).backgroundColor);
    return [...element.querySelectorAll("strong, small")].map((text) => {
      const foreground = luminance(getComputedStyle(text).color);
      return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
    });
  });
}

for (const colorScheme of ["light", "dark"] as const)
  for (const vertical of [false, true])
    test(`${colorScheme} creation keeps draft, saved and hovered title/time readable in ${vertical ? "vertical" : "horizontal"} view`, async ({
      page
    }, info) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      if (vertical) await calendarInitial(page, { view: "infinite-vertical" });
      await page.goto("/concept");
      await selectCalendarScene(page, "Create an appointment");
      const editor = page.getByRole("form", { name: "Appointment editor" });
      await expect(editor).toBeVisible({ timeout: 12000 });
      await pauseCalendarScene(page);
      await editor.locator("input").fill("Readable draft");
      const draft = page.locator('[data-testid="draft-event"] .concept-event');
      await expect(draft).toHaveAttribute("data-state", "new");
      await expect(draft.locator("strong")).toHaveText("Readable draft");
      for (const ratio of await contrast(draft)) expect(ratio).toBeGreaterThanOrEqual(4.5);
      await page.screenshot({ path: info.outputPath(`${colorScheme}-creation-draft.png`) });
      await editor.getByRole("button", { name: "Save appointment", exact: true }).click();
      const saved = page.locator('[data-testid="calendar-event"][data-event-id="concept-created-1"] .concept-event');
      await expect(saved.locator("strong")).toHaveText("Readable draft");
      for (const ratio of await contrast(saved)) expect(ratio).toBeGreaterThanOrEqual(4.5);
      await page.getByRole("button", { name: "Collapse description", exact: true }).click();
      await saved.hover();
      await expect(saved).toHaveAttribute("data-state", "hovered");
      for (const ratio of await contrast(saved)) expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
