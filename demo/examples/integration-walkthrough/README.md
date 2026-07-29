# Inside An Infinite Calendar

This route is the single example surface for React integrators and product designers. Every chapter uses a plain,
benefit-led title, explains the problem the feature solves, and demonstrates the behavior with a live example. It
preserves `/examples/integration-walkthrough` and replaces the former step walkthrough and standalone recipe routes.

The article teaches the calendar through focused live exhibits:

0. Why build another calendar.
1. Vertical and infinite.
2. Fast in the busiest times.
3. Leveraging browser engine.
4. Event cards on the grid, including one renderer adapting to roomy, narrow, and short event containers.
5. Card structure for the occasion.
6. Starting static example.
7. Availability and event layers.
8. Deferred and optimistic event changes.
9. Time of the day.
10. Traditional date navigation.
11. Zoom into the calendar.
12. Progressive time reveal.
13. Visual theming.
14. Localization.
15. Overlapping events.
16. See-through event hover.
17. Content preloading.
18. Stable view position.
19. Focus on the person.
20. Keep event in the view.
21. Plays nice with React.
22. Supporting animations.
23. Full demo.
24. Dependencies and size.

[`IntegrationWalkthrough.tsx`](./IntegrationWalkthrough.tsx) owns the narrative and progressive code examples.
[`ArticleDemos.tsx`](./ArticleDemos.tsx) owns the foundational interactive exhibits,
[`ArticleSystemDemos.tsx`](./ArticleSystemDemos.tsx) owns the layer and visual-focus labs, and
[`ArticleRecipeDemos.tsx`](./ArticleRecipeDemos.tsx) owns the read-only, drag/create, and preloading exhibits.
[`ArticleProductDemos.tsx`](./ArticleProductDemos.tsx) owns CSS-native chrome, current-time, navigation, progressive
precision, styling, custom card structure, date localization, and final-composition exhibits.
[`articleSupport.tsx`](./articleSupport.tsx) contains deterministic fixtures and the external event renderer. Every live
calendar imports the public `quno-calendar` entrypoint.

Each chapter leads with a concrete outcome and the problem it solves. Behavior and implementation follow only after
that context, and control instructions remain in callouts beside the relevant live example.

Every live calendar expands through a shared viewport overlay rather than the browser Fullscreen API. Expansion keeps
the same React calendar instance mounted, so its visible date, intra-date offset, and loaded event cache survive the
transition.
