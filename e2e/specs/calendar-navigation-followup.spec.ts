import { expect, test, type Page } from "@playwright/test";

const topDate = (page: Page) =>
  page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    const top = viewport.getBoundingClientRect().top + 43;
    return [...viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')].find(
      (day) => day.getBoundingClientRect().bottom > top && day.getBoundingClientRect().top <= top
    )?.dataset.date;
  });
const requests = async (page: Page): Promise<Array<{ startDate: string; endDate: string; aborted: boolean }>> =>
  JSON.parse((await page.getByTestId("requests").textContent())!);

for (const action of ["Monday", "Monday 12:30", "Today"]) {
  test(`vertical ${action} supersedes a restore through layout and its deadline`, async ({ page }) => {
    await page.goto("/e2e/fixtures/calendar-navigation-followup.html?vertical");
    await expect.poll(() => topDate(page)).toBe("2026-10-16");
    await page.getByRole("button", { name: "Start restore", exact: true }).click();
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect.poll(() => topDate(page)).toBe("2026-10-19");
    if (action !== "Monday") {
      const offset = await page
        .locator('.quno-calendar-day[data-date="2026-10-19"]')
        .evaluate(
          (day) =>
            day.getBoundingClientRect().top -
            document.querySelector(".quno-calendar-viewport")!.getBoundingClientRect().top
        );
      // At zoom 2 the timeline uses 2 px/minute; its header and gutter total 50 px.
      const minute = action === "Today" ? 210 : 270;
      expect(offset).toBeCloseTo(-(50 + minute * 2 - 48), 0);
    }
    await page.getByRole("button", { name: "Change layout", exact: true }).click();
    await page.getByRole("button", { name: "Release responses", exact: true }).click();
    await expect.poll(() => topDate(page)).toBe("2026-10-19");
    await page.waitForTimeout(3200);
    expect(await topDate(page)).toBe("2026-10-19");
  });
}

test("vertical restoration can still mount a distant date", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-navigation-followup.html?vertical");
  await expect.poll(() => topDate(page)).toBe("2026-10-16");
  await page.getByRole("button", { name: "Restore distant date", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-12-21");
  await page.waitForTimeout(3200);
  expect(await topDate(page)).toBe("2026-12-21");
});

for (const vertical of [false, true]) {
  test(`Friday/Monday pending reads survive reversals without extra fetching (${vertical ? "vertical" : "horizontal"})`, async ({
    page
  }) => {
    await page.goto(`/e2e/fixtures/calendar-navigation-followup.html${vertical ? "?vertical" : ""}`);
    await expect.poll(() => requests(page).then((value) => value.length)).toBe(1);
    for (const name of ["Monday", "Friday", "Monday", "Friday"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect.poll(() => topDate(page)).toBe(name === "Friday" ? "2026-10-16" : "2026-10-19");
      await page.waitForTimeout(180);
    }
    const reads = await requests(page);
    expect(reads.map(({ startDate, endDate }) => [startDate, endDate])).toEqual([
      ["2026-10-16", "2026-10-16"],
      ["2026-10-19", "2026-10-19"]
    ]);
    expect(reads.every(({ aborted }) => !aborted)).toBe(true);
    await page.getByRole("button", { name: "Distant date", exact: true }).click();
    await expect.poll(() => topDate(page)).toBe("2026-10-26");
    await expect.poll(() => requests(page).then((value) => value.filter(({ aborted }) => aborted).length)).toBe(2);
    await page.getByRole("button", { name: "Release responses", exact: true }).click();
    await page.waitForTimeout(500);
    expect(await topDate(page)).toBe("2026-10-26");
  });
}
