# Quno/Date Parser decisions

This ledger owns headless parsing, tokenization, vocabulary, ranking, relative-date arithmetic, and SSR-safe execution.
Date Input presentation and editing behavior belongs in [its own ledger](../date-input/decisions.md).

## QDPR-001 - Publish parsing as an independent headless primitive

- Date: 2026-08-25
- Status: Accepted
- Context: Parsing originated inside the natural date input, but consumers also need recognition and tokens without a
  rendered component or framework runtime.
- Decision: Publish `parseDateInput`, `tokenizeDateInput`, and parser-specific contracts only from
  `@quno/calendar/date-parser`. Keep the implementation timezone-free, dependency-free, ESM/CommonJS compatible, and
  safe to import without `document`.
- Consequences: Date Input may consume the implementation internally but does not re-export it. Future grammar,
  vocabulary, tokenization, and ranking decisions use `QDPR-*` and live in this file.

## Historical accepted decisions

The canonical text of the following pre-consolidation decisions remains in the
[QDP historical ledger](../datepicker/decisions.md): `QDP-086`–`QDP-089`, `QDP-099`, `QDP-105`, `QDP-109`,
`QDP-112`, `QDP-114`, `QDP-117`, `QDP-118`, and `QDP-120`. They remain accepted where their parser behavior still
applies; new refinements belong here rather than in the Datepicker ledger.

## QDPR-002 - Extend locale syntax with explicit date-part markers

- Date: 2026-08-25
- Status: Accepted
- Context: Built-in English and German vocabularies do not describe every locale’s written date structure. Japanese
  dates commonly attach `年`, `月`, and `日` to numeric year, month, and day parts, while application-side string
  rewriting would hide the accepted syntax from parser configuration and diagnostics.
- Decision: Add `datePartMarkers` to the public parser lexicon. Ignore configured marker words while resolving an
  absolute date, leaving the surrounding numeric parts to the existing timezone-free validation and ranking model. Do
  not claim a built-in Japanese parser language; consumers opt into the exact markers their product accepts.
- Consequences: `2026年8月25日` resolves after the small explicit setup
  `lexicon: { datePartMarkers: ["年", "月", "日"] }` and remains invalid without it. Other locale-specific numeric
  markers can use the same mechanism without adding a general preprocessing callback or changing relative grammar.

## QDPR-003 - Do not present isolated syntax markers as locale support

- Date: 2026-08-25
- Status: Accepted; supersedes QDPR-002 before release
- Context: Date-part markers can make one Japanese absolute-date form resolve, but the parser's fixed token order does
  not recognize common relative forms such as `5日前` or `来週`. A Japanese marker exhibit would therefore imply a level of
  locale support that its relative-date and range examples could not sustain.
- Decision: Remove the unshipped `datePartMarkers` lexicon property and the Date Parser internationalization chapter.
  Keep built-in English and German recognition explicit, and describe consumer lexicon extensions as aliases within
  the bounded grammar rather than as general locale translation.
- Consequences: The public surface and guide no longer promise partial Japanese parsing. Supporting Japanese or
  another grammar with different word boundaries and order requires a coherent parser-language design rather than
  isolated ignored markers.

## QDPR-004 - Keep parser implementation and private resolution state in the parser domain

- Date: 2026-09-05
- Status: Accepted; refines QDPR-001 and applies QUNO-012
- Decision: Own tokenization, recognition, vocabulary, ranking, and relative arithmetic under Date Parser. Export
  only parsing/tokenization and their consumer configuration and result contracts; keep resolved options, candidates,
  and constructed vocabulary private. Date Input imports this headless implementation internally.
- Consequences: The public parser declarations have no React dependency. Relative-date arithmetic is maintained
  separately from phrase recognition, and grammar, ranking, and locale inference retain their accepted behavior.

## QDPR-005 - Opt into timezone-free clock recognition

- Date: 2026-10-05
- Status: Accepted; extends QDPR-001 and QDPR-004
- Context: Headless consumers need familiar clock syntax alongside dates while existing date-input consumers retain
  their accepted date-only contract.
