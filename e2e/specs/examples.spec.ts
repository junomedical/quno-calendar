import { expect, test } from "@playwright/test";

test("read-only example route renders the horizontal calendar", async ({ page }) => {
  await page.goto("/examples/read-only");
  await expect(page.getByTestId("infinite-calendar")).toHaveAccessibleName("Read-only schedule");
  await expect(page.getByTestId("time-scale-header")).toBeVisible();
  await expect(page.getByText("Initial consultation").first()).toBeVisible();
});

test("drag/create example route renders an interactive horizontal calendar", async ({ page }) => {
  await page.goto("/examples/drag-create");
  await expect(page.getByTestId("infinite-calendar")).toBeVisible();
  await expect(page.getByText("Initial consultation").first()).toBeVisible();
});

test("vertical planner example route renders the vertical calendar", async ({ page }) => {
  await page.goto("/examples/vertical-planner");
  await expect(page.getByTestId("infinite-calendar")).toHaveAttribute("data-view", "infinite-vertical");
  await expect(page.getByTestId("vertical-time-pane").first()).toBeVisible();
});

test("availability example route renders availability blocks", async ({ page }) => {
  await page.goto("/examples/availability");
  await expect(page.getByTestId("availability-event").first()).toBeVisible();
});

test("controlled draft example route opens parent-owned edit UI", async ({ page }) => {
  await page.goto("/examples/controlled-draft");
  await page.getByText("Initial consultation").first().click();
  await expect(page.getByLabel("Draft title")).toHaveValue("Initial consultation");
});

test("demo routes expose source links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "View example source" })).toHaveAttribute(
    "href",
    /src\/demo\/DefaultDemo\.tsx$/
  );
});
