# Inside An Infinite Calendar

This route is the single example surface for React integrators and product designers. It replaces the former
step walkthrough and standalone recipe routes while preserving `/examples/integration-walkthrough`. A table of
contents links directly to every chapter from the article’s internal scroll container.

The article teaches the calendar through focused live exhibits:

1. Bounded date virtualization, the scrolled/repositioned settlement chip, and preserved full-screen state.
2. The smallest useful read-only integration.
3. Product-owned event cards, including replayable added-event and cancelled-draft motion.
4. Availability as a separate interaction layer that makes appointment cards visible but inert while editing.
5. Parent-owned drag and creation proposals.
6. Parent-controlled and pointer-anchored zoom.
7. Horizontal overlap lanes and vertical overlap columns.
8. Vertical-column hover handoff to events underneath an expanded overlap card.
9. Delayed loading plus policy-controlled warm-window event preloading.
10. Late-data stability, multi-calendar event projection, and viewport-focus preservation.
11. Parent-controlled creation focused to one selected doctor lane.
12. Event-relative visual focus across draft save and overlap-lane reassignment.
13. A complete public-package React integration.
14. Renderer-owned add and cancel transitions.

[`IntegrationWalkthrough.tsx`](./IntegrationWalkthrough.tsx) owns the narrative and progressive code examples.
[`ArticleDemos.tsx`](./ArticleDemos.tsx) owns the foundational interactive exhibits,
[`ArticleSystemDemos.tsx`](./ArticleSystemDemos.tsx) owns the layer and visual-focus labs, and
[`ArticleRecipeDemos.tsx`](./ArticleRecipeDemos.tsx) owns the read-only, drag/create, and preloading exhibits.
[`articleSupport.tsx`](./articleSupport.tsx) contains deterministic fixtures and the external event renderer. Every live
calendar imports the public `quno-calendar` entrypoint.

The narrative leads with the product reason for each system boundary: stable browser cost, trustworthy data ownership,
domain-specific card design, unambiguous editing, uninterrupted visual focus, and feedback that does not change calendar
geometry. Control instructions remain in callouts after the value is established.

Every live calendar expands through a shared viewport overlay rather than the browser Fullscreen API. Expansion keeps
the same React calendar instance mounted, so its visible date, intra-date offset, and loaded event cache survive the
transition.
