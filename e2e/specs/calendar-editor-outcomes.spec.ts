import { expect, test, type Page } from "@playwright/test";

const topDate = (page: Page) =>
  page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    const top = viewport.getBoundingClientRect().top + 42;
    return [...viewport.querySelectorAll<HTMLElement>(".quno-calendar-day")].find(
      (day) => day.getBoundingClientRect().bottom > top
    )?.dataset.date;
  });

for (const mode of ["create", "edit"]) {
  for (const outcome of ["Cancel", "Save"]) {
    test(`${outcome} restores the selected date after ${mode} releases 135 rows`, async ({ page }) => {
      await page.goto(`/e2e/fixtures/calendar-editor-outcomes.html?mode=${mode}`);
      await page.getByRole("button", { name: "October 15", exact: true }).click();
      await expect.poll(() => topDate(page)).toBe("2026-10-15");
      await page.getByRole("button", { name: "Open editor", exact: true }).click();
      await page.getByRole("button", { name: "October 22", exact: true }).click();
      await expect.poll(() => topDate(page)).toBe("2026-10-22");
      await page.getByRole("button", { name: outcome, exact: true }).click();
      const expected = outcome === "Save" ? "2026-10-22" : "2026-10-15";
      await expect(page.getByTestId("restore-date")).toHaveText(expected);
      await expect.poll(() => topDate(page)).toBe(expected);
      // Pass the draft transition, anchor deadline, and idle recenter.
      await page.waitForTimeout(4000);
      expect(await topDate(page)).toBe(expected);
      expect((await page.locator(`.quno-calendar-day[data-date="${expected}"]`).boundingBox())?.height).toBe(7872);
    });
  }
}

test("Cancel restores an opening date that left the mounted editor range", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-editor-outcomes.html");
  await page.getByRole("button", { name: "October 15", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  await page.getByRole("button", { name: "Open editor", exact: true }).click();
  await page.getByRole("button", { name: "October 29", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-29");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  await page.waitForTimeout(4000);
  expect(await topDate(page)).toBe("2026-10-15");
});

test("manual scrolling after an editor restore supersedes its date anchor", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-editor-outcomes.html");
  await page.getByRole("button", { name: "October 15", exact: true }).click();
  await page.getByRole("button", { name: "Open editor", exact: true }).click();
  await page.getByRole("button", { name: "October 22", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-22");
  await page.locator(".quno-calendar-viewport").hover();
  await page.mouse.wheel(0, 8000);
  await expect.poll(() => topDate(page)).not.toBe("2026-10-22");
  const date = await topDate(page);
  await page.waitForTimeout(4000);
  expect(await topDate(page)).toBe(date);
});
