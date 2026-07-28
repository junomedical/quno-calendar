# Inside An Infinite Calendar

This route is the single example surface for React integrators and product designers. It replaces the former
step walkthrough and standalone recipe routes while preserving `/examples/integration-walkthrough`. A table of
contents links directly to every chapter from the article’s internal scroll container.

The article teaches the calendar through focused live exhibits:

0. Why the primary view shows time of day horizontally for denser people/resource/room rows and fast vertical-wheel
   navigation.
1. Bounded date virtualization, the scrolled/repositioned settlement chip, and preserved full-screen state.
2. A performance design envelope from four to hundreds of daily events, targeting smooth 60–120fps scrolling.
3. CSS-native sticky dates and resource names that separate stable chrome from dynamic calendar state.
4. The smallest useful read-only integration.
5. Product-owned event cards, including replayable added-event and cancelled-draft motion.
6. A switchable custom card hierarchy led by product group, patient name, or room number.
7. Availability as a separate interaction layer with mode-specific drawing, movable availability, and appointment
   cards that remain visible but inert while editing.
8. Parent-owned drag and creation proposals with an explicit accept/cancel review step before committed data changes.
9. A current-time marker that remains visible through product navigation and cursor-free zoom.
10. Immediate date/time navigation plus previous, next, and Today controls through the imperative handle.
11. Smooth zoom out for daily context and zoom in for precision, anchored to the visible time being examined.
12. Progressive time-label precision from overview landmarks to five-minute placement.
13. Clinical, compact, and night styling presets composed from settings and scoped CSS.
14. English and Japanese localization plus human-relative and binary robot day names.
15. Horizontal overlap lanes and vertical overlap columns.
16. Horizontal-row hover handoff to events underneath an expanded overlap card.
17. Delayed loading plus policy-controlled warm-window preloading with the returned events visible before navigation.
18. Late-data stability, multi-calendar event projection, and viewport-focus preservation.
19. Parent-controlled creation focused to one selected doctor lane while adjacent-day appointments remain visible.
20. Event focus that leaves fully visible cards in place and reveals only clipped or offscreen targets.
21. A complete public-package React integration.
22. Renderer-owned add and cancel transitions that navigate newly committed events into view.
23. A final composed calendar combining navigation, zoom, styling, overlap, mutation, motion, and full-screen use.
24. The verified production ESM/CSS footprint and direct, peer, and bundled dependency counts.

[`IntegrationWalkthrough.tsx`](./IntegrationWalkthrough.tsx) owns the narrative and progressive code examples.
[`ArticleDemos.tsx`](./ArticleDemos.tsx) owns the foundational interactive exhibits,
[`ArticleSystemDemos.tsx`](./ArticleSystemDemos.tsx) owns the layer and visual-focus labs, and
[`ArticleRecipeDemos.tsx`](./ArticleRecipeDemos.tsx) owns the read-only, drag/create, and preloading exhibits.
[`ArticleProductDemos.tsx`](./ArticleProductDemos.tsx) owns CSS-native chrome, current-time, navigation, progressive
precision, styling, custom card structure, date localization, and final-composition exhibits.
[`articleSupport.tsx`](./articleSupport.tsx) contains deterministic fixtures and the external event renderer. Every live
calendar imports the public `quno-calendar` entrypoint.

The narrative leads with the product reason for each system boundary: stable browser cost, trustworthy data ownership,
domain-specific card design, unambiguous editing, uninterrupted visual focus, and feedback that does not change calendar
geometry. Control instructions remain in callouts after the value is established.

Every live calendar expands through a shared viewport overlay rather than the browser Fullscreen API. Expansion keeps
the same React calendar instance mounted, so its visible date, intra-date offset, and loaded event cache survive the
transition.
