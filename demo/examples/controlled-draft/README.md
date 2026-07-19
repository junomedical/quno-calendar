# Controlled Draft

Use this when product UI owns an external create/edit form. The parent controls the draft record; the calendar renders its preview and reports proposed draft moves.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> DraftOpen: draw or activate
  DraftOpen --> DraftOpen: edit form or move preview
  DraftOpen --> Idle: save or close
```

- Primary source: [`ControlledDraftCalendar.tsx`](./ControlledDraftCalendar.tsx)
- Public concepts: `activeDraft`, `onEventDraftRequest`, `onEventActivate`, `onActiveDraftMoveRequest`
- Product form state does not live inside calendar internals.
