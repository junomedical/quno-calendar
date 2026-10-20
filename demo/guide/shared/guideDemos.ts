import { catalog, type ProductId } from "#quno-demo/concept/scenarioCatalog";
export const guideProducts: Record<string, ProductId> = {
  "Quno/Infinite Calendar": "infinite-calendar",
  "Quno/Datepicker": "datepicker",
  "Quno/Date Input": "date-input",
  "Quno/Timepicker": "timepicker",
  "Quno/Date Parser": "date-parser"
};
export const guideDemos = Object.fromEntries(
  Object.entries(catalog).map(([product, scenes]) => [
    product,
    scenes.reduce<Record<string, string[]>>((links, scene) => {
      (links[scene.anchor] ??= []).push(scene.id);
      return links;
    }, {})
  ])
) as Record<ProductId, Record<string, string[]>>;
