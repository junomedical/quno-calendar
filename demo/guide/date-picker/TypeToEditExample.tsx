import { QunoDatePicker, type DateRange, type IsoDate } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput } from "@quno/calendar/date-parser";
import type { FocusEvent, JSX, KeyboardEventHandler } from "react";
import { useEffect, useRef, useState } from "react";

const expectedRange: DateRange = { start: "2025-08-19", end: "2026-08-19" };
const initialValue: DateRange = { start: "2026-05-21", end: "2026-08-18" };
const initialMonth: IsoDate = "2026-08-01";
const monthOf = (date: IsoDate): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;

const nearestDateOutsideView = (range: DateRange | null, visibleMonth: IsoDate): IsoDate | null => {
  if (!range) return null;
  if (monthOf(range.end) < visibleMonth) return range.end;
  if (monthOf(range.start) > visibleMonth) return range.start;
  return null;
};

const onlyChangedDate = (previous: DateRange | null, next: DateRange | null): IsoDate | null => {
  if (!previous || !next) return null;
  const changed = [
    previous.start === next.start ? null : next.start,
    previous.end === next.end ? null : next.end
  ].filter((date): date is IsoDate => date !== null);
  return changed.length === 1 ? changed[0] : null;
};

export const TypeToEditExample = (): JSX.Element => {
  const [value, setValue] = useState<DateRange | null>(initialValue);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState<DateRange | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<IsoDate>(initialMonth);
  const [calendarRevision, setCalendarRevision] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerStartedInside = useRef(false);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent): void => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setPreview(null);
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

  const moveCalendar = (next: DateRange | null, preferredDate?: IsoDate | null): void => {
    const date = preferredDate ?? nearestDateOutsideView(next, calendarMonth);
    if (!date || monthOf(date) === calendarMonth) return;
    setCalendarMonth(monthOf(date));
    setCalendarRevision((revision) => revision + 1);
  };
  const changeValue = (next: DateRange | null): void => {
    moveCalendar(next);
    setPreview(null);
    setValue(next);
  };
  const changeInputValue = (next: DateRange | null): void => {
    moveCalendar(next, onlyChangedDate(preview ?? value, next));
    setPreview(null);
    setValue(next);
  };
  const previewDraft = (text: string): void => {
    const result = parseDateInput(text, {
      expectedRange,
      referenceDate: "2026-08-19",
      preferredDateOrder: "dmy",
      parserLanguages: ["en", "de"]
    });
    if (result.status !== "success") return;
    moveCalendar(result.value, onlyChangedDate(preview ?? value, result.value));
    setPreview(result.value);
  };
  const previewArrow: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const input = event.currentTarget;
    setTimeout(() => previewDraft(input.value), 0);
  };
  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>): void => {
    if (pointerStartedInside.current) return;
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setOpen(false);
    setPreview(null);
  };
  return (
    <div
      className="story__type-to-edit"
      ref={rootRef}
      onBlurCapture={closeWhenFocusLeaves}
      onPointerDownCapture={() => {
        pointerStartedInside.current = true;
      }}
    >
      <header className="story__type-to-edit-summary">
        <div className="story__type-to-edit-input story__type-to-edit-input--summary">
          <QunoDateInput
            value={value}
            onChange={changeInputValue}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onInput={() => {
              setPreview(null);
            }}
            onKeyDown={previewArrow}
            onBlur={() => {
              setFocused(false);
            }}
            expectedRange={expectedRange}
            referenceDate="2026-08-19"
            preferredDateOrder="dmy"
            parserLanguages={["en", "de"]}
            placeholder="Choose a period"
            aria-label="Choose a period"
          />
        </div>
        {focused && value && (
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => changeValue(null)}>
            Clear
          </button>
        )}
      </header>
      {open && (
        <div className="story__type-to-edit-calendar">
          <QunoDatePicker
            key={calendarRevision}
            className={`story__picker story__picker--without-summary story__picker--type-to-edit${preview ? " story__picker--draft" : ""}`}
            value={preview ?? value}
            onChange={changeValue}
            onVisibleMonthChange={setCalendarMonth}
            initialMonth={calendarMonth}
            labels={{ hint: "" }}
          />
        </div>
      )}
    </div>
  );
};
