import type { DateRange, IsoDate } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { useMemo } from "react";

const expectedRange: DateRange = { start: "1900-01-01", end: "2100-12-31" };

type DateNavigationInputProps = {
  date: IsoDate;
  onChange: (date: IsoDate) => void;
};

export function DateNavigationInput({ date, onChange }: DateNavigationInputProps) {
  const value = useMemo<DateRange>(() => ({ start: date, end: date }), [date]);
  return (
    <QunoDateInput
      aria-label="Go to date"
      data-testid="jump-date-input"
      expectedRange={expectedRange}
      onChange={({ value: next }) => {
        if (next) onChange(next.start);
      }}
      placeholder="Today or 6 July"
      selectionMode="single"
      value={value}
    />
  );
}
