import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DemoZoomControl, DemoZoomProvider } from "../../../demo/showcase/zoom/DemoZoom";

describe("demo zoom render boundary", () => {
  it("updates zoom consumers without rendering static shell content again", () => {
    const renderStaticContent = vi.fn();

    function StaticContent() {
      renderStaticContent();
      return <div data-testid="static-shell-content" />;
    }

    render(
      <DemoZoomProvider initialZoom={1.2}>
        <StaticContent />
        <DemoZoomControl className="zoom-control" />
      </DemoZoomProvider>
    );

    fireEvent.change(screen.getByTestId("zoom-slider"), { target: { value: "2.4" } });

    expect(screen.getByTestId("zoom-value")).toHaveTextContent("2.40");
    expect(screen.getByTestId("static-shell-content")).toBeInTheDocument();
    expect(renderStaticContent).toHaveBeenCalledTimes(1);
  });
});
