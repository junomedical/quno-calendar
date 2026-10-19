import { expect, test } from "@playwright/test";
import { selectCalendarScene, pauseCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
const examples = ["tomorrow", "yesterday", "22 July 1980", "next Friday"];
for (const [today, results, width] of [
  ["2027-03-10", ["11 March 2027", "9 March 2027", "22 July 1980", "19 March 2027"], 1440],
  ["2028-12-31", ["1 January 2029", "30 December 2028", "22 July 1980", "5 January 2029"], 390]
] as const)
  test(`natural examples use today (${today}) and hold before each submission at ${width}px`, async ({
    page
  }, info) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date(`${today}T12:00:00`));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await page.getByRole("button", { name: "Date Input", exact: true }).click();
    await page.evaluate(() => {
      let typed = "";
      let completed = 0;
      const records: { text: string; delay: number; result?: string }[] = [];
      const canvas = document.querySelector<HTMLElement>(".concept-canvas")!;
      document.addEventListener("input", (event) => {
        const field = event.target as HTMLInputElement;
        if (field.dataset.action !== "date-input") return;
        typed = field.value;
        completed = performance.now();
      });
      document.addEventListener(
        "keydown",
        (event) => {
          if (event.isTrusted || event.key !== "Enter") return;
          const record = { text: typed, delay: performance.now() - completed, result: "" };
          records.push(record);
          requestAnimationFrame(() => {
            record.result = document.querySelector<HTMLInputElement>('[data-action="date-input"]')!.value;
            canvas.dataset.naturalExamples = JSON.stringify(records);
          });
        },
        true
      );
    });
    await selectCalendarScene(page, "Type naturally");
    const field = page.locator('[data-action="date-input"]');
    await expect(field).toHaveValue("yesterday", { timeout: 12000 });
    await page.screenshot({ path: info.outputPath("natural-phrase.png") });
    const canvas = page.locator(".concept-canvas");
    await expect
      .poll(async () => JSON.parse((await canvas.getAttribute("data-natural-examples")) ?? "[]").length, {
        timeout: 35000
      })
      .toBe(4);
    await pauseCalendarScene(page);
    const records = JSON.parse((await canvas.getAttribute("data-natural-examples"))!) as {
      text: string;
      delay: number;
      result: string;
    }[];
    expect(records.map((record) => record.text)).toEqual(examples);
    expect(records.map((record) => record.result)).toEqual(results);
    expect(records.every((record) => record.delay >= 1190)).toBe(true);
    await expect(field).toHaveValue(results[3]);
    await expect(page.locator(".concept-product-card output")).toHaveCount(0);
    await expect(page.locator(".concept-product-card")).not.toContainText("Reference date");
    const guide = (await page.locator(".concept-tour-guide").boundingBox())!;
    const stage = (await page.locator(".concept-product-stage").boundingBox())!;
    const card = (await page.locator(".concept-product-card").boundingBox())!;
    if (width === 390) expect(stage.y + stage.height).toBeLessThan(guide.y);
    else expect(card.x).toBeGreaterThan(guide.x + guide.width);
    await page.screenshot({ path: info.outputPath("natural-examples.png") });
    await field.fill("tomorrow");
    await field.press("Enter");
    await expect(field).toHaveValue(results[0]);
  });

test("keyboard editing steps days down and months up through visible values", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await page.getByRole("button", { name: "Date Input", exact: true }).click();
  await selectCalendarScene(page, "Edit with keyboard");
  const field = page.locator('[data-action="date-input"]');
  const values = await page.evaluate(async () => {
    const values = new Set<string>();
    while (
      document.querySelector(".concept")?.getAttribute("data-playing") === "true" &&
      document.querySelector(".concept-canvas")?.getAttribute("data-playback-cycle") === "0"
    ) {
      values.add(document.querySelector<HTMLInputElement>('[data-action="date-input"]')!.value);
      await new Promise(requestAnimationFrame);
    }
    return [...values];
  });
  expect(values).toEqual(
    expect.arrayContaining([
      "18 October 2026",
      "17 October 2026",
      "16 October 2026",
      "16 November 2026",
      "16 December 2026",
      "16 January 2027"
    ])
  );
  await pauseCalendarScene(page);
  await page.waitForTimeout(1000);
  await expect(field).toHaveValue("16 January 2027");
  await page.screenshot({ path: info.outputPath("keyboard-editing.png") });
});
