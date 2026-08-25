# Quno/Datepicker

Quno/Datepicker owns direct manipulation of a timezone-free day or inclusive range, including painting, endpoint
editing, range movement, month navigation, motion, localization, theming, and day presentation hooks.

- Public entry point: `@quno/calendar/datepicker`
- Live field guide: `/guide/datepicker`
- Focused demo: `/demo/datepicker`
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)
- [Shared date model and package boundaries](../shared/architecture.md)

The visible month remains independent from the selected value. Controlled and uncontrolled usage share `DateRange`,
with equal endpoints representing a single day. The field guide demonstrates `selectionMode="single"` on Datepicker by
itself before separately composing that picker with a focused Quno/Date Input selection surface.
