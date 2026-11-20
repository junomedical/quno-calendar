import { expect, test } from "@playwright/test";
for (const width of [320, 1280]) {
  test(`booking picker fits ${width}px and preserves source parity`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/guide/datepicker");
    await page.getByRole("link", { name: /Book an available slot/ }).click();
    await expect(page).toHaveURL(/#booking-picker$/);
    const example = page.locator("#booking-picker");
    await expect(example.getByRole("heading", { name: "Thursday 5th November" })).toBeVisible();
    await expect(example.getByText("Matching 1", { exact: true })).toBeVisible();
    await expect(example.getByRole("button", { name: "09:00–09:30" })).toHaveAttribute("data-comparison", "match");
    const firstSlot = example.getByRole("button", { name: "09:00–09:30" });
    const lastSlot = example.getByRole("button", { name: "11:00–11:30" });
    await expect(lastSlot).toBeDisabled();
    const firstRow = (await firstSlot.boundingBox())!;
    const lastRow = (await lastSlot.boundingBox())!;
    expect(lastRow.y).toBeGreaterThanOrEqual(firstRow.y + firstRow.height);
    expect(lastRow.width).toBeCloseTo(firstRow.width);
    await expect(example.getByRole("button", { name: "Previous month" })).toBeDisabled();
    await expect(example.getByRole("button", { name: "Next month" })).toBeDisabled();
    const geometry = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      panel: document.querySelector("#booking-picker aside")!.getBoundingClientRect().right,
      right: document.querySelector('#booking-picker [data-slot="booking-picker"]')!.getBoundingClientRect().right
    }));
    expect(geometry.scroll).toBe(geometry.width);
    expect(geometry.panel).toBeLessThanOrEqual(width);
    expect(geometry.right).toBeLessThanOrEqual(width);
    await example.getByRole("button", { name: "09:00–09:30" }).click();
    await expect(example.locator("output")).toHaveText("Selected 2026-11-05T09:00:00Z");
    await example.getByRole("button", { name: "API", exact: true }).click();
    await expect(example.getByRole("button", { name: "09:00–09:30" })).toBeDisabled();
  });
}
test("date-only booking waits for a day click and confirmation", async ({ page }) => {
  await page.goto("/guide/datepicker");
  await page.getByRole("link", { name: /Book an available slot/ }).click();
  await expect(page).toHaveURL(/#booking-picker$/);
  const example = page.locator("#booking-picker");
  await example.getByLabel("Date-only booking").check();
  const output = example.locator("output");
  const choices = example.locator('[data-slot="available-slots"]').getByRole("button");
  await expect(output).toHaveText("Choose a day, then confirm");
  await expect(choices).toHaveCount(0);
  const date = example.locator('[data-slot="day"][data-date="2026-11-05"]');
  await date.click();
  await expect(output).toHaveText("Choose a day, then confirm");
  await expect(choices).toHaveCount(1);
  await expect(choices.first()).toHaveAccessibleName("Confirm");
  await choices.first().click();
  await expect(output).toHaveText("Selected 2026-11-05T09:00:00Z");
});
