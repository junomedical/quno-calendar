import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate, ease } from "#quno-demo/concept/playbackMotion";
import { scrollBy } from "#quno-demo/concept/playbackScroll";

describe("cancellable demonstration motion", () => {
  let frames: Map<number, FrameRequestCallback>;
  let sequence: number;
  const tick = (time: number) => {
    const current = [...frames.values()];
    frames.clear();
    current.forEach((callback) => callback(time));
  };
  beforeEach(() => {
    frames = new Map();
    sequence = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++sequence, callback);
      return sequence;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("uses frame timestamps and reaches the exact final progress", async () => {
    const samples: number[] = [];
    const done = animate(new AbortController().signal, 1000, (value) => samples.push(value));
    for (const time of [20, 120, 520, 1020]) tick(time);
    await done;
    expect(samples).toEqual([0, 0.1, 0.5, 1]);
    expect(frames.size).toBe(0);
  });
  it("cancels the pending frame immediately and never applies the endpoint", async () => {
    const controller = new AbortController();
    const apply = vi.fn();
    const done = animate(controller.signal, 1000, apply);
    tick(0);
    tick(250);
    controller.abort();
    await expect(done).rejects.toThrow();
    expect(frames.size).toBe(0);
    tick(1000);
    expect(apply.mock.calls.map(([value]) => value)).toEqual([0, 0.25]);
  });
  it("eases both ends and preserves the requested scroll distance despite pixel rounding", async () => {
    const element = document.createElement("div");
    let top = 0;
    Object.defineProperty(element, "scrollTop", {
      get: () => top,
      set: (value) => {
        top = Math.round(value);
      }
    });
    const done = scrollBy(new AbortController().signal, element, 0, 31, 1000);
    for (let time = 0; time <= 1000; time += 10) tick(time);
    await done;
    expect(top).toBe(31);
    expect(ease(0.1, "ease-in-out")).toBeLessThan(0.1);
    expect(ease(0.9, "ease-in-out")).toBeGreaterThan(0.9);
  });
});
