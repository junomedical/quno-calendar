import { expectProductResult } from "#quno-e2e/concept-product-results";
import {
  pauseCalendarScene,
  productTabLabel,
  restartCalendarScene,
  calendarInitial,
  selectCalendarScene
} from "#quno-e2e/concept-helpers";
import { test, expect, type Page } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
async function open(page: Page, product = "Calendar") {
  await page.clock.setFixedTime(new Date("2026-10-19T12:00:00"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  if (product !== "Calendar") await page.getByRole("button", { name: productTabLabel(product), exact: true }).click();
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
}
async function play(page: Page, label: string) {
  if (await page.locator(".concept--guided").count()) {
    await selectCalendarScene(page, label);
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
    return;
  }
}
async function finished(page: Page) {
  if (await page.locator(".concept--guided").count()) {
    await page.waitForFunction(
      () => {
        if (document.querySelector(".concept")?.getAttribute("data-playing") === "false") return true;
        return document.querySelector(".concept")?.getAttribute("data-scene") === "scroll"
          ? document.querySelector(".concept-calendar-workspace")?.getAttribute("data-visible-date") !== "2026-10-19"
          : Number(document.querySelector(".concept-canvas")?.getAttribute("data-playback-cycle")) > 0;
      },
      undefined,
      { timeout: 35000 }
    );
    await pauseCalendarScene(page);
  }
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false", { timeout: 20000 });
  await expect(
    page.locator(
      '.concept-screen[data-active="true"] .concept-statusbar, .concept-fullscreen-dock .concept-statusbar, .concept-tour-status'
    )
  ).not.toContainText("demonstration paused");
}
test("concept opens the full-width calendar and floating guide by default", async ({ page }) => {
  await open(page);
  const canvas = (await page.locator(".concept-canvas").boundingBox())!;
  expect(canvas.x).toBe(0);
  expect(canvas.width).toBe(page.viewportSize()!.width);
  await expect(page.locator(".concept-tour-guide")).toBeVisible();
  await expect(page.locator(".concept-scenario, .concept-intro")).toHaveCount(0);
  await expect(page.locator(".concept-cursor")).toBeHidden();
  await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
  await expect(page.locator(".concept--fullscreen")).toHaveCSS("position", "fixed");
  await page.keyboard.press("Escape");
  await expect(page.locator(".concept-tour-guide")).toBeVisible();
});
test("scroll and zoom playback change live geometry, with a rounded non-intercepting cursor", async ({
  page
}, info) => {
  await open(page);
  await play(page, "Infinite scroll");
  await expect(page.locator(".concept-cursor")).toBeVisible();
  await expect(page.locator(".concept-cursor span")).toHaveCount(0);
  const rotation = await page.locator(".concept-cursor svg").evaluate((svg) => {
    const matrix = new DOMMatrix(getComputedStyle(svg).transform);
    return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
  });
  expect(rotation).toBeCloseTo(-15, 1);
  const shape = await page
    .locator(".concept-cursor path")
    .last()
    .evaluate((element) => {
      const path = element as SVGPathElement;
      return {
        filled: path.isPointInFill(new DOMPoint(10, 16)),
        notch: !path.isPointInFill(new DOMPoint(13, 25)),
        rounded: !path.isPointInFill(new DOMPoint(3.1, 2.4)),
        roundJoin: getComputedStyle(path).strokeLinejoin,
        roundedOutline: path.isPointInStroke(new DOMPoint(4, 4)),
        events: getComputedStyle(path).pointerEvents
      };
    });
  expect(shape).toEqual({
    filled: true,
    notch: true,
    rounded: true,
    roundJoin: "round",
    roundedOutline: true,
    events: "none"
  });
  await page.screenshot({ path: info.outputPath("cursor-and-appointments.png") });
  await finished(page);
  await expect(page.locator(".concept-calendar-workspace")).not.toHaveAttribute("data-visible-date", "2026-10-19");
  await play(page, "Zoom");
  const minimum = (await page.getByRole("slider", { name: "Zoom level" }).getAttribute("min"))!;
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-zoom", minimum);
  const before = await page.locator('[data-event-id="2026-10-19-event-0"]').boundingBox();
  await finished(page);
  expect(Number(await page.locator(".concept-calendar-workspace").getAttribute("data-zoom"))).toBe(8);
  const after = await page.locator('[data-event-id="2026-10-19-event-0"]').boundingBox();
  expect(after!.width).toBeGreaterThan(before!.width);
});
test("overlap playback targets each real hover lane", async ({ page }) => {
  await open(page);
  await play(page, "Overlapping events");
  for (const id of ["event-0", "overlap-1", "overlap-2"]) {
    const card = page.locator(`[data-event-id="2026-10-19-${id}"]`);
    await expect(card).toHaveAttribute("data-status", "hovered", { timeout: 7000 });
    await expect(card).toHaveAttribute("data-lane-count", "3");
    const pointer = await page.locator(".concept-cursor").boundingBox();
    const box = await card.boundingBox();
    expect(pointer!.y + 3).toBeGreaterThanOrEqual(box!.y);
    expect(pointer!.y + 3).toBeLessThan(box!.y + box!.height);
  }
  await finished(page);
});
test("view, theme and density scenes expose only their relevant controls", async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  await play(page, "Horizontal / vertical");
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-view", "infinite-vertical");
  await expect(page.locator('[data-event-id="2026-10-19-event-0"]')).toBeVisible();
  await finished(page);
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-view", "infinite-horizontal");
  await play(page, "Theming");
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".quno-calendar-shell")).toHaveCSS("background-color", "rgb(37, 35, 50)");
  await finished(page);
  await play(page, "Event density");
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-density", "60");
  await finished(page);
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-density", "4");
  await expect(page.locator(".concept-controls fieldset")).toHaveCount(1);
  await expect(page.locator('[data-action="vertical"], [data-action="dark"], [data-action="zoom"]')).toHaveCount(0);
});
test("creation and rescheduling preserve session appointments through view resets", async ({ page }) => {
  test.setTimeout(65000);
  await open(page);
  await play(page, "Create an appointment");
  await expect(page.locator('.concept-cursor[data-gesture="drag"]')).toBeVisible();
  await expect(page.locator('[data-event-id="draft-new-event"]')).toBeVisible();
  await expect(page.getByRole("form", { name: "Appointment editor" })).toBeVisible();
  await finished(page);
  await expect(page.locator('[data-event-id="concept-created-1"]')).toContainText("Studio catch-up");
  await expect(page.locator('[data-event-id="concept-created-1"] small')).toContainText("11:30");
  await restartCalendarScene(page, false);
  await expect(page.locator('[data-event-id="concept-created-1"]')).toHaveCount(1);
  await play(page, "Create an appointment");
  await finished(page);
  await expect(page.locator('[data-event-id="concept-created-2"] [data-action="created-event"]')).toHaveCount(1);
  await expect(page.locator('[data-event-id="concept-created-1"]')).toHaveCount(1);
  await play(page, "Reschedule");
  await expect(page.locator('[data-testid="calendar-event"][data-event-id="2026-10-19-event-0"]')).toHaveAttribute(
    "data-calendar-id",
    "person-1"
  );
  await finished(page);
  await expect(page.locator('[data-event-id="2026-10-19-event-0"]')).toHaveAttribute("data-calendar-id", "person-0");
  await expect(page.locator('[data-event-id="2026-10-19-event-0"] small')).toContainText("10:00");
});
const outcomes = [
  ["Datepicker", "Paint a range", "2026-10-19 → 2026-10-23 · 5 days"],
  ["Datepicker", "Adjust the end", "2026-10-19 → 2026-10-23 · 5 days"],
  ["Datepicker", "Move the range", "2026-10-19 → 2026-10-25 · 7 days"],
  ["Date Input", "Type naturally", "2026-10-30"],
  ["Date Input", "Edit with keyboard", "2027-01-16"],
  ["Date Input", "Works with datepicker", "2026-10-19 → 2026-10-25"],
  ["Timepicker", "Choose a time", "10:45"],
  ["Timepicker", "Keep an existing time", "10:45"],
  ["Date Parser", "Resolve a phrase", "2026-11-01"],
  ["Date Parser", "Resolve ambiguity", "2012-11-10"],
  ["Date Parser", "Cross midnight", "2026-10-21 01:00"]
];
for (const [product, scene, result] of outcomes)
  test(`${product}: ${scene} produces a real result`, async ({ page }) => {
    if (scene === "Resolve a phrase") test.setTimeout(60000);
    await open(page, product);
    await play(page, scene);
    if (scene === "Keep an existing time") {
      await expect(page.locator('[data-action="cadence-15"]')).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('.quno-time-picker [data-slot="selection-summary"]')).toContainText("10:35");
      await expect(page.locator('[data-time="10:35"]')).toHaveCount(0);
    }
    await finished(page);
    await expectProductResult(page, product, result);
    await expect(page.getByRole("link", { name: "Documentation", exact: true })).toHaveAttribute("href", /\/guide\//);
  });
