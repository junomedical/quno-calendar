import { describe, expect, it, vi } from "vitest";
import { scenarioDocument as data } from "#quno-demo/concept/scenarioCatalog";
import { parseScenarioDocument } from "#quno-demo/concept/scenarioValidation";
import { playSteps } from "#quno-demo/concept/playbackSteps";
import type { PlaybackActor } from "#quno-demo/concept/PlaybackActor";

const copy = () => JSON.parse(JSON.stringify(data));
describe("JSON controlled demonstration scenarios", () => {
  it("loads the authored document and resolves every preview scene", () => {
    const document = parseScenarioDocument(copy());
    expect(document.products.flatMap((product) => product.scenarios)).toHaveLength(19);
    for (const product of document.products) {
      expect(product.preview.every((id) => product.scenarios.some((scene) => scene.id === id))).toBe(true);
    }
  });
  it.each([
    [
      "missing explainer",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[0].paragraphs = [];
      }
    ],
    [
      "too many explainer paragraphs",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[0].paragraphs = ["One", "Two", "Three"];
      }
    ],
    [
      "invalid animation duration",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[0].steps[2].durationMs = -20;
      }
    ],
    [
      "unsupported easing",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[1].steps[2].easing = "spring";
      }
    ],
    [
      "unknown action",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[0].steps[0].action = "run-code";
      }
    ],
    [
      "missing action argument",
      (value: ReturnType<typeof copy>) => {
        delete value.products[0].scenarios[0].steps[0].target;
      }
    ],
    [
      "misspelled argument",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[0].steps[0].traget = "#example";
      }
    ],
    [
      "negative duration",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[0].steps[1].ms = -1;
      }
    ],
    [
      "wrong initial state",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[0].initial.zoom = "big";
      }
    ],
    [
      "unknown preview",
      (value: ReturnType<typeof copy>) => {
        value.products[0].preview = ["missing"];
      }
    ],
    [
      "duplicate scene",
      (value: ReturnType<typeof copy>) => {
        value.products[0].scenarios[1].id = "scroll";
      }
    ],
    [
      "duplicate preview",
      (value: ReturnType<typeof copy>) => {
        value.products[0].preview = ["scroll", "scroll"];
      }
    ],
    [
      "missing product",
      (value: ReturnType<typeof copy>) => {
        value.products.pop();
      }
    ],
    [
      "duplicate product",
      (value: ReturnType<typeof copy>) => {
        value.products[1] = value.products[0];
      }
    ],
    [
      "invalid date",
      (value: ReturnType<typeof copy>) => {
        value.context.referenceDate = "2026-02-30";
      }
    ],
    [
      "backward range",
      (value: ReturnType<typeof copy>) => {
        value.context.expectedRange.end = "2025-01-01";
      }
    ],
    [
      "unsupported cadence",
      (value: ReturnType<typeof copy>) => {
        value.products[3].scenarios[0].initial.cadence = 60;
      }
    ],
    [
      "wrong action product",
      (value: ReturnType<typeof copy>) => {
        value.products[1].scenarios[0].steps = [value.products[0].scenarios[6].steps[2]];
      }
    ]
  ])("rejects %s before playback", (_name, change) => {
    const value = copy();
    change(value);
    expect(() => parseScenarioDocument(value)).toThrow("Invalid scenario JSON");
  });
  it("executes an added JSON scene in declared order and stops before later actions on takeover", async () => {
    const document = parseScenarioDocument(copy());
    const product = document.products.find((item) => item.id === "date-input")!;
    product.scenarios.push({
      ...product.scenarios[0],
      id: "custom-scene",
      steps: [
        { action: "type", target: "#custom", text: "tomorrow" },
        { action: "key", target: "#custom", key: "Enter" },
        { action: "wait", ms: 123 }
      ]
    });
    product.preview = ["custom-scene"];
    const scene = parseScenarioDocument(document)
      .products.find((item) => item.id === "date-input")!
      .scenarios.at(-1)!;
    const controller = new AbortController();
    const calls: unknown[][] = [];
    const actor = {
      signal: controller.signal,
      type: vi.fn(async (...args: unknown[]) => {
        calls.push(args);
      }),
      key: vi.fn(async (...args: unknown[]) => {
        calls.push(args);
        controller.abort();
      }),
      wait: vi.fn()
    };
    await expect(playSteps(actor as unknown as PlaybackActor, scene.steps)).rejects.toThrow();
    expect(calls).toEqual([
      ["#custom", "tomorrow"],
      ["#custom", "Enter", undefined]
    ]);
    expect(actor.wait).not.toHaveBeenCalled();
  });
});
