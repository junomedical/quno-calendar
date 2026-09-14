# Branch: `feat/qu-3879-01-calendar-foundation`

1. Pin the existing package/runtime baseline for the QU-3879 calendar foundation release.
   1. Public booking-picker changes are introduced by release 2.
      Why: retain a coordinated, explicit cross-project milestone without enabling the public picker.
      Files: this release note only.

Validation: Package runtime remains the existing foundation baseline. This branch changes only its coordinated milestone note; public picker implementation remains deferred.

Release gate: pause for joint release 1 completeness testing before any further release 2 work.

2. Support an explicit display timezone for the staff calendar.
   1. Keep UTC event timestamps while using one IANA zone for bucketing, geometry, Today, focus, and drag/draw callbacks. Reject nonexistent wall-clock pointer times.
      Why: the brand calendar must display consistently across browser timezones.
      Files: timeline time conversion, event indexing/geometry, interactions, navigation, public settings, documentation, and timezone unit/browser examples.

3. Keep local dependencies outside release source.
   1. Files: .gitignore and the tracked node_modules symlink; retain the working symlink while removing it from Git.
      Why: keep the release limited to active calendar-foundation behavior and portable files.

4. Address review follow-up.
   1. Fix DST duration, reject ambiguous local pointer times, and cancel invalid draft ranges. Files: zonedTime.ts, timelineInteractionModel.ts, useTimelineDraftInteraction.ts, DST regression tests, timezone documentation and measured demo size assertions.
      Why: preserve explicit phase-1 boundaries and prevent incorrect scheduling timestamps.

   2. Validation: 328 tests pass with one worker, including 13 DST regression cases; four focused Chromium checks pass. Architecture, TypeScript, lint, library/demo build, size budgets, packed React/SSR and Preact fixtures, and pack dry-run pass. A parallel performance assertion was timing-sensitive and passed in the single-worker run. Full formatting still reports a pre-existing issue in src/lib/date-picker/OffscreenPills.tsx; changed DST files pass. The onboarding vendored archive was not replaced by this library-source cleanup.
