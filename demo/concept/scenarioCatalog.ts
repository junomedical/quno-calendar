import { config, files, sceneFiles } from "./scenarioSources";
import { parseScenarioFiles } from "./scenarioValidation";
import type { ProductId, Scenario } from "./scenarioTypes";
export type { ProductId, Scenario } from "./scenarioTypes";

export const scenarioDocument = parseScenarioFiles(config, files, sceneFiles);
export const products = scenarioDocument.products;
export const catalog = Object.fromEntries(products.map((item) => [item.id, item.scenarios])) as {
  [P in ProductId]: Scenario<P>[];
};
export const previews = Object.fromEntries(products.map((item) => [item.id, item.preview])) as Record<
  ProductId,
  string[]
>;
export const explore = Object.fromEntries(products.map((item) => [item.id, item.explore])) as Record<
  ProductId,
  [string, string][]
>;
export function getScenario<P extends ProductId>(product: P, id: string): Scenario<P> {
  const scene = catalog[product].find((item) => item.id === id);
  if (!scene) throw new Error(`Unknown demonstration: ${product}/${id}`);
  return scene;
}
