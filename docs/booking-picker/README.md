# Quno/Booking Picker

Quno/Booking Picker is the optional booking composition built on Quno/Datepicker. It owns provider-neutral date-and-time
presentation without making the standalone Datepicker depend on appointment, availability, or provider concepts.

- Public entry point: `@quno/calendar/booking-picker`
- Optional stylesheet: `@quno/calendar/booking-picker/styles.css`
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)
- [Shared package boundaries](../shared/architecture.md)

`QunoBookingDateTimePicker` groups timestamped slots by their local date in the supplied timezone, removes duplicate
intervals, derives exact Datepicker bounds from exclusive query periods, manages the visible month and selected day,
and renders accessible exact-time choices, loading state, and empty state. It retains the original slot object when a
choice is submitted.

The same entry point exports the source-comparison model and diagnostics used by Patient Journey and Funnel:
`compareBookingAvailabilityEnvelopes` treats only minute-normalized intervals present in both inputs as matching,
uses the envelope’s `bookingAuthority` to preserve the authorized slot payload for matches, and labels one-sided intervals explicitly. `quno` authority uses API payloads and disables Cronofy-only intervals. Cronofy or missing authority keeps Cronofy matches and disables API-only intervals. Existing `selectable: false` is never upgraded. This is presentation metadata; applications still enforce booking authority on the server. Slot, query-period, bootstrap,
and timing merge helpers keep those semantics identical across consumers.

Applications continue to own HTTP requests, provider capabilities, doctor/resource identity mapping, booking
submission, translations, and theme adapters. Import `@quno/calendar/datepicker` directly when only a day or range
picker is needed; that entry point contains no booking exports or booking CSS.

## Consumer-owned appearance

Booking Picker exposes `className`, `classNames`, and stable day/slot state attributes. Funnel and landing-page
adapters own colors, typography, corners, hover and selected states through their existing themes. There is no
`theme` prop or public-booking appearance stylesheet in this package. When setting a selected background, consumers
must also apply their theme's selected text color. Consumers retain their font, layout and visibility overrides.

```tsx
<QunoBookingDateTimePicker className="my-booking" classNames={{ slot: "my-time" }} {...bookingProps} />
```

The shared picker retains generic availability states and bounded navigation, including native disabled month arrows.

Applications render their own practitioner choices. The picker lays out the time buttons. Set
`--quno-booking-choice-gap` on the slot group to customize spacing. Smaller lists use full-width rows, and lists
with seven or more options wrap as space allows.

Unavailable dates outside the displayed month are muted by default, including without a theme. Available off-month dates keep their normal appearance. Override `--quno-booking-picker-unavailable-outside-text` (fallback: `--quno-date-picker-outside`, then `#a5acb7`) to customize this color.

Available spillover days explicitly inherit normal calendar text instead of core Datepicker’s outside-month gray. Override `--quno-booking-picker-available-date-text` when a separate available-day text color is needed.

Scheduling composition opts into Datepicker `padDayNumbers`, rendering `01`–`09` without changing full-date accessible labels. Font weight remains consumer-owned.

## Named arguments

`formatBookingDate({ date, locale })` provides the long selected-date heading used by Patient Journey and Funnel.
English uses weekday, ordinal day and month (for example, `Thursday 10th September`); other locales retain native
ordering and punctuation. The input is an `IsoDate` already resolved in the booking timezone. Formatting uses UTC
to retain that civil date independently of the host timezone. Opt in with `labels={{ selectedDate: formatBookingDate }}`;
the picker's default medium-date heading remains unchanged. Try the formatter in the booking guide example.

Booking helpers accept one object: `bookingSlotDate({ timestamp, timeZone })`, `mergeBookingSlots({ current, incoming })`, and `bookingPickerDateBounds({ periods, timeZone })`. Selection callbacks receive `{ slot }`, `{ date }`, `{ month }`, or `{ mode }`. Label formatters likewise receive named fields such as `{ date, locale }`, `{ count }`, or `{ milliseconds }`.

## Current Datepicker and complete month reads

The composition supports the current Datepicker's time-navigation contract without replacing that implementation. Optional compact controls hide the selection summary and offscreen pills, bound month arrows, and pad visible day numbers. Their defaults preserve standalone Datepicker behavior.

Booking Picker uses `YYYY-MM` for `initialMonth`, visible-month callbacks, and month availability helpers. Use
`bookingMonth({ date })` to derive a month from a booking day. Day selection still reports a full `YYYY-MM-DD` date.

