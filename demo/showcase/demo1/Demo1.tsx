import { CalendarDays } from "lucide-react";
import { PresetDemo } from "#quno-demo/showcase/preset/PresetDemo";
import type { DemoPreset } from "#quno-demo/showcase/preset/types";
import type { DemoRoute } from "#quno-demo/showcase/types";
import { Demo1EventCard } from "./Demo1EventCard";

const compactPreset: DemoPreset = {
  id: "demo1",
  brandIcon: CalendarDays,
  title: "Compact Board",
  subtitle: "Horizontal clinic throughput",
  initialScale: 1_000,
  controls: {
    calendarView: "infinite-horizontal",
    calendarCount: 7,
    zoom: 1.4,
    snapMinutes: 10,
    startHour: 7,
    endHour: 19,
    excludeWeekends: false,
    editAvailabilities: false
  },
  layout: {
    rowHeight: 42,
    dayHeaderHeight: 36,
    labelWidth: 190,
    verticalColumnMinWidth: 210,
    verticalColumnOverlapCapacity: 2,
    verticalColumnOverlapGrowth: 60,
    verticalEventHoverMinHeight: 54
  },
  eventRenderer: Demo1EventCard,
  messages: {
    initial: "Compact horizontal board",
    datasetLoaded: (scale) => `Loaded ${scale.toLocaleString()} compact events/year`,
    moveRejected: "Move rejected",
    moveAccepted: () => "Move accepted",
    eventCreated: () => "Created compact appointment"
  }
};

export function Demo1({ routes }: { routes: DemoRoute[] }) {
  return <PresetDemo preset={compactPreset} routes={routes} />;
}
