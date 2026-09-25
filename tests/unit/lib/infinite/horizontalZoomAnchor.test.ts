import { describe, expect, it } from "vitest";
import {
  centeredScrollLeftAfterZoom,
  controlledScrollLeftAfterZoom
} from "#quno-internal/timeline/infinite/anchors/zoom/useHorizontalControlledZoomAnchor";

describe("horizontal controlled zoom anchoring", () => {
  it("preserves the timeline pixel represented at the visible grid center", () => {
    const viewportWidth = 1_200;
    const labelWidth = 230;
    const previousZoom = 1.2;
    const nextZoom = 2.4;
    const previousScrollLeft = 180;
    const visibleTimelineWidth = viewportWidth - labelWidth - 8;
    const previousCenterMinuteOffset = (previousScrollLeft + visibleTimelineWidth / 2) / previousZoom;

    const nextScrollLeft = centeredScrollLeftAfterZoom({
      scrollLeft: previousScrollLeft,
      viewportWidth,
      labelWidth,
      previousZoom,
      nextZoom
    });
    const nextCenterMinuteOffset = (nextScrollLeft + visibleTimelineWidth / 2) / nextZoom;

    expect(nextCenterMinuteOffset).toBeCloseTo(previousCenterMinuteOffset, 8);
  });

  it("clamps zoom-out anchoring at the timeline origin", () => {
    expect(
      centeredScrollLeftAfterZoom({
        scrollLeft: 0,
        viewportWidth: 1_200,
        labelWidth: 230,
        previousZoom: 3,
        nextZoom: 0.5
      })
    ).toBe(0);
  });

  it("keeps the timeline origin fixed while zooming in", () => {
    expect(
      centeredScrollLeftAfterZoom({
        scrollLeft: 0,
        viewportWidth: 1_200,
        labelWidth: 230,
        previousZoom: 1.2,
        nextZoom: 3
      })
    ).toBe(0);
  });

  it("keeps a visible current-time marker fixed before using the center or origin", () => {
    const previousMarkerX = 600;
    const nextScrollLeft = controlledScrollLeftAfterZoom({
      scrollLeft: 0,
      viewportWidth: 1_200,
      labelWidth: 230,
      previousZoom: 1.2,
      nextZoom: 2.4,
      currentTimeTimelineX: previousMarkerX
    });
    const previousMarkerViewportOffset = previousMarkerX;
    const nextMarkerViewportOffset = (previousMarkerX * 2.4) / 1.2 - nextScrollLeft;

    expect(nextScrollLeft).toBe(600);
    expect(nextMarkerViewportOffset).toBe(previousMarkerViewportOffset);
  });

  it("falls back to center anchoring when the current-time marker is outside the viewport", () => {
    expect(
      controlledScrollLeftAfterZoom({
        scrollLeft: 180,
        viewportWidth: 1_200,
        labelWidth: 230,
        previousZoom: 1.2,
        nextZoom: 2.4,
        currentTimeTimelineX: 1_300
      })
    ).toBe(
      centeredScrollLeftAfterZoom({
        scrollLeft: 180,
        viewportWidth: 1_200,
        labelWidth: 230,
        previousZoom: 1.2,
        nextZoom: 2.4
      })
    );
  });
});
