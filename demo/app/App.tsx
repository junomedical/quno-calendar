import { useEffect, useState, type ComponentType } from "react";
import { DateInputDemo } from "../demos/DateInputDemo";
import { DateRangeDemo } from "../demos/DateRangeDemo";
import { DateInputFieldGuide } from "../guide/date-input/DateInputFieldGuide";
import { DatePickerStory } from "../guide/date-picker/DatePickerStory";
import { IntegrationWalkthrough } from "../guide/timeline/IntegrationWalkthrough";
import { DefaultDemo } from "../showcase/DefaultDemo";
import { Demo1 } from "../showcase/demo1/Demo1";
import { Demo2 } from "../showcase/demo2/Demo2";
import { Demo3 } from "../showcase/demo3/Demo3";
import type { DemoRoute } from "../showcase/types";
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

  if (["/guide", "/story", "/examples/integration-walkthrough"].includes(pathname)) {
    window.history.replaceState({}, "", "/guide/infinite-calendar");
    return <IntegrationWalkthrough />;
  }

  if (pathname === "/") return <ProjectHome />;
  if (pathname === "/guide/infinite-calendar") return <IntegrationWalkthrough />;
  if (pathname === "/guide/date-range-input") return <DatePickerStory />;
  if (pathname === "/guide/date-input-field") return <DateInputFieldGuide />;
  if (pathname === "/demo/date-range-input") return <DateRangeDemo />;
  if (pathname === "/demo/date-input-field") return <DateInputDemo />;

  const activeRoute = demoRoutes.find((route) => route.path === pathname);
  if (!activeRoute) return <ProjectHome />;
  const Demo = demoComponents[activeRoute.id] ?? DefaultDemo;
  return <Demo routes={demoRoutes} />;
}
