import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

for (const width of [1280, 390]) {
  test(`date-time composition and sticky minute layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/demo/date-time");
    const example = page.locator(".date-time-example");
    const input = example.getByRole("textbox", { name: "Date and time" });
    const summary = example.locator('[data-slot="selection-summary"]');
    const chooseDay = async () => {
      const day = example.locator('[data-slot="day"][data-date="2026-10-07"]');
      if (width === 390) await day.tap();
      else await day.click();
    };
    const calendar = example.locator('[data-slot="calendar"]');
    const heading = example.locator('[data-slot="month-heading-button"]');
    await input.fill("tomorrow 11:30AM");
    await input.press("Enter");
    await expect(input).toHaveValue("7 October 2026 11:30");
    await expect(summary).toContainText("11:30");
    await chooseDay();
    await expect(heading).toHaveAccessibleName("7 October 2026. Choose a date");
    await heading.click();
    await expect(calendar).toHaveAttribute("data-view", "dates");
    await expect(heading).toHaveText("October 2026");
    await expect(heading).toBeFocused();
    await expect(example.locator('[data-slot="grid"]')).toBeVisible();
    await expect(example.locator('[data-slot="month-navigation"]')).toHaveCount(0);
    await expect(input).toHaveValue("7 October 2026 11:30");
    await expect(example.locator('[data-date="2026-10-07"]')).toHaveAttribute("data-selected", "true");
    const dayTypography = await example.locator('[data-date="2026-10-07"] > span').evaluate((element) => {
      const style = getComputedStyle(element);
      return { size: style.fontSize, weight: style.fontWeight, family: style.fontFamily };
    });
    const dateHeight = await calendar.evaluate((element) => element.getBoundingClientRect().height);

    await example.getByRole("combobox", { name: "Minute cadence" }).selectOption("1");
    await chooseDay();
    await expect(input).toHaveValue("7 October 2026 11:30");
    await expect(heading).toHaveText("7 October 2026");
    const headingFits = await heading.locator("span").evaluate((element) => element.scrollWidth <= element.clientWidth);
    expect(headingFits).toBe(true);
    const panel = example.locator('[data-slot="time-navigation"]');
    await expect(panel.locator('[data-slot="hour-group"]')).toHaveCount(9);
    const minuteTypography = await panel
      .locator('[data-slot="minute-option"]')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return { size: style.fontSize, weight: style.fontWeight, family: style.fontFamily };
      });
    expect(minuteTypography).toEqual(dayTypography);
    const timeHeight = await calendar.evaluate((element) => element.getBoundingClientRect().height);
    expect(Math.abs(timeHeight - dateHeight)).toBeLessThanOrEqual(1);
    await panel.evaluate((element) => {
      element.scrollTop = 100;
    });
    const geometry = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const group = element.querySelector<HTMLElement>('[data-hour="9"]')!;
      const heading = group.querySelector<HTMLElement>("h3")!;
      const headingBox = heading.getBoundingClientRect();
      const options = [...group.querySelectorAll<HTMLElement>("button")];
      const rows = new Map<number, number>();
      for (const button of options) {
        const top = Math.round(button.getBoundingClientRect().top);
        rows.set(top, (rows.get(top) ?? 0) + 1);
      }
      return {
        maxPerRow: Math.max(...rows.values()),
        rows: rows.size,
        sticky: getComputedStyle(heading).position,
        hourSize: getComputedStyle(heading).fontSize,
        hourWeight: getComputedStyle(heading).fontWeight,
        hourColor: getComputedStyle(heading).color,
        minuteColor: getComputedStyle(options[0]).color,
        headingFits: heading.scrollWidth <= heading.clientWidth && heading.scrollHeight <= heading.clientHeight,
        stickyTop: headingBox.top - rect.top,
        headingVisible: heading.contains(
          document.elementFromPoint(headingBox.left + headingBox.width / 2, headingBox.top + 10)
        ),
        overflow: getComputedStyle(element).overflowY,
        fits: options.every((button) => {
          const box = button.getBoundingClientRect();
          return box.left >= rect.left && box.right <= rect.right;
        }),
        pageFits: document.documentElement.scrollWidth <= window.innerWidth
      };
    });
    expect(geometry).toMatchObject({
      maxPerRow: 5,
      rows: 12,
      sticky: "sticky",
      hourSize: "16px",
      hourWeight: "700",
      headingFits: true,
      headingVisible: true,
      overflow: "auto",
      fits: true,
      pageFits: true
    });
    expect(geometry.stickyTop).toBeGreaterThanOrEqual(3.9);
    expect(geometry.hourColor).toBe(geometry.minuteColor);
    expect(geometry.stickyTop).toBeLessThanOrEqual(4.1);
    await panel.getByRole("button", { name: "09:17", exact: true }).click();
    await expect(calendar).toHaveAttribute("data-view", "dates");
    await expect(heading).toHaveText("October 2026");
    await expect(summary).toContainText("09:17");
    await expect(heading).toBeFocused();
    await expect(input).toHaveValue("7 October 2026 09:17");
    await expect(example.locator('[data-slot="time-button"]')).toHaveCount(0);
    await expect(example.locator(".quno-date-picker-time-control")).toHaveCount(0);

    for (const cadence of [2, 3, 4, 5, 6, 10, 15, 20, 30] as const) {
      await example.getByRole("combobox", { name: "Minute cadence" }).selectOption(String(cadence));
      await chooseDay();
      await expect(panel.locator('[data-hour="9"] button')).toHaveCount(Math.ceil(60 / cadence));
      const columns = await panel
        .locator(".quno-date-picker-minute-options")
        .first()
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
      expect(columns).toBe({ 2: 5, 3: 5, 4: 5, 5: 6, 6: 5, 10: 6, 15: 4, 20: 3, 30: 2 }[cadence]);
      await heading.click();
      await expect(calendar).toHaveAttribute("data-view", "dates");
    }
    await chooseDay();
    await heading.press("Escape");
    await expect(heading).toBeFocused();
    await expect(calendar).toHaveAttribute("data-view", "dates");
    await example.getByRole("combobox", { name: "Enabled hours" }).selectOption("all");
    await example.getByRole("combobox", { name: "Minute cadence" }).selectOption("1");
    await input.fill("7 October 2026 23:59");
    await input.press("Enter");
    await chooseDay();
    await expect(panel.locator('[data-slot="hour-group"]')).toHaveCount(24);
    await expect(panel.getByRole("button", { name: "23:59", exact: true })).toBeInViewport({ ratio: 1 });
    await expect(panel.locator('[data-hour="23"] h3')).toBeInViewport({ ratio: 1 });
    await heading.press("Escape");
    await example.getByRole("combobox", { name: "Enabled hours" }).selectOption("empty");
    await chooseDay();
    await expect(panel.locator('[data-slot="hour-group"]')).toHaveCount(24);
    await heading.click();
    await input.fill("tomorrow 08:17");
    await input.press("Enter");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(summary).toContainText("08:17");
    await example.getByRole("checkbox", { name: "Force cadence and hours for typing" }).check();
    await input.fill("tomorrow 10AM");
    await input.press("Enter");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(input).toHaveValue("7 October 2026 10:00");
    await expect(summary).toContainText("10:00");
  });
}

test("both guides expose the public date-time composition and its focused demo", async ({ page }) => {
  for (const path of ["datepicker", "date-input"]) {
    await page.goto(`/guide/${path}#date-time`);
    const chapter = page.locator("#date-time");
    await expect(chapter.getByRole("link", { name: "Open the date-time demo" })).toHaveAttribute(
      "href",
      "/demo/date-time"
    );
    const input = chapter.getByRole("textbox", { name: "Date and time" });
    await input.fill("6 oct 2pm");
    await input.press("Enter");
    await expect(input).toHaveValue("6 October 2026 14:00");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(chapter.locator('[data-slot="day"][data-date="2026-10-06"]')).toHaveAttribute("data-selected", "true");
    await expect(chapter.locator('[data-slot="selection-summary"]')).toContainText("14:00");
    await chapter.getByRole("textbox", { name: "Date and time" }).fill("morgen um 15:00");
    await chapter.getByRole("textbox", { name: "Date and time" }).press("Enter");
    await expect(chapter.locator('[data-slot="selection-summary"]')).toContainText("15:00");
    await chapter.locator('[data-slot="day"][data-date="2026-10-07"]').click();
    await expect(chapter.locator('[data-slot="calendar"]')).toHaveAttribute("data-view", "time");
  }
});

