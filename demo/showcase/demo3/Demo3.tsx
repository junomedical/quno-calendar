import { CalendarCheck2 } from "lucide-react";
import { PresetDemo } from "../preset/PresetDemo";
import type { DemoPreset } from "../preset/types";
import type { DemoRoute } from "../types";
import { Demo3EventCard } from "./Demo3EventCard";

const availabilityPreset: DemoPreset = {
  id: "demo3",
  brandIcon: CalendarCheck2,
  title: "Availability Board",
  subtitle: "Availability-first editing",
  sourcePath: "demo/showcase/demo3/Demo3.tsx",
  initialScale: 5_000,
  controls: {
    calendarView: "infinite-vertical",
    calendarCount: 3,
    zoom: 1.8,
    snapMinutes: 5,
    startHour: 8,
    endHour: 18,
    excludeWeekends: true,
    editAvailabilities: true
  },
  layout: {
    rowHeight: 54,
    dayHeaderHeight: 48,
    labelWidth: 260,
    verticalColumnMinWidth: 320,
    verticalColumnOverlapCapacity: 2,
    verticalColumnOverlapGrowth: 120,
    verticalEventHoverMinHeight: 72
  },
  eventRenderer: Demo3EventCard,
  messages: {
    initial: "Availability editing enabled",
    datasetLoaded: (scale) => `Loaded ${scale.toLocaleString()} availability events/year`,
    moveRejected: "Availability move rejected",
    moveAccepted: (request) => (request.event.kind === "availability" ? "Availability move accepted" : "Move accepted"),
    eventCreated: (request) => (request.kind === "availability" ? "Created availability" : "Created appointment")
  }
};

export function Demo3({ routes }: { routes: DemoRoute[] }) {
  return <PresetDemo preset={availabilityPreset} routes={routes} />;
}
