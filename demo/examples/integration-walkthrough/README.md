# Inside An Infinite Calendar

This route is the single example surface for React integrators and product designers. It replaces the former
step walkthrough and standalone recipe routes while preserving `/examples/integration-walkthrough`. A table of
contents links directly to every chapter from the article’s internal scroll container.

The article teaches the calendar through focused live exhibits:

0. Why the primary view puts time left to right and days/resources top to bottom.
1. Bounded date virtualization, the scrolled/repositioned settlement chip, and preserved full-screen state.
2. A performance design envelope from four to hundreds of daily events, targeting smooth 60–120fps scrolling.
3. CSS-native sticky dates and resource names that separate stable chrome from dynamic calendar state.
4. The smallest useful read-only integration.
5. Product-owned event cards, including replayable added-event and cancelled-draft motion.
6. Availability as a separate interaction layer that makes appointment cards visible but inert while editing.
7. Parent-owned drag and creation proposals.
8. A current-time marker that remains visible through product navigation and cursor-free zoom.
9. Immediate date/time navigation plus previous, next, and Today controls through the imperative handle.
10. Parent-controlled zoom anchored to the visible current-time marker, with grid-center and pointer-specific fallbacks.
11. Progressive time-label precision from overview landmarks to five-minute placement.
12. Clinical, compact, and night styling presets composed from settings and scoped CSS.
13. Horizontal overlap lanes and vertical overlap columns.
14. Horizontal-row hover handoff to events underneath an expanded overlap card.
15. Delayed loading plus policy-controlled warm-window event preloading.
16. Late-data stability, multi-calendar event projection, and viewport-focus preservation.
17. Parent-controlled creation focused to one selected doctor lane while adjacent-day appointments remain visible.
18. Event focus that leaves fully visible cards in place and reveals only clipped or offscreen targets.
19. A complete public-package React integration.
20. Renderer-owned add and cancel transitions that navigate newly committed events into view.
21. A final composed calendar combining navigation, zoom, styling, overlap, mutation, motion, and full-screen use.
22. The verified production ESM/CSS footprint and direct, peer, and bundled dependency counts.

[`IntegrationWalkthrough.tsx`](./IntegrationWalkthrough.tsx) owns the narrative and progressive code examples.
[`ArticleDemos.tsx`](./ArticleDemos.tsx) owns the foundational interactive exhibits,
[`ArticleSystemDemos.tsx`](./ArticleSystemDemos.tsx) owns the layer and visual-focus labs, and
[`ArticleRecipeDemos.tsx`](./ArticleRecipeDemos.tsx) owns the read-only, drag/create, and preloading exhibits.
[`ArticleProductDemos.tsx`](./ArticleProductDemos.tsx) owns CSS-native chrome, current-time, navigation, progressive
precision, styling, and final-composition exhibits.
[`articleSupport.tsx`](./articleSupport.tsx) contains deterministic fixtures and the external event renderer. Every live
calendar imports the public `quno-calendar` entrypoint.

The narrative leads with the product reason for each system boundary: stable browser cost, trustworthy data ownership,
domain-specific card design, unambiguous editing, uninterrupted visual focus, and feedback that does not change calendar
geometry. Control instructions remain in callouts after the value is established.

Every live calendar expands through a shared viewport overlay rather than the browser Fullscreen API. Expansion keeps
the same React calendar instance mounted, so its visible date, intra-date offset, and loaded event cache survive the
transition.
