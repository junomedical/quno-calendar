import { BookOpenText, CalendarDays, Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { DemoRouteNav } from "../DemoRouteNav";
import { ApiLatencyControl } from "../controls/ApiLatencyControl";
import { DatasetControl } from "../controls/DatasetControl";
import { CalendarCountControl, SnapControl, TimeRangeControl, ToggleControl } from "../controls/TimelineControls";
import { ViewControl } from "../controls/ViewControl";
import { demoCalendars } from "../data";
import type { DemoControls } from "../hooks/useDemoControls";
import type { DemoRoute } from "../types";
import { DemoZoomControl } from "../zoom/DemoZoom";
import { DefaultDateJumpControl } from "./DefaultDateJumpControl";
import { DemoStatsPanel } from "./DemoStatsPanel";

type DefaultDemoSidebarProps = {
  routes: DemoRoute[];
  scale: number;
  activityEntries: string[];
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
  activityEntries,
  controls,
  pendingApiRequestCount,
  onScaleChange,
  onAvailabilityModeChange,
  onToday,
  onGoToDate,
  onExternalAdd
}: DefaultDemoSidebarProps) {
  const activityPaneRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const pane = activityPaneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [activityEntries]);

  return (
    <aside className="demo-sidebar demo-control-pane" aria-label="Demo controls">
      <div className="demo-brand">
        <CalendarDays size={26} aria-hidden />
        <div>
          <strong>Infinite Calendar</strong>
          <span>Reusable React PoC</span>
        </div>
      </div>
      <DemoRouteNav activeRouteId="default" className="demo-route-nav" routes={routes} />
      <a className="walkthrough-link" href="/guide">
        <BookOpenText size={15} aria-hidden />
        Read the integration field guide
      </a>
      <div className="data-api-control-row" data-testid="data-api-control-row">
        <DatasetControl scale={scale} onChange={onScaleChange} />
        <ApiLatencyControl
          latencyMs={controls.apiLatencyMs}
          pendingRequestCount={pendingApiRequestCount}
          onChange={controls.setApiLatencyMs}
        />
      </div>
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
      <DemoZoomControl className="zoom-control" />
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
      <section
        ref={activityPaneRef}
        className="demo-message"
        data-testid="demo-message"
        aria-label="Demo activity"
        role="log"
      >
        <ol>
          {activityEntries.map((entry, index) => (
            <li key={`${index}-${entry}`} data-testid="demo-activity-entry">
              {entry}
            </li>
          ))}
        </ol>
      </section>
      <DemoStatsPanel />
    </aside>
  );
}
