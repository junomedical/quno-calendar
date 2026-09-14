import { TimeZoneDemo } from "#quno-demo/demos/TimeZoneDemo";
import { useEffect, useState, type ComponentType } from "react";
import { DateInputDemo } from "#quno-demo/demos/DateInputDemo";
import { DateParserDemo } from "#quno-demo/demos/DateParserDemo";
import { DateRangeDemo } from "#quno-demo/demos/DateRangeDemo";
import { DateInputFieldGuide } from "#quno-demo/guide/date-input/DateInputFieldGuide";
import { DateParserFieldGuide } from "#quno-demo/guide/date-parser/DateParserFieldGuide";
import { DatePickerStory } from "#quno-demo/guide/date-picker/DatePickerStory";
import { IntegrationWalkthrough } from "#quno-demo/guide/timeline/IntegrationWalkthrough";
import { DefaultDemo } from "#quno-demo/showcase/DefaultDemo";
import { Demo1 } from "#quno-demo/showcase/demo1/Demo1";
import { Demo2 } from "#quno-demo/showcase/demo2/Demo2";
import { Demo3 } from "#quno-demo/showcase/demo3/Demo3";
import type { DemoRoute } from "#quno-demo/showcase/types";
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
    window.history.replaceState({}, "", `${redirect}${window.location.hash}`);
  }
  const routePath = redirect ?? pathname;

  if (routePath === "/guide/infinite-calendar") {
    return <IntegrationWalkthrough />;
  }

  if (routePath === "/demo/calendar-timezone") return <TimeZoneDemo />;
  if (routePath === "/") return <ProjectHome />;
  if (routePath === "/guide/datepicker") return <DatePickerStory />;
  if (routePath === "/guide/date-input") return <DateInputFieldGuide />;
  if (routePath === "/guide/date-parser") return <DateParserFieldGuide />;
  if (routePath === "/demo/datepicker") return <DateRangeDemo />;
  if (routePath === "/demo/date-input") return <DateInputDemo />;
  if (routePath === "/demo/date-parser") return <DateParserDemo />;

  const activeRoute = demoRoutes.find((route) => route.path === routePath);
  if (!activeRoute) return <ProjectHome />;
  const Demo = demoComponents[activeRoute.id] ?? DefaultDemo;
  return <Demo routes={demoRoutes} />;
}
