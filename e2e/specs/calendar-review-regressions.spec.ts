import { expect, test } from "@playwright/test";

for (const view of ["infinite-horizontal", "infinite-vertical"]) {
  test(`${view} preserves explicitly styled loading geometry before resources exist`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-regressions.html?loading&view=${view}`);
    const shell = page.locator(".quno-calendar-loading-shell");
    const skeleton = page.getByTestId("loading-skeleton");
    await expect(shell).toHaveAttribute("aria-busy", "true");
    await expect(skeleton).toBeVisible();
    expect((await shell.boundingBox())?.height).toBe(600);
    expect(await skeleton.boundingBox()).toEqual(await shell.boundingBox());
    await expect(page.locator(".quno-calendar-viewport")).toHaveCount(0);
    await page.getByRole("button", { name: "Finish loading" }).click();
    await expect(skeleton).toHaveCount(0);
    await expect(shell).toHaveAttribute("aria-busy", "false");
    expect((await shell.boundingBox())?.height).toBe(600);
    expect((await page.locator(".quno-calendar-viewport").boundingBox())?.height).toBe(600);
  });
}

test("centered distant navigation follows the row height after async collision layout", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-regressions.html");
  await page.getByRole("button", { name: "Center distant row" }).click();
  const row = page.locator(
    '[data-testid="calendar-day"][data-date="2026-07-27"] [data-testid="calendar-row"][data-calendar-id="b"]'
  );
  await expect(row).toBeVisible();
  await expect.poll(async () => (await row.boundingBox())?.height ?? 0).toBeGreaterThan(200);
  await expect
    .poll(() =>
      row.evaluate((element) => {
        const rowBox = element.getBoundingClientRect();
        const viewport = document.querySelector(".quno-calendar-viewport")!.getBoundingClientRect();
        const header = document.querySelector(".quno-calendar-day-header")!.getBoundingClientRect().height;
        return Math.abs(rowBox.top + rowBox.height / 2 - (viewport.top + (viewport.height + header) / 2));
      })
    )
    .toBeLessThanOrEqual(2);
});

test("a raw date request supersedes a queued distant resource request", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-regressions.html");
  await page.getByRole("button", { name: "Latest date wins" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const viewport = document.querySelector(".quno-calendar-viewport")!.getBoundingClientRect();
        const days = [...document.querySelectorAll<HTMLElement>("[data-date]")].filter((element) =>
          element.classList.contains("quno-calendar-day")
        );
        return days.find((element) => element.getBoundingClientRect().bottom > viewport.top + 30)?.dataset.date;
      })
    )
    .toBe("2026-08-03");
  await page.waitForTimeout(700);
  await expect(
    page.locator(
      '[data-testid="calendar-day"][data-date="2026-08-03"] [data-testid="calendar-row"][data-calendar-id="a"]'
    )
  ).toBeVisible();
});

for (const sizing of ["percentage", "minimum", "minimum&constrained"]) {
  test(`loading ${sizing} sizing remains consistent after resources mount`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-regressions.html?loading&${sizing}`);
    const height = sizing === "percentage" ? 300 : sizing.includes("constrained") ? 800 : 600;
    expect((await page.locator(".quno-calendar-loading-shell").boundingBox())?.height).toBe(height);
    await page.getByRole("button", { name: "Finish loading" }).click();
    await expect
      .poll(async () => (await page.locator(".quno-calendar-viewport").boundingBox())?.height ?? 0)
      .toBeGreaterThanOrEqual(height - 2);
    expect((await page.locator(".quno-calendar-loading-shell").boundingBox())?.height).toBe(height);
  });
}

for (const view of ["infinite-horizontal", "infinite-vertical"]) {
  test(`${view} accepted drag persists geometry without projected title or color`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/calendar-regressions.html?projection&view=${view}`);
    const card = page.getByTestId("fixture-event").filter({ hasText: "Local preview" }).first();
    await expect(card).toBeVisible();
    const before = await card.getAttribute("data-start");
    const box = (await card.boundingBox())!;
    const x = box.x + Math.min(box.width / 2, 30);
    const y = box.y + Math.min(box.height / 2, 15);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (view === "infinite-horizontal" ? 80 : 0), y + (view === "infinite-vertical" ? 80 : 0), {
      steps: 4
    });
    await page.mouse.up();
    await expect(card).not.toHaveAttribute("data-start", before!);
    const movedStart = await card.getAttribute("data-start");
    await page.getByRole("button", { name: "Clear projection" }).click();
    const savedCard = page.getByTestId("fixture-event").filter({ hasText: "Saved appointment" }).first();
    await expect(savedCard).toBeVisible();
    await expect(savedCard).toHaveAttribute("data-start", movedStart!);
    await expect(savedCard.locator("..")).not.toHaveCSS("--event-accent", "red");
  });
}
