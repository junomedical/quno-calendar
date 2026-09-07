import { QunoDatePicker, type DateRange, type IsoDate } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import type { FocusEvent, JSX } from "react";
import { useEffect, useRef, useState } from "react";

const expectedRange: DateRange = { start: "2025-08-19", end: "2027-08-19" };
const initialValue: DateRange = { start: "2026-08-12", end: "2026-08-19" };
const monthOf = (date: IsoDate): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;

const onlyChangedDate = (previous: DateRange | null, next: DateRange): IsoDate | null => {
  if (!previous) return null;
  const changed = [
    previous.start === next.start ? null : next.start,
    previous.end === next.end ? null : next.end
  ].filter((date): date is IsoDate => date !== null);
  return changed.length === 1 ? changed[0] : null;
};

export const RangeInputExample = (): JSX.Element => {
  const [value, setValue] = useState<DateRange | null>(initialValue);
  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<IsoDate>(monthOf(initialValue.start));
  const [calendarRevision, setCalendarRevision] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerStartedInside = useRef(false);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent): void => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const finishInsidePointer = (): void => {
      setTimeout(() => {
        pointerStartedInside.current = false;
      }, 0);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("pointerup", finishInsidePointer);
    document.addEventListener("pointercancel", finishInsidePointer);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("pointerup", finishInsidePointer);
      document.removeEventListener("pointercancel", finishInsidePointer);
    };
  }, [open]);

  const changeFromInput = (next: DateRange | null): void => {
    if (!next) {
      setValue(null);
      return;
    }
    const nextMonth = monthOf(onlyChangedDate(value, next) ?? next.end);
    setValue(next);
    if (nextMonth === calendarMonth) return;
    setCalendarMonth(nextMonth);
    setCalendarRevision((revision) => revision + 1);
  };
  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>): void => {
    if (pointerStartedInside.current) return;
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  };
  return (
    <div
      className="story__date-input-composition"
      ref={rootRef}
      onBlurCapture={closeWhenFocusLeaves}
      onPointerDownCapture={() => {
        pointerStartedInside.current = true;
      }}
    >
      <QunoDateInput
        value={value}
        onChange={({ value }) => changeFromInput(value)}
        onFocus={() => setOpen(true)}
        expectedRange={expectedRange}
        referenceDate="2026-08-19"
        preferredDateOrder="dmy"
        parserLanguages={["en", "de"]}
        selectionMode="range"
        placeholder="Choose a period"
        aria-label="Choose a period"
      />
      {open && (
        <div className="story__date-input-composition-calendar">
          <QunoDatePicker
            key={calendarRevision}
            className="story__date-input-composition-picker"
            value={value}
            onChange={({ value }) => setValue(value)}
            onVisibleMonthChange={({ month }) => setCalendarMonth(month)}
            initialMonth={calendarMonth}
            selectionMode="range"
            labels={{ selectedPeriod: "Selected period", hint: "Choose an inclusive period." }}
          />
        </div>
      )}
    </div>
  );
};
