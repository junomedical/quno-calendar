# Quno/Infinite Calendar

Quno/Infinite Calendar owns virtualized horizontal and vertical schedules, timestamped events, async loading, event
rendering, creation and movement, navigation, zoom, and visual focus.

- Public entry point: `@quno/calendar/infinite-calendar`
- Live field guide: `/guide/infinite-calendar`
- Focused demo: `/demo/infinite-calendar`
- [Architecture](./architecture.md)
- [Responsibility domains](./domains/README.md)
- [Runtime flows](./flows/README.md)
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)

Day keys use shared timezone-free `IsoDate` values. Event `start` and `end` remain timestamp strings and retain their
local or offset semantics.
