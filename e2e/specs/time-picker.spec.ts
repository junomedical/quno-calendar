import { expect, test } from "@playwright/test";

for (const width of [1280, 390]) {
  test(`standalone time selection, geometry, and sticky hours at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/demo/timepicker");
    const example = page.locator(".time-picker-example");
    const root = example.locator(".quno-time-picker");
    const panel = root.locator('[data-slot="time-navigation"]');
    await expect(root.locator('[data-slot="selection-summary"]')).toHaveText("10:30");
    await example.getByRole("combobox", { name: "Minute cadence" }).selectOption("1");
    await panel.evaluate((element) => {
      element.scrollTop = 100;
    });
    const layout = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const group = element.querySelector('[data-hour="9"]')!;
      const heading = group.querySelector("h3")!;
      const headingRect = heading.getBoundingClientRect();
      const buttons = [...group.querySelectorAll("button")];
      const rows = new Map<number, number>();
      for (const button of buttons) {
        const top = Math.round(button.getBoundingClientRect().top);
        rows.set(top, (rows.get(top) ?? 0) + 1);
      }
      return {
        columns: Math.max(...rows.values()),
        rows: rows.size,
        sticky: getComputedStyle(heading).position,
        top: headingRect.top - rect.top,
        visible: heading.contains(
          document.elementFromPoint(headingRect.left + headingRect.width / 2, headingRect.top + 10)
        ),
        fontSize: getComputedStyle(buttons[0]).fontSize,
        weight: getComputedStyle(buttons[0]).fontWeight,
        hourSize: getComputedStyle(heading).fontSize,
        hourWeight: getComputedStyle(heading).fontWeight,
        hourColor: getComputedStyle(heading).color,
        minuteColor: getComputedStyle(buttons[0]).color,
        headingFits: heading.scrollWidth <= heading.clientWidth && heading.scrollHeight <= heading.clientHeight,
        overflow: getComputedStyle(element).overflowY,
        fits: buttons.every((button) => {
          const box = button.getBoundingClientRect();
          return box.left >= rect.left && box.right <= rect.right;
        }),
        pageFits: document.documentElement.scrollWidth <= innerWidth
      };
    });
    expect(layout).toMatchObject({
      columns: 5,
      rows: 12,
      sticky: "sticky",
      visible: true,
      fontSize: "13px",
      weight: "550",
      hourSize: "16px",
      hourWeight: "700",
      headingFits: true,
      overflow: "auto",
      fits: true,
      pageFits: true
    });
    expect(layout.top).toBeCloseTo(4, 1);
    expect(layout.hourColor).toBe(layout.minuteColor);
    const selected = panel.getByRole("button", { name: "09:17", exact: true });
    await selected.press("Enter");
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    await expect(root.locator('[data-slot="selection-summary"]')).toHaveText("09:17");
    await expect(example.getByRole("status")).toHaveText("09:17");
    for (const [cadence, columns] of [
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 6],
      [6, 5],
      [10, 6],
      [15, 4],
      [20, 3],
      [30, 2]
    ]) {
      await example.getByRole("combobox", { name: "Minute cadence" }).selectOption(String(cadence));
      const group = panel.locator('[data-hour="9"]');
      await expect(group.locator("button")).toHaveCount(60 / cadence);
      const grid = await group.locator(".quno-time-picker-minute-options").evaluate((element) => {
        const buttons = [...element.querySelectorAll("button")];
        return {
          columns: getComputedStyle(element).gridTemplateColumns.split(" ").length,
          rows: new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top))).size
        };
      });
      expect(grid).toEqual({ columns, rows: 60 / cadence / columns });
    }
    await example.getByRole("combobox", { name: "Minute cadence" }).selectOption("1");
    await example.getByRole("button", { name: "Set 23:59 externally" }).click();
    await expect(root.locator('[data-slot="selection-summary"]')).toHaveText("23:59");
    await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
    await example.getByRole("combobox", { name: "Enabled hours" }).selectOption("all");
    await expect(panel.getByRole("button", { name: "23:59", exact: true })).toBeInViewport({ ratio: 1 });
    await expect(panel.locator('[data-hour="23"] h3')).toBeInViewport({ ratio: 1 });
    await example.getByRole("checkbox", { name: "Disabled" }).check();
    await expect(panel.getByRole("button", { name: "23:59", exact: true })).toBeDisabled();
    await expect(root.getByRole("button", { name: "Clear time" })).toBeDisabled();
    await example.getByRole("checkbox", { name: "Disabled" }).uncheck();
    await root.getByRole("button", { name: "Clear time" }).click();
    await expect(root.locator('[data-slot="selection-summary"]')).toHaveText("Choose a time");
    await expect(example.getByRole("status")).toHaveText("No selected time");
    await example.getByRole("combobox", { name: "Enabled hours" }).selectOption("empty");
    await expect(panel.locator('[data-slot="hour-group"]')).toHaveCount(24);
    await panel.getByRole("button", { name: "00:00", exact: true }).click();
    await expect(example.getByRole("status")).toHaveText("00:00");
  });
}

test("timepicker home card and guide expose recipes, local state, and scoped presentation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore the Timepicker guide" }).click();
  await expect(page).toHaveURL(/\/guide\/timepicker$/);
  const local = page.locator("#ownership .quno-time-picker");
  await expect(local.locator('[data-slot="selection-summary"]')).toHaveText("13:15 Uhr");
  const option = local.getByRole("button", { name: "14:30 Uhr", exact: true });
  await option.click();
  await expect(option).toHaveAttribute("aria-pressed", "true");
  expect(await option.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(109, 40, 217)");
  expect(await option.evaluate((element) => getComputedStyle(element).borderRadius)).toBe("12px");
  await local.getByRole("button", { name: "Reset time" }).click();
  await expect(local.locator('[data-slot="selection-summary"]')).toHaveText("Choose a time");
  await page.locator('details[aria-label="Select a standalone time implementation"] summary').click();
  await expect(page.getByLabel("Select a standalone time TSX source")).toContainText("@quno/calendar/timepicker");
  await expect(page.getByRole("link", { name: /^Demo/ })).toHaveAttribute("href", "/demo/timepicker");
});
