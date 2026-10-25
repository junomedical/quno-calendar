import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

for (const width of [1440, 844, 320, 280]) {
  for (const [route, product] of [
    ["calendar/scroll", "infinite-calendar"],
    ["datepicker/paint", "datepicker"],
    ["date-input/format", "date-input"],
    ["timepicker/time", "timepicker"],
    ["parser/phrase", "date-parser"]
  ]) {
    test(`${product} popup keeps its explanation reachable without a recipe link at ${width}px`, async ({ page }) => {
      const height = width <= 320 ? 667 : width === 844 ? 390 : 900;
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${route}`);
      const guide = page.locator(".concept-tour-guide");
      const body = guide.locator(".concept-tour-body");
      await expect(guide).toHaveAttribute("data-page", "scene");
      await expect(body.locator("p").last()).toBeVisible();
      await expect(body.getByRole("link")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Documentation", exact: true })).toHaveAttribute(
        "href",
        `/docs/${product}`
      );
      if (product === "infinite-calendar") {
        await expect(body.locator("p")).toHaveText([
          "The first and most important concept is an infinite calendar: an endless timeline you can explore by scrolling. It lets you move quickly between dates and participants without changing focus.",
          "The second decision was to make the timeline horizontal, fitting more calendars on screen and giving appointment cards more room for text to flow naturally."
        ]);
      }
      const navigation = guide.getByRole("navigation", { name: "Demo navigation", exact: true });
      const all = navigation.getByRole("button", { name: /^All .+ demos$/ });
      await expect(all).toBeVisible();
      await expect(all.locator("svg")).toHaveCount(0);
      await expect(guide.locator(".concept-tour-guide-top button")).toHaveCount(2);
      const previous = (await navigation.getByRole("button", { name: "Previous demo" }).boundingBox())!;
      const contents = (await all.boundingBox())!;
      const next = (await navigation.getByRole("button", { name: "Next demo" }).boundingBox())!;
      const footer = (await navigation.boundingBox())!;
      expect(previous.x).toBeGreaterThanOrEqual(footer.x);
      expect(previous.x + previous.width).toBeLessThanOrEqual(contents.x);
      expect(contents.x + contents.width).toBeLessThanOrEqual(next.x);
      expect(next.x + next.width).toBeLessThanOrEqual(footer.x + footer.width + 1);
      expect(contents.x + contents.width / 2).toBeCloseTo(footer.x + footer.width / 2, 0);
      expect(contents.y).toBe(previous.y);
      expect(contents.y).toBe(next.y);
      expect(contents.height).toBeGreaterThanOrEqual(width <= 850 ? 44 : 34);
      await all.click();
      await expect(guide).toHaveAttribute("data-page", "contents");
      await expect(all).toHaveCount(0);
      await guide.focus();
      await page.keyboard.press("Escape");
      await expect(guide).toHaveAttribute("data-page", "scene");
      await expect(all).toBeVisible();
      await body.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      const popup = (await guide.boundingBox())!;
      const viewport = (await body.boundingBox())!;
      const lastParagraph = (await body.locator("p").last().boundingBox())!;
      expect(popup.x).toBeGreaterThanOrEqual(0);
      expect(popup.y).toBeGreaterThanOrEqual(0);
      expect(popup.x + popup.width).toBeLessThanOrEqual(width);
      expect(popup.y + popup.height).toBeLessThanOrEqual(height);
      expect(lastParagraph.x).toBeGreaterThanOrEqual(viewport.x);
      expect(lastParagraph.x + lastParagraph.width).toBeLessThanOrEqual(viewport.x + viewport.width);
      expect(lastParagraph.y + lastParagraph.height).toBeLessThanOrEqual(viewport.y + viewport.height + 1);
      await guide.getByRole("button", { name: "Collapse description", exact: true }).click();
      await expect(body).toBeHidden();
      await guide.getByRole("button", { name: "Expand description", exact: true }).click();
      await expect(body).toBeVisible();
      await expect(guide.getByRole("button", { name: "Next demo", exact: true })).toBeVisible();
    });
  }
}
