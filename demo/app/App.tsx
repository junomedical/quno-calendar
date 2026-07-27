import { useEffect, useState, type ComponentType } from "react";
import { IntegrationWalkthrough } from "../examples/integration-walkthrough/IntegrationWalkthrough";
import { DefaultDemo } from "../showcase/DefaultDemo";
import { Demo1 } from "../showcase/demo1/Demo1";
import { Demo2 } from "../showcase/demo2/Demo2";
import { Demo3 } from "../showcase/demo3/Demo3";
import type { DemoRoute } from "../showcase/types";
import "./App.css";

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

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (pathname === "/examples/integration-walkthrough") return <IntegrationWalkthrough />;

  const activeRoute = demoRoutes.find((route) => route.path === pathname) ?? demoRoutes[0];
  const Demo = demoComponents[activeRoute.id] ?? DefaultDemo;
  return <Demo routes={demoRoutes} />;
}
