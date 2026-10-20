import type { Page } from "@playwright/test";

export async function swipeDrawer(page: Page, selector: string, distance: number, cancel = false) {
  await page.locator(".concept-tour-guide").evaluate(async (guide) => {
    await Promise.all(guide.getAnimations().map((animation) => animation.finished.catch(() => {})));
  });
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