for (const width of [1280, 390]) {
  test(`time arrows skip disabled days and preserve the panel across months at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/demo/date-time");
    const example = page.locator(".date-time-example");
    const input = example.getByRole("textbox", { name: "Date and time" });
    await example.getByRole("checkbox", { name: "Skip weekends" }).check();
    await input.fill("30 October 2026 10:17");
    await input.press("Enter");
    const calendar = example.locator('[data-slot="calendar"]');
    const heading = example.locator('[data-slot="month-heading-button"]');
    await example.locator('[data-slot="day"][data-date="2026-10-30"]').click();
    const height = await calendar.evaluate((element) => element.getBoundingClientRect().height);
    const next = example.getByRole("button", { name: "Next enabled day" });
    await next.click();
    await expect(heading).toHaveText("2 November 2026");
    await expect(input).toHaveValue("2 November 2026 10:17");
    await expect(calendar).toHaveAttribute("data-view", "time");
    await expect(next).toBeFocused();
    const navigatedHeight = await calendar.evaluate((element) => element.getBoundingClientRect().height);
    expect(Math.abs(navigatedHeight - height)).toBeLessThanOrEqual(1);
    await example.getByRole("button", { name: "Previous enabled day" }).press("Enter");
    await expect(heading).toHaveText("30 October 2026");
    await expect(calendar).toHaveAttribute("data-view", "time");
    await heading.press("Enter");
    await expect(heading).toHaveText("October 2026");
    await expect(calendar).toHaveAttribute("data-view", "dates");
    await expect(heading).toBeFocused();

    await input.fill("31 December 2027 10:17");
    await input.press("Enter");
    await example.locator('[data-slot="day"][data-date="2027-12-31"]').press("Enter");
    await expect(next).toBeDisabled();
    expect(await next.evaluate((button) => getComputedStyle(button).opacity)).toBe("0.4");
    await expect(calendar).toHaveAttribute("data-view", "time");
  });
}
