# Quno/Date Input

Quno/Date Input owns the accessible controlled or uncontrolled text field that consumes Date Parser results and emits
the shared timezone-free `DateRange` model.

- Public entry point: `@quno/calendar/date-input`
- Live field guide: `/guide/date-input`
- Focused demo: `/demo/date-input`
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)
- [Date Parser](../date-parser/README.md)

The component owns draft text, recognition state, keyboard edits, formatting, commit behavior, and accessibility. It
does not re-export parser utilities, and composition with Datepicker remains consumer-owned.
