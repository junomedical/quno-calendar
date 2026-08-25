import { QunoDatePicker, type DateRange, type IsoDate } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

const expectedRange: DateRange = { start: "2025-08-19", end: "2027-08-19" };
const initialValue: DateRange = { start: "2026-08-19", end: "2026-08-19" };
const monthOf = (date: IsoDate): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;

export const SingleDayInputExample = (): JSX.Element => {
  const [value, setValue] = useState<DateRange | null>(initialValue);
  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<IsoDate>(monthOf(initialValue.start));
  const [calendarRevision, setCalendarRevision] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent): void => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const changeFromInput = (next: DateRange | null): void => {
    setValue(next);
    if (!next) return;
    const nextMonth = monthOf(next.start);
    if (nextMonth === calendarMonth) return;
    setCalendarMonth(nextMonth);
    setCalendarRevision((revision) => revision + 1);
  };
  const closeWhenFocusLeaves = (): void => {
    setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) setOpen(false);
    }, 0);
  };

  return (
    <div className="story__single-day-composition" ref={rootRef} onBlurCapture={closeWhenFocusLeaves}>
      <QunoDateInput
        value={value}
        onChange={changeFromInput}
        onFocus={() => setOpen(true)}
        expectedRange={expectedRange}
        referenceDate="2026-08-19"
        preferredDateOrder="dmy"
        parserLanguages={["en", "de"]}
        selectionMode="single"
        placeholder="Choose a day"
        aria-label="Choose a day"
      />
      {open && (
        <div className="story__single-day-composition-calendar">
          <QunoDatePicker
            key={calendarRevision}
            className="story__single-day-composition-picker"
            value={value}
            onChange={setValue}
            onVisibleMonthChange={setCalendarMonth}
            initialMonth={calendarMonth}
            selectionMode="single"
            labels={{ selectedPeriod: "Selected day", hint: "Choose one day." }}
          />
        </div>
      )}
    </div>
  );
};
