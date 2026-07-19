import { DemoRouteNav } from "../DemoRouteNav";
import { DemoSourceLinks } from "../DemoSourceLinks";
import { ApiLatencyControl } from "../controls/ApiLatencyControl";
import { DateJumpControl } from "../controls/DateJumpControl";
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
import type { DemoPreset } from "./types";

type PresetDemoSidebarProps = {
  preset: DemoPreset;
  routes: DemoRoute[];
  scale: number;
  message: string;
  controls: DemoControls;
  pendingApiRequestCount: number;
  onScaleChange: (scale: number) => void;
  onAvailabilityModeChange: (checked: boolean) => void;
  onGoToDate: () => void;
};

export function PresetDemoSidebar({
  preset,
  routes,
  scale,
  message,
  controls,
  pendingApiRequestCount,
  onScaleChange,
  onAvailabilityModeChange,
  onGoToDate
}: PresetDemoSidebarProps) {
  const className = (suffix: string) => `${preset.id}-${suffix}`;
  const BrandIcon = preset.brandIcon;

  return (
    <aside className={className("sidebar")} aria-label="Demo controls">
      <div className={className("brand")}>
        <BrandIcon size={24} aria-hidden />
        <div>
          <strong>{preset.title}</strong>
          <span>{preset.subtitle}</span>
        </div>
      </div>

      <DemoRouteNav activeRouteId={preset.id} className={className("route-nav")} routes={routes} />
      <DemoSourceLinks sourcePath={preset.sourcePath} />
      <DatasetControl scale={scale} onChange={onScaleChange} />
      <ApiLatencyControl
        latencyMs={controls.apiLatencyMs}
        pendingRequestCount={pendingApiRequestCount}
        onChange={controls.setApiLatencyMs}
      />
      <ViewControl
        className={className("view-switch")}
        inputName={`${preset.id}-view`}
        view={controls.calendarView}
        onChange={controls.setCalendarView}
      />
      <CalendarCountControl
        count={controls.calendarCount}
        maximum={demoCalendars.length}
        onChange={controls.setCalendarCount}
      />
      <ZoomControl className={className("zoom-control")} zoom={controls.zoom} onChange={controls.setZoom} />
      <SnapControl minutes={controls.snapMinutes} onChange={controls.setSnapMinutes} />
      <TimeRangeControl
        className={className("time-range")}
        startHour={controls.startHour}
        endHour={controls.endHour}
        onStartHourChange={controls.setStartHour}
        onEndHourChange={controls.setEndHour}
      />
      <ToggleControl
        checked={controls.excludeWeekends}
        className={className("toggle")}
        label="Exclude weekends"
        testId="exclude-weekends"
        onChange={controls.setExcludeWeekends}
      />
      <DateJumpControl
        className={className("date-jump")}
        date={controls.jumpDate}
        time={controls.jumpTime}
        showIcon={preset.id !== "demo1"}
        onDateChange={controls.setJumpDate}
        onTimeChange={controls.setJumpTime}
        onGo={onGoToDate}
      />
      <ToggleControl
        checked={controls.editAvailabilities}
        className={className("toggle")}
        label="Availabilities"
        testId="availability-mode"
        onChange={onAvailabilityModeChange}
      />
      <p className={className("message")} data-testid="demo-message">
        {message}
      </p>
    </aside>
  );
}
