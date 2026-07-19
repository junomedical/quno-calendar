import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  defaultTimelineSettings,
  type CalendarEvent,
  type CalendarRow,
  type TimelineSettings
} from "../../../../src/lib/core/types";
import { useDayMetrics } from "../../../../src/lib/infinite/events/metrics/useDayMetrics";
import { useVerticalPreparedColumns } from "../../../../src/lib/infinite/events/metrics/useVerticalPreparedColumns";

const dateKey = "2026-07-18";
const calendar: CalendarRow = { id: "calendar-a", name: "Calendar A" };
const calendars = [calendar];
const event: CalendarEvent = {
  id: "event-a",
  calendarId: calendar.id,
  title: "Appointment",
  start: `${dateKey}T09:00:00`,
  end: `${dateKey}T10:00:00`
};
const eventsByDate = { [dateKey]: [event] };

function settingsAtZoom(zoom: number): TimelineSettings {
  return { ...defaultTimelineSettings, zoom };
}

describe("zoom preparation stability", () => {
  it("preserves horizontal membership, prepared cells, and metrics when only zoom changes", () => {
    const { result, rerender } = renderHook(
      ({ settings }) =>
        useDayMetrics({
          eventsByDate,
          selectedCalendars: calendars,
          settings,
          baseDayHeight: settings.dayHeaderHeight + settings.rowHeight,
          activeDraft: null
        }),
      { initialProps: { settings: settingsAtZoom(1) } }
    );
    const initialMetrics = result.current;
    const initialCell = initialMetrics.preparedCellForRow(dateKey, calendar.id);
    const initialEvents = initialMetrics.eventsForRow(dateKey, calendar.id);

    rerender({ settings: settingsAtZoom(2) });

    expect(result.current.dayMetricsByDate).toBe(initialMetrics.dayMetricsByDate);
    expect(result.current.preparedCellForRow(dateKey, calendar.id)).toBe(initialCell);
    expect(result.current.eventsForRow(dateKey, calendar.id)).toBe(initialEvents);
    expect(result.current.preparedCellForRow).toBe(initialMetrics.preparedCellForRow);
    expect(result.current.eventsForRow).toBe(initialMetrics.eventsForRow);
  });

  it("preserves vertical membership and prepared cells across zoom and equal date arrays", () => {
    const { result, rerender } = renderHook(
      ({ settings, visibleDateKeys }) =>
        useVerticalPreparedColumns({
          activeDraft: null,
          eventsByDate,
          renderedCalendars: calendars,
          settings,
          visibleDateKeys
        }),
      { initialProps: { settings: settingsAtZoom(1), visibleDateKeys: [dateKey] } }
    );
    const initialColumns = result.current;
    const initialCell = initialColumns.preparedCellForColumn(dateKey, calendar.id);
    const initialEvents = initialColumns.eventsForColumn(dateKey, calendar.id);

    rerender({ settings: settingsAtZoom(2), visibleDateKeys: [dateKey] });

    expect(result.current).toBe(initialColumns);
    expect(result.current.preparedCellForColumn(dateKey, calendar.id)).toBe(initialCell);
    expect(result.current.eventsForColumn(dateKey, calendar.id)).toBe(initialEvents);
  });
});
