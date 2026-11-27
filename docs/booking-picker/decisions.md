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

## BPK-006 — Keep current primitives and share complete month pagination

- Date: 2026-11-04
- Decision: Adapt Booking Picker to the current Datepicker. Preserve the five standalone products. Share provider-neutral cursor pagination between Funnel and Patient Journey. Keep grants, requests, and booking authority in applications.
- Date-only selection requires an explicit pointer day action. Diagnostic-only intervals remain read-only. The independent QU-4049 keyboard activation fix is excluded from this branch.
- Resolve the initial month and exclusive query bounds in the supplied booking timezone. Keep full-date accessible labels.
- Why: restore the existing picker work without reverting newer primitives or truncating dense booking months.

## BPK-007 — Share source orchestration through injected adapters

- Date: 2026-11-05
- Status: Accepted; supersedes the orchestration ownership portion of BPK-001 and BPK-006
- Context: Patient Journey and Funnel repeated source selection, comparison loading, token refresh, month caches,
  and adjacent-month prefetch. Their transport and doctor-mapping rules differ.
- Decision: Export `createBookingAvailabilityLoader` and `bookingAvailabilityMonthPeriod` from Booking Picker.
  Inject source adapters and keep each cache in its mounted consumer. Share one-refresh behavior, concurrent reads,
  error eviction, refreshed-token cache aliases, full-context cache identity, and timezone-aware adjacent-month reads.
  Applications retain network requests, credentials, eligibility context, provider error classification and payloads,
  doctor/resource mapping, styling, and submission. Keep Datepicker and the headless root unchanged.
- Consequences: Both consumers use one orchestration implementation. The shared package performs no HTTP requests,
  keeps no global capability cache, and adds no server logging or transport instrumentation.

## BPK-008 — Share booking-authority payload selection

- Date: 2026-11-06
- Status: Accepted; supersedes the matching-payload portion of BPK-001
- Context: Patient Journey and Funnel repeated the same authority merge around shared interval comparison.
- Decision: `compareBookingAvailabilityEnvelopes` reads consumer-supplied `bookingAuthority`. API authority retains API payloads for matches and disables Cronofy-only intervals. Cronofy or missing authority retains Cronofy matches and disables API-only intervals. Keep existing read-only state. The diagnostic source mode never selects the writer.
- Consequences: Consumers keep server validation, network calls, grants, doctor mapping and submission. The shared helper only applies presentation metadata; it does not authorize a booking mutation.

## BPK-009 — Share interval policy filtering

- Date: 2026-11-10
- Status: Accepted
- Context: Patient Journey filtered provider starts for unsupported cadence. Embedded Funnel omitted that filter and offered different starts.
- Decision: Export the pure named helper `filterBookingSlots`. Apply it after complete pagination in both consumers. Keep Product policy resolution, provider protocol adaptation, HTTP and booking authorization in applications.
- Consequences: Both consumers use one cadence algorithm. The helper retains original slot payloads and read-only selection metadata. The package performs no provider request.

## BPK-010 — Allow single-source consumers

- Date: 2026-11-10
- Status: Accepted; refines BPK-007
- Decision: Accept a partial adapter map and an optional comparison callback. Reject unavailable modes explicitly. Keep source transport, authority and rollout flags in applications.
- Why: Product scheduling policy and provider replacement can be released and tested separately without constructing unused adapters.

## BPK-011 — Separate browsing from committed controlled selections

- Date: 2026-11-11
- Status: Accepted; supersedes the loading behavior in BPK-006
- Decision: Only a changed external slot value or timezone synchronizes the browsing date. Month changes immediately select the first date in that month, or clear the browsing date when none exists. Render and submit times only from the visible month in the booking timezone.
- Why: unchanged controlled values and complete slot arrays must not restore a previous day or expose a previous month's times.

## BPK-012 — Serve the example through the existing guide

- Date: 2026-11-11
- Status: Accepted
- Decision: Mount the public Booking Picker example in the Datepicker guide at `/guide/datepicker#booking-picker`. Reuse guide contents navigation and scope example CSS. Remove the separate HTML entry.
- Why: the documented example must be reachable through the production `index.html` application.

## BPK-013 — Share doctor choices without owning application behavior

