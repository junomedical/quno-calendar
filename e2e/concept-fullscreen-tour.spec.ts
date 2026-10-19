import { test, expect, type Page } from "@playwright/test";
import { restartCalendarScene, selectCalendarScene } from "#quno-e2e/concept-helpers";
test.describe.configure({ mode: "parallel" });
async function open(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await expect(page.locator(".concept-event").first()).toBeVisible();
}
async function contained(page: Page) {
  await expect
    .poll(async () => {
      const box = (await page.locator(".concept-tour-guide").boundingBox())!;
      const parent = (await page.locator(".concept-canvas").boundingBox())!;
      return (
        box.x >= parent.x + 11 &&
        box.y >= parent.y + 11 &&
        box.x + box.width <= parent.x + parent.width - 11 &&
        box.y + box.height <= parent.y + parent.height - 11
      );
    })
    .toBe(true);
  const guide = (await page.locator(".concept-tour-guide").boundingBox())!;
  const canvas = (await page.locator(".concept-canvas").boundingBox())!;
  expect(guide.x).toBeGreaterThanOrEqual(canvas.x + 11);
  expect(guide.y).toBeGreaterThanOrEqual(canvas.y + 11);
  expect(guide.x + guide.width).toBeLessThanOrEqual(canvas.x + canvas.width - 11);
  expect(guide.y + guide.height).toBeLessThanOrEqual(canvas.y + canvas.height - 11);
  const navigation = page.locator(".concept-tour-guide > .concept-tour-pagination");
  if ((await page.locator(".concept-tour-guide").getAttribute("data-collapsed")) === "true") {
    await expect(navigation).toHaveCount(0);
    const expand = page.getByRole("button", { name: "Expand description", exact: true });
    expect(
      await expand.evaluate((button) => {
        const rect = button.getBoundingClientRect();
        return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      })
    ).toBe(true);
    return;
  }
  await expect(navigation).toBeVisible();
  const footer = (await navigation.boundingBox())!;
  expect(footer.x).toBeGreaterThan(guide.x);
  expect(footer.x + footer.width).toBeLessThan(guide.x + guide.width);
  expect(footer.y + footer.height).toBeLessThan(guide.y + guide.height);
  expect(guide.y + guide.height - footer.y - footer.height).toBeLessThanOrEqual(21);
  expect(
    await navigation.getByRole("button", { name: "Next demo" }).evaluate((button) => {
      const rect = button.getBoundingClientRect();
      return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })
  ).toBe(true);
}
for (const size of [
  { width: 1440, height: 900 },
  { width: 950, height: 650 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 844, height: 390 }
]) {
  test(`default calendar is full-width with a collapsible floating guide at ${size.width}×${size.height}`, async ({
    page
  }, info) => {
    await page.setViewportSize(size);
    await open(page);
    await expect(page.locator(".concept--fullscreen")).toHaveCount(0);
    await expect(page.locator(".concept-intro, .concept-scenarios")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "See demo", exact: true })).toHaveCount(0);
    await expect(
      page.getByText("Scroll, click, or use the keyboard at any time to take over.", { exact: true })
    ).toHaveCount(0);
    const canvas = page.locator(".concept-canvas");
    const viewport = await page.locator(".quno-calendar-viewport").elementHandle();
    const bounds = (await canvas.boundingBox())!;
    expect(bounds.x).toBe(0);
    expect(bounds.width).toBe(size.width);
    expect(bounds.y + bounds.height).toBe(size.height);
    await expect(canvas).not.toHaveAttribute("inert", "");
    await contained(page);
    const guide = page.locator(".concept-tour-guide");
    expect(
      await guide.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(box.x + 15, box.y + 15));
      })
    ).toBe(true);
    const expanded = (await guide.boundingBox())!;
    expect(Math.abs(bounds.y + bounds.height - expanded.y - expanded.height - 24)).toBeLessThanOrEqual(1);
    const toggle = (await page.getByRole("button", { name: "Collapse description", exact: true }).boundingBox())!;
    if (size.width === 1440) await page.screenshot({ path: info.outputPath("calendar-default.png") });
    await page.getByRole("button", { name: "Collapse description", exact: true }).click();
    await expect(page.locator(".concept-tour-body")).toBeHidden();
    const collapsed = (await guide.boundingBox())!;
    expect(collapsed.height).toBeLessThan(expanded.height);
    expect(collapsed.width).toBe(expanded.width);
    const expandedToggle = (await page.getByRole("button", { name: "Expand description", exact: true }).boundingBox())!;
    expect(expandedToggle.width).toBe(toggle.width);
    expect(expandedToggle.height).toBe(toggle.height);
    expect(expandedToggle.x).toBe(toggle.x);
    expect(collapsed.y + collapsed.height).toBeCloseTo(expanded.y + expanded.height, 4);
    await expect(guide.getByRole("button")).toHaveCount(1);
    await expect(guide.getByRole("button", { name: "Expand description", exact: true })).toBeVisible();
    await expect(guide.locator(".concept-tour-back, .concept-tour-pagination")).toHaveCount(0);
    expect(await guide.locator("h1").evaluate((title) => title.scrollWidth <= title.clientWidth)).toBe(true);
    if (size.width === 1440) await page.screenshot({ path: info.outputPath("calendar-collapsed.png") });
    await contained(page);
    expect(await canvas.boundingBox()).toEqual(bounds);
    await page.getByRole("button", { name: "Expand description", exact: true }).click();
    await expect(page.locator(".concept-tour-body")).toBeVisible();
    const corner = (await page.getByRole("button", { name: "Full screen calendar", exact: true }).boundingBox())!;
    expect(bounds.x + bounds.width - corner.x - corner.width).toBe(16);
    expect(bounds.y + bounds.height - corner.y - corner.height).toBe(16);
    await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Exit full screen" })).toBeFocused();
    await expect(page.locator(".concept-nav")).toHaveCount(0);
    await contained(page);
    await page.getByRole("button", { name: "Exit full screen" }).click();
    await expect(page.getByRole("button", { name: "Full screen calendar", exact: true })).toBeFocused();
    expect(await canvas.boundingBox()).toEqual(bounds);
    expect(await viewport!.evaluate((el) => el === document.querySelector(".quno-calendar-viewport"))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
  });
}
test("guide drags, clamps to calendar bounds, retains position through collapse and fullscreen, and supports keyboard movement", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const guide = page.locator(".concept-tour-guide");
  const viewport = await page.locator(".quno-calendar-viewport").elementHandle();
  const start = (await guide.boundingBox())!;
  const grip = guide;
  const handle = (await guide.locator(".concept-explanation p").first().boundingBox())!;
  await page.mouse.move(handle.x + 20, handle.y + 10);
  await page.mouse.down();
  await page.mouse.move(handle.x + 320, handle.y - 90, { steps: 12 });
  await page.mouse.up();
  const moved = (await guide.boundingBox())!;
  expect(moved.x - start.x).toBe(300);
  expect(moved.y - start.y).toBe(-100);
  await page.getByRole("button", { name: "Collapse description", exact: true }).click();
  expect((await guide.boundingBox())!.x).toBe(moved.x);
  expect((await guide.boundingBox())!.y + (await guide.boundingBox())!.height).toBeCloseTo(moved.y + moved.height, 4);
  await grip.press("ArrowRight");
  expect((await guide.boundingBox())!.x).toBe(moved.x + 20);
  await grip.press("Home");
  expect((await guide.boundingBox())!.x).toBe(24);
  await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
  await expect(guide).toHaveAttribute("data-collapsed", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Full screen calendar", exact: true })).toBeFocused();
  await grip.press("Shift+ArrowRight");
  expect((await guide.boundingBox())!.x).toBe(74);
  const next = (await grip.boundingBox())!;
  await page.mouse.move(next.x + 15, next.y + 15);
  await page.mouse.down();
  await page.mouse.move(1438, 898, { steps: 10 });
  await page.mouse.up();
  await contained(page);
  await page.setViewportSize({ width: 390, height: 667 });
  await expect.poll(async () => (await guide.boundingBox())!.x).toBeLessThan(390);
  await contained(page);
  await page.getByRole("button", { name: "Expand description", exact: true }).click();
  await contained(page);
  expect(await viewport!.evaluate((el) => el === document.querySelector(".quno-calendar-viewport"))).toBe(true);
});
test("touch drag moves the collapsed guide without scrolling the calendar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole("button", { name: "Collapse description", exact: true }).click();
  const canvas = page.locator(".quno-calendar-viewport");
  const top = await canvas.evaluate((el) => el.scrollTop);
  const handle = (await page.locator(".concept-tour-guide h1").boundingBox())!;
  const before = (await page.locator(".concept-tour-guide").boundingBox())!;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: handle.x + handle.width / 2, y: handle.y + handle.height / 2, id: 1 }]
  });
  for (let step = 1; step <= 10; step++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 - step * 10, id: 1 }]
    });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
  expect((await page.locator(".concept-tour-guide").boundingBox())!.y).toBeCloseTo(before.y - 100, 0);
  expect(await canvas.evaluate((el) => el.scrollTop)).toBe(top);
});
test("scene arrows keep the description expanded; theme and viewport identity survive fullscreen", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("button", { name: "Previous demo" })).toBeDisabled();
  await selectCalendarScene(page, "Reschedule", false);
  await expect(page.getByRole("button", { name: "Next demo" })).toBeDisabled();
  await restartCalendarScene(page);
  await page.getByRole("button", { name: "Previous demo", exact: true }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator(".concept-tour-guide h1")).toHaveText("Create an appointment");
  await expect(page.locator(".concept-tour-guide")).toHaveAttribute("data-collapsed", "false");
  await selectCalendarScene(page, "Theming", false);
  await page.locator('[data-action="dark"]').click();
  await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-theme", "dark");
});
for (const input of ["wheel", "keyboard", "pointer"] as const) {
  test(`calendar playback yields to manual ${input} and stays paused`, async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
    await restartCalendarScene(page);
    await expect(page.locator('.concept-cursor[data-gesture="scroll"]')).toBeVisible();
    if (input === "keyboard") await page.keyboard.press("ArrowDown");
    else if (input === "wheel") await page.mouse.wheel(0, 160);
    else {
      const box = (await page.locator(".quno-calendar-viewport").boundingBox())!;
      await page.mouse.click(box.x + 30, box.y + box.height / 2);
    }
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
    await expect(page.locator(".concept-cursor")).toBeHidden();
    const date = await page.locator(".concept-calendar-workspace").getAttribute("data-visible-date");
    await page.waitForTimeout(1300);
    await expect(page.locator(".concept-calendar-workspace")).toHaveAttribute("data-visible-date", date!);
    await expect(page.locator(".concept-tour-guide")).toHaveAttribute("data-collapsed", "false");
  });
}

