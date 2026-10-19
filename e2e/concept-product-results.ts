import { expect, type Page } from "@playwright/test";

export async function expectProductResult(page: Page, product: string, result: string) {
  const dates = result.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  if (product === "Datepicker") {
    const start = dates[0];
    if (!start) throw new Error(`Missing date in expected picker result: ${result}`);
    const grid = page.locator('[data-slot="grid"]');
    await expect(grid.locator('[data-range-start="true"]')).toHaveAttribute("data-date", start);
    await expect(grid.locator('[data-range-end="true"]')).toHaveAttribute("data-date", dates[1] ?? start);
  } else if (product === "Date Input") {
    const format = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });
    const parts = dates.map((date) => format.format(new Date(`${date}T12:00:00Z`)));
    await expect(page.locator('[data-action="date-input"]')).toHaveValue(parts.join(" – "));
  } else if (product === "Timepicker")
    await expect(page.locator('.quno-time-picker [data-slot="selection-summary"]')).toContainText(result);
  else await expect(page.locator(".concept-result")).toContainText(result);
}
