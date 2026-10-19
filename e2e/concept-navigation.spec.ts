import { test, expect, type Page } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
test.use({ hasTouch: true });
async function open(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await expect(page.locator(".concept-event").first()).toBeVisible();
}
async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 1 }] });
  for (let step = 1; step <= 12; step++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 12, y: from.y + ((to.y - from.y) * step) / 12, id: 1 }]
    });
    await page.waitForTimeout(16);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
for (const size of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 375, height: 667 }
]) {
  test(`title, explanation, demo and bottom rail fit one screen at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page);
    const intro = (await page.locator('.concept-screen[data-active="true"] .concept-intro').boundingBox())!;
    const canvas = (await page.locator(".concept-canvas").boundingBox())!;
    const rail = (await page.locator(".concept-scenarios").boundingBox())!;
    const button = (await page.getByRole("button", { name: "Full screen demo", exact: true }).boundingBox())!;
    const paragraphs = page.locator('.concept-screen[data-active="true"] .concept-explanation p');
    expect(await paragraphs.count()).toBeGreaterThanOrEqual(1);
    expect(await paragraphs.count()).toBeLessThanOrEqual(2);
    const lastParagraph = (await paragraphs.last().boundingBox())!;
    expect(button.y).toBeGreaterThanOrEqual(lastParagraph.y + lastParagraph.height);
    expect(intro.y).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(120);
    expect(rail.y + rail.height).toBeCloseTo(size.height, 0);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(rail.y + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
    await expect(page.locator(".concept-scenario-grid")).toHaveCSS("overflow-x", "auto");
  });
}
test("scenario titles scroll the page through intermediate positions and update the active demo", async ({ page }) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator(".concept-scenario button").filter({ hasText: "Zoom" }).click();
  const samples = await page.evaluate(async () => {
    const values: number[] = [];
    while (document.querySelector(".concept")?.getAttribute("data-scene") !== "zoom") {
      values.push(document.querySelector(".concept-pages")!.scrollTop);
      await new Promise(requestAnimationFrame);
    }
    return values;
  });
  expect(new Set(samples).size).toBeGreaterThan(4);
  await expect(page.locator('.concept-screen[data-active="true"] .concept-intro h1')).toHaveText("Zoom");
  const pages = page.locator(".concept-pages");
  expect(await pages.evaluate((el) => Math.abs(el.scrollTop - el.clientHeight))).toBeLessThan(2);
  await page.getByRole("button", { name: "Try it", exact: true }).click();
  await pages.evaluate((el) => el.scrollTo({ top: el.clientHeight * 2, behavior: "instant" }));
  await expect(page.locator('.concept-screen[data-active="true"] .concept-intro h1')).toHaveText("Overlapping events");
  await expect(page.locator('.concept-scenario button[aria-current="step"]')).toContainText("Overlapping events");
});
test("fullscreen shows only the live demo and interaction controls, preserving state on exit", async ({ page }) => {
  await open(page);
  await page.locator(".concept-scenario button").filter({ hasText: "Theming" }).click();
  await expect(page.locator(".concept-scenario button").filter({ hasText: "Theming" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByRole("button", { name: "Try it", exact: true }).click();
  await page.locator('[data-action="dark"]').click();
  await page.getByRole("button", { name: "Full screen demo", exact: true }).click();
  await expect(page.locator(".concept-nav, .concept-intro, .concept-scenarios")).toHaveCount(0);
  await expect(page.locator(".concept-canvas")).not.toHaveAttribute("inert", "");
  const canvas = (await page.locator(".concept-canvas").boundingBox())!;
  expect(canvas.x).toBe(0);
  expect(canvas.y).toBe(0);
  expect(canvas.width).toBe(page.viewportSize()!.width);
  expect(canvas.height).toBeGreaterThan(page.viewportSize()!.height * 0.8);
  await page.keyboard.press("Escape");
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-view", "infinite-horizontal");
  await expect(page.getByRole("button", { name: "Full screen demo", exact: true })).toBeFocused();
});
test("mobile rail swipes horizontally and preview swipes navigate between demos", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const rail = page.locator(".concept-scenario-grid");
  const box = (await rail.boundingBox())!;
  await swipe(page, { x: 330, y: box.y + 25 }, { x: 60, y: box.y + 25 });
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeGreaterThan(60);
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "scroll");
  await expect(page.locator(".concept-canvas")).toHaveAttribute("inert", "");
  const canvas = (await page.locator(".concept-canvas").boundingBox())!;
  await swipe(page, { x: 200, y: canvas.y + canvas.height - 25 }, { x: 200, y: 140 });
  await expect(page.locator(".concept")).not.toHaveAttribute("data-scene", "scroll");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
  await expect(page.locator('[data-action="event-title"]')).toHaveCount(0);
});
test("mobile fields cannot take focus until fullscreen and become inert again on exit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole("button", { name: "Date Input", exact: true }).click();
  const input = page.locator('[data-action="date-input"]');
  const box = (await input.boundingBox())!;
  await page.touchscreen.tap(box.x + 20, box.y + box.height / 2);
  await expect(input).not.toBeFocused();
  await expect(input).toHaveValue("");
  await page.getByRole("button", { name: "Full screen demo", exact: true }).click();
  await input.fill("19 October 2026");
  await input.press("Enter");
  await expect(page.locator(".concept-result")).toContainText("2026-10-19");
  await page.getByRole("button", { name: "Exit full screen", exact: true }).click();
  await expect(page.locator(".concept-canvas")).toHaveAttribute("inert", "");
  await expect(input).toHaveValue("19 October 2026");
});

test("every mobile scenario keeps its explanation and fullscreen button above the preview", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await open(page);
  for (const product of ["Calendar", "Datepicker", "Date Input", "Timepicker", "Date Parser"]) {
    await page.getByRole("button", { name: product, exact: true }).click();
    const titles = page.locator(".concept-scenario button");
    for (let index = 0; index < (await titles.count()); index++) {
      await titles.nth(index).click();
      await expect(titles.nth(index)).toHaveAttribute("aria-pressed", "true");
      const canvas = (await page.locator(".concept-canvas").boundingBox())!;
      const button = (await page.getByRole("button", { name: "Full screen demo", exact: true }).boundingBox())!;
      expect(button.y + button.height).toBeLessThanOrEqual(canvas.y);
      expect(canvas.height).toBeGreaterThan(100);
      await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
    }
  }
});
