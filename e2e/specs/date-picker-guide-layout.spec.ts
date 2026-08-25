import { expect, test } from "@playwright/test";

test("single-day editing uses one field and state cards form a two-by-two grid", async ({ page }) => {
  await page.goto("/guide/datepicker");

  const singleDay = page.locator("#single-day");
  const editor = singleDay.getByRole("textbox", { name: "Selected day" });
  await expect(editor).toHaveCount(1);
  await expect(singleDay.locator('.story__single-day-picker > [data-slot="selection-header"]')).toBeHidden();
  await expect(editor).toHaveValue("19 August 2026");
  await singleDay.locator('[data-date="2026-08-18"]').click();
  await expect(editor).toHaveValue("18 August 2026");

  const cards = page.locator("#idea .story__idea-grid article");
  await expect(cards).toHaveCount(4);
  const boxes = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect()));
  expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(1);
  expect(boxes[2].top).toBeGreaterThan(boxes[0].bottom);
  expect(Math.abs(boxes[2].top - boxes[3].top)).toBeLessThan(1);
  expect(Math.abs(boxes[0].width - boxes[3].width)).toBeLessThan(1);
});