test("All demos and the table of contents stay inside the draggable guide", async ({ page }, info) => {
  await open(page);
  const guide = page.locator(".concept-tour-guide");
  await expect(page.locator(".concept-tour-content > .concept-playback-controls")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Move demo guide", exact: true })).toHaveCount(0);
  await expect(page.getByText("Explore at your own pace", { exact: true })).toHaveCount(0);
  await contained(page);
  const home = (await guide.boundingBox())!;
  const anchored = async () => {
    const box = (await guide.boundingBox())!;
    expect(box.x).toBe(home.x);
    expect(box.y + box.height).toBeCloseTo(home.y + home.height, 3);
  };
  await guide.getByRole("button", { name: /^All .+ demos$/ }).click();
  await anchored();
  const toc = guide.getByRole("navigation", { name: "All calendar demos" });
  await expect(toc.getByRole("button")).toHaveCount(9);
  await expect(guide.locator(".concept-tour-back")).toHaveCount(0);
  const toggle = await guide.getByRole("button", { name: "Collapse description", exact: true }).boundingBox();
  await guide.getByRole("button", { name: "Collapse description", exact: true }).click();
  const afterToggle = (await guide.getByRole("button", { name: "Expand description", exact: true }).boundingBox())!;
  expect(afterToggle.width).toBe(toggle!.width);
  expect(afterToggle.height).toBe(toggle!.height);
  await expect(guide.getByRole("button")).toHaveCount(1);
  await guide.getByRole("button", { name: "Expand description", exact: true }).click();
  const labels = await toc.getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const range = document.createRange();
      range.selectNodeContents(button.lastChild!);
      return { left: range.getBoundingClientRect().left, alignment: getComputedStyle(button).justifyContent };
    })
  );
  expect(labels.every((label) => label.alignment === "flex-start")).toBe(true);
  expect(Math.max(...labels.map((label) => label.left)) - Math.min(...labels.map((label) => label.left))).toBeLessThan(
    1
  );
  await page.screenshot({ path: info.outputPath("calendar-contents.png") });
  await toc.getByRole("button", { name: /Overlapping events/ }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "overlap");
  await expect(toc).toHaveCount(0);
  await expect(guide.locator("h1")).toHaveText("Overlapping events");
  await anchored();
  await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
  await anchored();
  await guide.getByRole("button", { name: /^All .+ demos$/ }).click();
  await page.keyboard.press("Escape");
  await expect(toc).toHaveCount(0);
  await expect(page.locator(".concept--fullscreen")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".concept--fullscreen")).toHaveCount(0);
  await page.getByRole("button", { name: "Collapse description", exact: true }).click();
  await expect(guide.getByRole("button")).toHaveCount(1);
  await page.getByRole("button", { name: "Expand description", exact: true }).click();
  await guide.getByRole("button", { name: /^All .+ demos$/ }).click();
  await expect(toc).toBeVisible();
});

