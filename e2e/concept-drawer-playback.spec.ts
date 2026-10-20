import { expect, test } from "@playwright/test";
import { selectCalendarScene } from "#quno-e2e/concept-helpers";
import { swipeDrawer } from "#quno-e2e/concept-drawer-helpers";

test.describe.configure({ mode: "parallel" });

for (const [product, scene] of [
  ["Calendar", "Infinite scroll"],
  ["Datepicker", "Paint a range"],
  ["Date Input", "Type naturally"],
  ["Timepicker", "Choose a time"],
  ["Parser", "Resolve ambiguity"]
]) {
  test(`${product} keeps playing through mobile drawer taps, swipes and keyboard disclosure`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    if (product !== "Calendar") await page.getByRole("button", { name: product, exact: true }).click();
    await selectCalendarScene(page, scene);
    const concept = page.locator(".concept");
    const guide = page.locator(".concept-tour-guide");
    const canvas = page.locator(".concept-canvas");
    const original = await canvas.elementHandle();
    const cycle = Number(await canvas.getAttribute("data-playback-cycle"));
    const disclosure = async (collapsed: boolean) => {
      await expect(guide).toHaveAttribute("data-collapsed", String(collapsed));
      await expect(concept).toHaveAttribute("data-playing", "true");
    };
    await swipeDrawer(page, ".concept-tour-toggle", 0);
    await disclosure(true);
    await page.getByRole("button", { name: "Expand description" }).click();
    await disclosure(false);
    await swipeDrawer(page, ".concept-tour-guide h1", 90);
    await disclosure(true);
    await swipeDrawer(page, ".concept-tour-guide h1", -90);
    await disclosure(false);
    await swipeDrawer(page, ".concept-tour-toggle", 24);
    await disclosure(false);
    await swipeDrawer(page, ".concept-tour-toggle", 90, true);
    await disclosure(false);
    await page.getByRole("button", { name: "Collapse description" }).press("Enter");
    await disclosure(true);
    await page.getByRole("button", { name: "Expand description" }).press("Space");
    await disclosure(false);
    if (product === "Calendar") {
      const viewport = page.locator(".quno-calendar-viewport");
      const top = await viewport.evaluate((node) => node.scrollTop);
      await expect.poll(() => viewport.evaluate((node) => node.scrollTop), { timeout: 10000 }).not.toBe(top);
    } else {
      await expect
        .poll(async () => Number(await canvas.getAttribute("data-playback-cycle")), { timeout: 35000 })
        .toBeGreaterThan(cycle);
    }
    expect(await original!.evaluate((node) => node === document.querySelector(".concept-canvas"))).toBe(true);
    await expect(concept).toHaveAttribute("data-playing", "true");
    await canvas.click({ position: { x: 3, y: 3 } });
    await expect(concept).toHaveAttribute("data-playing", "false");
    await page.getByRole("button", { name: "Collapse description" }).click();
    await swipeDrawer(page, ".concept-tour-guide h1", -90);
    await expect(guide).toHaveAttribute("data-collapsed", "false");
    await expect(concept).toHaveAttribute("data-playing", "false");
  });
}

for (const action of ["contents", "fullscreen"] as const) {
  test(`mobile ${action} still stops playback`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await selectCalendarScene(page, "Infinite scroll");
    await page
      .getByRole("button", { name: action === "contents" ? "All calendar demos" : "Full screen calendar", exact: true })
      .click();
    await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
  });
}

test("desktop guide disclosure and dragging still stop playback", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await selectCalendarScene(page, "Infinite scroll");
  await page.getByRole("button", { name: "Collapse description" }).click();
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
  await page.getByRole("button", { name: "Expand description" }).click();
  await selectCalendarScene(page, "Infinite scroll");
  const title = (await page.locator(".concept-tour-guide h1").boundingBox())!;
  await page.mouse.move(title.x + 10, title.y + 10);
  await page.mouse.down();
  await page.mouse.move(title.x + 90, title.y - 10, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator(".concept")).toHaveAttribute("data-playing", "false");
});
