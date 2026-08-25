import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../demo/app/ProjectHome", () => ({
  ProjectHome: () => <div data-testid="route-home" />
}));
vi.mock("../../../demo/showcase/DefaultDemo", () => ({
  DefaultDemo: () => <div data-testid="route-default" />
}));
vi.mock("../../../demo/showcase/demo1/Demo1", () => ({ Demo1: () => <div data-testid="route-demo1" /> }));
vi.mock("../../../demo/showcase/demo2/Demo2", () => ({ Demo2: () => <div data-testid="route-demo2" /> }));
vi.mock("../../../demo/showcase/demo3/Demo3", () => ({ Demo3: () => <div data-testid="route-demo3" /> }));
vi.mock("../../../demo/guide/timeline/IntegrationWalkthrough", () => ({
  IntegrationWalkthrough: () => <div data-testid="route-timeline-guide" />
}));
vi.mock("../../../demo/guide/date-picker/DatePickerStory", () => ({
  DatePickerStory: () => <div data-testid="route-date-range-guide" />
}));
vi.mock("../../../demo/guide/date-input/DateInputFieldGuide", () => ({
  DateInputFieldGuide: () => <div data-testid="route-date-input-guide" />
}));
vi.mock("../../../demo/demos/DateRangeDemo", () => ({
  DateRangeDemo: () => <div data-testid="route-date-range-demo" />
}));
vi.mock("../../../demo/demos/DateInputDemo", () => ({
  DateInputDemo: () => <div data-testid="route-date-input-demo" />
}));

import { App, demoRoutes } from "../../../demo/app/App";

describe("application route registry", () => {
  it("keeps all four calendar demo routes", () => {
    expect(demoRoutes.map(({ id, path }) => ({ id, path }))).toEqual([
      { id: "default", path: "/demo/infinite-calendar" },
      { id: "demo1", path: "/demo1" },
      { id: "demo2", path: "/demo2" },
      { id: "demo3", path: "/demo3" }
    ]);
  });

  it.each([
    ["/", "route-home"],
    ["/guide/infinite-calendar", "route-timeline-guide"],
    ["/guide/date-range-input", "route-date-range-guide"],
    ["/guide/date-input-field", "route-date-input-guide"],
    ["/demo/infinite-calendar", "route-default"],
    ["/demo/date-range-input", "route-date-range-demo"],
    ["/demo/date-input-field", "route-date-input-demo"],
    ["/demo1", "route-demo1"],
    ["/demo2", "route-demo2"],
    ["/demo3", "route-demo3"]
  ])("renders %s from the declarative registry", (path, testId) => {
    window.history.replaceState({}, "", path);
    const view = render(<App />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    view.unmount();
  });

  it("falls back to the project home for unknown paths", () => {
    window.history.replaceState({}, "", "/unknown");
    const view = render(<App />);
    expect(screen.getByTestId("route-home")).toBeInTheDocument();
    view.unmount();
  });

  it.each(["/guide", "/story", "/examples/integration-walkthrough"])(
    "redirects %s to the infinite-calendar guide",
    (path) => {
      window.history.replaceState({}, "", path);
      const view = render(<App />);
      expect(screen.getByTestId("route-timeline-guide")).toBeInTheDocument();
      expect(window.location.pathname).toBe("/guide/infinite-calendar");
      view.unmount();
    }
  );
});
