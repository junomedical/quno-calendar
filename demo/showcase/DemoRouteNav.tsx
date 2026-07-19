import type { DemoRoute } from "./types";

type DemoRouteNavProps = {
  activeRouteId: string;
  className: string;
  routes: DemoRoute[];
};

export function DemoRouteNav({ activeRouteId, className, routes }: DemoRouteNavProps) {
  return (
    <nav className={className} aria-label="Demo variants">
      {routes.map((route) => (
        <a
          aria-current={route.id === activeRouteId ? "page" : undefined}
          data-testid={`demo-route-${route.id}`}
          href={route.path}
          key={route.id}
        >
          {route.label}
        </a>
      ))}
    </nav>
  );
}