test("manual takeover and product changes cancel pending playback", async ({ page }) => {
  await open(page, "Date Input");
  await play(page, "Type naturally");
  const input = page.locator('[data-action="date-input"]');
  await expect(input).not.toHaveValue("");
  await input.click();
  await input.fill("19 October 2026");
  await input.press("Enter");
  await finished(page);
  await page.waitForTimeout(1800);
  await expectProductResult(page, "Date Input", "2026-10-19");
  await play(page, "Type naturally");
  await page.getByRole("button", { name: "Timepicker", exact: true }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await pauseCalendarScene(page);
  await expect(page.locator('.quno-time-picker [data-slot="selection-summary"]')).toContainText("09:00");
});
test("manual picker gesture matches playback and remains usable after reset", async ({ page }) => {
  await open(page, "Datepicker");
  const start = await page.locator('[data-date="2026-10-19"]').boundingBox();
  const end = await page.locator('[data-date="2026-10-23"]').boundingBox();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(end!.x + end!.width / 2, end!.y + end!.height / 2, { steps: 10 });
  await page.mouse.up();
  await expectProductResult(page, "Datepicker", "2026-10-19 → 2026-10-23");
  await selectCalendarScene(page, "Paint a range", false);
  await expect(page.locator('[data-slot="day"][data-committed="true"]')).toHaveCount(0);
});
test("phone layout exposes the working control and fits all products", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const canvas = await page.locator(".concept-canvas").boundingBox();
  expect(canvas!.y).toBeLessThan(600);
  for (const product of ["Calendar", "Datepicker", "Date Input", "Timepicker", "Date Parser"]) {
    await page.getByRole("button", { name: productTabLabel(product), exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(page.locator(".concept-cursor")).toBeHidden();
  }
  await page.getByRole("button", { name: "Datepicker", exact: true }).click();
  await play(page, "Paint a range");
  await finished(page);
  await expectProductResult(page, "Datepicker", "2026-10-19 → 2026-10-23");
});

test("takeover during a drag cancels the draft and hidden tabs cancel future actions", async ({ page }) => {
  await open(page);
  await play(page, "Create an appointment");
  await expect(page.locator('.concept-cursor[data-gesture="drag"]')).toBeVisible();
  await pauseCalendarScene(page);
  await finished(page);
  await page.waitForTimeout(1300);
  await expect(page.getByRole("form", { name: "Appointment editor" })).toHaveCount(0);
  await expect(page.locator('[data-event-id="concept-created-1"]')).toHaveCount(0);
  await play(page, "Theming");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await finished(page);
  await page.waitForTimeout(1500);
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-theme", "light");
});
test("a picker scene loops without advancing and revisiting restores its initial state", async ({ page }) => {
  await open(page, "Datepicker");
  await play(page, "Paint a range");
  await finished(page);
  await expectProductResult(page, "Datepicker", "2026-10-19 → 2026-10-23");
  await selectCalendarScene(page, "Paint a range", false);
  await expect(page.locator('[data-slot="day"][data-committed="true"]')).toHaveCount(0);
});
test("density guide has a lazy interactive exhibit and copyable recipe", async ({ page }) => {
  await page.goto("/guide/infinite-calendar#performance");
  const section = page.locator("#performance");
  await section.locator('[data-demo-label="event density comparison"]').scrollIntoViewIfNeeded();
  await expect(section.getByTestId("density-guide-demo")).toBeVisible();
  await section.locator('[data-action="density-20"]').click();
  await expect(section.locator(".concept-calendar-workspace")).toHaveAttribute("data-density", "20");
  await expect(
    section.getByText("Implementation · Generate a deterministic range at three event densities", { exact: true })
  ).toBeVisible();
});
for (const scene of ["Horizontal / vertical", "Theming", "Event density", "Create an appointment", "Reschedule"])
  test(`phone calendar playback: ${scene}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await play(page, scene);
    await finished(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    if (scene === "Create an appointment")
      await expect(page.locator('[data-event-id="concept-created-1"]')).toContainText("Studio catch-up");
    if (scene === "Reschedule")
      await expect(page.locator('[data-event-id="2026-10-19-event-0"] small')).toContainText("10:00");
  });

for (const scene of ["Infinite scroll", "Zoom", "Overlapping events", "Create an appointment", "Reschedule"])
  test(`vertical playback: ${scene}`, async ({ page }) => {
    await calendarInitial(page, { view: "infinite-vertical" });
    await open(page);
    await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
    await play(page, scene);
    await finished(page);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-view", "infinite-vertical");
    if (scene === "Infinite scroll")
      await expect(page.locator(".concept-calendar-workspace")).not.toHaveAttribute("data-visible-date", "2026-10-19");
    if (scene === "Create an appointment")
      await expect(page.locator('[data-event-id="concept-created-1"]')).toContainText("Studio catch-up");
    if (scene === "Reschedule")
      await expect(page.locator('[data-event-id="2026-10-19-event-0"] small')).toContainText("10:00");
  });
for (const [product, scene, result] of [
  ["Date Input", "Works with datepicker", "2026-10-19 → 2026-10-25"],
  ["Timepicker", "Choose a time", "10:45"],
  ["Date Parser", "Cross midnight", "2026-10-21 01:00"]
])
  test(`phone product playback: ${scene}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    if (scene === "Resolve a phrase") test.setTimeout(60000);
    await open(page, product);
    await play(page, scene);
    await finished(page);
    await expectProductResult(page, product, result);
  });

test("one scenario JSON controls its copy, initial state and actions independently", async ({ page }) => {
  const { default: data } = await import("#quno-demo/concept/scenarios/date-input/natural.json", {
    with: { type: "json" }
  });
  const scene = structuredClone(data) as import("#quno-demo/concept/scenarioTypes").Scenario<"date-input">;
  scene.label = "Follow JSON";
  scene.hint = "A single scenario from data.";
  scene.anchor = "keyboard-controls";
  scene.initial = {
    range: { start: "2026-11-05", end: "2026-11-05" },
    selectionMode: "single",
    picker: false,
    label: "JSON appointment"
  };
  scene.steps = [
    { action: "type", target: '[data-action="date-input"]', text: "tomorrow" },
    { action: "key", target: '[data-action="date-input"]', key: "Enter" }
  ];
  await page.route("**/demo/concept/scenarios/date-input/natural.json*", (route) =>
    route.fulfill({ contentType: "application/javascript", body: `export default ${JSON.stringify(scene)};` })
  );
  await open(page);
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await page.getByRole("button", { name: "Date Input", exact: true }).click();
  await selectCalendarScene(page, "Follow JSON", false);
  const custom = page.locator(".concept-tour-guide");
  await expect(custom.locator("h1")).toHaveText("Follow JSON");
  await expect(custom.getByRole("link")).toHaveAttribute("href", "/guide/date-input#keyboard-controls");
  await expect(page.getByLabel("JSON appointment")).toHaveValue("5 November 2026");
  await selectCalendarScene(page, "Follow JSON");
  await finished(page);
  await expectProductResult(page, "Date Input", "2026-10-20");
  await selectCalendarScene(page, "Follow JSON", false);
  await expect(page.getByLabel("JSON appointment")).toHaveValue("5 November 2026");
});
