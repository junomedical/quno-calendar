import { beforeEach, afterEach, vi } from "vitest";

// JSDOM has no layout; browser geometry is covered by Playwright.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(800);
});
afterEach(() => vi.restoreAllMocks());
