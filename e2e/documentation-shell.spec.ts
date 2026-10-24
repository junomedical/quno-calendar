import { expect, test } from "@playwright/test";

const products = ["infinite-calendar", "datepicker", "date-input", "timepicker", "date-parser"] as const;
const sections = ["infinite-view", "paint", "selection-mode", "time-selection", "date-formats"] as const;

for (const width of [1440, 1024, 390]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`shared navigation and guide columns at ${width}px in ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/datepicker");
      const header = page.locator(".site-header");
      await expect(header).toHaveCSS("color-scheme", colorScheme);
      const demoBounds = (await header.boundingBox())!;
      const demoStyle = await header.evaluate((element) => ({
        color: getComputedStyle(element).color,
        background: getComputedStyle(element).backgroundColor
      }));
      const docs = header.getByRole("link", { name: "Documentation", exact: true });
      if (width > 850) {
        const tabs = (await header.locator("nav").boundingBox())!;
        const action = (await docs.boundingBox())!;
        expect(tabs.x).toBe(24);
        expect(action.x - tabs.x - tabs.width).toBe(24);
      }
      await docs.click();
      await expect(page).toHaveURL(/\/docs\/datepicker$/);
      await expect(page.locator(".field-guide h1")).toBeVisible();
      expect(await header.boundingBox()).toEqual(demoBounds);
      expect(
        await header.evaluate((element) => ({
          color: getComputedStyle(element).color,
          background: getComputedStyle(element).backgroundColor
        }))
      ).toEqual(demoStyle);
      await expect(header.getByRole("link", { name: "Datepicker", exact: true })).toHaveAttribute(
        "aria-current",
        "page"
      );
      await header.getByRole("link", { name: "Demo", exact: true }).click();
      await expect(page).toHaveURL(/\/datepicker$/);

      for (const [index, product] of products.entries()) {
        await page.goto(`/docs/${product}`);
        const guide = page.locator(".field-guide");
        await expect(guide.locator("h1")).toBeVisible();
        await expect(guide).toHaveCSS("color-scheme", colorScheme);
        await expect(guide).toHaveCSS(
          "background-color",
          colorScheme === "dark" ? "rgb(29, 27, 38)" : "rgb(251, 250, 246)"
        );
        const content = (await guide.locator(".field-guide__content").boundingBox())!;
        expect(content.x).toBe(width <= 640 ? 14 : 24);
        await expect(page.getByRole("navigation", { name: "Live demos", exact: true })).toHaveCount(0);
        await expect(guide.getByRole("link", { name: /^Watch demo/ })).toHaveCount(0);
        const section = page.locator(`#${sections[index]}`);
        await expect(section).toHaveCount(1);
        await section.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
        const note = section.locator(".field-guide__try, .calendar-article__callout").first();
        const example = section.locator(".field-guide__example, .calendar-article__breakout").first();
        const noteBox = (await note.boundingBox())!;
        const exampleBox = (await example.boundingBox())!;
        const sectionBox = (await section.boundingBox())!;
        if (width >= 1100) {
          expect(noteBox.x - sectionBox.x - sectionBox.width).toBe(48);
          expect(noteBox.width).toBe(280);
          const copyBox = (await section.locator(".field-guide__description > .field-guide__copy").boundingBox())!;
          expect(noteBox.y + noteBox.height).toBeCloseTo(copyBox.y + copyBox.height, 1);
        } else {
          expect(noteBox.x).toBe(sectionBox.x);
          expect(noteBox.y + noteBox.height).toBeLessThanOrEqual(exampleBox.y);
        }
        expect(noteBox.y + noteBox.height).toBeLessThanOrEqual(exampleBox.y);
        expect(exampleBox.x).toBeGreaterThanOrEqual(0);
        expect(exampleBox.x + exampleBox.width).toBeLessThanOrEqual(width);
        expect((await header.boundingBox())!.y).toBe(0);
        expect(sectionBox.y).toBeGreaterThanOrEqual(demoBounds.height);
        expect(noteBox.x + noteBox.width).toBeLessThanOrEqual(width);
        expect(await guide.evaluate((element) => element.scrollWidth)).toBe(
          await guide.evaluate((element) => element.clientWidth)
        );
        await expect(header.locator('[aria-current="page"]')).toHaveAttribute("href", `/docs/${product}`);
      }
      await page.goto("/docs");
      await expect(header.getByRole("link", { name: "Demo", exact: true })).toHaveAttribute("href", "/");
      await expect(page.locator(".project-home")).toHaveCSS("color-scheme", colorScheme);
      await expect(page.locator(".project-home")).toHaveCSS(
        "background-color",
        colorScheme === "dark" ? "rgb(29, 27, 38)" : "rgb(251, 250, 246)"
      );
    });
  }
}

test("documentation follows browser appearance changes while controls stay readable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/docs/timepicker#time-selection");
  const guide = page.locator(".field-guide");
  const example = page.locator("#time-selection .field-guide__example");
  await expect(guide).toHaveCSS("background-color", "rgb(251, 250, 246)");
  for (const colorScheme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator(".site-header")).toHaveCSS("color-scheme", colorScheme);
    await expect(guide).toHaveCSS(
      "background-color",
      colorScheme === "dark" ? "rgb(29, 27, 38)" : "rgb(251, 250, 246)"
    );
    await expect(example).toHaveCSS("color-scheme", "light");
    await expect(example).toHaveCSS("color", "rgb(37, 40, 35)");
    await expect(example).toHaveCSS("background-color", "rgb(255, 254, 250)");
  }
  const minute = example.locator('[data-time="10:45"]');
  await minute.click();
  await expect(minute).toHaveAttribute("aria-pressed", "true");
});

test("shared header persists during a delayed dark documentation load", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/demo/guide/date-parser/DateParserFieldGuide.tsx*", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/docs/date-parser", { waitUntil: "domcontentloaded" });
  try {
    const placeholder = page.getByLabel("Loading documentation");
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toHaveText("");
    await expect(placeholder).toHaveCSS("background-color", "rgb(29, 27, 38)");
    const header = page.locator(".site-header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Parser", exact: true })).toHaveAttribute("aria-current", "page");
    const headerBox = (await header.boundingBox())!;
    const placeholderBox = (await placeholder.boundingBox())!;
    expect(placeholderBox.y).toBe(headerBox.height);
    expect(placeholderBox.y + placeholderBox.height).toBe(720);
  } finally {
    release();
  }
  await expect(page.locator(".field-guide h1")).toBeVisible();
});

test("calendar example actions retain their palette beside themed documentation cards", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/docs/infinite-calendar#availability");
  await page.locator("#availability .article-lazy-demo").scrollIntoViewIfNeeded();
  const selected = page.locator('#availability .article-segmented-control button[aria-pressed="true"]').first();
  await expect(selected).toBeVisible();
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(selected).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(selected).toHaveCSS("background-color", "rgb(36, 107, 93)");
    await expect(page.locator(".article-performance-range article").first()).toHaveCSS(
      "background-color",
      colorScheme === "dark" ? "rgb(38, 35, 48)" : "rgb(255, 254, 250)"
    );
  }
});