test("calendar starts automatically on entry and on selecting the next scene", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/concept");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator('.concept-cursor[data-gesture="scroll"]')).toBeVisible();
  await expect(page.locator(".concept-tour-guide h1")).toHaveText("Calendar");
  await page.getByRole("button", { name: "Next demo", exact: true }).click();
  await expect(page.locator(".concept-tour-guide h1")).toHaveText("Infinite scroll");
  await page.getByRole("button", { name: "Next demo", exact: true }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "zoom");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator('.concept-cursor[data-gesture="drag"]')).toBeVisible();
  await expect(page.locator(".concept-tour-guide")).toHaveAttribute("data-collapsed", "false");
  await expect(page.locator(".concept-tour-body")).toBeVisible();
  await expect(page.locator(".concept-tour-guide .concept-playback-controls")).toHaveCount(0);
  await expect(
    page.locator(".concept-tour-guide").getByRole("button", { name: /^(Play tour|Replay scene|Try it|Reset|Pause)$/ })
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("calendar-chapter.png") });
  await page.getByRole("button", { name: "Previous demo", exact: true }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "scroll");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator(".concept-tour-body")).toBeVisible();
  await page.getByRole("button", { name: /^All .+ demos$/ }).click();
  await page
    .getByRole("navigation", { name: "All calendar demos" })
    .getByRole("button", { name: /Overlapping events/ })
    .click();
  await expect(page.locator(".concept")).toHaveAttribute("data-scene", "overlap");
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
  await expect(page.locator(".concept-tour-body")).toBeVisible();
  await page.getByRole("button", { name: "Collapse description", exact: true }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
});

