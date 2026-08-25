# Migration to @quno/calendar 0.6.0

Version `0.6.0` presents Infinite Calendar, Datepicker, Date Input, and Date Parser as independent package surfaces. There are no legacy JavaScript exports or wrapper packages.

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
