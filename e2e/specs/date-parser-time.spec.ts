import { expect, test } from "@playwright/test";

for (const width of [1280, 390]) {
  test(`clock parsing stays interactive and contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/guide/date-parser#time-parsing");
    const chapter = page.locator("#time-parsing");
    const mode = chapter.getByRole("combobox", { name: "Clock times" });
    const output = chapter.locator(".date-input-parser-example pre");
    await chapter.getByRole("button", { name: "tomorrow 23:00–01:00" }).click();
    await expect(output).toContainText('"start": "2026-08-26"');
    await expect(output).toContainText('"end": "2026-08-27"');
    await expect(output).toContainText('"start": "23:00"');
    await expect(output).toContainText('"end": "01:00"');
    await mode.selectOption("false");
    await expect(output).toContainText('"status": "invalid"');
    await mode.selectOption("true");
    await chapter.getByRole("textbox", { name: "Date and time to parse" }).fill("12 June at 13");
    await expect(output).toContainText('"start": "13:00"');
    const geometry = await chapter.locator(".date-input-parser-example").evaluate((element) => {
      const box = element.getBoundingClientRect();
      const controls = [...element.querySelectorAll("input, select, button, pre")];
      return {
        insideViewport: box.left >= 0 && box.right <= window.innerWidth,
        controlsFit: controls.every((control) => {
          const rect = control.getBoundingClientRect();
          return rect.width > 0 && rect.left >= box.left && rect.right <= box.right + 1;
        }),
        inputHeight: element.querySelector("input")!.getBoundingClientRect().height,
        outputOverflow: getComputedStyle(element.querySelector("pre")!).overflowX
      };
    });
    expect(geometry.insideViewport).toBe(true);
    expect(geometry.controlsFit).toBe(true);
    expect(geometry.inputHeight).toBeGreaterThanOrEqual(44);
    expect(geometry.outputOverflow).toBe("auto");

    await page.goto("/demo/date-parser");
    await page.getByRole("button", { name: "23:00–01:00" }).click();
    const result = page.getByRole("heading", { name: "Resolved output" }).locator("..").locator("pre");
    await expect(result).toContainText('"status": "invalid"');
    await page.getByRole("combobox", { name: "Clock times" }).selectOption("true");
    await expect(result).toContainText('"end": "2026-08-26"');
    await expect(result).toContainText('"start": "23:00"');
    const tokens = page.getByRole("heading", { name: "Tokens", exact: true }).locator("..").locator("pre");
    await expect(tokens).toContainText('"type": "time"');
    const demoGeometry = await page.locator(".date-parser-demo").evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        viewport: window.innerWidth,
        overflow: getComputedStyle(element.querySelector("pre")!).overflowX
      };
    });
    expect(demoGeometry.left).toBeGreaterThanOrEqual(0);
    expect(demoGeometry.right).toBeLessThanOrEqual(demoGeometry.viewport);
    expect(demoGeometry.overflow).toBe("auto");
  });
}
