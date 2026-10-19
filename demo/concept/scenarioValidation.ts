import type { PlaybackStep, ProductId, ScenarioDocument } from "./scenarioTypes";
import {
  array,
  between,
  boolean,
  clock,
  date,
  nonempty,
  nullable,
  number,
  object,
  oneOf,
  range,
  requireValue,
  text,
  type Check
} from "./scenarioChecks";

const ids = ["infinite-calendar", "datepicker", "date-input", "timepicker", "date-parser"] as const;
const initial: Record<ProductId, Check> = {
  "infinite-calendar": object({
    view: oneOf("preferred", "infinite-horizontal", "infinite-vertical"),
    theme: oneOf("light", "dark", "brand"),
    density: between(4, 400, true),
    zoom: between(0.5, 8),
    controls: array(oneOf("view", "theme", "density", "zoom"))
  }),
  datepicker: object({ range: nullable(range), single: boolean }),
  "date-input": object({
    range: nullable(range),
    selectionMode: oneOf("single", "range"),
    picker: boolean,
    label: nonempty
  }),
  timepicker: object({
    value: nullable(clock),
    cadence: oneOf(1, 2, 3, 4, 5, 6, 10, 15, 20, 30),
    businessHours: boolean
  }),
  "date-parser": object({ text, order: oneOf("dmy", "mdy"), clocks: boolean })
};
const motion = { durationMs: between(0, 60000), easing: oneOf("linear", "ease-in-out") };
const steps: Record<PlaybackStep["action"], Check> = {
  wait: object({ action: oneOf("wait"), ms: between(0, 60000) }),
  find: object({ action: oneOf("find"), target: nonempty }),
  hover: object({ action: oneOf("hover"), target: nonempty }),
  aim: object({ action: oneOf("aim"), target: nonempty, caption: nonempty }),
  click: object({ action: oneOf("click"), target: nonempty, caption: nonempty }),
  cue: object({ action: oneOf("cue"), caption: nonempty, gesture: oneOf("move", "hover", "scroll", "key") }),
  type: object({ action: oneOf("type"), target: nonempty, text }),
  key: object({ action: oneOf("key"), target: nonempty, key: nonempty }, { caret: between(0, 1000, true) }),
  scroll: object({ action: oneOf("scroll"), target: nonempty, amount: number, ...motion }, { caption: nonempty }),
  "scroll-to": object({
    action: oneOf("scroll-to"),
    target: nonempty,
    destination: nonempty,
    caption: nonempty,
    ...motion
  }),
  "scroll-day": object({
    action: oneOf("scroll-day"),
    target: nonempty,
    cell: nonempty,
    horizontalAmount: number,
    verticalOffset: number,
    ...motion
  }),
  slider: object({ action: oneOf("slider"), target: nonempty, value: number, caption: nonempty, ...motion }),
  wheel: object({
    action: oneOf("wheel"),
    target: nonempty,
    caption: nonempty,
    cue: nonempty,
    deltaY: number,
    shiftKey: boolean,
    count: between(1, 100, true),
    intervalMs: between(0, 60000)
  }),
  "drag-dates": object({ action: oneOf("drag-dates"), from: date, to: date }),
  "draw-event": object({
    action: oneOf("draw-event"),
    reference: nonempty,
    grid: nonempty,
    viewport: nonempty,
    startOffset: number,
    endOffset: number
  }),
  "move-event": object({
    action: oneOf("move-event"),
    reference: nonempty,
    grid: nonempty,
    viewport: nonempty,
    timeOffset: number
  })
};
const step: Check = (value, path) => {
  const action = (value as { action?: unknown } | null)?.action;
  requireValue(
    typeof action === "string" && Object.prototype.hasOwnProperty.call(steps, action),
    `${path}.action`,
    "supported action"
  );
  steps[action as PlaybackStep["action"]](value, path);
};
const link: Check = (value, path) => {
  array(nonempty)(value, path);
  requireValue((value as unknown[]).length === 2, path, "[label, guide anchor]");
};
const product: Check = (value, path) => {
  const id = (value as { id?: unknown } | null)?.id;
  oneOf(...ids)(id, `${path}.id`);
  object({
    id: oneOf(...ids),
    label: nonempty,
    title: nonempty,
    description: nonempty,
    preview: array(nonempty, 1),
    explore: array(link),
    scenarios: array(
      object(
        {
          id: nonempty,
          label: nonempty,
          hint: nonempty,
          paragraphs: (value, path) => {
            array(nonempty, 1)(value, path);
            requireValue((value as unknown[]).length <= 2, path, "one or two paragraphs");
          },
          anchor: nonempty,
          initial: initial[id as ProductId],
          steps: array(step, 1)
        },
        {}
      ),
      1
    )
  })(value, path);
};
export function parseScenarioDocument(value: unknown): ScenarioDocument {
  object({
    version: oneOf(1),
    startProduct: oneOf(...ids),
    context: object({ referenceDate: date, initialMonth: date, expectedRange: range }),
    products: array(product, ids.length)
  })(value, "scenarios");
  const document = value as ScenarioDocument;
  requireValue(document.context.initialMonth.endsWith("-01"), "context.initialMonth", "first day of month");
  requireValue(
    new Set(document.products.map((item) => item.id)).size === document.products.length,
    "products",
    "unique product IDs"
  );
  for (const entry of document.products) {
    const scenes = new Set(entry.scenarios.map((scene) => scene.id));
    requireValue(scenes.size === entry.scenarios.length, `${entry.id}.scenarios`, "unique scene IDs");
    requireValue(new Set(entry.preview).size === entry.preview.length, `${entry.id}.preview`, "unique scene IDs");
    for (const id of entry.preview) requireValue(scenes.has(id), `${entry.id}.preview`, `existing scene (${id})`);
    for (const scene of entry.scenarios) {
      for (const action of scene.steps) {
        const calendarAction = ["scroll-day", "draw-event", "move-event"].includes(action.action);
        requireValue(
          !calendarAction || entry.id === "infinite-calendar",
          `${entry.id}.${scene.id}`,
          "calendar action in calendar product"
        );
      }
    }
  }
  return document;
}

export function parseScenarioFiles(
  value: unknown,
  files: Record<string, unknown>,
  sceneFiles: Record<string, unknown>
): ScenarioDocument {
  requireValue(value && typeof value === "object" && !Array.isArray(value), "demo.json", "manifest object");
  const manifest = value as Record<string, unknown>;
  array(oneOf(...ids), ids.length)(manifest.products, "demo.json.products");
  const products = (manifest.products as ProductId[]).map((id) => {
    const entry = files[id] as { id?: unknown; scenarios?: unknown } | undefined;
    requireValue(entry?.id === id, `scenarios/${id}.json`, `product with ID ${id}`);
    array(nonempty, 1)(entry.scenarios, `scenarios/${id}.json.scenarios`);
    const scenarios = (entry.scenarios as string[]).map((sceneId) => {
      const scene = sceneFiles[`${id}/${sceneId}`] as { id?: unknown } | undefined;
      requireValue(scene?.id === sceneId, `scenarios/${id}/${sceneId}.json`, `scenario with ID ${sceneId}`);
      return scene;
    });
    return { ...entry, scenarios };
  });
  return parseScenarioDocument({ ...manifest, products });
}
