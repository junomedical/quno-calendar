import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

async function swipe(page: Page, selector: string, distance: number, cancel = false) {
  const box = (await page.locator(selector).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  for (let step = 1; step <= 8; step++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + (distance * step) / 8, id: 1 }]
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
  await client.detach();
}

test("phone drawer swipes from its chevron and header, preserves the calendar and leaves fullscreen reachable", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  const guide = page.locator(".concept-tour-guide");
  const viewport = page.locator(".quno-calendar-viewport");
  await expect(page.locator(".concept-event").first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("phone-drawer-expanded.png") });
  const original = await viewport.elementHandle();
  const before = await viewport.evaluate((node) => ({ top: node.scrollTop, left: node.scrollLeft }));
  await swipe(page, ".concept-tour-toggle", 90);
  await expect(guide).toHaveAttribute("data-collapsed", "true");
  await expect(guide.getByRole("button", { name: "Expand description" })).toHaveAttribute("aria-expanded", "false");
  const box = (await guide.boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.width).toBe(390);
  expect(box.y + box.height).toBe(844);
  await page.screenshot({ path: test.info().outputPath("phone-drawer-collapsed.png") });
  await page.getByRole("button", { name: "Full screen calendar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Exit full screen" })).toBeFocused();
  await expect(guide).toHaveAttribute("data-collapsed", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Full screen calendar", exact: true })).toBeFocused();
  await swipe(page, ".concept-tour-guide h1", -90);
  await expect(guide).toHaveAttribute("data-collapsed", "false");
  await swipe(page, ".concept-tour-toggle", 24);
  await expect(guide).toHaveAttribute("data-collapsed", "false");
  await swipe(page, ".concept-tour-toggle", 90, true);
  await expect(guide).toHaveAttribute("data-collapsed", "false");
  expect(await guide.evaluate((node) => getComputedStyle(node).transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
  expect(await viewport.evaluate((node) => ({ top: node.scrollTop, left: node.scrollLeft }))).toEqual(before);
  expect(await original!.evaluate((node) => node === document.querySelector(".quno-calendar-viewport"))).toBe(true);
  await guide.getByRole("button", { name: "Collapse description" }).press("Enter");
  await expect(guide).toHaveAttribute("data-collapsed", "true");
});

test("drawer contents scroll natively without moving or collapsing the sheet", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await page.getByRole("button", { name: "All calendar demos", exact: true }).click();
  const body = page.locator(".concept-tour-body");
  const guide = page.locator(".concept-tour-guide");
  const before = await guide.boundingBox();
  expect(await body.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  await swipe(page, ".concept-tour-body", -60);
  await expect.poll(() => body.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect(guide).toHaveAttribute("data-collapsed", "false");
  expect(await guide.boundingBox()).toEqual(before);
});

test("a downward swipe settles from its dragged position without jumping upward", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concept");
  await expect(page.locator(".concept-event").first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const guide = page.locator(".concept-tour-guide");
  const samples = guide.evaluate(async (element) => {
    const positions: number[] = [];
    for (let frame = 0; frame < 60; frame++) {
      await new Promise(requestAnimationFrame);
      positions.push(element.getBoundingClientRect().top);
    }
    return positions;
  });
  await swipe(page, ".concept-tour-toggle", 90);
  await expect(guide).toHaveAttribute("data-collapsed", "true");
  const positions = await samples;
  expect(positions.at(-1)! - positions[0]).toBeGreaterThan(90);
  expect(positions.every((top, index) => index === 0 || top >= positions[index - 1] - 1)).toBe(true);
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`drawer collapse slides down with ${reducedMotion} motion`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await expect(page.locator(".concept-event").first()).toBeVisible();
    await page.emulateMedia({ reducedMotion });
    const result = await page.locator(".concept-tour-guide").evaluate(async (guide) => {
      const initial = guide.getBoundingClientRect().height;
      (guide.querySelector(".concept-tour-toggle") as HTMLButtonElement).click();
      const samples: { top: number; bottom: number; height: number }[] = [];
      for (let frame = 0; frame < 25; frame++) {
        await new Promise(requestAnimationFrame);
        const box = guide.getBoundingClientRect();
        samples.push({ top: box.top, bottom: box.bottom, height: box.height });
      }
      return { initial, samples };
    });
    const final = result.samples.at(-1)!;
    expect(final.height).toBeLessThan(result.initial);
    expect(result.samples.every((sample) => Math.abs(sample.bottom - 844) < 1)).toBe(true);
    const intermediate = result.samples.filter(
      (sample) => sample.height > final.height + 1 && sample.height < result.initial - 1
    );
    if (reducedMotion === "reduce") expect(intermediate).toHaveLength(0);
    else expect(intermediate.length).toBeGreaterThan(1);
    const toggle = page.getByRole("button", { name: "Expand description" });
    await expect(toggle).toBeVisible();
    expect(
      await toggle.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      })
    ).toBe(true);
  });
}
