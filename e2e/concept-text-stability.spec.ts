import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "parallel" });
for (const size of [
  { width: 1440, height: 900 },
  { width: 950, height: 800 },
  { width: 390, height: 844 }
]) {
  test(`scenario copy retains geometry through scroll, activation and playback at ${size.width}px`, async ({
    page
  }) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/concept");
    await expect(page.locator(".concept-event").first()).toBeVisible();
    const scene = page.locator('[data-scene-id="zoom"]');
    await expect(scene).toHaveAttribute("inert", "");
    const heading = await scene.locator("h1").elementHandle();
    const original = await scene.evaluate((section) => {
      const parent = section.getBoundingClientRect();
      return [
        ...section.querySelectorAll("h1, .concept-explanation p, .concept-intro-actions, .concept-playback-controls")
      ].map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          x: rect.x - parent.x,
          y: rect.y - parent.y,
          width: rect.width,
          height: rect.height,
          fontSize: getComputedStyle(node).fontSize
        };
      });
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const frames = await page.evaluate(async () => {
      const section = document.querySelector('[data-scene-id="zoom"]')!;
      const pages = document.querySelector(".concept-pages")!;
      pages.scrollTo({ top: pages.clientHeight, behavior: "smooth" });
      const values = [];
      let settled = 0;
      while (settled < 5) {
        const parent = section.getBoundingClientRect();
        values.push(
          [
            ...section.querySelectorAll(
              "h1, .concept-explanation p, .concept-intro-actions, .concept-playback-controls"
            )
          ].map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              x: rect.x - parent.x,
              y: rect.y - parent.y,
              width: rect.width,
              height: rect.height,
              fontSize: getComputedStyle(node).fontSize
            };
          })
        );
        if (section.getAttribute("data-active") === "true") settled++;
        await new Promise(requestAnimationFrame);
      }
      return values;
    });
    expect(frames.length).toBeGreaterThan(8);
    for (const frame of frames) {
      expect(frame).toHaveLength(original.length);
      for (let index = 0; index < frame.length; index++) {
        expect(frame[index].fontSize).toBe(original[index].fontSize);
        for (const key of ["x", "y", "width", "height"] as const)
          expect(Math.abs(frame[index][key] - original[index][key])).toBeLessThan(0.5);
      }
    }
    expect(await heading!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(scene).not.toHaveAttribute("inert", "");
    await expect(page.locator('.concept-screen[data-active="false"]')).toHaveCount(7);
    if (size.width > 850) {
      const before = (await scene.locator("h1").boundingBox())!;
      await page.getByRole("button", { name: "Replay scene", exact: true }).click();
      await expect(page.locator(".concept")).toHaveAttribute("data-playing", "true");
      expect((await scene.locator("h1").boundingBox())!.y).toBeCloseTo(before.y, 1);
      await page.getByRole("button", { name: "Try it", exact: true }).click();
      expect((await scene.locator("h1").boundingBox())!.y).toBeCloseTo(before.y, 1);
    }
  });
}