- Date: 2026-11-17
- Status: Accepted
- Decision: Export `QunoBookingDoctorOptions` for use inside `QunoBookingChoiceGroup`. Share card markup, title
  formatting, single-doctor selection and named selection callbacks. Consumers retain selection state, image
  rendering, skeletons, visibility, CSS and mobile collapse/scroll behavior.
- Why: Patient Journey, its onboarding preview and Funnel V13 can reuse doctor rendering without changing app behavior.

## BPK-014 — Expire cached booking month results

- Date: 2026-11-19
- Status: Accepted
- Decision: Accept an optional result expiry in Unix milliseconds. At that time, readiness and reuse treat the
  month as stale. Concurrent readers share a refresh across the stale entry's aliases.
- Consequences: Consumers can bypass the month cache for a fresh read and match the complete selected slot
  before submitting. The consuming app owns its recovery dialog and authorization requests.

## BPK-015 — Confirm date-only choices

- Date: 2026-11-19
- Status: Accepted. Refines date-only selection in BPK-006 and the date-only month reset in BPK-011.
- Decision: A deliberate day selection reveals one localized button for the first bookable slot.
  The button dispatches slot selection. A consumer with its own confirmation control can receive a draft on the day click.
- Why: Preserve the two actions patients used in the Cronofy picker.

## BPK-016 — Keep doctor choices in applications

- Date: 2026-11-19
- Status: Accepted. Supersedes [BPK-013](#bpk-013--share-doctor-choices-without-owning-application-behavior).
- Decision: Keep doctor-card markup, title formatting and list layout in the consuming apps. Remove the doctor options
  and choice-group exports. Render the time-slot layout inside Booking Picker.
- Why: Let each application use its own doctor data and keep the Calendar API focused on dates and times.

## BPK-017 — Apply controlled selections when availability arrives

- Date: 2026-11-19
- Status: Accepted. Refines BPK-011 and retains BPK-015.
- Decision: Keep a changed external slot pending until its local day is available. Move to its month within the
  query bounds and identify the value-driven month event so consumers can fetch that month. Clear the intent
  when the app replaces or clears its value or when the user chooses another day, month, or time.
- Consequences: One month drives the day grid and visible times. Equivalent values preserve browsing, and a
  synchronized value never emits a slot selection. Timezone and precision changes reevaluate the current value.

## BPK-018 — Restore public booking date and clock labels

- Date: 2026-11-20
- Status: Accepted. Supplements BPK-015 for public booking consumers.
- Decision: Allow date-only consumers to preselect the first bookable day. Show a slot action without dispatching it.
  Continue through empty opening months within the booking window. Leave the date grid in place until a slot arrives.
  Show the timezone abbreviation with each time. Allow consumers to hide the summary while keeping per-slot labels.
- Why: Match the deployed picker on invitations and funnels. Recovery retains a separate draft and confirmation.

## BPK-019 — Show timezone labels only on time options

- Date: 2026-11-20
- Status: Accepted. Supersedes the timezone summary in BPK-018.
- Decision: Keep `showTimeZone` for per-slot timezone labels. Remove the separate summary and its customization fields.
- Why: Booking surfaces display timezone information on individual times.

## BPK-020 — Focus the first enabled time after explicit date selection

- Date: 2026-11-20
- Status: Accepted.
- Decision: Let consumers opt in to focusing the first enabled time after the patient chooses a date.
  Preserve the date-only confirmation and leave focus in place during initial preselection.
- Why: Make the available times immediately reachable after a deliberate date choice.

## BPK-021 — Find the first available month for timed bookings

- Date: 2026-11-26
- Status: Accepted. Extends BPK-018 to timed bookings.
- Decision: Search forward within the authorized window when the opening month has no bookable day. Select
  the first available day and keep time selection explicit. The consumer can end the search when the
  specialist or source changes. Warm the next month after automatic or manual navigation while it remains
  in the authorized window.
- Why: Patients can see the first available day without paging through empty months.

## BPK-022 — Represent booking months as year and month

- Date: 2026-11-26
- Status: Accepted.
- Decision: Use `YYYY-MM` in the Booking Picker API and availability loader. Convert to a full date at the
  Datepicker boundary and when calculating local midnight.
- Why: Initial positioning, navigation and prefetch use one month value.
