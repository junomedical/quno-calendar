import { expect, test, type Page } from "@playwright/test";
import { goToWorkday, firstViewportEventBox } from "#quno-e2e/helpers";

const topDate = (page: Page) =>
  page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    const top = viewport.getBoundingClientRect().top + 1;
    return [...viewport.querySelectorAll<HTMLElement>(".quno-calendar-day")].find(
      (day) => day.getBoundingClientRect().bottom > top
    )?.dataset.date;
  });

test("hidden and empty row selections read the real viewport without aborting for owner changes", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-viewport-loading.html");
  await expect(page.getByTestId("request-count")).toHaveText("1");
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  await page.getByRole("button", { name: "No rows", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  await page.waitForTimeout(850);
  await expect(page.getByTestId("abort-count")).toHaveText("0");
  const count = Number(await page.getByTestId("request-count").textContent());
  expect(count).toBeLessThanOrEqual(4);
  const requests = JSON.parse((await page.getByTestId("requests").textContent())!);
  for (const request of requests) {
    expect(request.ids).toBe(135);
    expect(request.visible.length).toBeGreaterThan(0);
    expect(request.startDate >= request.visible[0], JSON.stringify(request)).toBe(true);
    expect(request.endDate <= request.visible.at(-1), JSON.stringify(request)).toBe(true);
  }
  await page.getByRole("button", { name: "All rows", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("request-count")).toHaveText(String(count));
});

test("rapid scroll reversals coalesce requests and late data cannot navigate the grid", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-viewport-loading.html");
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await page.waitForTimeout(800);
  const count = Number(await page.getByTestId("request-count").textContent());
  const viewport = page.locator(".quno-calendar-viewport");
  await viewport.hover();
  for (let index = 0; index < 8; index++) await page.mouse.wheel(0, index % 2 ? -400 : 400);
  await page.waitForTimeout(150);
  const finalDate = await topDate(page);
  await page.waitForTimeout(1600);
  expect(await topDate(page)).toBe(finalDate);
  expect(Number(await page.getByTestId("request-count").textContent()) - count).toBeLessThanOrEqual(2);
});

for (const settle of [750, 3200])
  test(`filtering from a late resource row after ${settle} ms preserves its date through an empty selection`, async ({
    page
  }) => {
    await page.goto("/e2e/fixtures/calendar-viewport-loading.html");
    await expect(page.getByTestId("request-count")).toHaveText("1");
    await page.getByRole("button", { name: "Bottom row", exact: true }).click();
    await page.waitForTimeout(settle);
    const date = await topDate(page);
    for (const name of ["Compact", "No rows", "Compact", "All rows"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await page.waitForTimeout(850);
      expect(await topDate(page), name).toBe(date);
    }
  });

test("dense measured days retain their date through staff, room and empty row selections", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-viewport-loading.html?dense=true");
  await page.getByRole("button", { name: "Bottom row", exact: true }).click();
  await page.waitForTimeout(3400);
  const date = await topDate(page);
  for (const name of ["Staff rows", "Room rows", "No rows", "Compact", "All rows"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(850);
    expect(await topDate(page), name).toBe(date);
  }
});

test("the consumer demo retains its date when calendar-count filtering changes", async ({ page }) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page, "2026-07-06");
  await firstViewportEventBox(page);
  const firstVisibleDate = () =>
    page.locator(".quno-calendar-viewport").evaluate((viewport) => {
      const inset = viewport.querySelector('[data-testid="time-scale-header"]')?.getBoundingClientRect().height ?? 0;
      const top = viewport.getBoundingClientRect().top + inset + 1;
      return [...viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')].find(
        (day) => day.getBoundingClientRect().bottom > top
      )?.dataset.date;
    });
  const date = await firstVisibleDate();
  for (const key of ["Home", "End", "Home", "ArrowRight"]) {
    await page.getByTestId("calendar-count").press(key);
    await page.waitForTimeout(600);
    expect(await firstVisibleDate(), key).toBe(date);
  }
});
