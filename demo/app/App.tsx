import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { AsyncApiCalendar } from "../examples/async-api/AsyncApiCalendar";
import { AvailabilityEditor } from "../examples/availability/AvailabilityEditor";
import { exampleCatalog, type ExampleDefinition } from "../examples/catalog";
import { ControlledDraftCalendar } from "../examples/controlled-draft/ControlledDraftCalendar";
import { DragCreateCalendar } from "../examples/drag-create/DragCreateCalendar";
import { ReadOnlyCalendar } from "../examples/read-only/ReadOnlyCalendar";
import { VerticalPlanner } from "../examples/vertical-planner/VerticalPlanner";
import { DefaultDemo } from "../showcase/DefaultDemo";
import { Demo1 } from "../showcase/demo1/Demo1";
import { Demo2 } from "../showcase/demo2/Demo2";
import { Demo3 } from "../showcase/demo3/Demo3";
import type { DemoRoute } from "../showcase/types";
import "./App.css";

const sourceBaseUrl = "https://github.com/quno-ai/quno-calendar/blob/main";

export const demoRoutes: DemoRoute[] = [
  { id: "default", path: "/", label: "Default" },
  { id: "demo1", path: "/demo1", label: "Compact" },
  { id: "demo2", path: "/demo2", label: "Planner" },
  { id: "demo3", path: "/demo3", label: "Availability" }
];

const demoComponents: Record<string, ComponentType<{ routes: DemoRoute[] }>> = {
  default: DefaultDemo,
  demo1: Demo1,
  demo2: Demo2,
  demo3: Demo3
};

const exampleComponents: Record<string, ComponentType> = {
  "read-only": ReadOnlyCalendar,
  "drag-create": DragCreateCalendar,
  "vertical-planner": VerticalPlanner,
  availability: AvailabilityEditor,
  "controlled-draft": ControlledDraftCalendar,
  "async-api": AsyncApiCalendar
};

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const example = exampleCatalog.find((candidate) => candidate.path === pathname);
  if (example) {
    const Example = exampleComponents[example.id];
    return (
      <ExampleShell example={example}>
        <Example />
      </ExampleShell>
    );
  }

  const activeRoute = demoRoutes.find((route) => route.path === pathname) ?? demoRoutes[0];
  const Demo = demoComponents[activeRoute.id] ?? DefaultDemo;
  return <Demo routes={demoRoutes} />;
}

function ExampleShell({ children, example }: { children: ReactNode; example: ExampleDefinition }) {
  return (
    <main className="example-shell">
      <header className="example-header">
        <div>
          <p className="example-eyebrow">Focused integration recipe</p>
          <h1>{example.title}</h1>
          <p>{example.summary}</p>
          <a
            className="example-source-link"
            href={`${sourceBaseUrl}/${example.sourcePath}`}
            rel="noreferrer"
            target="_blank"
          >
            View recipe source
          </a>
        </div>
        <nav aria-label="Calendar examples">
          {exampleCatalog.map((candidate) => (
            <a aria-current={candidate.id === example.id ? "page" : undefined} href={candidate.path} key={candidate.id}>
              {candidate.title}
            </a>
          ))}
        </nav>
      </header>
      <section className="example-stage">{children}</section>
    </main>
  );
}
