import { DemoRouteNav } from "#quno-demo/showcase/DemoRouteNav";
import { ApiLatencyControl } from "#quno-demo/showcase/controls/ApiLatencyControl";
import { DateJumpControl } from "#quno-demo/showcase/controls/DateJumpControl";
import { DatasetControl } from "#quno-demo/showcase/controls/DatasetControl";
import {
  CalendarCountControl,
  SnapControl,
  TimeRangeControl,
  ToggleControl
} from "#quno-demo/showcase/controls/TimelineControls";
import { ViewControl } from "#quno-demo/showcase/controls/ViewControl";
import { demoCalendars } from "#quno-demo/showcase/data";
import type { DemoControls } from "#quno-demo/showcase/hooks/useDemoControls";
import type { DemoRoute } from "#quno-demo/showcase/types";
import { DemoZoomControl } from "#quno-demo/showcase/zoom/DemoZoom";
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
  onGoToDate: (date: DemoControls["jumpDate"]) => void;
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
  const className = (suffix: string) => `${preset.id}-${suffix} preset-${suffix}`;
  const BrandIcon = preset.brandIcon;

  return (
    <aside className={`${className("sidebar")} demo-control-pane`} aria-label="Demo controls">
      <div className={className("brand")}>
        <BrandIcon size={24} aria-hidden />
        <div>
          <strong>{preset.title}</strong>
          <span>{preset.subtitle}</span>
        </div>
      </div>

      <DemoRouteNav activeRouteId={preset.id} className={className("route-nav")} routes={routes} />
      <div className="data-api-control-row" data-testid="data-api-control-row">
        <DatasetControl scale={scale} onChange={onScaleChange} />
        <ApiLatencyControl
          latencyMs={controls.apiLatencyMs}
          pendingRequestCount={pendingApiRequestCount}
          onChange={controls.setApiLatencyMs}
        />
      </div>
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
      <DemoZoomControl className={className("zoom-control")} />
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
      <DateJumpControl className={className("date-jump")} date={controls.jumpDate} onDateChange={onGoToDate} />
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
