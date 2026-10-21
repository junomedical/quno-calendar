import { expect, test, type Page } from "@playwright/test";
import { goToWorkday, firstViewportEventBox } from "#quno-e2e/helpers";

const topDate = (page: Page) =>
  page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    const top = viewport.getBoundingClientRect().top + 1;
    return [...viewport.querySelectorAll<HTMLElement>(".quno-calendar-day")].find(
      (day) => day.getBoundingClientRect().bottom > top
    )?.dataset.date;
  });

test("centers a saved event on both axes and restores the captured resource after creation layout changes", async ({
  page
}) => {
  await page.goto("/e2e/fixtures/calendar-viewport-loading.html?center");
  await page.getByRole("button", { name: "Center saved event", exact: true }).click();
  const geometry = () =>
    page.locator(".quno-calendar-viewport").evaluate((viewport) => {
      const event = viewport.querySelector<HTMLElement>('[data-date="2026-10-15"] [data-testid="calendar-event"]');
      if (!event) return null;
      const box = event.getBoundingClientRect();
      const frame = viewport.getBoundingClientRect();
      return {
        x: box.x + box.width / 2 - frame.x,
        y: box.y + box.height / 2 - frame.y,
        centerX: 220 + (viewport.clientWidth - 220) / 2,
        centerY: 42 + (viewport.clientHeight - 42) / 2
      };
    });
  await expect
    .poll(async () => {
      const box = await geometry();
      return box ? Math.abs(box.x - box.centerX) + Math.abs(box.y - box.centerY) : Infinity;
    })
    .toBeLessThan(2);
  const before = await geometry();
  await page.getByRole("button", { name: "Capture viewport", exact: true }).click();
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await page.getByRole("button", { name: "October 22", exact: true }).click();
  await page.getByRole("button", { name: "Restore viewport", exact: true }).click();
  await expect
    .poll(async () => {
      const box = await geometry();
      return box ? Math.abs(box.x - before!.x) + Math.abs(box.y - before!.y) : Infinity;
    })
    .toBeLessThan(2);
});

test("screen buffers follow actual day height and grow only for the configured distance", async ({ page }) => {
  await page.goto("/e2e/fixtures/calendar-viewport-loading.html?screens");
  await expect(page.getByTestId("request-count")).toHaveText("1");
  await page.waitForTimeout(600);
  const first = JSON.parse((await page.getByTestId("requests").textContent())!);
  expect(first[0]).toMatchObject({ startDate: "2026-10-14", endDate: "2026-10-16" });
  const fraction = await page
    .locator(".quno-calendar-viewport")
    .evaluate(
      (viewport) =>
        viewport.clientHeight /
        viewport.querySelector<HTMLElement>('[data-date="2026-10-15"].quno-calendar-day')!.getBoundingClientRect()
          .height
    );
  expect(fraction).toBeLessThan(0.1);
  await page.locator(".quno-calendar-viewport").evaluate((viewport) => {
    viewport.scrollTop += 3000;
  });
  await page.waitForTimeout(350);
  await expect(page.getByTestId("request-count")).toHaveText("1");
  await page.getByRole("button", { name: "October 15", exact: true }).click();
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  const checkCoverage = async (screens: number) => {
    await expect
      .poll(() =>
        page.locator(".quno-calendar-viewport").evaluate((viewport, screens) => {
          const reference = viewport.querySelector<HTMLElement>('[data-date="2026-10-15"].quno-calendar-day')!;
          const box = reference.getBoundingClientRect();
          const bounds = viewport.getBoundingClientRect();
          const height = viewport.clientHeight - 42;
          const first = Math.floor((bounds.top + 42 - height * screens - box.top) / box.height);
          const last = Math.ceil((bounds.top + viewport.clientHeight + height * screens - box.top) / box.height) - 1;
          const requests: Array<{ startDate: string; endDate: string }> = JSON.parse(
            document.querySelector('[data-testid="requests"]')!.textContent!
          );
          const dates = Array.from({ length: last - first + 1 }, (_, index) => {
            const date = new Date("2026-10-15T00:00:00Z");
            date.setUTCDate(date.getUTCDate() + first + index);
            return date.toISOString().slice(0, 10);
          });
          return dates.every((date) =>
            requests.some((request) => request.startDate <= date && request.endDate >= date)
          );
        }, screens)
      )
      .toBe(true);
  };
  await checkCoverage(1);
  await page.waitForTimeout(600);
  const compactCount = await page.getByTestId("request-count").textContent();
  await page.getByLabel("Prefetch screens").selectOption("0");
  await page.waitForTimeout(250);
  await expect(page.getByTestId("request-count")).toHaveText(compactCount!);
  await page.getByLabel("Prefetch screens").selectOption("2");
  await checkCoverage(2);
  expect(Number(await page.getByTestId("request-count").textContent())).toBeGreaterThan(Number(compactCount));
  expect(await topDate(page)).toBe("2026-10-15");
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
