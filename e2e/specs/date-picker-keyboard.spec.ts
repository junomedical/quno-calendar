import { expect, test } from "@playwright/test";

for (const key of ["Enter", "Space"]) {
  test(`date-only single selection responds to ${key} and retains focus`, async ({ page }) => {
    await page.goto("/docs/datepicker#single-day");
    const picker = page.locator("#single-day .quno-date-picker");
    const target = picker.locator('[data-slot="day"][data-date="2026-08-18"]');
    await target.focus();
    await target.press(key);

    await expect(target).toHaveAttribute("aria-selected", "true");
    await expect(target).toBeFocused();
    await expect(picker.locator('[data-selected="true"]')).toHaveCount(1);
    await expect(picker.locator('[data-slot="calendar"]')).toHaveAttribute("data-view", "dates");
  });
}

test("date-only range selection responds to native keyboard activation", async ({ page }) => {
  await page.goto("/docs/datepicker#stable-view");
  const picker = page.locator("#stable-view .quno-date-picker");
  await expect(picker.locator('[data-selected="true"]')).toHaveCount(0);
  const start = picker.locator('[data-slot="day"][data-date="2026-08-10"]');
  const end = picker.locator('[data-slot="day"][data-date="2026-08-15"]');
  await start.focus();
  await start.press("Enter");
  await end.focus();
  await end.press("Space");

  await expect(start).toHaveAttribute("data-range-start", "true");
  await expect(end).toHaveAttribute("data-range-end", "true");
  await expect(end).toBeFocused();
  await expect(picker.locator('[data-selected="true"]')).toHaveCount(6);
});
