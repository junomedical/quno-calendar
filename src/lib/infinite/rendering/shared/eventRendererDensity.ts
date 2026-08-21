import type {
  EventHeightDensity,
  EventRendererSizing,
  EventWidthDensity
} from "#calendar-internal/core/eventRendererSizing";

const classifyWidthDensity = (width: number, sizing: EventRendererSizing["width"]): EventWidthDensity => {
  if (width < sizing.tightBelow) return "tight";
  if (width < sizing.compactBelow) return "compact";

  return "regular";
};

const classifyHeightDensity = (height: number, sizing: EventRendererSizing["height"]): EventHeightDensity => {
  if (height < sizing.minimalBelow) return "minimal";
  if (height < sizing.titleOnlyBelow) return "title-only";
  if (height < sizing.compactBelow) return "compact";

  return "regular";
};

/** Converts calendar-owned shell geometry into stable names for product CSS. */
export const eventRendererDensity = (
  width: number,
  height: number,
  sizing: EventRendererSizing
): { width: EventWidthDensity; height: EventHeightDensity } => ({
  width: classifyWidthDensity(width, sizing.width),
  height: classifyHeightDensity(height, sizing.height)
});
