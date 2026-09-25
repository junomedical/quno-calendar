import { expect, test } from "@playwright/test";

test("single-day mode and focused range-input composition stay distinct", async ({ page }) => {
  await page.goto("/guide/datepicker");

  const singleDay = page.locator("#single-day");
  await expect(singleDay.getByRole("textbox")).toHaveCount(0);
  await expect(singleDay.locator('[data-slot="selection-header"]')).toBeVisible();
  await singleDay.locator('[data-date="2026-08-18"]').click();
  await expect(singleDay.locator('[data-date="2026-08-18"]')).toHaveAttribute("data-selected", "true");

  const composition = page.locator("#date-input-composition");
  const editor = composition.getByRole("textbox", { name: "Choose a period" });
  await expect(composition.getByRole("grid")).toHaveCount(0);
  await editor.focus();
  await expect(composition.getByRole("grid")).toBeVisible();
  await expect(composition.locator('[data-slot="selection-header"]')).toBeHidden();
  await editor.fill("12 juni - 18 juni");
  await editor.press("Enter");
  await expect(editor).toHaveValue("12 June 2026 – 18 June 2026");
  await expect(composition.locator('[data-date="2026-06-12"]')).toHaveAttribute("data-range-start", "true");
  await expect(composition.locator('[data-date="2026-06-15"]')).toHaveAttribute("data-selected", "true");
  await expect(composition.locator('[data-date="2026-06-18"]')).toHaveAttribute("data-range-end", "true");
  await editor.fill("21 May 2026 – 18 August 2026");
  await editor.press("Enter");
  await composition.locator('[data-slot="pill"][data-endpoint="start"]').click();
  await expect(composition.getByRole("grid")).toHaveAccessibleName("Date range picker: May 2026");
  await composition.locator('[data-slot="pill"][data-endpoint="end"]').click();
  await expect(composition.getByRole("grid")).toHaveAccessibleName("Date range picker: August 2026");
  await editor.fill("");
  await editor.press("Enter");
  await expect(editor).toHaveValue("");
  await expect(composition.locator('[data-selected="true"]')).toHaveCount(0);
  await page.getByRole("heading", { name: "Date range selection you won't hate" }).click();
  await expect(composition.getByRole("grid")).toHaveCount(0);
});

test("quick navigation explains seasonal month groups and keeps years sticky", async ({ page }) => {
  await page.goto("/guide/datepicker#quick-jump");

  const quickJump = page.locator("#quick-jump");
  await expect(quickJump).toContainText("Months follow the seasons");
  await expect(quickJump).toContainText("Sticky year labels keep the year readable during fast scrolling");
  await quickJump.getByRole("button", { name: /Open month and year navigation/ }).click();
  await expect(quickJump.locator('[data-slot="year-heading"]').first()).toHaveCSS("position", "sticky");
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
