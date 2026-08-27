import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarId } from "./calendarCellTypes";
import type { EventId } from "./types";

/** Target used for preserving a rendered event or calendar slot in the viewport. */
export type CalendarViewportAnchorTarget = {
  eventId?: EventId;
  calendarId?: CalendarId;
  dateKey?: IsoDate;
  time?: string;
  requireVisible?: boolean;
};

/** Opaque viewport anchor captured by `QunoInfiniteCalendar` and restored after parent layout changes. */
export type CalendarViewportAnchor = {
  snapshot: {
    top: number;
    left: number;
  };
  target: CalendarViewportAnchorTarget;
};

/** Options for restoring a captured viewport anchor. */
export type CalendarViewportAnchorRestoreOptions = {
  target?: CalendarViewportAnchorTarget;
  afterRecenter?: boolean;
  allowNavigationFallback?: boolean;
  cancelOnManualScroll?: boolean;
};

/** Options for patching one committed event into the currently loaded visible cache. */
export type CalendarVisibleEventCommitOptions = {
  previousEventId?: EventId;
  appearing?: boolean;
};
