import type { ProductId, ScenarioDocument } from "./scenarioTypes";
import {
  array,
  between,
  boolean,
  clock,
  date,
  nonempty,
  nullable,
  object,
  oneOf,
  range,
  requireValue,
  text,
  type Check
} from "./scenarioChecks";

import { step } from "./scenarioStepChecks";

const ids = ["infinite-calendar", "datepicker", "date-input", "timepicker", "date-parser"] as const;
const initial: Record<ProductId, Check> = {
  "infinite-calendar": object(
    {
      view: oneOf("preferred", "infinite-horizontal", "infinite-vertical"),
      theme: oneOf("light", "dark", "brand"),
      density: between(4, 400, true),
      zoom: between(0.5, 8),
      controls: array(oneOf("view", "theme", "density", "zoom"))
    },
    { focusDraft: boolean }
  ),
  datepicker: object({ range: nullable(range), single: boolean }),
  "date-input": object({
    range: nullable(range),
    selectionMode: oneOf("single", "range"),
    picker: boolean,
    label: nonempty
  }),
  timepicker: object(
    {
      value: nullable(clock),
      cadence: oneOf(1, 2, 3, 4, 5, 6, 10, 15, 20, 30),
      businessHours: boolean
    },
    { date }
  ),
  "date-parser": object({ text, order: oneOf("dmy", "mdy"), clocks: boolean })
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
            requireValue(
              (value as unknown[]).length <= (id === "infinite-calendar" ? 3 : 2),
              path,
              "up to three Calendar paragraphs or two for other products"
            );
          },
          anchor: nonempty,
          initial: initial[id as ProductId],
          steps: array(step, 1)
        },
        { loop: oneOf("continue"), chapterOnly: boolean }
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
      requireValue(
        !scene.loop || entry.id === "infinite-calendar" || entry.id === "datepicker",
        `${entry.id}.${scene.id}.loop`,
        "Calendar or Datepicker loop mode"
      );
      for (const action of scene.steps) {
        requireValue(
          action.action !== "scroll-year" || entry.id === "datepicker",
          `${entry.id}.${scene.id}`,
          "year scrolling in Datepicker"
        );
        const calendarAction = ["scroll-loop", "scroll-day", "draw-event", "move-event"].includes(action.action);
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
