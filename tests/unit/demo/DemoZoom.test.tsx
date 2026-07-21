import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultTimelineSettings } from "../../../src/lib";
import { DemoCalendarRoot, DemoZoomControl, DemoZoomProvider } from "../../../demo/showcase/zoom/DemoZoom";

describe("demo zoom render boundary", () => {
  afterEach(() => vi.restoreAllMocks());

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

  it("projects only the latest slider value in an animation frame", () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => frameCallbacks.push(callback));
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const { zoom: _zoom, ...settings } = defaultTimelineSettings;

    render(
      <DemoZoomProvider initialZoom={1.2}>
        <DemoCalendarRoot
          calendars={[{ id: "calendar-a", name: "Calendar A" }]}
          selectedCalendarIds={["calendar-a"]}
          loadEvents={async () => []}
          eventRenderer={() => null}
          settings={settings}
        />
        <DemoZoomControl className="zoom-control" />
      </DemoZoomProvider>
    );
    const slider = screen.getByTestId("zoom-slider");
    const timelineTrack = document.querySelector<HTMLElement>(".ic-time-tick-track");
    expect(timelineTrack?.style.width).toBe("720px");
    frameCallbacks.length = 0;
    requestFrame.mockClear();

    fireEvent.change(slider, { target: { value: "4" } });
    fireEvent.change(slider, { target: { value: "2" } });
    fireEvent.change(slider, { target: { value: "0.5" } });

    expect(screen.getByTestId("zoom-value")).toHaveTextContent("0.50");
    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(timelineTrack?.style.width).toBe("720px");
    act(() => frameCallbacks.shift()?.(16.7));
    expect(timelineTrack?.style.width).toBe("300px");
  });
});
