# Quno/Booking Picker decisions

## BPK-001 — Isolate and share booking composition

- Date: 2026-09-10
- Status: Accepted; supersedes the package-placement portion of QDP-126, QDP-127, and QDP-128
- Context: Patient Journey and Funnel independently composed the same Datepicker, timezone grouping, selected-day
  lifecycle, time choices, source diagnostics, and Cronofy/API comparison. Exporting those booking concepts from the
  Datepicker entry point reduced application duplication but made a standalone date picker appear coupled to the full
  booking wrapper.
- Decision: Publish booking composition through `@quno/calendar/booking-picker` and its own optional stylesheet.
  Keep `@quno/calendar/datepicker` limited to timezone-free day and range interaction. Booking Picker may consume
  Datepicker internally and owns provider-neutral grouping, interval deduplication, query bounds, month/selection
  lifecycle, time rendering, source diagnostics, minute-normalized comparison, and merge helpers. Applications own
  fetching, provider credentials and capabilities, resource identity, translations, styling adapters, and submission.
- Consequences: Plain Datepicker consumers do not import booking code or styles. Funnel and Patient Journey use one
  behavioral implementation today, and Funnel's eventual move into Patient Journey can remove an adapter without
  changing the picker. The booking bundle is intentionally larger than Datepicker and is measured independently.

## BPK-002 — Share opt-in public booking appearance

- Date: 2026-09-15
- Status: Accepted
- Context: Funnel and landing adapters reproduced Cronofy widget styles differently.
- Decision: Offer `theme="public-booking"` with CSS-variable fallbacks in Booking Picker. Keep consumer brand mapping,
  layout, visibility and explicit overrides authoritative. Do not change standalone Datepicker or availability sources.
- Consequences: Both consumers share appearance defaults while branded conditional pages retain their customization.

## BPK-003 — Mute unavailable spillover dates

- Date: 2026-09-15
- Status: Accepted
- Decision: In booking pickers, unavailable dates outside the displayed month are muted independently of appearance theme. Keep available spillover dates and current-month dates unchanged, and expose an overridable text-color token.
- Why: host button resets previously hid the distinction that the Cronofy widget provides.

## BPK-004 — Keep appearance in consuming pages

- Date: 2026-09-15
- Status: Accepted; supersedes BPK-002
- Decision: Remove the `public-booking` theme prop, root attribute and appearance stylesheet. Funnel and landing
  adapters own their existing theme mappings, including paired selected background/text colors and page overrides.
  Keep generic unavailable spillover styling and disabled bounded navigation in the shared picker.
- Why: the consumer theme is the design authority; shared appearance was overriding selected text and duplicating
  ownership. This also restores the landing page's pre-existing FunnelTheme color contract.

## BPK-005 — Named booking arguments and callback payloads

- Date: 2026-09-15
- Decision: All booking helpers and callbacks accept one named object, superseding the positional-signature compatibility exception in QUNO-BOOKING-RESTORE. Examples: `bookingSlotDate({ timestamp, timeZone })`, `onSlotSelected({ slot })`, and `onSelect({ mode })`.
- Why: make the restored booking composition comply with the same checked contracts as the other library domains. Consumer adapters translate application callbacks at their boundary.
