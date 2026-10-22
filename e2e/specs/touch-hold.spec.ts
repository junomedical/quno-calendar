import { expect, test, type Page, type CDPSession } from "@playwright/test";

async function touch(client: CDPSession, type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) {
  await client.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
}
async function target(page: Page, vertical: boolean, grid: boolean) {
  const day = page.locator('[data-testid="calendar-day"][data-date="2026-10-08"]');
  if (!grid) {
    const card = day.locator('[data-event-id="visit"]');
    await expect(card).toBeVisible();
    const box = (await card.boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  const column = day.locator(
    `${vertical ? ".icv-calendar-column-grid" : ".quno-calendar-row-grid"}[data-calendar-id="two"]`
  );
  const box = (await column.boundingBox())!;
  return { x: vertical ? box.x + box.width / 2 : box.x + 160, y: vertical ? box.y + 200 : box.y + box.height / 2 };
}

for (const vertical of [false, true]) {
  for (const grid of [false, true]) {
    test(`${vertical ? "vertical" : "horizontal"}: touch ${grid ? "drawing" : "event drag"} waits for hold and leaves a quick pan native`, async ({
      browser,
      browserName,
      baseURL
    }) => {
      test.skip(browserName !== "chromium", "Native touch movement uses Chromium's input protocol.");
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
        isMobile: true
      });
      const page = await context.newPage();
      await page.goto(`/e2e/fixtures/touch-interactions.html?view=infinite-${vertical ? "vertical" : "horizontal"}`);
      const viewport = page.locator(".quno-calendar-viewport");
      const client = await context.newCDPSession(page);
      const origin = await target(page, vertical, grid);
      const before = await viewport.evaluate((node) => node.scrollTop);
      await touch(client, "touchStart", origin.x, origin.y);
      for (let index = 1; index <= 6; index++) await touch(client, "touchMove", origin.x, origin.y - index * 12);
      await touch(client, "touchEnd");
      await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(before + 20);
      await page.waitForTimeout(400);
      await expect(page.getByTestId("result")).toBeEmpty();
      await expect(page.getByTestId("drag-preview-event")).toHaveCount(0);
      await expect(page.getByTestId("draft-event")).toHaveCount(0);
      await page.reload();
      const held = await target(page, vertical, grid);
      const heldScroll = await viewport.evaluate((node) => node.scrollTop);
      await touch(client, "touchStart", held.x, held.y);
      await page.waitForTimeout(180);
      await expect(page.locator('[data-status="dragging"]')).toHaveCount(0);
      await expect(page.getByTestId("draft-event")).toHaveCount(0);
      await page.waitForTimeout(220);
      if (grid) await expect(page.getByTestId("draft-event")).toHaveCount(1);
      else await expect(page.locator('[data-event-id="visit"][data-status="dragging"]')).toHaveCount(1);
      for (let index = 1; index <= 6; index++)
        await touch(client, "touchMove", held.x + (vertical ? 0 : index * 15), held.y + (vertical ? index * 15 : 0));
      expect(await viewport.evaluate((node) => node.scrollTop)).toBe(heldScroll);
      if (!grid) {
        const preview = (await page.getByTestId("drag-preview-event").boundingBox())!;
        expect(
          Math.abs(
            vertical ? preview.y + preview.height / 2 - held.y - 90 : preview.x + preview.width / 2 - held.x - 90
          )
        ).toBeLessThan(2);
      }
      await touch(client, "touchEnd");
      await expect(page.getByTestId("result")).toContainText(grid ? "draw:" : "move:");
      await context.close();
    });
  }
}
