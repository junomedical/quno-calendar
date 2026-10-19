import { expect, test } from "@playwright/test";
import { selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });

for (const width of [390, 1440]) {
  test(`system appearance follows live changes without resetting the calendar at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/concept");
    const calendar = page.locator(".concept-calendar-workspace");
    await expect(calendar).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".quno-calendar-shell")).toHaveCSS("background-color", "rgb(37, 35, 50)");
    const original = await calendar.elementHandle();
    const date = await calendar.getAttribute("data-visible-date");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(calendar).toHaveAttribute("data-theme", "light");
    await expect(page.locator(".quno-calendar-shell")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    expect(await original!.evaluate((node) => node === document.querySelector(".concept-calendar-workspace"))).toBe(
      true
    );
    await expect(calendar).toHaveAttribute("data-visible-date", date!);
    await selectCalendarScene(page, "Theming", false);
    await page.getByRole("button", { name: "Branded", exact: true }).click();
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(calendar).toHaveAttribute("data-theme", "brand");
    await selectCalendarScene(page, "Event density", false);
    await expect(calendar).toHaveAttribute("data-theme", "dark");
  });

  test(`product canvases follow appearance while explainers and controls stay light at ${width}px`, async ({
    page
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/concept");
    for (const product of ["Datepicker", "Date Input", "Timepicker", "Date Parser"]) {
      await page.getByRole("button", { name: product, exact: true }).click();
      const card = page.locator(".concept-product-card");
      await expect(card).toBeVisible();
      await expect(page.locator(".concept-content")).toHaveCSS("background-color", "rgb(29, 27, 38)");
      await expect(page.locator(".concept-canvas")).toHaveCSS("background-color", "rgb(29, 27, 38)");
      await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(card).toHaveCSS("color", "rgb(48, 43, 66)");
      await expect(card).toHaveCSS("color-scheme", "light");
      await expect(page.locator(".concept-tour-guide")).toHaveCSS("color", "rgb(48, 43, 66)");
      await expect(page.locator(".concept-tour-guide")).toHaveCSS("background-color", "rgba(249, 246, 255, 0.96)");
      const native = card.locator(".quno-date-picker-calendar-shell, .quno-time-picker, input").first();
      await expect(native).toHaveCSS("background-color", "rgb(255, 255, 255)");
      const original = await card.elementHandle();
      await page.emulateMedia({ colorScheme: "light" });
      await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
      expect(await original!.evaluate((node) => node === document.querySelector(".concept-product-card"))).toBe(true);
      await page.emulateMedia({ colorScheme: "dark" });
      await page.getByRole("button", { name: /^Full screen/ }).click();
      await expect(page.locator(".concept")).toHaveCSS("color-scheme", "dark");
      await expect(page.locator(".concept-canvas")).toHaveCSS("background-color", "rgb(29, 27, 38)");
      await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
      if (product === "Datepicker") await page.screenshot({ path: info.outputPath("dark-datepicker.png") });
      await page.getByRole("button", { name: "Exit full screen", exact: true }).click();
    }
  });
}

for (const width of [390, 1440, 1800])
  test(`zoom controls match rendered bounds and resize at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await selectCalendarScene(page, "Zoom", false);
    const slider = page.getByRole("slider", { name: "Zoom level" });
    const calendar = page.locator(".concept-calendar-workspace");
    const viewport = page.locator(".quno-calendar-viewport");
    const fit = await viewport.evaluate((node) =>
      Math.max(0.5, Math.ceil(((node.clientWidth - 238 - 8) / 660) * 100) / 100)
    );
    await expect(slider).toHaveAttribute("min", String(fit));
    await expect(slider).toHaveAttribute("max", "8");
    await slider.press("Home");
    await expect(calendar).toHaveAttribute("data-zoom", String(fit));
    await expect(page.getByRole("button", { name: "Zoom out", exact: true })).toBeDisabled();
    await page.keyboard.down("Shift");
    await viewport.hover({ position: { x: 300, y: 100 } });
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(100);
    await expect(calendar).toHaveAttribute("data-zoom", String(fit));
    await page.mouse.wheel(0, -200);
    await expect.poll(async () => Number(await calendar.getAttribute("data-zoom"))).toBeGreaterThan(fit);
    await page.keyboard.up("Shift");
    await slider.press("End");
    await expect(calendar).toHaveAttribute("data-zoom", "8");
    await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeDisabled();
    await page.setViewportSize({ width: 390, height: 900 });
    await expect(slider).toHaveAttribute("min", "0.5");
    await slider.press("Home");
    await expect(calendar).toHaveAttribute("data-zoom", "0.5");
    await page.setViewportSize({ width: 1800, height: 900 });
    await expect.poll(async () => Number(await calendar.getAttribute("data-zoom"))).toBeGreaterThan(2);
    expect(Number(await slider.inputValue())).toBe(Number(await slider.getAttribute("min")));
    await selectCalendarScene(page, "Horizontal / vertical", false);
    await page.getByRole("button", { name: "Vertical", exact: true }).click();
    await selectCalendarScene(page, "Zoom", false);
    await expect(slider).toHaveAttribute("min", "0.5");
  });
