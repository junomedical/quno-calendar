import { expect, test } from "@playwright/test";

for (const [route, topic] of [
  ["datepicker", "date-input-composition"],
  ["date-input", "picker-composition"]
]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    for (const activation of ["click", "Enter", "Space"] as const) {
      test(`${route} endpoint shortcuts retain popup focus with ${activation} and ${reducedMotion} motion`, async ({
        page,
        browserName
      }) => {
        await page.emulateMedia({ reducedMotion });
        await page.goto(`/guide/${route}#${topic}`);
        const composition = page.locator(`#${topic}`);
        const input = composition.getByRole("textbox", { name: "Choose a period" });
        await input.focus();
        await input.fill("21 May 2026 – 18 August 2026");
        await input.press("Enter");

        for (const [endpoint, month, date] of [
          ["start", "May", "2026-05-21"],
          ["end", "August", "2026-08-18"]
        ]) {
          const shortcut = composition.locator(`[data-slot="pill"][data-endpoint="${endpoint}"]`);
          if (activation === "click") await shortcut.click();
          else {
            await shortcut.focus();
            await shortcut.press(activation);
          }
          await expect(composition.getByRole("grid")).toHaveAccessibleName(`Date range picker: ${month} 2026`);
          await expect(shortcut).toHaveCount(0);
          await expect(composition.locator('[data-slot="month-heading-button"]')).toBeFocused();
          await expect(composition.locator(`[data-slot="day"][data-date="${date}"]`)).toHaveAttribute(
            `data-range-${endpoint}`,
            "true"
          );
          await expect(input).toHaveValue("21 May 2026 – 18 August 2026");
        }

        // Safari uses Option+Tab to include buttons in sequential keyboard focus.
        await composition
          .locator('[data-slot="month-heading-button"]')
          .press(browserName === "webkit" ? "Alt+Tab" : "Tab");
        await expect(composition.getByRole("button", { name: "Next month" })).toBeFocused();
        await page.getByRole("link", { name: "All components" }).focus();
        await expect(composition.getByRole("grid")).toHaveCount(0);
        await input.focus();
        await expect(composition.getByRole("grid")).toBeVisible();
        await page.locator("h1").click();
        await expect(composition.getByRole("grid")).toHaveCount(0);
      });
    }
  }
}
