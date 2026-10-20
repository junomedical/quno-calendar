import { useEffect, useState, type ComponentType } from "react";
import { DateInputDemo } from "#quno-demo/demos/DateInputDemo";
import { TimePickerDemo } from "#quno-demo/demos/TimePickerDemo";
import { DateTimeDemo } from "#quno-demo/demos/DateTimeDemo";
import { DateParserDemo } from "#quno-demo/demos/DateParserDemo";
import { DateRangeDemo } from "#quno-demo/demos/DateRangeDemo";
import { DefaultDemo } from "#quno-demo/showcase/DefaultDemo";
import { Demo1 } from "#quno-demo/showcase/demo1/Demo1";
import { Demo2 } from "#quno-demo/showcase/demo2/Demo2";
import { Demo3 } from "#quno-demo/showcase/demo3/Demo3";
import type { DemoRoute } from "#quno-demo/showcase/types";
import { DemoConcept } from "#quno-demo/concept/DemoConcept";
import { CurrentDocs } from "#quno-demo/guide/CurrentDocs";
import { ArchiveDocs } from "#quno-demo/archive/ArchiveDocs";
import { ProjectHome } from "./ProjectHome";
import "./App.css";

export const demoRoutes: DemoRoute[] = [
  { id: "default", path: "/demo/infinite-calendar", label: "Default" },
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

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const redirects: Record<string, string> = {
    "/guide": "/guide/infinite-calendar",
    "/story": "/guide/infinite-calendar",
    "/examples/integration-walkthrough": "/guide/infinite-calendar",
    "/guide/date-range-input": "/guide/datepicker",
    "/guide/date-input-field": "/guide/date-input",
    "/demo/date-range-input": "/demo/datepicker",
    "/demo/date-input-field": "/demo/date-input"
  };
  const redirect = redirects[pathname];
  if (redirect) {
    window.history.replaceState({}, "", `${redirect}${window.location.search}${window.location.hash}`);
  }
  const resolved = redirect ?? pathname;
  const routePath =
    resolved.startsWith("/docs/") && !resolved.startsWith("/docs/archive")
      ? resolved.replace("/docs/", "/guide/")
      : resolved;

  if (routePath.startsWith("/guide/")) return <CurrentDocs product={routePath.split("/")[2]} />;

  if (routePath === "/concept" || routePath === "/") return <DemoConcept />;
  if (routePath === "/docs") return <ProjectHome />;
  if (routePath === "/docs/archive" || routePath.startsWith("/docs/archive/")) {
    return <ArchiveDocs product={routePath.split("/")[3] ?? ""} />;
  }
  if (routePath === "/demo/datepicker") return <DateRangeDemo />;
  if (routePath === "/demo/date-input") return <DateInputDemo />;
  if (routePath === "/demo/timepicker") return <TimePickerDemo />;
  if (routePath === "/demo/date-time") return <DateTimeDemo />;
  if (routePath === "/demo/date-parser") return <DateParserDemo />;

  const activeRoute = demoRoutes.find((route) => route.path === routePath);
  if (!activeRoute) return <DemoConcept />;
  const Demo = demoComponents[activeRoute.id] ?? DefaultDemo;
  return <Demo routes={demoRoutes} />;
}
