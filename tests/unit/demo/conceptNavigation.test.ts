import { describe, expect, it } from "vitest";
import { conceptHref, readConceptLocation } from "#quno-demo/concept/useConceptNavigation";
import { catalog } from "#quno-demo/concept/scenarioCatalog";
import { guideDemos } from "#quno-demo/guide/shared/guideDemos";
describe("shared concept locations", () => {
  it.each(["infinite-calendar", "datepicker", "date-input", "timepicker", "date-parser"] as const)(
    "round-trips every %s demo and introduction",
    (product) => {
      for (const scene of catalog[product]) {
        window.history.replaceState(null, "", conceptHref({ product, scene: scene.id }));
        expect(readConceptLocation()).toEqual({ product, scene: scene.id, intro: false });
      }
      window.history.replaceState(null, "", conceptHref({ product, intro: true }));
      expect(readConceptLocation()).toEqual({ product, scene: catalog[product][0].id, intro: true });
    }
  );
  it.each(["/", "/concept"])("reads previously shared query URLs at %s", (path) => {
    window.history.replaceState(null, "", path + "?product=date-parser&demo=ambiguity");
    expect(readConceptLocation()).toEqual({ product: "date-parser", scene: "ambiguity", intro: false });
  });
  it("gives path segments precedence over legacy query state", () => {
    window.history.replaceState(null, "", "/datepicker/paint?product=timepicker&demo=cadence");
    expect(readConceptLocation()).toEqual({ product: "datepicker", scene: "paint", intro: false });
  });
  it("only connects documentation sections to existing demos", () => {
    for (const product of Object.keys(guideDemos) as (keyof typeof guideDemos)[]) {
      for (const scene of Object.values(guideDemos[product]).flat())
        expect(catalog[product].some(({ id }) => id === scene)).toBe(true);
    }
  });
});
