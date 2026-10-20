# Quno/Date Parser

Quno/Date Parser owns dependency-free recognition and tokenization of timezone-free dates and inclusive ranges.

- Public entry point: `@quno/calendar/date-parser`
- Live field guide: `/docs/date-parser`
- Focused demo: `/demo/date-parser`
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)
- [Date Input](../date-input/README.md)

The parser supports explicit formats, preferred numeric order, bounded relative phrases, configurable week starts,
ranges, expected-period ranking, English and German vocabularies, lexicon extensions, and tokenization without a UI or
framework dependency. Lexicon extensions add aliases within that bounded grammar; they do not provide general locale
or natural-language parsing.

The field guide's production chapter presents the headless entry point, measured artifact, and runtime contract
directly without repeating them in a separate import implementation accordion.

## Bundle budget

The headless JavaScript entry point has a 7 KiB gzip ceiling, leaving room above the current 6.03 KiB artifact.
See [QDPR-006](./decisions.md#qdpr-006---leave-headroom-in-the-parser-bundle-budget).

## Named contracts

The parser owns its implementation and headless types. Call `parseDateInput({ text, ...options })` and
`tokenizeDateInput({ text })`. `parserLanguages` is the single language setting; resolution internals are private.

Successful and partial-range results return top-level `start` and `end` objects of type `DateInputParseEndpoint`:
`{ date: IsoDate, time: string | null }`. Clocks are normalized timezone-free `HH:mm`; `null` means no clock was supplied.
Date-only parsing has the same endpoint shape with both times set to `null`. Empty and invalid results contain only
their `status`. Single inputs duplicate both endpoints. A partial range duplicates the start date and leaves the end
time `null`. The former `value`, `times`, and `DateInputTimeRange` are removed; see the
[endpoint migration](../shared/migration.md#unreleased-paired-parser-endpoints).

See the [breaking migration](../shared/migration.md#unreleased-named-contracts-and-product-ownership).

## Optional clock recognition

Set `recognizeTime: true` on `parseDateInput` to recognize `10:00`, `10AM`, `10:30PM`, `13`, `23`, and `12:59`.
The default remains date-only. Each `start`/`end` pairs its timezone-free `IsoDate` with a normalized `HH:mm` clock,
or `null` when the endpoint's time was not supplied.

```ts
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";

const result = parseDateInput({
  text: "tomorrow 23:00–01:00",
  recognizeTime: true,
  referenceDate: "2026-10-05",
  expectedRange: { start: "2026-01-01", end: "2027-12-31" }
});
// { status: "success",
//   start: { date: "2026-10-06", time: "23:00" },
//   end: { date: "2026-10-07", time: "01:00" } }

const tokens = tokenizeDateInput({ text: "10:30PM", recognizeTime: true });
// { type: "time", value: "22:30", raw: "10:30PM", start: 0, end: 7 }
```

Hours use one or two digits: `0–23` for 24-hour clocks, `1–12` with case-insensitive AM/PM. Minutes require two digits
in `00–59`; spaces before AM/PM are optional. `12AM` is midnight and `12PM` is noon. Time-only input uses
`referenceDate`, defaulting to today. Time may precede or follow one date, using whitespace or `at`/`um` connectors.
Bare numeric tokens keep valid date readings: `12 June 13` remains a date, while `12 June at 13` supplies a clock.
Omitted years use the same ranking as date-only input: with reference date `2026-10-06`, `6 oct 2pm` resolves to
one day, `2026-10-06`, at `14:00`, even when the expected range spans several years.
Existing duration phrases keep their meaning.

Ranges accept existing delimiters, plus compact dashes between explicit clocks (`10:00–11:00`). Bare-hour ranges
need an explicit delimiter (`13 - 23`); `10-11` retains its date reading. A missing date inherits the other endpoint's
date, or uses the reference date if both are omitted. An earlier time on an undated end advances it one calendar day;
equal times stay on the same day. Explicit dates remain authoritative and reversed endpoints normalize with their
own clocks. Missing times and meridiem suffixes are never inherited.

A trailing range delimiter returns `partial-range`, duplicates the recognized start date, and leaves the end time
`null`. Malformed clocks are `invalid`. Single selection allows intraday intervals and rejects overnight ranges.
Times on whole multi-day calendar phrases, seconds, timezones, offsets, dotted meridiem, and natural clock phrases
are unsupported. Date Input and Datepicker can compose one date and one clock with `timeMode` in single-day mode;
see the [date-time recipe](../shared/usage.md#single-day-date-and-time). The headless parser continues to support
intraday and overnight ranges independently of the single-clock UI.

## Concept playground

The `/concept` playground uses the shared guide, autoplay loops and live phone stage from
[QUNO-032](../shared/decisions.md#quno-032---share-the-floating-guide-across-all-concept-products). Mobile presents the
explainer as a bottom drawer with chevron taps and header swipes; fullscreen sits beside the chevron in both layouts
([QUNO-038](../shared/decisions.md#quno-038--use-a-mobile-explainer-drawer-with-adjacent-fullscreen)). The drawer
overlays the full mobile canvas without reserving space or shifting the working product when collapsed
([QUNO-039](../shared/decisions.md#quno-039--overlay-the-full-mobile-canvas-with-the-explainer-drawer)).
Mobile chevron disclosure and header swipes preserve the current playback state
([QUNO-040](../shared/decisions.md#quno-040---keep-mobile-drawer-disclosure-independent-of-playback)).

The top tab is **Parser** and its introduction is **Date parser**. The explanation introduces text tokenization
followed by interpretation as meaningful dates, describing this responsibility within the library.
Its live workbench demonstrates relative phrases, date-order ambiguity and overnight clock ranges. The fixed
reference date, semantic tokens and readable endpoint results remain inspectable. Only the presentation
and playback repetition change; the parser remains headless. See [concept notes](../../demo/concept/README.md).

The concept workbench shows raw tokens and their public types beneath the phrase, followed immediately by the
resolved endpoints. There are no extra preferences or structured-result controls. Scene JSON configures the
preferred date order and clock recognition; Cross midnight enables clocks. Tokenization uses
the same clock-recognition option as parsing; whitespace-only token chips are omitted. See QDPR-008.

Parser token chips show known English vocabulary in green, with month-name, weekday, relative and duration-unit
labels. Unknown words remain neutral. The same consumer-owned lexicon supplies the parser and chip meanings; raw
lexical types remain inspectable. A recognized word does not guarantee that the complete phrase is valid.

Concept semantic labels distinguish a colon as a time separator and numeric 61–9999 values as years, unless they
belong to a duration count or clock parts. Smaller/out-of-range values retain their neutral number label (QDPR-010).

Resolve ambiguity cycles `10-11-12`, `01/02` and `feb 11 80`, then restores the first phrase. With the fixed
day-first configuration and reference date, these resolve to `2012-11-10`, `2027-02-01` and `1980-02-11`. Each complete
example holds for 1700 ms, exposing numeric order, missing-year inference and abbreviated-year interpretation. See QDPR-014.

The concept introduction opens with `12/01 10:00` already recognized, with clock support enabled, and remains idle
until a chapter is chosen. Resolve a phrase cycles six examples: next Friday, tomorrow 10:30, past 3 days,
22 July 1980, an explicit October range and next month. Each completed phrase holds for 1700 ms (QDPR-012).

The concept canvas follows the computer's light/dark setting while this product and the explainer retain their
existing light presentation on bright panels; see [QUNO-037](../shared/decisions.md#quno-037---follow-system-appearance-around-light-demo-panels).

The main concept homepage uses shareable product/demo links. The current field guide connects those chapters to
its integration examples and recipes; the previous guide is preserved under `/docs/archive/date-parser`.
See [QUNO-041](../shared/decisions.md#quno-041---promote-the-concept-homepage-and-preserve-field-guides).
