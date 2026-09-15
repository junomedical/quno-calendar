# Migration to @quno/calendar 0.6.0

Version `0.6.0` presents Infinite Calendar, Datepicker, Date Input, and Date Parser as independent package surfaces. There are no legacy JavaScript exports or wrapper packages.

## Unreleased: named contracts and product ownership

This cleanup is a breaking change with no compatibility aliases or positional overloads. Package entry points,
return values, date semantics, CSS tokens, slots, and native React event signatures remain unchanged.

| Previous API                                                                     | Replacement                                                                                                       |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `parseDateInput(text, options)`                                                  | `parseDateInput({ text, ...options })`                                                                            |
| `tokenizeDateInput(text)`                                                        | `tokenizeDateInput({ text })`                                                                                     |
| `addDays(date, amount)` and positional date helpers                              | `addDeays({ date, amount })`; pass each helper's named fields                                                     |
| Datepicker shared runtime helper exports                                         | Import the same helpers from `@quno/calendar`                                                                     |
| Picker/input `onChange(value)`                                                   | `onChange({ value })`                                                                                             |
| `onVisibleMonthChange(month)` / `onZoomChange(zoom)`                             | `onVisibleMonthChange({ month })` / `onZoomChange({ zoom })`                                                      |
| Date Input `formatter` / `QunoDateInputFormatter`                                | `formatters` / `QunoDateInputFormatters`; individual overrides are optional                                       |
| Positional formatting callbacks                                                  | `({ date, locale })`, `({ month, locale })`, `({ weekday, locale })`, or `({ value, locale })`                    |
| `disabledDays(date)` / `QunoDatePickerDisabledDayMatcher`                        | `isDayDisabled({ date })` / `QunoDatePickerDisabledDayPredicate`                                                  |
| `eventRenderer`                                                                  | `renderEvent` (still rendered as a React component)                                                               |
| Timeline `getCalendarDayProps` / `getCalendarCellProps` / `getCalendarHourProps` | `getDayProps` / `getDayCellProps` / `getHourProps`                                                                |
| `settings.dateLocale`                                                            | Component-level `locale`                                                                                          |
| `settings.dayNameGenerator` / `DayNameGenerator`                                 | `formatters.dayLabel` / `QunoInfiniteCalendarFormatters["dayLabel"]`; the callback receives `IsoDate`, not `Date` |
| `parserLanguage: "de"`                                                           | `parserLanguages: ["de"]`; omitted or empty arrays retain locale inference                                        |
| `scrollToDate(date)` / `scrollToDateTime(date, time)`                            | `scrollToDate({ date })` / `scrollToDateTime({ date, time })`                                                     |
| `focusEvent(event, options)` / `commitVisibleEvent(event, options)`              | `focusEvent({ event, ...options })` / `commitVisibleEvent({ event, ...options })`                                 |
| `restoreViewportAnchor(anchor, options)` / `removeVisibleEvent(eventId)`         | `restoreViewportAnchor({ anchor, ...options })` / `removeVisibleEvent({ eventId })`                               |
| `isIsoDate(value)`                                                               | `isIsoDate(input)` for `input = { value }`; narrows `input.value`                                                 |

The parser no longer exports `DateInputResolveOptions`, `ResolvedDateCandidate`, `DateInputVocabulary`,
`DateInputFormatter`, or `DateInputRangeFormatter`. Use its documented options, results, tokens and lexicon contracts;
input formatting belongs to `QunoDateInputFormatters`. Shared type re-exports remain available from product entry points.
Picker-specific selection helpers remain on the picker entry point.

```tsx
import { addDays, type DateRange } from "@quno/calendar";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput } from "@quno/calendar/date-parser";

const expectedRange: DateRange = { start: "2026-08-12", end: addDays({ date: "2026-08-12", amount: 7 }) };
const result = parseDateInput({ text: "today", expectedRange, referenceDate: expectedRange.start });
const onChange = ({ value }: { value: DateRange | null }) => setValue(value);
<QunoDatePicker value={value} onChange={onChange} />;
<QunoDateInput expectedRange={expectedRange} value={value} onChange={onChange} />;
```

