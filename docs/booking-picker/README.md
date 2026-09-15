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
preserves Cronofy's slot payload for matches, and labels one-sided intervals explicitly. Slot, query-period, bootstrap,
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

Unavailable dates outside the displayed month are muted by default, including without a theme. Available off-month dates keep their normal appearance. Override `--quno-booking-picker-unavailable-outside-text` (fallback: `--quno-date-picker-outside`, then `#a5acb7`) to customize this color.

Available spillover days explicitly inherit normal calendar text instead of core Datepicker’s outside-month gray. Override `--quno-booking-picker-available-date-text` when a separate available-day text color is needed.

Scheduling composition opts into Datepicker `padDayNumbers`, rendering `01`–`09` without changing full-date accessible labels. Font weight remains consumer-owned.
