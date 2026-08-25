import type { LucideIcon } from "lucide-react";
import type { EventCreateRequest, EventMoveRequest, EventRenderer } from "@quno/calendar/infinite-calendar";
import type { DemoControlDefaults, DemoLayoutSettings } from "#quno-demo/showcase/hooks/useDemoControls";

export type DemoPreset = {
  id: "demo1" | "demo2" | "demo3";
  brandIcon: LucideIcon;
  title: string;
  subtitle: string;
  initialScale: number;
  controls: DemoControlDefaults;
  layout: DemoLayoutSettings;
  eventRenderer: EventRenderer;
  messages: {
    initial: string;
    datasetLoaded: (scale: number) => string;
    moveRejected: string;
    moveAccepted: (request: EventMoveRequest) => string;
    eventCreated: (request: EventCreateRequest) => string;
  };
};
