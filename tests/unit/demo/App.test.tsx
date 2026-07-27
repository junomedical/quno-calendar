import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../demo/showcase/DefaultDemo", () => ({
  DefaultDemo: () => <div data-testid="route-default" />
}));
vi.mock("../../../demo/showcase/demo1/Demo1", () => ({ Demo1: () => <div data-testid="route-demo1" /> }));
vi.mock("../../../demo/showcase/demo2/Demo2", () => ({ Demo2: () => <div data-testid="route-demo2" /> }));
vi.mock("../../../demo/showcase/demo3/Demo3", () => ({ Demo3: () => <div data-testid="route-demo3" /> }));
vi.mock("../../../demo/examples/integration-walkthrough/IntegrationWalkthrough", () => ({
  IntegrationWalkthrough: () => <div data-testid="route-integration-walkthrough" />
}));

import { App, demoRoutes } from "../../../demo/app/App";

describe("application route registry", () => {
  it("keeps all four public demo routes", () => {
    expect(demoRoutes.map(({ id, path }) => ({ id, path }))).toEqual([
      { id: "default", path: "/" },
      { id: "demo1", path: "/demo1" },
      { id: "demo2", path: "/demo2" },
      { id: "demo3", path: "/demo3" }
    ]);
  });

  it.each([
    ["/", "route-default"],
    ["/demo1", "route-demo1"],
    ["/demo2", "route-demo2"],
    ["/demo3", "route-demo3"],
    ["/examples/integration-walkthrough", "route-integration-walkthrough"]
  ])("renders %s from the declarative registry", (path, testId) => {
    window.history.replaceState({}, "", path);
    const view = render(<App />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    view.unmount();
  });

  it("falls back to the default demo for unknown paths", () => {
    window.history.replaceState({}, "", "/unknown");
    const view = render(<App />);
    expect(screen.getByTestId("route-default")).toBeInTheDocument();
    view.unmount();
  });

  it.each([
    "/examples/read-only",
    "/examples/drag-create",
    "/examples/vertical-planner",
    "/examples/availability",
    "/examples/controlled-draft",
    "/examples/async-api"
  ])("retires the former standalone route %s", (path) => {
    window.history.replaceState({}, "", path);
    const view = render(<App />);
    expect(screen.getByTestId("route-default")).toBeInTheDocument();
    view.unmount();
  });

  it("renders the editorial walkthrough without the shared recipe shell", () => {
    window.history.replaceState({}, "", "/examples/integration-walkthrough?step=focus");
    const view = render(<App />);
    expect(screen.getByTestId("route-integration-walkthrough")).toBeInTheDocument();
    expect(screen.queryByText("Focused integration recipe")).not.toBeInTheDocument();
    view.unmount();
  });
});
