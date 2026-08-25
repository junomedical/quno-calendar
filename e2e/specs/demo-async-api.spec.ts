import { expect, test } from "@playwright/test";

test("demo simulates delayed API loading without blocking calendar chrome", async ({ page }) => {
  const apiResponse = page.waitForResponse(
    (response) => response.url().includes("/api/demo-events") && response.request().method() === "POST"
  );
  await page.goto("/demo/infinite-calendar");

  await page.getByTestId("api-latency-select").selectOption("1000");
  await page.getByTestId("scale-select").selectOption("5000");

  await expect(page.getByTestId("calendar-day").first()).toBeVisible();
  await expect(page.getByTestId("calendar-event")).toHaveCount(0);
  await expect(page.getByTestId("api-loading-status")).toContainText("Loading events from API");
  await expect(page.getByTestId("calendar-event").first()).toBeVisible({ timeout: 10_000 });
  expect((await apiResponse).status()).toBe(200);
  await expect(page.getByTestId("api-loading-status")).toHaveText("API idle");
});
