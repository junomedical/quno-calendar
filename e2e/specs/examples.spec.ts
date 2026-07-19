import { expect, test } from "@playwright/test";

test("read-only example route renders the horizontal calendar", async ({ page }) => {
  await page.goto("/examples/read-only");
  await expect(page.getByRole("heading", { name: "Read-only calendar" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Calendar examples" }).getByRole("link")).toHaveCount(6);
  await expect(page.getByRole("link", { name: "Read-only calendar" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "View recipe source" })).toHaveAttribute(
    "href",
    /demo\/examples\/read-only\/ReadOnlyCalendar\.tsx$/
  );
  await expect(page.getByTestId("infinite-calendar")).toHaveAccessibleName("Read-only schedule");
  await expect(page.getByTestId("time-scale-header")).toBeVisible();
  await expect(page.getByText("Initial consultation").first()).toBeVisible();
  const shellLayout = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".example-header")?.getBoundingClientRect();
    const stage = document.querySelector<HTMLElement>(".example-stage")?.getBoundingClientRect();
    return header && stage ? { headerBottom: header.bottom, stageTop: stage.top, stageHeight: stage.height } : null;
  });
  expect(shellLayout).not.toBeNull();
  expect((shellLayout?.stageTop ?? 0) - (shellLayout?.headerBottom ?? 0)).toBeGreaterThanOrEqual(10);
  expect(shellLayout?.stageHeight ?? 0).toBeGreaterThan(400);
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

test("delayed API example renders its grid before events arrive", async ({ page }) => {
  await page.goto("/examples/async-api?latency=3000");
  await expect(page.getByTestId("async-api-note")).toBeVisible();
  await expect(page.getByTestId("infinite-calendar")).toHaveAccessibleName("Delayed API schedule");
  await expect(page.getByText("Provider A").first()).toBeVisible();
  await expect(page.getByText("Initial consultation")).toHaveCount(0);
  await expect(page.getByText("Initial consultation").first()).toBeVisible({ timeout: 10_000 });
});

test("demo routes expose source links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "View example source" })).toHaveAttribute(
    "href",
    /demo\/showcase\/DefaultDemo\.tsx$/
  );
});
