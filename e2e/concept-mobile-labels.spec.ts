import { expect, test } from "@playwright/test";
import { selectCalendarScene } from "#quno-e2e/concept-helpers";

test("mobile names column uses thirty percent with smaller text through resize and fullscreen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  const viewport = page.locator(".quno-calendar-viewport");
  const names = page.locator(".quno-calendar-row-label").first();
  const dates = page.locator(".quno-calendar-date-label").first();
  await expect(page.locator(".concept-event").first()).toBeVisible();
  const original = await viewport.elementHandle();
  const desktop = {
    name: await names.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
    date: await dates.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
  };
  await expect(names).toHaveCSS("width", "238px");
  for (const width of [375, 390, 844, 850]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    const expected = await viewport.evaluate((node) => node.clientWidth * 0.3);
    await expect.poll(async () => (await names.boundingBox())!.width).toBeCloseTo(expected, 1);
    expect((await dates.boundingBox())!.width).toBeCloseTo(expected, 1);
    expect(await names.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeCloseTo(
      desktop.name * 0.75,
      2
    );
    expect(await dates.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeCloseTo(
      desktop.date * 0.6,
      2
    );
    const grid = await viewport.evaluate((node) => {
      const row = node.querySelector<HTMLElement>(".quno-calendar-row-grid")!;
      return row.getBoundingClientRect().left + node.scrollLeft - node.getBoundingClientRect().left;
    });
    expect(grid).toBeCloseTo(expected, 1);
    await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
    await expect.poll(async () => (await names.boundingBox())!.width).toBeCloseTo(expected, 1);
    await page.keyboard.press("Escape");
    expect(await original!.evaluate((node) => node === document.querySelector(".quno-calendar-viewport"))).toBe(true);
    if (width === 390) await page.screenshot({ path: test.info().outputPath("mobile-calendar-labels.png") });
  }
  await page.setViewportSize({ width: 851, height: 900 });
  await expect(names).toHaveCSS("width", "238px");
  await expect(names).toHaveCSS("font-size", `${desktop.name}px`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(names).toHaveCSS("width", "238px");
  await expect(names).toHaveCSS("font-size", `${desktop.name}px`);
  await expect(dates).toHaveCSS("font-size", `${desktop.date}px`);
});

test("mobile zoom fits the responsive labels and vertical view keeps its own left axis", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Zoom", false);
  const viewport = page.locator(".quno-calendar-viewport");
  const fit = await viewport.evaluate((node) =>
    Math.max(0.5, Math.ceil(((node.clientWidth * 0.7 - 8) / 660) * 100) / 100)
  );
  await expect(page.getByRole("slider", { name: "Zoom level" })).toHaveAttribute("min", String(fit));
  await selectCalendarScene(page, "Horizontal / vertical", false);
  await page.getByRole("button", { name: "Vertical", exact: true }).click();
  await expect(page.locator(".icv-time-pane").first()).toHaveCSS("width", "167px");
  await expect(page.locator(".icv-calendar-header-cell").first()).toHaveCSS("font-size", "14px");
  await page.getByRole("button", { name: "Horizontal", exact: true }).click();
  const width = await viewport.evaluate((node) => node.clientWidth * 0.3);
  await expect
    .poll(async () => (await page.locator(".quno-calendar-row-label").first().boundingBox())!.width)
    .toBeCloseTo(width, 1);
});