- Decision: Add `recognizeTime: true` to parsing and tokenization, defaulting to false. Keep `value: DateRange` and add
  optional `times: DateInputTimeRange` with normalized `HH:mm` boundaries and `null` for missing clocks. Accept bare
  24-hour hours, colon minutes, and case-insensitive AM/PM; preserve valid unmarked date readings and require `at`/`um`
  to disambiguate a bare hour. Time-only input uses the live reference date. Inherit omitted endpoint dates, never
  times or meridiem, and advance an undated end by one calendar day when its clock precedes the start. Normalize
  explicitly dated endpoints with their times attached; retain partial-range and single-calendar-day semantics.
  Exclude clocks on multi-day relative periods, seconds, zones, offsets, dotted meridiem, and natural clock phrases.
  Opt-in tokenization emits explicit clocks as time tokens with original raw spans; bare hours remain numeric tokens.
- Consequences: Parser guide and demo expose the opt-in through public imports. Date Input consumes the date-only
  analyzer without clock recognition code; Datepicker and the shared day model retain their contracts. The parser stays
  dependency-free and SSR-safe. Existing feature size ceilings remain unchanged.

## QDPR-006 - Leave headroom in the parser bundle budget

- Date: 2026-10-06
- Status: Accepted; supersedes QDPR-005's unchanged parser size ceiling
- Context: The parser artifact is approximately 6 KiB gzip, and Node 26's compression output exceeds the former
  6 KiB ceiling by a few bytes. A ceiling at the artifact's current size leaves no useful room for future changes.
- Decision: Raise the Date Parser JavaScript gzip ceiling to 7 KiB and align the bundle guard, field-guide budget,
  and verification documentation. Retain independent budgets for the other products.
- Consequences: The size check passes across the verified Node versions while retaining a bounded parser budget.

## UI integration update — 2026-10-06

