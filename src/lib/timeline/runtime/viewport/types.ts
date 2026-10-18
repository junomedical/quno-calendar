import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { GeometryInput } from "#quno-internal/timeline/runtime/model/geometry";
import type { Geometry, RenderWindow, Viewport } from "#quno-internal/timeline/runtime/model/types";
import type { IntentKind, ViewportIntent } from "./ownership";
export type EngineLayout = Omit<GeometryInput, "dates" | "viewportWidth"> & { anchorDate: IsoDate; nowMinute?: number };
export type EngineSnapshot = Readonly<{
  revision: number;
  reason: string;
  geometry: Geometry;
  viewport: Viewport;
  window: RenderWindow;
  owner: ViewportIntent | null;
}>;
export type EngineTrace = Readonly<{
  revision: number;
  reason: string;
  owner: IntentKind | null;
  top: number;
  left: number;
}>;

export type EngineOptions = { layout: EngineLayout; viewport: Viewport; trace?: (entry: EngineTrace) => void };
