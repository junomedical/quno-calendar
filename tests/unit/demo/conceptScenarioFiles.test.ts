import { describe, expect, it } from "vitest";
import { config, files, sceneFiles } from "#quno-demo/concept/scenarioSources";
import { parseScenarioFiles } from "#quno-demo/concept/scenarioValidation";
import type { Scenario } from "#quno-demo/concept/scenarioTypes";

describe("separate product scenario files", () => {
  it.each(Object.keys(files))("edits %s without changing another product", (id) => {
    const edited = structuredClone(files);
    edited[id as keyof typeof files].title = "Independent demo";
    const document = parseScenarioFiles(config, edited, sceneFiles);
    expect(document.products.map((product) => product.id)).toEqual(config.products);
    for (const product of document.products) {
      const original = {
        ...files[product.id],
        scenarios: files[product.id].scenarios.map((id) => sceneFiles[`${product.id}/${id}`])
      };
      expect(product).toEqual(product.id === id ? { ...original, title: "Independent demo" } : original);
    }
  });
  it("follows the manifest's tab order and initial product", () => {
    const manifest = { ...config, startProduct: "timepicker", products: [...config.products].reverse() };
    const document = parseScenarioFiles(manifest, files, sceneFiles);
    expect(document.products.map((product) => product.id)).toEqual(manifest.products);
    expect(document.startProduct).toBe("timepicker");
  });
  it("rejects a missing product file with its path", () => {
    expect(() => parseScenarioFiles(config, { ...files, datepicker: undefined }, sceneFiles)).toThrow(
      "scenarios/datepicker.json"
    );
  });
  it("rejects a product stored under the wrong filename", () => {
    expect(() => parseScenarioFiles(config, { ...files, datepicker: files.timepicker }, sceneFiles)).toThrow(
      "scenarios/datepicker.json"
    );
  });
  it("rejects duplicated product references", () => {
    expect(() =>
      parseScenarioFiles({ ...config, products: config.products.map(() => "datepicker") }, files, sceneFiles)
    ).toThrow("unique product IDs");
  });
  it("still validates scenes inside each product file", () => {
    const edited = structuredClone(files);
    edited.timepicker.preview = ["missing"];
    expect(() => parseScenarioFiles(config, edited, sceneFiles)).toThrow("timepicker.preview");
  });
});

describe("one JSON file per scenario", () => {
  it("discovers exactly the twenty-five referenced scenario files", () => {
    const references = Object.values(files).flatMap((product) => product.scenarios.map((id) => `${product.id}/${id}`));
    expect(Object.keys(sceneFiles).sort()).toEqual(references.sort());
    expect(references).toHaveLength(25);
  });
  it.each(Object.keys(sceneFiles))("edits only %s", (path) => {
    const edited = { ...sceneFiles, [path]: { ...(sceneFiles[path] as Scenario), hint: "Independent scenario" } };
    const document = parseScenarioFiles(config, files, edited);
    for (const product of document.products) {
      for (const scene of product.scenarios) {
        const key = `${product.id}/${scene.id}`;
        const original = sceneFiles[key];
        expect(scene).toEqual(key === path ? { ...(original as Scenario), hint: "Independent scenario" } : original);
      }
    }
  });
  it("adds and orders a new scene with JSON data alone", () => {
    const manifests = structuredClone(files);
    manifests["date-input"].scenarios.unshift("custom");
    manifests["date-input"].preview = ["custom"];
    const scene = { ...(sceneFiles["date-input/natural"] as Scenario), id: "custom", label: "New JSON scene" };
    const document = parseScenarioFiles(config, manifests, { ...sceneFiles, "date-input/custom": scene });
    const product = document.products.find((item) => item.id === "date-input")!;
    expect(product.scenarios[0]).toEqual(scene);
    expect(product.preview).toEqual(["custom"]);
  });
  it("reports a missing scenario by its filename", () => {
    expect(() => parseScenarioFiles(config, files, { ...sceneFiles, "date-input/natural": undefined })).toThrow(
      "scenarios/date-input/natural.json"
    );
  });
  it("rejects a scenario stored under the wrong filename", () => {
    expect(() => parseScenarioFiles(config, files, { ...sceneFiles, "date-input/natural": { id: "wrong" } })).toThrow(
      "scenarios/date-input/natural.json"
    );
  });
  it("rejects duplicate scenario references in a product manifest", () => {
    const manifests = structuredClone(files);
    manifests["date-input"].scenarios.push("natural");
    expect(() => parseScenarioFiles(config, manifests, sceneFiles)).toThrow("unique scene IDs");
  });
});
