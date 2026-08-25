import { expect, test, type Page } from "@playwright/test";

async function expectPickerHeadingSizes(page: Page, route: string) {
  await page.goto(route);
  const picker = page.locator(".quno-date-picker").first();
  const monthHeading = picker.locator('[data-slot="month-heading"]');
  await expect(monthHeading).toBeVisible();
  await expect(monthHeading).toHaveCSS("font-size", "17px");

  await picker.locator('[data-slot="month-heading-button"]').click();
  const yearHeading = picker.locator('[data-slot="year-heading"]').first();
  await expect(yearHeading).toBeVisible();
  await expect(yearHeading).toHaveCSS("font-size", "12px");
}

test("datepicker demos keep component month and year typography", async ({ page }) => {
  await expectPickerHeadingSizes(page, "/guide/datepicker");
  await expectPickerHeadingSizes(page, "/demo/datepicker");
});

test("acid and candy themes keep the range Clear control compact", async ({ page }) => {
  await page.goto("/guide/datepicker");
  const theme = page.locator("#theming");
  const clear = theme.getByRole("button", { name: "Clear" });

  for (const name of ["acid", "candy"]) {
    await theme.getByRole("button", { name: `${name} theme` }).click();
    await expect(clear).toHaveCSS("font-size", "12px");
    expect((await clear.boundingBox())?.height).toBeLessThanOrEqual(26);
  }
});
