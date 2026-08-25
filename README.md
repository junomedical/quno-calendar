# @quno/calendar

One React-authored package for Quno’s timeline calendar, date picker, and natural date input. Version `0.6.0` supports React 18+ directly and Preact through documented `preact/compat` aliases.

## Install

```sh
npm install @quno/calendar react react-dom
```

Import only the feature and optional stylesheet you use:

```tsx
import { QunoCalendar } from "@quno/calendar/timeline";
import "@quno/calendar/timeline/styles.css";

import { QunoDatePicker } from "@quno/calendar/date-picker";
import "@quno/calendar/date-picker/styles.css";

import { QunoDateInput, parseDateInput } from "@quno/calendar/date-input";
import "@quno/calendar/date-input/styles.css";
```

The root `@quno/calendar` entry contains shared headless, timezone-free day contracts such as `IsoDate`, `DateRange`, `addDays`, and `compareDates`. It exports no UI component. Each JavaScript subpath is ESM/CommonJS compatible, SSR-safe, and does not inject styles.

## Features

- `timeline`: virtualized horizontal and vertical schedules with async event loading, custom event rendering, creation, movement, zoom, navigation, and focus.
- `date-picker`: a controlled or uncontrolled single-month picker for single days and inclusive date ranges.
- `date-input`: a dependency-free natural date tokenizer/parser with calendar periods and relative weekdays, plus an
  accessible controlled or uncontrolled input.

Calendar day keys use timezone-free `YYYY-MM-DD` values. Timeline event `start` and `end` remain timestamp strings and retain their local/offset semantics.

## Guide and records

Run `npm run dev` and open `/` for the project overview. Its three cards lead to the dedicated infinite-calendar,
date-range-input, and date-input field guides; every guide links to a focused demo. The former `/guide`, `/story`, and
`/examples/integration-walkthrough` routes redirect to the infinite-calendar guide.

- [Usage recipes](./docs/usage.md)
- [Migration guide](./docs/migration.md)
- [Architecture](./docs/architecture.md)
- [Test plan](./docs/test-plan.md)
- [Decision log](./docs/decisions.md)
- [Changelog](./CHANGELOG.md)

## Development

```sh
npm test
npm run typecheck
npm run lint
npm run check:architecture
npm run build
npm run verify:package
npm run test:compat
```

Release preparation is local only. Publishing, deprecating old packages, and deleting archival repositories require separate authorization.
