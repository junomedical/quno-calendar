import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`homepage preserves shareable product and chapter navigation at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page).toHaveTitle("Quno — Dates and schedules");
    const concept = page.locator("main.concept");
    await expect(concept).toHaveAttribute("data-product", "infinite-calendar");
    await expect(page.locator(".concept-logo")).toHaveCount(0);
    const tabs = page.getByRole("navigation", { name: "Products", exact: true });
    await tabs.getByRole("button", { name: "Datepicker", exact: true }).click();
    await page.getByRole("button", { name: "Next demo", exact: true }).click();
    await expect(page).toHaveURL(/\/datepicker\/paint$/);
    await expect(page.locator(".concept-tour-content")).toHaveAttribute("data-introduction", "false");
    await page.getByRole("button", { name: "Next demo", exact: true }).click();
    await expect(page).toHaveURL(/\/datepicker\/resize$/);
    await tabs.getByRole("button", { name: "Parser", exact: true }).click();
    await expect(page).toHaveURL(/\/parser$/);
    await tabs.getByRole("button", { name: "Datepicker", exact: true }).click();
    await expect(page).toHaveURL(/\/datepicker\/resize$/);
    await expect(concept).toHaveAttribute("data-scene", "resize");
    const shared = page.url();
    await page.reload();
    await expect(concept).toHaveAttribute("data-scene", "resize");
    await expect(page.locator(".concept-tour-content")).toHaveAttribute("data-introduction", "false");
    await page.goBack();
    await expect(concept).toHaveAttribute("data-product", "date-parser");
    await expect(page.locator(".concept-tour-content")).toHaveAttribute("data-introduction", "true");
    await page.goForward();
    await expect(concept).toHaveAttribute("data-product", "datepicker");
    await expect(concept).toHaveAttribute("data-scene", "resize");
    const recipient = await context.newPage();
    await recipient.goto(shared);
    await expect(recipient.locator("main.concept")).toHaveAttribute("data-scene", "resize");
    await expect(recipient.locator(".concept-tour-content")).toHaveAttribute("data-introduction", "false");
    await recipient.close();
    await expect(page.getByRole("link", { name: "Documentation" })).toHaveAttribute("href", "/docs/datepicker");
    const bounds = await tabs.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await page.locator("body").evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(width);
  });

  test(`current and archived docs retain examples and distinct navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const product of ["infinite-calendar", "datepicker", "date-input", "timepicker", "date-parser"]) {
      await page.goto(`/docs/${product}`);
      const demos = page.getByRole("navigation", { name: "Live demos", exact: true });
      await expect(demos).toBeVisible();
      const first = demos.getByRole("link").first();
      await expect(first).toHaveAttribute(
        "href",
        new RegExp(
          `^/${product === "infinite-calendar" ? "calendar" : product === "date-parser" ? "parser" : product}/`
        )
      );
      const nav = page.getByRole("navigation", { name: "Documentation products" });
      await expect(page.locator('a[href^="/docs/archive"]')).toHaveCount(0);
      const geometry = await nav.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return { right: box.right, scroll: node.scrollWidth, width: node.clientWidth };
      });
      expect(geometry.right).toBeLessThanOrEqual(width);
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.width);
      await page.goto(`/docs/archive/${product}`);
      await expect(page.getByText(/Archived field guides · 20 October 2026/)).toBeVisible();
      await expect(page.locator(".field-guide h1")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Live demos", exact: true })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /^Demo/ })).toHaveAttribute("href", `/demo/${product}`);
      await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
    }
    await page.goto("/docs/archive");
    await expect(page.getByRole("link", { name: "Explore the calendar guide" })).toHaveAttribute(
      "href",
      "/docs/archive/infinite-calendar"
    );
    await page.goto("/docs/datepicker#single-day");
    await expect(page.locator("#single-day .quno-date-picker")).toBeVisible();
    await expect.poll(async () => (await page.locator("#single-day").boundingBox())!.y).toBeGreaterThanOrEqual(0);
    await expect.poll(async () => (await page.locator("#single-day").boundingBox())!.y).toBeLessThan(60);
  });
}

test("invalid shared links fall back to a valid product introduction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?product=unknown&demo=missing&source=shared");
  await expect(page.locator("main.concept")).toHaveAttribute("data-product", "infinite-calendar");
  await expect(page).toHaveURL(/\/\?source=shared$/);
  await page.goto("/?product=datepicker&demo=density");
  await expect(page.locator(".concept-tour-content")).toHaveAttribute("data-introduction", "true");
  await expect(page).toHaveURL(/\/datepicker$/);
});

test("busy-schedule docs start light on a dark computer", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/docs/infinite-calendar#performance");
  await page
    .locator('.article-lazy-demo[data-demo-label="event density comparison"]')
    .evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  const demo = page.getByTestId("density-guide-demo");
  await demo.scrollIntoViewIfNeeded();
  const workspace = demo.locator(".concept-calendar-workspace");
  await expect(workspace).toHaveAttribute("data-theme", "light");
  await expect(demo.locator(".concept-calendar-workspace")).toHaveCSS("color-scheme", "light");
  const viewport = demo.locator(".quno-calendar-viewport");
  expect((await viewport.boundingBox())!.height).toBeGreaterThan(450);
  await demo.getByRole("button", { name: "Packed · 60", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-density", "60");
  await expect(workspace).toHaveAttribute("data-theme", "light");
});

test("shared chapters open directly for every product", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [product, scene, label] of [
    ["infinite-calendar", "density", "Event density"],
    ["datepicker", "resize", "Adjust the end"],
    ["date-input", "keyboard", "Edit with keyboard"],
    ["timepicker", "cadence", "Keep an existing time"],
    ["date-parser", "ambiguity", "Resolve ambiguity"]
  ]) {
    await page.goto(
      `/${product === "infinite-calendar" ? "calendar" : product === "date-parser" ? "parser" : product}/${scene}`
    );
    await expect(page.locator("main.concept")).toHaveAttribute("data-product", product);
    await expect(page.locator("main.concept")).toHaveAttribute("data-scene", scene);
    await expect(page.locator(".concept-tour-content")).toHaveAttribute("data-introduction", "false");
    await expect(page.locator(".concept-tour-guide h1")).toHaveText(label);
  }
});

test("documentation loads without flashing a message or archive links", async ({ page }) => {
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/demo/guide/date-parser/DateParserFieldGuide.tsx*", async (route) => {
    requested();
    await gate;
    await route.continue();
  });
  await page.goto("/docs/date-parser", { waitUntil: "domcontentloaded" });
  await pending;
  const placeholder = page.getByLabel("Loading documentation");
  try {
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toHaveText("");
    await expect(placeholder).toHaveCSS("background-color", "rgb(251, 250, 246)");
    expect((await placeholder.boundingBox())!.height).toBe(720);
    await expect(page.getByText("Opening documentation…", { exact: true })).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.locator(".field-guide h1")).toBeVisible();
  await expect(placeholder).toHaveCount(0);
  await expect(page.locator('a[href^="/docs/archive"]')).toHaveCount(0);
  await page.goto("/docs");
  await expect(page.locator(".project-home h1")).toBeVisible();
  await expect(page.locator('a[href^="/docs/archive"]')).toHaveCount(0);
});
