import { describe, expect, it } from "vitest";
import { defaultEventRendererSizing } from "../../../../src/lib";
import { eventRendererDensity } from "../../../../src/lib/infinite/rendering/shared/eventRendererDensity";

describe("eventRendererDensity", () => {
  it("classifies event shells at the shared default boundaries", () => {
    expect(eventRendererDensity(71, 21, defaultEventRendererSizing)).toEqual({
      width: "tight",
      height: "minimal"
    });
    expect(eventRendererDensity(72, 22, defaultEventRendererSizing)).toEqual({
      width: "compact",
      height: "title-only"
    });
    expect(eventRendererDensity(120, 52, defaultEventRendererSizing)).toEqual({
      width: "regular",
      height: "regular"
    });
  });

  it("honors caller-provided sizing thresholds", () => {
    expect(
      eventRendererDensity(100, 40, {
        width: { compactBelow: 200, tightBelow: 110 },
        height: { compactBelow: 80, titleOnlyBelow: 50, minimalBelow: 30 }
      })
    ).toEqual({ width: "tight", height: "title-only" });
  });
});
