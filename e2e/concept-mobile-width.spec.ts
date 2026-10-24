import { devices, expect, test, type Page } from "@playwright/test";

async function expectViewportFit(page: Page, width: number, product: string) {
  const geometry = await page.evaluate((product) => {
    const selectors = [
      "main.concept",
      ...(document.querySelector(".concept--fullscreen") ? [] : [".site-header"]),
      ".concept-tour-content",
      ".concept-canvas",
      ".concept-tour-guide",
      ...(product === "datepicker"
        ? [".concept-product-stage", ".concept-product-mount", ".concept-product-card", ".quno-date-picker"]
        : [".quno-calendar-viewport"])
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

for (const product of ["datepicker", "calendar"]) {
  test(`mobile ${product} fits the viewport through rotation, navigation and drawer changes`, async ({
    browser,
    browserName,
    baseURL
  }, info) => {
    test.skip(browserName === "firefox", "Firefox does not support mobile device emulation");
    const context = await browser.newContext({ ...devices["Pixel 7"], baseURL, reducedMotion: "reduce" });
    const page = await context.newPage();
    try {
      await page.goto(product === "datepicker" ? "/datepicker/paint" : "/calendar/views");
      const guide = page.locator(".concept-tour-guide");
      await expect(
        page.locator(product === "datepicker" ? ".quno-date-picker" : ".quno-calendar-viewport")
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
        } else {
          await page.getByRole("button", { name: "Vertical", exact: true }).click();
        }
        await expectViewportFit(page, size.width, product);
        if (product === "datepicker") {
          await page.locator('[data-slot="month-heading-button"]').click();
          await page.getByRole("button", { name: "Next month", exact: true }).click();
        } else {
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
      await context.close();
    }
  });
}
