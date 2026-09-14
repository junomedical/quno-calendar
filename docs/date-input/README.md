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

Parser options and vocabulary are compiled once per input configuration and reused across drafts. Ordinary recognition
decoration may settle through a React transition, but the native text and caret stay urgent; Enter, blur, Arrow edits,
partial-range completion, and IME completion remain synchronous. Parsing stays on the main thread because the input is
small and a worker would make the public contract asynchronous while adding startup and serialization overhead.

The field guide's production chapter presents the Date Input entry point, optional stylesheet, measured artifacts, and
runtime contracts directly without repeating them in a separate import implementation accordion.

The package's separate React 19 consumer fixture typechecks and mounts Date Input together with the other public UI
subpaths; the normal development dependency remains React 18 so both supported type generations stay covered.

## Named contracts

Date Input consumes the headless implementation owned by Date Parser. Use `formatters.range({ value, locale })`,
`parserLanguages`, and `onChange({ value })`; native input events retain React event signatures.

See the [breaking migration](../shared/migration.md#unreleased-named-contracts-and-product-ownership).
