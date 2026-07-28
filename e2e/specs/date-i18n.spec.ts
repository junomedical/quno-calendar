import { expect, test } from "@playwright/test";
import { goToWorkday } from "../helpers";

test.use({ locale: "de-DE" });

test("localizes horizontal and vertical date chrome without clipping labels", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page, "2026-07-06");

  const horizontalLabel = page
    .locator('[data-testid="calendar-day"][data-date="2026-07-06"] .ic-date-label:not(.icv-date-label)')
    .filter({ hasText: "6. Juli, Montag" });
  await expect(horizontalLabel).toBeVisible();
  expect(
    await horizontalLabel.evaluate((element) => ({
      horizontalOverflow: element.scrollWidth - element.clientWidth,
      verticalOverflow: element.scrollHeight - element.clientHeight
    }))
  ).toEqual({ horizontalOverflow: 0, verticalOverflow: 0 });

  await page.getByTestId("view-infinite-vertical").check();
  await goToWorkday(page, "2026-07-06");

  const verticalLabel = page.locator('[data-testid="calendar-day"][data-date="2026-07-06"] .icv-date-label');
  await expect(verticalLabel.locator(".icv-date-main")).toHaveText("6. Juli");
  await expect(verticalLabel.locator(".icv-date-weekday")).toHaveText("Montag");
  expect(
    await verticalLabel.evaluate((element) => ({
      horizontalOverflow: element.scrollWidth - element.clientWidth,
      verticalOverflow: element.scrollHeight - element.clientHeight
    }))
  ).toEqual({ horizontalOverflow: 0, verticalOverflow: 0 });
});
