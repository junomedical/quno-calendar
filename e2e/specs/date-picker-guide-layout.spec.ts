import { expect, test } from "@playwright/test";

test("single-day mode and focused Date Input composition stay distinct", async ({ page }) => {
  await page.goto("/guide/datepicker");

  const singleDay = page.locator("#single-day");
  await expect(singleDay.getByRole("textbox")).toHaveCount(0);
  await expect(singleDay.locator('[data-slot="selection-header"]')).toBeVisible();
  await singleDay.locator('[data-date="2026-08-18"]').click();
  await expect(singleDay.locator('[data-date="2026-08-18"]')).toHaveAttribute("data-selected", "true");

  const composition = page.locator("#single-day-input");
  const editor = composition.getByRole("textbox", { name: "Choose a day" });
  await expect(composition.getByRole("grid")).toHaveCount(0);
  await editor.focus();
  await expect(composition.getByRole("grid")).toBeVisible();
  await expect(composition.locator('[data-slot="selection-header"]')).toBeHidden();
  await editor.fill("12 juni");
  await editor.press("Enter");
  await expect(editor).toHaveValue("12 June 2026");
  await expect(composition.locator('[data-date="2026-06-12"]')).toHaveAttribute("data-selected", "true");
  await editor.fill("");
  await editor.press("Enter");
  await expect(editor).toHaveValue("");
  await expect(composition.locator('[data-selected="true"]')).toHaveCount(0);
  await page.getByRole("heading", { name: "Shape a date range as directly as you point to it." }).click();
  await expect(composition.getByRole("grid")).toHaveCount(0);
});

test("explicit state cards form a two-by-two grid", async ({ page }) => {
  await page.goto("/guide/datepicker#idea");

  const cards = page.locator("#idea .story__idea-grid article");
  await expect(cards).toHaveCount(4);
  const boxes = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect()));
  expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(1);
  expect(boxes[2].top).toBeGreaterThan(boxes[0].bottom);
  expect(Math.abs(boxes[2].top - boxes[3].top)).toBeLessThan(1);
  expect(Math.abs(boxes[0].width - boxes[3].width)).toBeLessThan(1);
});
