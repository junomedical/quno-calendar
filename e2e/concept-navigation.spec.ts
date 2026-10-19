import { selectCalendarScene } from "#quno-e2e/concept-helpers";
import { expect, test } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
const products = [
  ["Datepicker", "Paint a range", 8],
  ["Date Input", "Format guessing", 5],
  ["Timepicker", "Choose a time", 4],
  ["Date Parser", "Resolve a phrase", 4]
] as const;
for (const [product, chapter, count] of products)
  for (const size of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 844, height: 390 }
  ])
    test(`${product} uses the floating guide and live full-window demo at ${size.width}×${size.height}`, async ({
      page
    }, info) => {
      await page.setViewportSize(size);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/concept");
      await page.getByRole("button", { name: product, exact: true }).click();
      const guide = page.locator(".concept-tour-guide");
      const canvas = page.locator(".concept-canvas");
      await expect(guide.locator("h1")).toHaveText(product);
      await expect(canvas).not.toHaveAttribute("inert", "");
      await expect(page.locator(".concept-pages, .concept-scenarios, .concept-playback-controls")).toHaveCount(0);
      expect((await canvas.boundingBox())!.width).toBe(size.width);
      const all = guide.getByRole("button", { name: `All ${product.toLowerCase()} demos`, exact: true });
      await expect(all).toHaveText(`All ${product.toLowerCase()} demos`);
      const collapse = guide.getByRole("button", { name: "Collapse description", exact: true });
      expect((await all.boundingBox())!.height).toBe((await collapse.boundingBox())!.height);
      await expect(guide.locator(".concept-tour-pagination button")).toHaveCount(2);
      await expect(guide.locator(".concept-tour-current")).toHaveCount(0);
      await all.click();
      await expect(guide.locator(".concept-tour-contents button")).toHaveCount(count);
      await expect(guide.locator(".concept-tour-back")).toHaveCount(0);
      await guide
        .locator(".concept-tour-contents")
        .getByRole("button", { name: new RegExp(chapter) })
        .click();
      const card = page.locator(".concept-product-card");
      await expect(card).toBeVisible();
      const node = await card.elementHandle();
      const expanded = (await guide.boundingBox())!;
      const stage = (await page.locator(".concept-product-stage").boundingBox())!;
      const cardBox = (await card.boundingBox())!;
      expect(size.height - expanded.y - expanded.height).toBeCloseTo(24, 0);
      if (size.width >= 720) {
        expect(cardBox.x).toBeGreaterThan(expanded.x + expanded.width + 12);
        expect(cardBox.x + cardBox.width / 2).toBeGreaterThan(size.width / 2);
      } else {
        expect(stage.y + stage.height).toBeLessThanOrEqual(expanded.y - 12);
      }
      await page.getByRole("button", { name: "Collapse description", exact: true }).click();
      const collapsed = (await guide.boundingBox())!;
      expect(collapsed.x).toBe(expanded.x);
      expect(collapsed.width).toBe(expanded.width);
      expect(collapsed.y + collapsed.height).toBeCloseTo(expanded.y + expanded.height, 3);
      await expect(guide.getByRole("button")).toHaveCount(1);
      await page.getByRole("button", { name: "Expand description", exact: true }).click();
      const full = page.getByRole("button", { name: `Full screen ${product.toLowerCase()}`, exact: true });
      const bounds = (await full.boundingBox())!;
      expect(size.width - bounds.x - bounds.width).toBe(16);
      expect(size.height - bounds.y - bounds.height).toBe(16);
      await full.click();
      await expect(page.locator(".concept--fullscreen")).toBeVisible();
      await page.keyboard.press("Escape");
      expect(await node!.evaluate((element) => element.isConnected)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
      if (size.width === 1440)
        await page.screenshot({ path: info.outputPath(`${product.toLowerCase().replace(/ /g, "-")}.png`) });
    });

test("Timepicker minutes are smaller than hours and aligned at the top", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await page.getByRole("button", { name: "Timepicker", exact: true }).click();
  await expect(page.locator(".concept-product-card output")).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: /Business hours/ })).toHaveCount(0);
  const clockBox = (await page.locator(".quno-time-picker").boundingBox())!;
  const cadenceBox = (await page.getByRole("group", { name: "Minute cadence" }).boundingBox())!;
  expect(cadenceBox.y).toBeGreaterThanOrEqual(clockBox.y + clockBox.height);
  const geometry = await page.locator('.quno-time-picker-hour-group[data-hour="10"]').evaluate((group) => {
    const hour = group.querySelector("h3")!;
    const minute = group.querySelector("button")!;
    return {
      hour: parseFloat(getComputedStyle(hour).fontSize),
      minute: parseFloat(getComputedStyle(minute).fontSize),
      top: minute.getBoundingClientRect().top - hour.getBoundingClientRect().top,
      alignment: getComputedStyle(minute).alignItems
    };
  });
  expect(geometry.minute).toBeLessThan(geometry.hour);
  expect(geometry.top).toBeCloseTo(0, 3);
  expect(geometry.alignment).toBe("flex-start");
});

test("all products autoplay on chapter arrival and remain on that chapter for repeated cycles", async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await page.getByRole("button", { name: "Datepicker", exact: true }).click();
  await selectCalendarScene(page, "Paint a range");
  await expect(page.locator(".concept-canvas")).toHaveAttribute("data-playback-cycle", "2", { timeout: 30000 });
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "paint");
  await expect(page.locator(".concept-tour-guide")).toHaveAttribute("data-collapsed", "false");
  await page.keyboard.press("Shift");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
});
