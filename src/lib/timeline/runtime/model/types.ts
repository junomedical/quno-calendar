import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type {
  CalendarId,
  CalendarEvent,
  CalendarRow,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import type { PreparedEventLayers } from "#quno-internal/timeline/infinite/events/layout/preparedCell";

export type Point = Readonly<{ x: number; y: number }>;
export type Rectangle = Point & Readonly<{ width: number; height: number }>;
export type Viewport = Readonly<{ width: number; height: number; left: number; top: number }>;
export type Orientation = "horizontal" | "vertical";
export type Extent = Readonly<{ index: number; start: number; end: number; size: number }>;
export type ResourceMetric = Readonly<{
  calendarId: CalendarId;
  events: readonly CalendarEvent[];
  layers: PreparedEventLayers;
  height: number;
  width: number;
}>;
export type DayMetric = Readonly<{ dateKey: IsoDate; resources: readonly ResourceMetric[] }>;
export type ResourceGeometry = ResourceMetric;
export type DayGeometry = Readonly<{
  dateKey: IsoDate;
  index: number;
  bounds: Rectangle;
  resources: readonly ResourceGeometry[];
  resourceExtents: readonly Extent[];
}>;
export type Geometry = Readonly<{
  orientation: Orientation;
  calendars: readonly CalendarRow[];
  settings: QunoInfiniteCalendarSettings;
  dates: readonly DayGeometry[];
  dateExtents: readonly Extent[];
  dateIndex: ReadonlyMap<IsoDate, number>;
  width: number;
  height: number;
  labelWidth: number;
  timeGutter: number;
  scale: number;
  draft?: CalendarEvent | null;
}>;
export type LogicalPoint = Readonly<{
  dateKey: IsoDate;
  calendarId?: CalendarId;
  minute?: number;
  resourceOffset?: number;
  resourceFraction?: number;
  dateOffset?: number;
  dateFraction?: number;
  eventId?: string;
}>;
export type SemanticAnchor = Readonly<{
  target: LogicalPoint;
  screen: Point;
  axes: "x" | "y" | "both";
}>;
export type RenderWindow = Readonly<{
  visibleDateKeys: readonly IsoDate[];
  dateIndexes: readonly number[];
  resourceIndexes: ReadonlyMap<IsoDate, readonly number[]>;
}>;
