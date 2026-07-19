import { expect, test } from "@playwright/test";

test("50-resource horizontal dates mount only their visible row window", async ({ page }) => {
  await page.goto("/examples/async-api");
  const days = page.getByTestId("calendar-day");
  await expect(days.first()).toBeAttached();

  const maximumRowsPerDate = () =>
    days.evaluateAll((nodes) =>
      Math.max(...nodes.map((node) => node.querySelectorAll('[data-testid="calendar-row"]').length))
    );
  await expect.poll(maximumRowsPerDate).toBeGreaterThan(0);
  expect(await maximumRowsPerDate()).toBeLessThan(24);
});

test("50-resource vertical dates preserve full width while windowing columns", async ({ page }) => {
  await page.goto("/examples/async-api?view=vertical");
  await expect(page.getByTestId("infinite-calendar")).toHaveAttribute("data-view", "infinite-vertical");
  const days = page.getByTestId("calendar-day");

  const maximumColumnsPerDate = () =>
    days.evaluateAll((nodes) =>
      Math.max(...nodes.map((node) => node.querySelectorAll('[data-testid="calendar-column"]').length))
    );
  await expect.poll(maximumColumnsPerDate).toBeGreaterThan(0);
  expect(await maximumColumnsPerDate()).toBeLessThan(16);

  const populatedDay = days.filter({ has: page.getByTestId("calendar-column") }).first();
  const visibleColumns = populatedDay.getByTestId("calendar-column");
  const backgrounds = await visibleColumns.evaluateAll((columns) =>
    columns.slice(0, 2).map((column) => getComputedStyle(column).backgroundColor)
  );
  expect(backgrounds).toHaveLength(2);
  expect(backgrounds[0]).not.toBe(backgrounds[1]);

  const viewport = page.locator(".ic-viewport");
  const hasHorizontalRange = await viewport.evaluate((element) => element.scrollWidth > element.clientWidth * 4);
  expect(hasHorizontalRange).toBe(true);
  await viewport.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(page.getByText("Resource 50").first()).toBeVisible();
});
