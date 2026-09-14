import { addDays, isIsoDate, type DateRange, type IsoDate } from "@quno/calendar";
import { QunoDatePicker, type QunoDatePickerProps } from "@quno/calendar/datepicker";
import type { QunoDateInputProps } from "@quno/calendar/date-input";
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
import type {
  QunoInfiniteCalendarHandle,
  QunoInfiniteCalendarProps,
  CalendarEvent
} from "@quno/calendar/infinite-calendar";
// @ts-expect-error Shared runtime helpers have one public home.
import { addDays as pickerAddDays } from "@quno/calendar/datepicker";
// @ts-expect-error Resolution state is private to the parser.
import type { DateInputResolveOptions } from "@quno/calendar/date-parser";
// @ts-expect-error Candidate ranking is private to the parser.
import type { ResolvedDateCandidate } from "@quno/calendar/date-parser";
// @ts-expect-error Internal vocabulary is not a public parser contract.
import type { DateInputVocabulary } from "@quno/calendar/date-parser";
// @ts-expect-error Formatting belongs to the input, not the parser.
import type { DateInputFormatter } from "@quno/calendar/date-parser";

/** Compiled with the consumer surface; never executed by the runtime tests. */
export function checkPublicContracts(handle: QunoInfiniteCalendarHandle, event: CalendarEvent) {
  const date: IsoDate = "2026-08-12";
  const expectedRange: DateRange = { start: date, end: addDays({ date, amount: 1 }) };
  const candidate: { value: string } = { value: date };
  if (isIsoDate(candidate)) {
    const narrowed: IsoDate = candidate.value;
    void narrowed;
  }
  parseDateInput({ text: "today", expectedRange, parserLanguages: ["en"] });
  tokenizeDateInput({ text: "today" });
  handle.scrollToDate({ date });
  handle.scrollToDateTime({ date, time: "09:00" });
  handle.focusEvent({ event, preferredCalendarId: event.calendarId });
  handle.commitVisibleEvent({ event, previousEventId: "temporary", appearing: true });
  handle.restoreViewportAnchor({ anchor: null, cancelOnManualScroll: true });
  handle.removeVisibleEvent({ eventId: event.id });
  // @ts-expect-error Positional utility calls are removed.
  addDays(date, 1);
  // @ts-expect-error Positional parser calls are removed.
  parseDateInput("today", { expectedRange });
  // @ts-expect-error Tokenization also receives an object.
  tokenizeDateInput("today");
  // @ts-expect-error Navigation receives named context.
  handle.scrollToDate(date);
  // @ts-expect-error Focus options are flat.
  handle.focusEvent({ event, options: { preferredCalendarId: event.calendarId } });
  // @ts-expect-error The singular language alias is removed.
  parseDateInput({ text: "today", expectedRange, parserLanguage: "en" });
  const picker: QunoDatePickerProps = {
    onChange: ({ value }) => {
      const range: DateRange | null = value;
      void range;
    },
    onVisibleMonthChange: ({ month }) => {
      const date: IsoDate = month;
      void date;
    },
    isDayDisabled: ({ date }) => date === expectedRange.start,
    formatters: { date: ({ date, locale }) => `${date}:${locale}`, weekday: ({ weekday }) => String(weekday) }
  };
  const input: QunoDateInputProps = {
    expectedRange,
    onChange: picker.onChange,
    formatters: { range: ({ value, locale }) => `${value.start}:${locale}` },
    onInput: (event) => {
      event.currentTarget.setSelectionRange(0, 0);
    }
  };
  // @ts-expect-error Disabled-date predicate has a canonical name.
  picker.disabledDays = () => false;
  // @ts-expect-error Input formatting uses the plural collection.
  input.formatter = { range: () => "" };
  const calendar: Partial<QunoInfiniteCalendarProps> = {
    locale: "en-GB",
    formatters: { dayLabel: ({ date }) => date },
    onZoomChange: ({ zoom }) => {
      const value: number = zoom;
      void value;
    },
    getDayProps: ({ date }) => ({ title: date }),
    getDayCellProps: ({ calendar }) => ({ title: calendar.name }),
    getHourProps: ({ hour }) => ({ title: String(hour) })
  };
  // @ts-expect-error The legacy renderer prop is removed.
  calendar.eventRenderer = () => null;
  // @ts-expect-error The legacy presentation prop is removed.
  calendar.getCalendarDayProps = () => ({});
  // @ts-expect-error Localization is a component prop, outside geometry settings.
  calendar.settings = { dateLocale: "en-GB" };
  void [pickerAddDays, QunoDatePicker, input, calendar];
}

export type RejectedPrivateTypes =
  | DateInputResolveOptions
  | ResolvedDateCandidate
  | DateInputVocabulary
  | DateInputFormatter;
