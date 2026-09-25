import type { CalendarHourPresentation } from "#quno-internal/timeline/core/calendarCellPresentation";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minuteToX, minuteToY } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import { VERTICAL_TIMELINE_GUTTER_PX } from "#quno-internal/timeline/infinite/rendering/vertical/verticalGeometry";

type CalendarHourBandsProps = {
  hours: CalendarHourPresentation[];
  orientation: "horizontal" | "vertical";
  settings: QunoInfiniteCalendarSettings;
};

/** Presentation-only hour bands shared by content grids and visible time chrome. */
export function CalendarHourBands({ hours, orientation, settings }: CalendarHourBandsProps) {
  return hours.map(({ hour, startMinute, endMinute, props }) => {
    const isHorizontal = orientation === "horizontal";
    const start = isHorizontal
      ? minuteToX({ minute: startMinute, geometry: settings })
      : minuteToY({ minute: startMinute, geometry: settings });
    const size =
      (isHorizontal
        ? minuteToX({ minute: endMinute, geometry: settings })
        : minuteToY({ minute: endMinute, geometry: settings })) - start;
    return (
      <div
        className={["quno-calendar-hour-band", props.className].filter(Boolean).join(" ")}
        data-slot="calendar-hour"
        data-hour={hour}
        data-start-minute={startMinute}
        data-end-minute={endMinute}
        key={hour}
        style={
          isHorizontal
            ? { ...props.style, left: TIMELINE_LEFT_GUTTER_PX + start, top: 0, width: size, height: "100%" }
            : { ...props.style, left: 0, top: VERTICAL_TIMELINE_GUTTER_PX + start, width: "100%", height: size }
        }
        title={props.title}
      />
    );
  });
}

/** Finds presentation for an existing full-hour time label. */
export function calendarHourLabelProps({ hours, minute }: { hours: CalendarHourPresentation[]; minute: number }) {
  return hours.find(({ hour }) => hour * 60 === minute)?.props;
}
