# Migration to @quno/calendar 0.6.0

Version `0.6.0` consolidates the former calendar and datepicker packages without legacy exports or wrapper packages.

## Import mapping

| Before                                                       | Now                                     |
| ------------------------------------------------------------ | --------------------------------------- |
| `quno-calendar` or pending `infinite-calendar`               | `@quno/calendar/timeline`               |
| `quno-calendar/styles.css` or `infinite-calendar/styles.css` | `@quno/calendar/timeline/styles.css`    |
| `@quno/datepicker`                                           | `@quno/calendar/date-picker`            |
| `@quno/datepicker/styles.css`                                | `@quno/calendar/date-picker/styles.css` |
| `@quno/datepicker/date-input`                                | `@quno/calendar/date-input`             |
| `@quno/datepicker/date-input/styles.css`                     | `@quno/calendar/date-input/styles.css`  |

The root `@quno/calendar` entry is headless. Move imports for `IsoDate`, `DateRange`, `DateSelectionMode`, `WeekStart`, parsing/formatting, comparison, and calendar-day helpers there when they are shared across features.

## Timeline facade names

| Before                     | Now                    |
| -------------------------- | ---------------------- |
| `CalendarRoot`             | `QunoCalendar`         |
| `CalendarRootProps`        | `QunoCalendarProps`    |
| `CalendarNavigationHandle` | `QunoCalendarHandle`   |
| `TimelineSettings`         | `QunoCalendarSettings` |

Domain names such as `CalendarEvent`, `EventRendererProps`, and `LoadEvents` are unchanged. Timeline day keys are now typed as `IsoDate`; event `start` and `end` values remain timestamp strings.

## Styling

The combined package uses component-scoped names:

- Shared tokens: `--quno-*`
- Timeline: `--quno-calendar-*` and `quno-calendar-*`
- Date picker: `--quno-date-picker-*` and `quno-date-picker-*`
- Date input: date-picker tokens with input-specific suffixes

Update the former `--ic-*`, `.ic-*`, and `--quno-picker-*` names. Stable feature-level `data-slot` and state attributes remain available. JavaScript imports no longer imply a stylesheet; import each `styles.css` subpath explicitly.

## Preact

The source is authored for React 18+. Existing Preact applications should add the aliases shown in [the usage guide](./usage.md#react-preact-ssr-and-production-builds). The packed package is verified through those aliases.
