import { CalendarRoot } from "quno-calendar";
import { demoCalendars } from "../data";
import type { DemoRoute } from "../types";
import { PresetDemoSidebar } from "./PresetDemoSidebar";
import type { DemoPreset } from "./types";
import { usePresetDemo } from "./usePresetDemo";

type PresetDemoProps = {
  preset: DemoPreset;
  routes: DemoRoute[];
};

export function PresetDemo({ preset, routes }: PresetDemoProps) {
  const demo = usePresetDemo(preset);

  return (
    <main className={`${preset.id}-shell`} data-demo-id={preset.id}>
      <PresetDemoSidebar
        preset={preset}
        routes={routes}
        scale={demo.scale}
        message={demo.message}
        controls={demo.controls}
        pendingApiRequestCount={demo.pendingApiRequestCount}
        onScaleChange={demo.handleScaleChange}
        onAvailabilityModeChange={demo.setAvailabilityMode}
        onGoToDate={demo.goToDate}
      />
      <section className={`${preset.id}-calendar-panel`}>
        <CalendarRoot
          key={demo.scale}
          view={demo.controls.calendarView}
          ref={demo.calendarRef}
          calendars={demoCalendars}
          selectedCalendarIds={demo.selectedCalendarIds}
          loadEvents={demo.loadEvents}
          eventRenderer={preset.eventRenderer}
          onEventMoveRequest={demo.handleMove}
          onEventCreateRequest={demo.handleCreate}
          onZoomChange={demo.controls.setZoom}
          now={demo.systemNow}
          interactionMode={demo.controls.editAvailabilities ? "availability" : "events"}
          settings={demo.controls.settings}
        />
      </section>
    </main>
  );
}