A changed controlled `value` synchronizes the booking day when its availability arrives. An in-bounds value in
another month changes the grid immediately and emits `onVisibleMonthChange({ month, source: "value" })` so consumers
can request that month. User navigation emits `{ month }`. A newer external value, clearing the value, or a deliberate
day, month, or time selection supersedes any pending synchronization. Refreshes with the same value preserve browsing.
Prop synchronization never dispatches `onSlotSelected`. The booking timezone determines the target day and month.

`fetchBookingAvailabilityBatches({ periods, fetchBatch })` continues full 512-slot pages from an inclusive cursor, deduplicates that boundary, and rejects a non-advancing response. Funnel and Patient Journey use this one helper for complete months. Applications supply network requests and expired-capability classification; the shared loader coordinates refresh.

In date-only mode, choosing a day reveals one **Confirm** button. The `autoSelectDate` option makes the first bookable day active when availability loads, including a later month on opening for date-only bookings. Applications can opt in for timed bookings with `shouldSeekFirstAvailableDate` and return false after a specialist or source change. When the timed picker stays in a month that has only read-only availability, it selects the first day with slots and displays disabled time buttons. Time selection stays with the patient. In date-only mode, the confirmation button selects that day's first bookable slot, and `labels.dateOnlySlot` localizes it. A consumer with its own confirmation control can set `selectSlotOnDayClick` to receive a draft on the day click.

Set `focusFirstTimeOnDateSelection` to focus the first enabled time after the patient chooses a date. The initial date,
month navigation, and controlled value updates leave focus with the patient. Date-only choices keep their confirmation.

`showTimeZone` adds the booking timezone's abbreviation in parentheses to each time. The abbreviation uses the slot's instant, so seasonal time changes are reflected. When the browser provides an offset instead, format it as a compact numeric offset. Timezone labels appear on timed slots. Date-only choices omit timezone text. The interactive example at `/guide/datepicker#booking-picker` uses public JavaScript and CSS entry points.

Query bounds, initial months, and timestamped slots use the same booking timezone. This preserves local midnight across daylight-saving changes. Omit `timeZone` from the bounds helper only when UTC dates are intended. Internal date keys use shared cached ISO-calendar/Latin-digit fields, without a fixed country locale. Visible dates and times retain the supplied display locale.

## Source loading and month sessions

`createBookingAvailabilityLoader` coordinates the injected Cronofy/API source adapters, concurrent comparison reads,
one refresh for a reused expired capability, and caller-owned month caches. `readCached` reuses completed and in-flight
reads, evicts rejected requests and resolved bootstrap errors, and retains a completed month under a refreshed token.
Cache identity includes the full JSON-serializable application input and source capability. Compare uses its own context-scoped partition.
Create a separate cache for each mounted picker session; the loader has no global request cache.
Supply an optional `expiresAt({ result })` callback for results that carry expiring credentials. Return the
absolute expiry in Unix milliseconds. On lookup at or after expiry, `isReady` returns false and
`readCached` starts a new read. Concurrent reads through the stale entry's aliases share that request.
Results without a supplied expiry keep the ordinary cache behavior.

Use `read` to bypass the month cache before a submission check. `matchBookingSelection({ selected, slots })`
returns a complete selectable result only when the start and end instants, canonical doctor, resource IDs,
physical location, Product, upsell and invitation match. The application owns grant renewal, submission and
the recovery dialog.

`prefetch` warms only adjacent months that overlap the authorized horizon. It uses
`bookingAvailabilityMonthPeriod({ month, timeZone })` for local-midnight boundaries across daylight-saving changes.
A failed background month does not cancel its neighbor. Consumers can provide
`continueForward({ result })` to read one month at a time until the first bookable result or the end of the booking
window. The predicate receives no result for a gap between query periods. After an automatic or manual month change, prefetch the next month if it overlaps the window. `isReady` reports completed, unexpired month reads for loader-free navigation.

Applications still own URLs, authentication, HTTP error classification, Product/invitation context, doctor identity,
provider payload mapping, themes, and booking submission. Source adapters implement `hasBootstrap`, `bootstrap`,
`read`, `isExpired`, and `key`; the loader performs no HTTP calls itself. The loader uses the supplied `success` callback to extract successful bootstrap data. All adapter callbacks receive named objects. There are no server timing probes or logs.

## Slot cadence policy

`filterBookingSlots({ slots, policy })` applies consumer-supplied `cadenceMinutes` and `overlappingSlots` after complete pagination. It aligns starts to UTC instant cadence, sorts intervals, and preserves each original slot payload. Omit `policy` to keep provider results unchanged. Product settings and provider-specific interval limits remain in the application.

A consumer may inject a single `sources` adapter and omit `compare`. Reading an unconfigured source, or comparison without a comparer, rejects explicitly; no unused provider is constructed. This supports Product-policy booking independently of a later provider rollout.
