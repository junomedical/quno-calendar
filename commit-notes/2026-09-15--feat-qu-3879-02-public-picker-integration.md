# Branch: `feat/qu-3879-02-public-picker-integration`

## Shared picker and comparison restoration

1. Restore the shared booking picker and source diagnostics.
   1. Keep date/time selection, interval comparison, and bootstrap/call timings in the calendar `booking-picker` export.
   2. Restore the existing theme adapters for Funnel and landing pages.
      Why: Both consumers must retain the same picker behavior and established styling.

### Validation of shared picker restoration

- Live port 3031: landing and PRP Funnel display the shared bar, differences and independent bootstrap/availability timings. PRP: 66 matching, 0 API-only, 0 Cronofy-only. Landing: 40 API-only.
- Preserved consumer theme variables. Corrected Funnel fieldset clipping; measured fieldset scroll width equals client width.
- Scoped tests: 101 calendar, 43 Funnel and 8 landing tests pass. Calendar/Funnel/Automations typechecks and calendar lint pass.
- Remaining checks: calendar named-object architecture guard rejects restored legacy callback signatures; formatting reports five files. Next full typecheck reports three unchanged JSON fixture errors. Standalone Chromium suite could not bind its sandbox port; separate fixture/package installation checks did not complete.

## Public booking appearance theme

1. Share opt-in public-booking date and time appearance across Funnel and landing pages.
   1. Why: the replacement picker diverged from deployed Cronofy weekday casing, available-date fill/weight, corners and zero-border hover outlines.
   2. Keep inherited brand/page variables, consumer class hooks, fonts, layout and visibility overrides authoritative.
   3. Files: shared booking theme CSS/types/component/tests/docs in Calendar; booking picker adapters/styles and docs in Funnel and Patient Journey.
   4. Validation: 25 focused tests across Calendar/Funnel/Patient Journey pass, plus two Chromium computed-style tests for defaults and inherited overrides. Calendar/Funnel typechecks and scoped consumer lint pass. Shared library/demo builds, packed React/SSR/type/CSS verification, Preact compatibility and dry-run packaging pass. Full Calendar tests: 357/360 initially passed; all three timing failures passed on isolated rerun. Chromium: 119/120 initially passed; the failed unrelated drawing test passed on isolated rerun. Live Funnel computed styles confirm #eef2f6 available dates, weight 400, title-case weekdays, 6.4px corners, and 1.6px inset hover shadow; conditional landing retains Caveat Brush and #00bcb3/white buttons.
   5. Existing verification limits: Calendar named-object contract guard rejects pre-existing booking signatures, Datepicker gzip exceeds its ceiling by 142 bytes, repository-wide formatting has pre-existing files, and Patient Journey typecheck has four unrelated fixture errors. Theme files pass scoped formatting.

## Muted unavailable spillover dates

1. Default unavailable dates outside the current month to muted text in the shared booking picker, independently of theme.
   1. Why: host button resets made these dates look like current-month days, unlike Cronofy. Available spillover dates remain unchanged.
   2. Expose `--quno-booking-picker-unavailable-outside-text` for consumer overrides.
   3. Files: Calendar `styles/booking-days.css`, booking stylesheet import, browser style tests and docs; refreshed vendored packages and funnel runtime in consumers.
   4. Validation: three browser styling tests pass, including unavailable/available/current-month distinction and color override.

## Compact, visibly disabled month arrows

1. Add configurable navigation button sizing and dimmed, pointer-inert native disabled arrows to core Datepicker CSS.
   1. Why: unavailable previous/next actions looked active; booking consumers need the deployed 32px visual size.
   2. Files: Calendar `styles/calendar.css`, booking navigation and browser style tests, Datepicker docs and changelog.
2. Set both public booking adapters to 32px month arrows while retaining consumer size/opacity overrides.
   1. Files: Funnel `CalendarBooking.module.scss`, Patient Journey `FunnelCalendarBooking.module.scss`, docs, refreshed vendor packages and runtime.
3. Validation: 13 shared booking tests and four browser style tests pass, including disabled actions at both bounds, 32px geometry, opacity and pointer-events checks. Library and funnel builds pass.

### Available spillover color correction

1. Explicitly inherit normal calendar text for available outside-month days, overriding core Datepicker gray.
   1. Why: the landing page still grayed available October 29/December 3 in November despite the prior unavailable-day fix.
   2. Files: shared `booking-days.css`, browser fixture (now includes the core outside color), booking docs and refreshed consumer packages/runtime.
   3. Validation: four browser style tests pass, including available outside-day color under inherited core styling.

## Consumer-owned picker appearance (supersedes appearance theme above)

1. Remove the unreleased shared `public-booking` theme API and move its date/time rules into the two consuming adapters.
   1. Why: each page's existing theme owns appearance; selected text must follow its configured background/text pair.
   2. Files: Calendar booking types/component/CSS and hook tests; Funnel `BookingDatePicker` and CSS; Patient Journey
      picker CSS, `FunnelCalendarBooking` and `bookingThemeStyle` restore the existing landing theme prop mapping.
   3. Keep compact disabled navigation, gray unavailable spillover dates, comparison styling and visibility behavior.
   4. Update product usage/docs and append BPK-004 superseding the shared appearance decision.
   5. Validation: 28 scoped unit tests and two Chromium core-style tests pass. Live browser assertions confirm
      landing selected text is white on its configured dark background, Funnel selected text stays dark on yellow,
      date hover uses background only, time hover retains its inset outline, 32px disabled arrows are inert and
      only unavailable spillover dates are gray. Calendar/Funnel typechecks pass; Next retains four unrelated fixture
      type errors. Built/refreshed both local consumers. Evidence: consumer-owned-picker-styles.json and
      consumer-owned-picker-hover.json in the September 15 side-conversation visualization directory.

## Optional leading zeros and inherited date weight

1. Add `padDayNumbers` to core Datepicker, default false; scheduling composition explicitly enables it.
   1. Why: match two-digit booking numerals without changing ordinary datepickers or accessible labels.
   2. Files: Datepicker types/resolved config/grid/overflow, booking composition, scoped regression tests and single-day guide demo/docs.
2. Let landing date-number spans inherit the page button weight; preserve the normal-weight outside-month reset.
   1. Why: deployed bolding comes from Layout’s button rule, while the funnel inherits normal weight. It is not a shared calendar theme rule.
   2. Files: landing `QunoDateTimePicker.module.scss`, consumer docs and refreshed local packages/runtime.
3. Validation: 105 core/date/booking tests and 13 consumer adapter tests pass; core typecheck, scoped lint, library/demo and funnel builds pass. Live browser assertions confirm `01`/`09` in both scheduling pickers, unchanged accessible full-date labels, landing current-month weight 700 inherited from page buttons, outside-month weight 400, and funnel weight 400. Evidence: `leading-zero-page-weights.json` in the side-conversation visualization directory.

## Push preparation — 2026-09-15

1. Verify the integrated release checkout and preserve the existing feature changes.
   1. Why: provide a reproducible commit with explicit validation results before pushing.
   2. 363 unit tests and 120 Chromium browser tests pass. Typecheck, lint, demo/library builds, Preact and React 19 compatibility, packed React/SSR/types/CSS/ESM/CommonJS verification, and dry-run pack pass. Formatting corrected. Remaining release checks: restored booking functions/callbacks violate the named-object contract; Datepicker JavaScript is 10,919 B gzip versus its 10,752 B limit (167 B over). Firefox/WebKit could not launch because their browser executables are not installed. These are not waived by preparing the branch.
