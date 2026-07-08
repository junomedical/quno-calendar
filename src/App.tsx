import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DefaultDemo } from "./demo/DefaultDemo";
import { AvailabilityEditor } from "./examples/AvailabilityEditor";
import { ControlledDraftCalendar } from "./examples/ControlledDraftCalendar";
import { DragCreateCalendar } from "./examples/DragCreateCalendar";
import { ReadOnlyCalendar } from "./examples/ReadOnlyCalendar";
import { VerticalPlanner } from "./examples/VerticalPlanner";
import { Demo1 } from "./demo/demo1/Demo1";
import { Demo2 } from "./demo/demo2/Demo2";
import { Demo3 } from "./demo/demo3/Demo3";
import "./App.css";

export type DemoRoute = {
  id: string;
  path: string;
  label: string;
};

export const demoRoutes: DemoRoute[] = [
  { id: "default", path: "/", label: "Default" },
  { id: "demo1", path: "/demo1", label: "Compact" },
  { id: "demo2", path: "/demo2", label: "Planner" },
  { id: "demo3", path: "/demo3", label: "Availability" }
];

function routeIdForPath(pathname: string) {
  return demoRoutes.find((route) => route.path === pathname)?.id ?? "default";
}

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const activeRouteId = useMemo(() => routeIdForPath(pathname), [pathname]);

  if (pathname === "/examples/read-only") {
    return (
      <ExampleShell>
        <ReadOnlyCalendar />
      </ExampleShell>
    );
  }
  if (pathname === "/examples/drag-create") {
    return (
      <ExampleShell>
        <DragCreateCalendar />
      </ExampleShell>
    );
  }
  if (pathname === "/examples/vertical-planner") {
    return (
      <ExampleShell>
        <VerticalPlanner />
      </ExampleShell>
    );
  }
  if (pathname === "/examples/availability") {
    return (
      <ExampleShell>
        <AvailabilityEditor />
      </ExampleShell>
    );
  }
  if (pathname === "/examples/controlled-draft") {
    return (
      <ExampleShell>
        <ControlledDraftCalendar />
      </ExampleShell>
    );
  }

  if (activeRouteId === "demo1") {
    return <Demo1 routes={demoRoutes} />;
  }
  if (activeRouteId === "demo2") {
    return <Demo2 routes={demoRoutes} />;
  }
  if (activeRouteId === "demo3") {
    return <Demo3 routes={demoRoutes} />;
  }
  return <DefaultDemo routes={demoRoutes} />;
}

function ExampleShell({ children }: { children: ReactNode }) {
  return <main className="example-shell">{children}</main>;
}
