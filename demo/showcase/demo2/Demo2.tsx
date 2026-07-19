import { Columns3 } from "lucide-react";
import { PresetDemo } from "../preset/PresetDemo";
import type { DemoPreset } from "../preset/types";
import type { DemoRoute } from "../types";
import { Demo2EventCard } from "./Demo2EventCard";
import "./Demo2.css";

const plannerPreset: DemoPreset = {
  id: "demo2",
  brandIcon: Columns3,
  title: "Resource Planner",
  subtitle: "Wide vertical columns",
  sourcePath: "demo/showcase/demo2/Demo2.tsx",
  initialScale: 1_000,
  controls: {
    calendarView: "infinite-vertical",
    calendarCount: 8,
    zoom: 2.4,
    snapMinutes: 15,
    startHour: 7,
    endHour: 20,
    excludeWeekends: false,
    editAvailabilities: false
  },
  layout: {
    rowHeight: 58,
    dayHeaderHeight: 52,
    labelWidth: 280,
    verticalColumnMinWidth: 280,
    verticalColumnOverlapCapacity: 4,
    verticalColumnOverlapGrowth: 90,
    verticalEventHoverMinHeight: 76
  },
  eventRenderer: Demo2EventCard,
  messages: {
    initial: "Wide vertical resource planner",
    datasetLoaded: (scale) => `Loaded ${scale.toLocaleString()} planner events/year`,
    moveRejected: "Move rejected",
    moveAccepted: () => "Move accepted",
    eventCreated: () => "Created planner appointment"
  }
};

export function Demo2({ routes }: { routes: DemoRoute[] }) {
  return <PresetDemo preset={plannerPreset} routes={routes} />;
}
