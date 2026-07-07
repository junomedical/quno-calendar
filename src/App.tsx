import { useEffect, useMemo, useState } from "react";
import { DefaultDemo } from "./demo/DefaultDemo";
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
