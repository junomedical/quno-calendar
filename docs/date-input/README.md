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

In the focused picker composition, Start and End shortcuts navigate while keeping the popup open and the typed value
intact. Picker focus moves to its month heading; leaving the composed control through focus or an outside click closes it.

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

## Optional single-day clock input

Use `selectionMode="single"` with `timeMode` to recognize a date and one clock through the existing
[Date Parser grammar](../date-parser/README.md#optional-clock-recognition). `time`/`defaultTime` stores a separate
`HH:mm` clock; successful Enter/blur commits emit `onChange({ value, time })`, including time-only changes.
Date-only text commits with `time: null`; clearing emits both values as `null`. Intraday intervals with distinct clocks
and overnight ranges are invalid because the field represents one day and one time. For dates without a year,
`6 oct 2pm` recognizes one ranked day and the clock `14:00`.

`enabledHours` and `minuteCadence` configure picker choices independently of typed recognition. Typed clocks ignore
both settings by default. Omitted or empty `enabledHours` allows all hours, including with forced cadence. Set `forceCadence={true}` on Date Input to
reject off-cadence or disabled-hour clocks as invalid drafts rather than rounding; date-only values remain valid.
The field formats the date followed by the clock; optional `formatters.time({ time, locale })` overrides the clock.
Custom output should stay parseable by the configured grammar. Controlled changes synchronize both values, while
settings changes do not rewrite existing clocks. Range mode and omitted `timeMode` retain date-only behavior.

Arrow keys retain the clock during date edits, adjust its hour or minute part under the caret, and remain drafts until Enter/blur. With `forceCadence`, minute
steps use the cadence and hour edits skip disabled hours; otherwise all hours and single-minute edits are available. IME and native input events retain their existing contracts.
The synchronous clock parser now enters the Date Input bundle to support this opt-in prop; the parser API remains
owned by its separate headless product.

Try `/demo/date-time` and the live date-time chapter, or copy the
[composition recipe](../shared/usage.md#single-day-date-and-time).

`minuteCadence` also accepts 20-minute steps for forced validation and clock arrow edits. Picker row sizes follow the [shared cadence table](../timepicker/README.md#value-and-settings).
