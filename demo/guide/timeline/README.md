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
15. Style rows and columns from data.
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
precision, theming, row/column styling, custom card structure, date localization, and final-composition exhibits.
[`ReactStateDemo.tsx`](./ReactStateDemo.tsx) owns the focused controlled-props and callback exhibit.
[`articleSupport.tsx`](./articleSupport.tsx) contains deterministic fixtures and the external event renderer. Every live
calendar imports the public `@quno/calendar/infinite-calendar` entrypoint.

Each chapter leads with a concrete outcome and the problem it solves. Behavior and implementation follow only after
that context, and control instructions remain in callouts beside the relevant live example.

Every live calendar expands through a shared viewport overlay rather than the browser Fullscreen API. Expansion keeps
the same React calendar instance mounted, so its visible date, intra-date offset, and loaded event cache survive the
transition.
