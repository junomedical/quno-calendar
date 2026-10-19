import type { DateRange, DateSelectionMode, IsoDate } from "@quno/calendar";
import type { CalendarView } from "@quno/calendar/infinite-calendar";
import type { MinuteCadence } from "@quno/calendar/timepicker";

export type InitialByProduct = {
  "infinite-calendar": {
    view: CalendarView | "preferred";
    theme: string;
    density: number;
    zoom: number;
    focusDraft?: boolean;
    controls: ("view" | "theme" | "density" | "zoom")[];
  };
  datepicker: { range: DateRange | null; single: boolean };
  "date-input": { range: DateRange | null; selectionMode: DateSelectionMode; picker: boolean; label: string };
  timepicker: { value: string | null; cadence: MinuteCadence; businessHours: boolean; date?: IsoDate };
  "date-parser": { text: string; order: "dmy" | "mdy"; clocks: boolean };
};
export type ProductId = keyof InitialByProduct;
export type Motion = { durationMs: number; easing: "linear" | "ease-in-out" };
export type PlaybackStep =
  | { action: "wait"; ms: number }
  | { action: "find" | "hover"; target: string }
  | { action: "aim" | "click"; target: string; caption: string }
  | { action: "cue"; caption: string; gesture: "move" | "hover" | "scroll" | "key" }
  | { action: "type"; target: string; text: string }
  | { action: "key"; target: string; key: string; caret?: number }
  | ({ action: "scroll"; target: string; amount: number; caption?: string } & Motion)
  | ({ action: "scroll-year"; target: string; year: number } & Motion)
  | ({ action: "scroll-loop"; target: string; amount: number; pauseMs: number } & Motion)
  | ({ action: "scroll-to"; target: string; destination: string; caption: string } & Motion)
  | ({ action: "scroll-day"; target: string; cell: string; horizontalAmount: number; verticalOffset: number } & Motion)
  | ({ action: "slider"; target: string; value: number; caption: string } & Motion)
  | {
      action: "wheel";
      target: string;
      caption: string;
      cue: string;
      deltaY: number;
      shiftKey: boolean;
      count: number;
      intervalMs: number;
    }
  | { action: "drag-dates"; from: IsoDate; to: IsoDate }
  | { action: "draw-event"; reference: string; grid: string; viewport: string; startOffset: number; endOffset: number }
  | { action: "move-event"; reference: string; grid: string; viewport: string; timeOffset: number };
export type Scenario<P extends ProductId = ProductId> = {
  id: string;
  label: string;
  hint: string;
  paragraphs: string[];
  anchor: string;
  initial: InitialByProduct[P];
  steps: PlaybackStep[];
  loop?: "continue";
  chapterOnly?: boolean;
};
export type Product<P extends ProductId = ProductId> = {
  id: P;
  label: string;
  title: string;
  description: string;
  preview: string[];
  explore: [string, string][];
  scenarios: Scenario<P>[];
};
export type ScenarioDocument = {
  version: 1;
  startProduct: ProductId;
  context: { referenceDate: IsoDate; initialMonth: IsoDate; expectedRange: DateRange };
  products: Product[];
};
