import { expect, test, type Page } from "@playwright/test";

const topDate = (page: Page) =>
  page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    const top = viewport.getBoundingClientRect().top + 1;
    return [...viewport.querySelectorAll<HTMLElement>(".quno-calendar-day")].find(
      (day) => day.getBoundingClientRect().bottom > top
    )?.dataset.date;
  });

const day = (page: Page, date: string) => page.locator(`.quno-calendar-day[data-date="${date}"]`);

const open = async (page: Page) => {
  await page.goto("/e2e/fixtures/calendar-row-filter.html");
  await expect(page.getByTestId("request-count")).toHaveText("1");
  await page.getByRole("button", { name: "October 15", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
};

test("compacting many loaded rows preserves the date and clears estimates outside the loaded window", async ({
  page
}) => {
  await open(page);
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  await expect.poll(async () => (await day(page, "2026-10-15").boundingBox())?.height).toBe(100);
  await page.waitForTimeout(1800);
  expect(await topDate(page)).toBe("2026-10-15");
  await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    viewport.scrollTop += 700;
  });
  await expect.poll(() => topDate(page)).toBe("2026-10-22");
  await page.getByRole("button", { name: "All rows", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-22");
  await expect.poll(async () => (await day(page, "2026-10-22").boundingBox())?.height).toBe(7872);
  await page.waitForTimeout(1800);
  expect(await topDate(page)).toBe("2026-10-22");
  expect(Number(await page.getByTestId("request-count").textContent())).toBeLessThan(8);
  for (const range of await page.getByTestId("request-range").allTextContents()) {
    const [start, end] = range.split("..");
    expect(start >= "2026-09-25" && end <= "2026-11-10", range).toBe(true);
  }
});

test("a surviving row keeps its local offset through contraction and expansion", async ({ page }) => {
  await open(page);
  await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    viewport.scrollTop += 42 + 134 * 58 + 12;
  });
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  const row = day(page, "2026-10-15").locator('[data-testid="calendar-row"][data-calendar-id="row-134"]');
  const localOffset = () =>
    row.evaluate(
      (element) =>
        document.querySelector(".quno-calendar-viewport")!.getBoundingClientRect().top -
        element.getBoundingClientRect().top
    );
  await expect.poll(localOffset).toBe(12);
  await page.getByRole("button", { name: "All rows", exact: true }).click();
  await expect.poll(localOffset).toBe(12);
  await page.waitForTimeout(1800);
  expect(await localOffset()).toBe(12);
});

test("removing every row preserves an unloaded date instead of carrying an offset into later dates", async ({
  page
}) => {
  await open(page);
  await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    viewport.scrollTop += 1000;
  });
  await page.getByRole("button", { name: "No rows", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
  await page.getByRole("button", { name: "All rows", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-15");
});

for (const update of ["Load earlier", "Load later", "Load earlier and owners"]) {
  test(`late data keeps the displayed row fixed: ${update}`, async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Compact", exact: true }).click();
    await expect.poll(() => topDate(page)).toBe("2026-10-15");
    await page.waitForTimeout(1800);
    await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
      viewport.scrollTop += 54;
    });
    const row = day(page, "2026-10-15").locator('[data-testid="calendar-row"][data-calendar-id="row-134"]');
    const offset = () =>
      row.evaluate(
        (element) =>
          element.getBoundingClientRect().top -
          document.querySelector(".quno-calendar-viewport")!.getBoundingClientRect().top
      );
    await expect.poll(offset).toBe(-12);
    await page.getByRole("button", { name: update, exact: true }).click();
    await expect(page.getByTestId("pending")).toHaveText("true");
    await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
      const samples: Array<number | null> = [];
      const deadline = performance.now() + 1500;
      const sample = () => {
        const row = viewport.querySelector(
          '[data-date="2026-10-15"] [data-testid="calendar-row"][data-calendar-id="row-134"]'
        );
        samples.push(row ? row.getBoundingClientRect().top - viewport.getBoundingClientRect().top : null);
        (viewport as HTMLElement).dataset.lateDataOffsets = JSON.stringify(samples);
        if (performance.now() < deadline) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.getByRole("button", { name: "Release data", exact: true }).click();
    await expect
      .poll(
        async () => (await day(page, update === "Load later" ? "2026-10-16" : "2026-10-14").boundingBox())?.height ?? 0
      )
      .toBeGreaterThan(update === "Load earlier and owners" ? 7872 : 100);
    await expect.poll(() => topDate(page)).toBe("2026-10-15");
    await expect.poll(offset).toBe(-12);
    await page.waitForTimeout(1800);
    expect(await topDate(page)).toBe("2026-10-15");
    expect(await offset()).toBe(-12);
    const frameOffsets: Array<number | null> = JSON.parse(
      (await page.locator(".quno-calendar-viewport").getAttribute("data-late-data-offsets")) ?? "[]"
    );
    expect(frameOffsets.length).toBeGreaterThan(2);
    for (const value of frameOffsets) {
      expect(value).not.toBeNull();
      expect(Math.abs(value! + 12)).toBeLessThanOrEqual(1);
    }
    await page.getByRole("button", { name: "Clear overlaps", exact: true }).click();
    await page.getByRole("button", { name: "Release data", exact: true }).click();
    await expect
      .poll(async () => (await day(page, update === "Load later" ? "2026-10-16" : "2026-10-14").boundingBox())?.height)
      .toBe(update === "Load earlier and owners" ? 7872 : 100);
    await page.waitForTimeout(1800);
    expect(await topDate(page)).toBe("2026-10-15");
    expect(await offset()).toBe(-12);
  });
}

test("navigation during a pending update wins over the previously viewed date", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.getByTestId("pending")).toHaveText("true");
  await page.getByRole("button", { name: "October 22", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-22");
  await page.getByRole("button", { name: "Release data", exact: true }).click();
  await expect.poll(() => topDate(page)).toBe("2026-10-22");
  await page.waitForTimeout(1800);
  expect(await topDate(page)).toBe("2026-10-22");
});
