import { devices, expect, test, type Page } from "@playwright/test";

async function expectViewportFit(page: Page, width: number, product: string) {
  const geometry = await page.evaluate((product) => {
    const selectors = [
      "main.concept",
      ...(document.querySelector(".concept--fullscreen") ? [] : [".site-header"]),
      ".concept-tour-content",
      ".concept-canvas",
      ".concept-tour-guide",
      ...(product === "calendar"
        ? [".quno-calendar-viewport"]
        : [
            ".concept-product-stage",
            ".concept-product-mount",
            ".concept-product-card",
            product === "datepicker" ? ".quno-date-picker" : ".quno-time-picker"
          ]),
      ...(product === "timepicker" ? [".concept-cadence"] : [])
    ];
    return {
      document: document.documentElement.scrollWidth,
      layout: innerWidth,
      visual: visualViewport!.width,
      boxes: selectors.map((selector) => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return { selector, left: box.left, right: box.right, width: box.width };
      })
    };
  }, product);
  expect(geometry.document).toBe(width);
  expect(geometry.layout).toBe(width);
  expect(geometry.visual).toBeCloseTo(width, 1);
  for (const box of geometry.boxes) {
    expect(box.left, box.selector).toBeGreaterThanOrEqual(0);
    expect(box.right, box.selector).toBeLessThanOrEqual(width);
    expect(box.width, box.selector).toBeGreaterThan(0);
  }
}

for (const product of ["datepicker", "calendar", "timepicker"]) {
  test(`mobile ${product} fits the viewport through rotation, navigation and drawer changes`, async ({
    browser,
    browserName,
    baseURL
  }, info) => {
    test.skip(browserName === "firefox", "Firefox does not support mobile device emulation");
    const context = await browser.newContext({ ...devices["Pixel 7"], baseURL, reducedMotion: "reduce" });
    const page = await context.newPage();
    try {
      await page.goto(
        product === "datepicker"
          ? "/datepicker/paint"
          : product === "calendar"
            ? "/calendar/views"
            : "/timepicker/cadence"
      );
      const guide = page.locator(".concept-tour-guide");
      await expect(
        page.locator(
          product === "datepicker"
            ? ".quno-date-picker"
            : product === "calendar"
              ? ".quno-calendar-viewport"
              : ".quno-time-picker"
        )
      ).toBeVisible();
      for (const size of [
        { width: 390, height: 844 },
        { width: 844, height: 390 },
        { width: 320, height: 667 },
        { width: 280, height: 653 },
        { width: 360, height: 780 }
      ]) {
        await page.setViewportSize(size);
        await expectViewportFit(page, size.width, product);
        await guide.getByRole("button", { name: "Collapse description", exact: true }).click();
        if (product === "datepicker") {
          await page.locator('[data-slot="month-heading-button"]').click();
          await expect(page.locator('[data-slot="month-navigation"]')).toBeVisible();
        } else if (product === "calendar") {
          await page.getByRole("button", { name: "Vertical", exact: true }).click();
        } else if (size.width >= 320 && size.height >= 600) {
          for (const step of [5, 15, 20]) {
            await page.getByRole("button", { name: `${step} min`, exact: true }).click();
            await expect(page.locator('[data-hour="10"] [data-slot="minute-option"]')).toHaveCount(60 / step);
            await expect(page.locator('[data-slot="selection-summary"]')).toHaveText("10:35");
            const bounds = await page.locator(".quno-time-picker").boundingBox();
            const card = await page.locator(".concept-product-card").boundingBox();
            const choices = await page
              .locator('.quno-time-picker [data-slot="minute-option"], .concept-cadence button')
              .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
            for (const choice of choices) {
              expect(choice.left).toBeGreaterThanOrEqual(0);
              expect(choice.right).toBeLessThanOrEqual(size.width);
            }
            expect(bounds!.x).toBeGreaterThanOrEqual(card!.x);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(card!.x + card!.width);
            for (const button of await page.locator(".concept-cadence button").all()) {
              const box = (await button.boundingBox())!;
              expect(box.width).toBeGreaterThanOrEqual(80);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
        await expectViewportFit(page, size.width, product);
        if (product === "datepicker") {
          await page.locator('[data-slot="month-heading-button"]').click();
          await page.getByRole("button", { name: "Next month", exact: true }).click();
        } else if (product === "calendar") {
          await page.getByRole("button", { name: "Horizontal", exact: true }).click();
        }
        await guide.getByRole("button", { name: "Expand description", exact: true }).click();
        await guide.getByRole("button", { name: /^All .+ demos$/ }).click();
        await expectViewportFit(page, size.width, product);
        await page.keyboard.press("Escape");
        await guide.getByRole("button", { name: /^Full screen/ }).click();
        await expectViewportFit(page, size.width, product);
        await page.keyboard.press("Escape");
      }
      await page.screenshot({ path: info.outputPath(`${product}-mobile-width.png`) });
    } finally {
      await context.close().catch(() => {});
    }
  });
}
