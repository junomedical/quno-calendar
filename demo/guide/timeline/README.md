# Quno/Infinite Calendar field guide

This article owns the dedicated `/guide/infinite-calendar` route. Every chapter uses a plain, benefit-led title,
explains the problem the feature solves, and demonstrates the behavior live. Its Demo button opens the unrestricted
calendar at `/demo/infinite-calendar`.

The article teaches the calendar through focused live exhibits:

1. Fit dense schedules into a clear view.
2. Move through dates without limits while immediately populating newly visible days.
3. Keep busy schedules fast.
4. Leverage the browser engine.
5. Render useful event cards, including one renderer adapting to fixed specimens and a CSS-only, user-resizable
   container with a browser-native draggable corner.
6. Shape card structure for the occasion.
7. Start with a read-only calendar.
8. Add availability and event layers.
9. Create, move, and edit content without snapping visible target rows, and restore the view on cancellation.
10. Mark and return to the current time.
11. Connect familiar date navigation with the shared Quno Date Input, including immediate Arrow Up/Down preview.
12. Zoom without losing precision.
13. Reveal time progressively.
14. Theme the calendar.
15. Style days, hours, rows, and columns from data.
16. Localize dates and product labels.
17. Resolve overlapping content.
18. Reveal events beneath a hover.
19. Preload events before they enter the view.
20. Keep a stable position during late loading.
21. Focus creation on one calendar.
22. Keep the committed event in view.
23. Keep React as the source of truth.
24. Support motion without losing state, beginning with an explicit New draft action.
25. Put everything together.
26. Ship the package.

[`IntegrationWalkthrough.tsx`](./IntegrationWalkthrough.tsx) owns the narrative and progressive code examples.
[`ArticleDemos.tsx`](./ArticleDemos.tsx) owns the foundational interactive exhibits,
[`ArticleSystemDemos.tsx`](./ArticleSystemDemos.tsx) owns the layer and visual-focus labs, and
[`ArticleRecipeDemos.tsx`](./ArticleRecipeDemos.tsx) owns the read-only, drag/create, and preloading exhibits.
[`ArticleProductDemos.tsx`](./ArticleProductDemos.tsx) owns CSS-native chrome, current-time, navigation, progressive
precision, theming, day/hour/row/column styling, custom card structure, date localization, and final-composition exhibits.
[`ReactStateDemo.tsx`](./ReactStateDemo.tsx) owns the focused controlled-props and callback exhibit.
[`EventProjectionDemo.tsx`](./EventProjectionDemo.tsx) demonstrates local previews without loader invalidation.
[`articleSupport.tsx`](./articleSupport.tsx) contains deterministic fixtures and the external event renderer. Every live
calendar imports the public `@quno/calendar/infinite-calendar` entrypoint.

The prefetch loading exhibit supplies its selected resource ID before calendar metadata arrives. The loading fallback
waits for a matching resource before the hidden timeline mounts and requests events.

The prefetch exhibit shares pending-request tracking with the showcase HTTP loader while retaining local fixtures.
Its loading message stays active until all reads settle. Jump to the prefetched date, then use Back to starting date
after loading finishes to verify reuse of the earlier cache. Tests assert immediate cached cards, no redundant
return reads, and contained control geometry.

Prefetch distance is consumer-owned state: choose 0, 0.5, 1, 2 or 3 usable viewport heights on each side. The policy
updates without clearing cached events. The fixture's July 9 consultation demonstrates immediate cached navigation.
Every positive distance also warms at least one adjacent included day per side, so very tall days still preload
their neighbors. Zero disables adjacent prefetch on that side.

Each chapter leads with a concrete outcome and the problem it solves. Behavior and implementation follow only after
that context, and control instructions remain in callouts beside the relevant live example.

Every live calendar expands through a shared viewport overlay rather than the browser Fullscreen API. Expansion keeps
the same React calendar instance mounted, so its visible date, intra-date offset, and loaded event cache survive the
transition.

The payload chapter reports the 0.6.3 Infinite Calendar artifacts: 33.07 KiB gzip JavaScript with a 50 KiB ceiling,
and 1.97 KiB gzip optional CSS with a 2 KiB ceiling. The shared production profile supplies the same facts.

The performance chapter includes a lazy Quiet/Busy/Packed playground with exact 4/20/60 events per day, view/theme controls, and a complete range-loader recipe.

The infinite-scroll exhibit opts into `dateWindowRadius: 7`, retaining 15 included dates instead of the default
month-based window. Its adjacent copyable recipe uses the public setting. The performance exhibit keeps a 560 px
block layout independent of the concept navigation grid, with density controls visible on mobile.

Current route: `/docs/infinite-calendar` (legacy `/guide/infinite-calendar` still works). The guide links chapters
to the matching homepage demos while preserving specialized exhibits. The pre-change guide source lives in
`demo/archive/guide/timeline` and is served at `/docs/archive/infinite-calendar`. Density starts light even when
the OS is dark. New availability uses the explicit availability render layer, just like the initial windows.

`MultiDayEventsDemo.tsx` adds the lazy `#multi-day-events` exhibit and copyable overlap-loading recipe.
Try beginning/middle/ending grabs, both orientations, working-hour clipping, rejected moves and the controlled draft.
Its small segment adapter reuses ArticleEventCard, including availability and interaction states, and supplies
clipped clocks and continuation arrows. Callbacks retain complete event timestamps.

The editing exhibit explains touch hold activation; the zoom exhibit describes current-clock slider focus and exact pointer-time reversal. Both continue to use the public calendar entry point and existing controls.
