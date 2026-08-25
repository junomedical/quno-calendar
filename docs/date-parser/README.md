# Quno/Date Parser

Quno/Date Parser owns dependency-free recognition and tokenization of timezone-free dates and inclusive ranges.

- Public entry point: `@quno/calendar/date-parser`
- Live field guide: `/guide/date-parser`
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