test("floater opens with a dedicated introduction, and scene navigation and contents can return to it", async ({
  page
}) => {
  await open(page);
  const guide = page.locator(".concept-tour-guide");
  const viewport = await page.locator(".quno-calendar-viewport").elementHandle();
  await expect(guide).toHaveAttribute("data-page", "intro");
  await expect(guide.locator("h1")).toHaveText("Calendar");
  await expect(guide).toContainText("When I explored calendar concepts");
  await expect(guide.locator(".concept-playback-controls, a")).toHaveCount(0);
  await expect(guide.locator(".concept-tour-pagination button")).toHaveCount(2);
  await expect(guide.locator(".concept-tour-current")).toHaveCount(0);
  await page.getByRole("button", { name: "Next demo", exact: true }).click();
  await expect(guide).toHaveAttribute("data-page", "scene");
  await expect(guide.locator("h1")).toHaveText("Infinite scroll");
  await expect(page.getByRole("button", { name: "Previous demo", exact: true })).toBeEnabled();
  await expect(guide.locator(".concept-tour-pagination button")).toHaveCount(2);
  await page.getByRole("button", { name: "Previous demo", exact: true }).click();
  await expect(guide).toHaveAttribute("data-page", "intro");
  await guide.getByRole("button", { name: /^All .+ demos$/ }).click();
  const contents = guide.getByRole("navigation", { name: "All calendar demos" });
  await expect(contents.getByRole("button").first()).toHaveText("01Calendar");
  await contents.getByRole("button", { name: /Zoom/ }).click();
  await expect(guide.locator("h1")).toHaveText("Zoom");
  await guide.getByRole("button", { name: /^All .+ demos$/ }).click();
  await contents.getByRole("button", { name: /Calendar/ }).click();
  await expect(guide).toHaveAttribute("data-page", "intro");
  await expect(guide.locator("h1")).toHaveText("Calendar");
  expect(await viewport!.evaluate((node) => node === document.querySelector(".quno-calendar-viewport"))).toBe(true);
  await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
  await expect(guide).toHaveAttribute("data-page", "intro");
  await page.keyboard.press("Escape");
  await expect(guide).toHaveAttribute("data-page", "intro");
});
