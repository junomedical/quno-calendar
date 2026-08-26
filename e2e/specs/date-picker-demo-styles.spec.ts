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

test("delayed day states remain disabled until availability succeeds", async ({ page }) => {
  await page.goto("/guide/datepicker#day-handler");
  const topic = page.locator("#day-handler");
  const available = topic.locator('[data-date="2026-08-10"]');
  const unavailable = topic.locator('[data-date="2026-08-12"]');
  const failed = topic.locator('[data-date="2026-08-24"]');

  await expect(available).toBeDisabled();
  await expect(available).toHaveClass(/story__day--loading/);
  await expect(available.locator("span")).toHaveCSS("animation-name", "story-day-loading");
  await expect(topic.getByText("Availability loaded")).toBeVisible();

  await expect(available).toBeEnabled();
  await expect(unavailable).toBeDisabled();
  await expect(unavailable.locator("span")).toHaveCSS("text-decoration-line", "line-through");
  await expect(failed).toBeDisabled();
  await expect(failed).toHaveClass(/story__day--error/);
  await expect(failed.locator("span")).toHaveCSS("text-decoration-line", "line-through");

  await available.click();
  await expect(available).toHaveAttribute("data-selected", "true");
  await unavailable.click({ force: true });
  await expect(unavailable).not.toHaveAttribute("data-range-end");
});
