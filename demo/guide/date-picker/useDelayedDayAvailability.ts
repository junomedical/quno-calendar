import { useCallback, useEffect, useMemo, useState } from "react";
import { calendarGrid, type IsoDate, type QunoDatePickerDayCellCustomizer } from "@quno/calendar/datepicker";

export type DemoDayAvailability = "loading" | "available" | "disabled" | "error";

const DELAY_MS = 900;
const failedDate: IsoDate = "2026-08-24";
const holidayDate: IsoDate = "2026-08-27";

const weekday = (date: IsoDate): number => new Date(`${date}T00:00:00Z`).getUTCDay();

const resolvedAvailability = (date: IsoDate): DemoDayAvailability => {
  if (date === failedDate) return "error";
  if (date === holidayDate || weekday(date) === 0 || weekday(date) === 3 || weekday(date) === 6) return "disabled";
  return "available";
};

const statusFor = (statuses: Partial<Record<IsoDate, DemoDayAvailability>>, date: IsoDate): DemoDayAvailability =>
  statuses[date] ?? "loading";

export function useDelayedDayAvailability(initialMonth: IsoDate) {
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [statuses, setStatuses] = useState<Partial<Record<IsoDate, DemoDayAvailability>>>({});
  const visibleDates = useMemo(() => calendarGrid({ month: visibleMonth }), [visibleMonth]);

  useEffect(() => {
    setStatuses((current) => {
      const next = { ...current };
      for (const date of visibleDates) next[date] ??= "loading";
      return next;
    });
    const timer = window.setTimeout(() => {
      setStatuses((current) => {
        const next = { ...current };
        for (const date of visibleDates) next[date] = resolvedAvailability(date);
        return next;
      });
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [visibleDates]);

  const isDayDisabled = useCallback((date: IsoDate) => statusFor(statuses, date) !== "available", [statuses]);
  const getDayCellProps = useCallback<QunoDatePickerDayCellCustomizer>(
    ({ date, isToday, isWeekend }) => {
      const status = statusFor(statuses, date);
      return {
        className: [
          isToday && "story__day--today",
          isWeekend && "story__day--weekend",
          status === "loading" && "story__day--loading",
          status === "disabled" && "story__day--non-working",
          status === "error" && "story__day--error",
          date === holidayDate && "story__day--holiday"
        ]
          .filter(Boolean)
          .join(" "),
        title:
          status === "loading"
            ? "Checking availability"
            : status === "error"
              ? "Availability check failed"
              : date === holidayDate
                ? "Clinic holiday"
                : status === "disabled"
                  ? "Not selectable"
                  : isToday
                    ? "Today"
                    : undefined
      };
    },
    [statuses]
  );
  const loadingCount = visibleDates.filter((date) => statusFor(statuses, date) === "loading").length;

  return { isDayDisabled, getDayCellProps, loadingCount, setVisibleMonth };
}
