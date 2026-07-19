import { CalendarDays, Plus } from "lucide-react";
import { DemoRouteNav } from "../DemoRouteNav";
import { DemoSourceLinks } from "../DemoSourceLinks";
import { ApiLatencyControl } from "../controls/ApiLatencyControl";
import { DatasetControl } from "../controls/DatasetControl";
import {
  CalendarCountControl,
  SnapControl,
  TimeRangeControl,
  ToggleControl,
  ZoomControl
} from "../controls/TimelineControls";
import { ViewControl } from "../controls/ViewControl";
import { demoCalendars } from "../data";
import type { DemoControls } from "../hooks/useDemoControls";
import type { DemoRoute } from "../types";
import { DefaultDateJumpControl } from "./DefaultDateJumpControl";
import { DemoStatsPanel } from "./DemoStatsPanel";

type DefaultDemoSidebarProps = {
  routes: DemoRoute[];
  scale: number;
  message: string;
  controls: DemoControls;
  pendingApiRequestCount: number;
  onScaleChange: (scale: number) => void;
  onAvailabilityModeChange: (checked: boolean) => void;
  onToday: () => void;
  onGoToDate: () => void;
  onExternalAdd: () => void;
};

export function DefaultDemoSidebar({
  routes,
  scale,
  message,
  controls,
  pendingApiRequestCount,
  onScaleChange,
  onAvailabilityModeChange,
  onToday,
  onGoToDate,
  onExternalAdd
}: DefaultDemoSidebarProps) {
  return (
    <aside className="demo-sidebar" aria-label="Demo controls">
      <div className="demo-brand">
        <CalendarDays size={26} aria-hidden />
        <div>
          <strong>Infinite Calendar</strong>
          <span>Reusable React PoC</span>
        </div>
      </div>
      <DemoRouteNav activeRouteId="default" className="demo-route-nav" routes={routes} />
      <DemoSourceLinks sourcePath="demo/showcase/DefaultDemo.tsx" />
      <DatasetControl scale={scale} onChange={onScaleChange} />
      <ApiLatencyControl
        latencyMs={controls.apiLatencyMs}
        pendingRequestCount={pendingApiRequestCount}
        onChange={controls.setApiLatencyMs}
      />
      <ViewControl
        className="view-switch"
        inputName="calendar-view"
        view={controls.calendarView}
        onChange={controls.setCalendarView}
      />
      <CalendarCountControl
        count={controls.calendarCount}
        maximum={demoCalendars.length}
        onChange={controls.setCalendarCount}
      />
      <ZoomControl className="zoom-control" zoom={controls.zoom} onChange={controls.setZoom} />
      <SnapControl minutes={controls.snapMinutes} onChange={controls.setSnapMinutes} />
      <TimeRangeControl
        className="time-range"
        startHour={controls.startHour}
        endHour={controls.endHour}
        onStartHourChange={controls.setStartHour}
        onEndHourChange={controls.setEndHour}
      />
      <ToggleControl
        checked={controls.excludeWeekends}
        className="toggle"
        label="Exclude weekends"
        testId="exclude-weekends"
        onChange={controls.setExcludeWeekends}
      />
      <ToggleControl
        checked={controls.editAvailabilities}
        className="toggle"
        label="Availabilities"
        testId="availability-mode"
        onChange={onAvailabilityModeChange}
      />
      <DefaultDateJumpControl
        date={controls.jumpDate}
        time={controls.jumpTime}
        onDateChange={controls.setJumpDate}
        onTimeChange={controls.setJumpTime}
        onToday={onToday}
        onGo={onGoToDate}
      />
      <button type="button" className="external-add-button" onClick={onExternalAdd} data-testid="external-add-button">
        <Plus size={15} aria-hidden />
        Add event
      </button>
      <p className="demo-message" data-testid="demo-message">
        {message}
      </p>
      <DemoStatsPanel />
    </aside>
  );
}
