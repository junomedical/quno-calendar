import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("unavailable off-month dates are muted by default, independently of theme", async ({ page }) => {
  const dayCss = readFileSync(resolve("src/lib/booking-picker/styles/booking-days.css"), "utf8");
  await page.setContent(`<style>.quno-booking-date-time-picker { color: rgb(21,32,43); } button { color: inherit; } .quno-date-picker-day--outside { color: rgb(165,172,183); } ${dayCss}</style>
    <section class="quno-booking-date-time-picker">
      <button class="quno-date-picker-day quno-date-picker-day--outside" data-outside="true" data-disabled="true"><span>2</span></button>
      <button class="quno-date-picker-day quno-date-picker-day--outside" data-outside="true"><span>1</span></button>
      <button class="quno-date-picker-day" data-disabled="true"><span>30</span></button>
    </section>`);
  await expect(page.getByText("2", { exact: true })).toHaveCSS("color", "rgb(165, 172, 183)");
  await expect(page.getByText("1", { exact: true })).toHaveCSS("color", "rgb(21, 32, 43)");
  await expect(page.getByText("30", { exact: true })).toHaveCSS("color", "rgb(21, 32, 43)");
  await page.addStyleTag({
    content: ".quno-booking-date-time-picker { --quno-booking-picker-unavailable-outside-text: rgb(100,110,120); }"
  });
  await expect(page.getByText("2", { exact: true })).toHaveCSS("color", "rgb(100, 110, 120)");
});

test("core month arrows expose compact sizing and inert disabled state", async ({ page }) => {
  const css = readFileSync(resolve("src/lib/date-picker/styles/calendar.css"), "utf8");
  await page.setContent(`<style>${css}</style><div style="--quno-date-picker-navigation-button-size:32px" class="quno-date-picker-month-header">
    <button data-slot="previous-button" disabled>Previous</button><h2>September</h2><button data-slot="next-button">Next</button>
  </div>`);
  const previous = page.getByRole("button", { name: "Previous" });
  const next = page.getByRole("button", { name: "Next" });
  await expect(previous).toBeDisabled();
  await expect(previous).toHaveCSS("width", "32px");
  await expect(previous).toHaveCSS("opacity", "0.35");
  await expect(previous).toHaveCSS("pointer-events", "none");
  await expect(next).toBeEnabled();
  await expect(next).toHaveCSS("opacity", "1");
  await expect(next).toHaveCSS("pointer-events", "auto");
});
