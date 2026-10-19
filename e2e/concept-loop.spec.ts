import { expect, test } from "@playwright/test";
import { pauseCalendarScene, selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });

for (const width of [1440, 390])
  test(`orientation switches scroll into the next day in each view at ${width}px`, async ({ page }, info) => {
    test.setTimeout(30000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await selectCalendarScene(page, "Horizontal / vertical");
    const calendar = page.locator(".concept-calendar-workspace");
    const workspace = await calendar.elementHandle();
    await expect(calendar).toHaveAttribute("data-view", "infinite-vertical");
    await expect(calendar).toHaveAttribute("data-visible-date", "2026-10-20", { timeout: 10000 });
    await expect(calendar).toHaveAttribute("data-view", "infinite-horizontal", { timeout: 10000 });
    await expect(calendar).toHaveAttribute("data-visible-date", "2026-10-21", { timeout: 10000 });
    await expect(page.locator(".concept")).toHaveAttribute("data-scene", "views");
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
    expect(await workspace!.evaluate((node) => node === document.querySelector(".concept-calendar-workspace"))).toBe(
      true
    );
    if (width === 1440) await page.screenshot({ path: info.outputPath("orientation-next-day.png") });
    await expect(page.locator(".concept-canvas")).toHaveAttribute("data-playback-cycle", "1", { timeout: 10000 });
    await expect(calendar).toHaveAttribute("data-visible-date", "2026-10-19");
    await pauseCalendarScene(page);
  });

test("theming explicitly returns to Light before continuing the same scene", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Theming");
  const actions = await page.evaluate(async () => {
    const workspace = document.querySelector(".concept-calendar-workspace")!;
    const clicks: string[] = [];
    const capture = (event: Event) => {
      const action = (event.target as Element).closest("[data-action]")?.getAttribute("data-action");
      if (action) clicks.push(action);
    };
    workspace.addEventListener("click", capture, true);
    while (document.querySelector(".concept-canvas")?.getAttribute("data-playback-cycle") === "0")
      await new Promise(requestAnimationFrame);
    workspace.removeEventListener("click", capture, true);
    return clicks;
  });
  expect(actions).toEqual(["dark", "brand", "light"]);
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".concept-cursor")).toBeVisible();
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "theme");
  await pauseCalendarScene(page);
});

test("scroll continues through new dates without resetting or selecting another scenario", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/concept");
  const schedule = page.locator(".concept-calendar-workspace");
  await expect(page.locator('.concept-cursor[data-gesture="scroll"]')).toBeVisible();
  const result = await page.evaluate(async () => {
    const dates: string[] = [];
    let navigationClicks = 0;
    const navigation = document.querySelector(".concept-tour-pagination")!;
    const click = () => navigationClicks++;
    navigation.addEventListener("click", click);
    for (let sample = 0; sample < 4; sample++) {
      await new Promise((resolve) => setTimeout(resolve, 3500));
      dates.push(document.querySelector<HTMLElement>(".concept-calendar-workspace")!.dataset.visibleDate!);
    }
    navigation.removeEventListener("click", click);
    return { dates, navigationClicks };
  });
  expect(result.navigationClicks).toBe(0);
  expect(new Set(result.dates).size).toBeGreaterThan(2);
  expect(result.dates.every((date, index) => !index || date >= result.dates[index - 1])).toBe(true);
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "scroll");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator(".concept-tour-body")).toBeVisible();
  await pauseCalendarScene(page);
  const stopped = await schedule.getAttribute("data-visible-date");
  await page.waitForTimeout(1500);
  await expect(schedule).toHaveAttribute("data-visible-date", stopped!);
});

test("zoom repeats on the same chapter with expanded text and stops on manual input", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Zoom");
  const schedule = page.locator(".concept-calendar-workspace");
  await expect(schedule).toHaveAttribute("data-zoom", "0.5", { timeout: 15000 });
  await expect(schedule).toHaveAttribute("data-zoom", "8", { timeout: 10000 });
  await expect(schedule).toHaveAttribute("data-zoom", "0.5", { timeout: 15000 });
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "zoom");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator(".concept-tour-guide")).toHaveAttribute("data-collapsed", "false");
  await pauseCalendarScene(page);
  const stopped = await schedule.getAttribute("data-zoom");
  await page.waitForTimeout(1500);
  await expect(schedule).toHaveAttribute("data-zoom", stopped!);
});

test("creation repeats without accumulating automatic appointments under the expanded phone guide", async ({
  page
}) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Create an appointment");
  await expect(page.locator('[data-event-id="concept-created-1"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-event-id="concept-created-2"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-event-id="concept-created-1"]')).toHaveCount(0);
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "create");
  await expect(page.locator(".concept-tour-guide")).toHaveAttribute("data-collapsed", "false");
  await expect(page.locator(".concept-tour-guide")).toHaveCSS("pointer-events", "auto");
  await pauseCalendarScene(page);
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-event-id="concept-created-2"]')).toHaveCount(1);
});
