import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import { prepareEventCell, prepareEventLayers } from "#quno-internal/timeline/infinite/events/layout/layout";

const settings = { startHour: 8, endHour: 18 };

function overlappingEvents(count: number): CalendarEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `event-${index}`,
    calendarId: "calendar-a",
    title: `Event ${index}`,
    start: "2026-07-18T09:00:00",
    end: "2026-07-18T10:00:00"
  }));
}

function medianRuntime(events: CalendarEvent[], repetitions: number): number {
  const samples = Array.from({ length: 5 }, () => {
    const startedAt = performance.now();
    for (let iteration = 0; iteration < repetitions; iteration += 1) prepareEventCell({ events, settings });
    return performance.now() - startedAt;
  }).sort((left, right) => left - right);
  return samples[2];
}

function medianLayerRuntime(events: CalendarEvent[], repetitions: number): number {
  const samples = Array.from({ length: 5 }, () => {
    const startedAt = performance.now();
    for (let iteration = 0; iteration < repetitions; iteration += 1) prepareEventLayers({ events, settings });
    return performance.now() - startedAt;
  }).sort((left, right) => left - right);
  return samples[2];
}

describe("prepared layout scaling", () => {
  it("keeps a 10x dense-cell increase below 25x runtime", () => {
    const small = overlappingEvents(500);
    const large = overlappingEvents(5_000);
    prepareEventCell({ events: small, settings });
    prepareEventCell({ events: large, settings });

    const smallRuntime = medianRuntime(small, 4);
    const largeRuntime = medianRuntime(large, 4);
    expect(largeRuntime / Math.max(0.1, smallRuntime)).toBeLessThan(25);
  });

  it("keeps a 10x mixed appointment/availability increase below 25x runtime", () => {
    const mixed = (count: number) =>
      overlappingEvents(count).map((event, index) => ({
        ...event,
        kind: index % 2 === 0 ? ("appointment" as const) : ("availability" as const)
      }));
    const small = mixed(500);
    const large = mixed(5_000);
    prepareEventLayers({ events: small, settings });
    prepareEventLayers({ events: large, settings });

    const smallRuntime = medianLayerRuntime(small, 4);
    const largeRuntime = medianLayerRuntime(large, 4);
    expect(largeRuntime / Math.max(0.1, smallRuntime)).toBeLessThan(25);
  });
});