Zero-argument commands and existing object requests such as `loadEvents`, `onEventMoveRequest`,
`captureViewportAnchor`, and `releaseActiveDraft` keep their object shapes. Native `onInput`, pointer events, refs,
React state setters, collection callbacks, and virtualizer callbacks retain their host-required signatures.

## Import mapping

| Before                                                                     | Now                                           |
| -------------------------------------------------------------------------- | --------------------------------------------- |
| `quno-calendar`, pending `infinite-calendar`, or `@quno/calendar/timeline` | `@quno/calendar/infinite-calendar`            |
| their calendar stylesheet subpaths                                         | `@quno/calendar/infinite-calendar/styles.css` |
| `@quno/datepicker` or `@quno/calendar/date-picker`                         | `@quno/calendar/datepicker`                   |
| their picker stylesheet subpaths                                           | `@quno/calendar/datepicker/styles.css`        |
| `@quno/datepicker/date-input`                                              | `@quno/calendar/date-input`                   |
| parser functions formerly exported by Date Input                           | `@quno/calendar/date-parser`                  |

Date Parser has no stylesheet. Date Input may use it internally but does not re-export `parseDateInput`, `tokenizeDateInput`, or parser-specific types.

## Infinite Calendar facade names

| Before                                             | Now                                   |
| -------------------------------------------------- | ------------------------------------- |
| `CalendarRoot` or `QunoCalendar`                   | `QunoInfiniteCalendar`                |
| `CalendarRootProps` or `QunoCalendarProps`         | `QunoInfiniteCalendarProps`           |
| `CalendarNavigationHandle` or `QunoCalendarHandle` | `QunoInfiniteCalendarHandle`          |
| `TimelineSettings` or `QunoCalendarSettings`       | `QunoInfiniteCalendarSettings`        |
| `defaultQunoCalendarSettings`                      | `defaultQunoInfiniteCalendarSettings` |

Event-domain names such as `CalendarEvent`, `EventRendererProps`, and `LoadEvents` are unchanged. Infinite Calendar day keys use shared `IsoDate`; event `start` and `end` values remain timestamp strings.

## Headless root and styling

The `@quno/calendar` root remains headless. Use it for `IsoDate`, `DateRange`, `DateSelectionMode`, `WeekStart`, comparison, formatting, parsing, and calendar-day arithmetic shared between features.

Component tokens and classes stay scoped:

- Shared tokens: `--quno-*`
- Infinite Calendar: `--quno-calendar-*` and `quno-calendar-*`
- Datepicker: `--quno-date-picker-*` and `quno-date-picker-*`
- Date Input: the Datepicker token family with input-specific suffixes

JavaScript imports never imply a stylesheet. Import each UI primitive's `styles.css` subpath explicitly.

## Preact

The source is authored for React 18+. Existing Preact applications should add the aliases in [the usage guide](./usage.md#react-preact-ssr-and-production-builds). The packed package is verified through those aliases.

### Unreleased booking appearance correction

Remove `theme="public-booking"` from booking pickers. It was an unreleased opt-in appearance experiment; consumers
now apply their own scoped date/time CSS through existing class hooks and state attributes. No change to slot or
navigation behavior is required. Always pair selected background and text colors in the consumer theme.

## Booking composition named arguments

The restored booking subpath now follows the named-object contract. Change `bookingSlotDate(timestamp, timeZone)` to `bookingSlotDate({ timestamp, timeZone })`; merge helpers receive `{ current, incoming }`, period merging receives `{ left, right }`, and comparison receives `{ cronofy, quno }`. Date bounds receive `{ periods }`; slot grouping receives `{ slots, timeZone }`. Timing retention receives `{ timings }`. Callbacks destructure their payload: `onSlotSelected={({ slot }) => submit(slot)}`, `onVisibleMonthChange={({ month }) => load(month)}`, and source-panel `onSelect={({ mode }) => select(mode)}`. Update label callbacks to destructure their named fields too.