[QUNO-015](../shared/decisions.md#quno-015---compose-a-single-day-and-a-separate-clock-across-picker-and-input)
extends the UI integration limitation in QDPR-005: Date Input now consumes the existing clock-capable facade in
single-day time mode, while Datepicker selects a separate clock without importing parser code. The headless parser's
accepted grammar, distinct intraday/overnight clocks, result shape, dependency direction, and 6 KiB ceiling are unchanged.

## QDPR-006 - Rank single timed dates without a year once

- Date: 2026-10-06
- Status: Accepted; corrects endpoint ranking under QDPR-005
- Context: Applying range ranking to the duplicated endpoint of `6 oct 2pm` could select two different years in a
  multi-year expected window, making a valid date-time invalid in single selection.
- Decision: Rank a single timed endpoint with the same single-date ranking as date-only input, then duplicate that
  resolved date. A trailing delimiter likewise duplicates the resolved start date and leaves the end clock null.
  Rank genuinely separate range endpoints together as before.
- Consequences: Abbreviated months and AM/PM clocks retain their grammar; omitted years respect expected-range,
  locale, and reference-date ranking. Single selection accepts the resulting date and clock without public API changes.

## Concurrent decision records reconciled — 2026-10-06

The merged branches independently assigned QDPR-006 to [parser budget headroom](#qdpr-006---leave-headroom-in-the-parser-bundle-budget)
and [single timed-date ranking](#qdpr-006---rank-single-timed-dates-without-a-year-once).
Preserve both accepted identifiers and texts, and distinguish references by full title/anchor. The current parser
ceiling is 7 KiB; the earlier UI integration note's unchanged 6 KiB refers to its branch baseline.

## QDPR-007 - Return paired date and clock endpoints

- Date: 2026-10-07
- Status: Accepted; supersedes only the result shape in QDPR-005
- Context: Parallel `value: DateRange` and optional `times` force consumers to assemble a date and clock from two
  separate objects, even though each clock belongs to a specific endpoint.
- Decision: Return top-level `start` and `end` objects from successful and partial-range results. Export
  `DateInputParseEndpoint = { date: IsoDate; time: string | null }` only from the parser subpath. Always include both
  endpoint fields, including `time: null` for date-only or missing clocks. Remove `value`, `times`, and
  `DateInputTimeRange` immediately without compatibility aliases. Empty/invalid results remain status-only. Single
  inputs duplicate their date and clock; partial ranges duplicate the start date and leave the end clock null.
  Preserve grammar, ranking, date/time normalization, overnight inference, tokenization, and opt-in clock recognition.
- Consequences: All parser consumers and packed fixtures use the paired endpoints. Date Input projects endpoint dates
  into its existing `DateRange` and reads the start clock without changing its public callbacks or keyboard behavior.
  UI date/clock models, shared contracts, dependency direction, and the 7 KiB parser ceiling remain unchanged.
  The [migration guide](../shared/migration.md#unreleased-paired-parser-endpoints) documents the public break.

## Separate demo configuration — 2026-10-18

[QUNO-026](../shared/decisions.md#quno-026---give-each-product-demo-its-own-json-file) moves this product’s concept
scenarios into its own JSON file. Component contracts and scenario behavior remain unchanged.

[QUNO-027](../shared/decisions.md#quno-027---store-every-scenario-in-its-own-json-file) further separates every scenario
into its own file; the product JSON retains only metadata and ordered references.

[QUNO-028](../shared/decisions.md#quno-028---navigate-demo-screens-with-a-bottom-title-rail) records viewport-sized
scenario sections, JSON explanations, explicit fullscreen, and inert mobile previews shared by the concept demos.

[QUNO-029](../shared/decisions.md#quno-029---preserve-scenario-text-layout-during-scrolling) keeps complete concept explanation layouts mounted and reserves playback/status space, preventing text jumps during scrolling and activation.

## Shared floating presentation — 2026-10-19

[QUNO-032](../shared/decisions.md#quno-032---share-the-floating-guide-across-all-concept-products) replaces the concept's
section rail and fullscreen launch with the shared floating guide and looping live workbench. Keep the fixed reference
date, readable endpoints and optional structured result; no headless parser contract changes.

## QDPR-008 - Expose Tokens Beside Resolved Concept Dates

- Date: 2026-10-19
- Status: Accepted; extends the shared floating presentation
- Decision: Show live token chips with their raw text and public token type immediately below the phrase/reference,
  followed by resolved start/end dates and clocks. Keep preferences and the optional structured result afterward so
  resolution is visible before configuration. Omit whitespace-only tokens from the visual list without altering data.
- Consequences: Consume public tokenizeDateInput with the same clock option as parseDateInput. Verify phrase changes,
  token types, overnight clocks, output ordering and visibility on desktop/phone. Parser grammar and public APIs remain
  unchanged.

## QDPR-009 - Distinguish Known Vocabulary And Semantic Roles In Token Chips

- Date: 2026-10-19
- Status: Accepted; supersedes QDPR-008's visible generic word label
- Decision: Color known token vocabulary green and label month names, weekdays, relative words/days and day/week/
  month/year units by meaning. Keep unknown words neutral and explicitly labeled. Preserve the public lexical type
  in the token's data attribute and tooltip. Time connectors are known only when clock recognition is enabled.
- Consequences: Supply the demo's explicit English aliases to the public parser through its existing lexicon setting,
  and derive chip meanings from that same consumer configuration. A known word does not imply the whole phrase is
  valid; the resolved output remains authoritative. No public token shape or grammar changes. Browser checks cover
  role labels, green styling, unknown vocabulary, dates and clocks.

## QDPR-010 - Label Time Separators And Unambiguous Numeric Years

- Date: 2026-10-19
- Status: Accepted; extends QDPR-009's demo semantic labels
- Decision: Label a colon as a time separator even when clock recognition is disabled. Label numeric values from
  61 through 9999 as years when they are not a duration count or adjacent to a clock separator. Leave smaller or
  out-of-range numbers neutral because their date role may be ambiguous. Keep the raw public token type intact.
- Consequences: Verify 60/61 and 9999/10000 boundaries, 1980, colon-separated time parts and a 61-day duration.
  These labels explain the demo input; parser recognition, ranking and tokenization APIs retain their contracts.

## QDPR-011 - Keep Concept Resolution Free Of Extra Controls

- Date: 2026-10-19
- Status: Accepted; supersedes QDPR-008's preferences and structured-result presentation
- Decision: Remove Structured result, its copy action, the clock-recognition checkbox and date-order controls from
  the concept workbench. Keep the phrase, reference date, semantic tokens and resolved endpoints. Scene JSON owns
  preferred order and clock recognition; Cross midnight retains clock support. Resolve ambiguity now types a date
  whose month/day reading is forced by 13, then returns to the ambiguous date under the authored preferred order.
- Consequences: Playback never targets removed controls. Verify both ambiguity results, absent controls, visible
  tokens/endpoints and overnight resolution on desktop/phone. Public APIs and full field-guide configuration stay
  unchanged.

## QDPR-012 - Open With A Ready Date And Time And Expand Phrase Examples

- Date: 2026-10-19
- Status: Accepted; extends QDPR-011 and adopts shared QUNO-034
- Decision: Initialize the first concept scene with 12/01 10:00, DMY order and clock recognition enabled. Its product
  introduction stays on that already-resolved input through chapterOnly; choosing Resolve a phrase starts playback.
  Cycle next Friday, tomorrow 10:30, past 3 days, 22 July 1980, 12 Oct 2026 - 16 Oct 2026 and next month, holding each
  completed example for 1700 ms. Repeat the same chapter and restore the ready initial value between passes.
- Consequences: Show tokens and paired date/clock results immediately, with the existing fixed reference and expected
  range. Verify idle introduction/restoration, editable ready value, six actual results, repeated playback, manual
  takeover and desktop/phone visibility. Keep public parser contracts and other product introductions unchanged.

## Shared mobile explainer drawer — 2026-10-20

[QUNO-038](../shared/decisions.md#quno-038--use-a-mobile-explainer-drawer-with-adjacent-fullscreen) supersedes the shared
concept's mobile floating positioning and corner fullscreen placement. The drawer, chevron/fullscreen group and
responsive dock clearance belong to the demo; this product's public behavior and styles retain their contracts.

## Shared mobile drawer overlay — 2026-10-20

[QUNO-039](../shared/decisions.md#quno-039--overlay-the-full-mobile-canvas-with-the-explainer-drawer) removes reserved
mobile stage space: the shared explainer overlays the full canvas without disclosure-driven product movement.
This updates demo presentation only; public component contracts and desktop layout remain unchanged.

## QDPR-013 - Introduce The Parser With Tokenization And Date Interpretation

- Date: 2026-10-20
- Status: Accepted; refines QDPR-012's concept introduction copy and menu label
- Decision: Use Parser for the top product tab and Date parser for its introduction heading. Explain that natural
  language processing first tokenizes text and then connects it into meaningful dates, identifying this as the
  library domain's responsibility. Keep that copy and the optional short tabLabel in the product manifest; other
  products fall back to their existing label.
- Consequences: Preserve the ready date/time example, chapters, contextual contents, fullscreen naming and parsing
  behavior. Product IDs, public names/imports and routes retain date-parser. Browser checks verify the short tab,
  introduction copy and responsive navigation on desktop/phone; no public API migration is needed.

## QDPR-014 - Demonstrate Ambiguous Short Dates And Year Inference

- Date: 2026-10-20
- Status: Accepted; supersedes QDPR-011's ambiguity examples
- Decision: Cycle 10-11-12, 01/02 and feb 11 80 in Resolve ambiguity, then restore the first phrase. Keep the
  fixed reference date, expected period and day-first order, with a 1700 ms pause on each complete example. Explain
  numeric ordering, omitted-year inference and abbreviated-year interpretation through their written results.
- Consequences: The public parser resolves 2012-11-10, 2027-02-01 and 1980-02-11 respectively. Verify both endpoints,
  repeated playback, visible tokens/results and manual takeover on desktop/phone. Keep this change in authored scene
  JSON and documentation; parser grammar, ranking, configuration and public contracts remain unchanged.
