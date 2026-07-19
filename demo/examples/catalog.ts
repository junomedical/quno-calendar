export type ExampleDefinition = {
  id: string;
  path: string;
  title: string;
  summary: string;
  sourcePath: string;
};

export const exampleCatalog: ExampleDefinition[] = [
  {
    id: "read-only",
    path: "/examples/read-only",
    title: "Read-only calendar",
    summary: "The smallest useful integration: calendars, an async range loader, settings, and an event renderer.",
    sourcePath: "demo/examples/read-only/ReadOnlyCalendar.tsx"
  },
  {
    id: "drag-create",
    path: "/examples/drag-create",
    title: "Drag and create",
    summary: "Parent-owned event mutations using move and timeline-draw requests.",
    sourcePath: "demo/examples/drag-create/DragCreateCalendar.tsx"
  },
  {
    id: "vertical-planner",
    path: "/examples/vertical-planner",
    title: "Vertical resource planner",
    summary: "The same data contract projected as resource columns with vertical time.",
    sourcePath: "demo/examples/vertical-planner/VerticalPlanner.tsx"
  },
  {
    id: "availability",
    path: "/examples/availability",
    title: "Availability editor",
    summary: "Availability-specific drawing mode with creation handled by the parent.",
    sourcePath: "demo/examples/availability/AvailabilityEditor.tsx"
  },
  {
    id: "controlled-draft",
    path: "/examples/controlled-draft",
    title: "Controlled draft",
    summary: "External create/edit form ownership while the calendar renders and moves the preview.",
    sourcePath: "demo/examples/controlled-draft/ControlledDraftCalendar.tsx"
  },
  {
    id: "async-api",
    path: "/examples/async-api",
    title: "Delayed async API",
    summary: "Immediate grid rendering, cancellable range loading, and stable focus when late data changes layout.",
    sourcePath: "demo/examples/async-api/AsyncApiCalendar.tsx"
  }
];
