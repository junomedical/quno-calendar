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
