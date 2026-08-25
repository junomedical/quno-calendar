import { afterEach, describe, expect, it } from "vitest";
import {
  timelineGridAtPoint,
  timelineGridIdentity
} from "#quno-internal/timeline/infinite/interactions/hit-testing/timelineHitTarget";

function resolvePointTo(element: Element) {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => element
  });
}

afterEach(() => document.body.replaceChildren());

describe("timelineGridAtPoint", () => {
  it("returns only a grid owned by the supplied calendar container", () => {
    const firstCalendar = document.createElement("section");
    const secondCalendar = document.createElement("section");
    const firstGrid = firstCalendar.appendChild(document.createElement("div"));
    const secondGrid = secondCalendar.appendChild(document.createElement("div"));
    firstGrid.className = "quno-calendar-row-grid";
    secondGrid.className = "quno-calendar-row-grid";
    const secondEvent = secondGrid.appendChild(document.createElement("div"));
    document.body.append(firstCalendar, secondCalendar);
    resolvePointTo(secondEvent);

    expect(
      timelineGridAtPoint(firstCalendar, { clientX: 10, clientY: 10 }, ".quno-calendar-row-grid", ".sticky")
    ).toBeNull();
    expect(
      timelineGridAtPoint(secondCalendar, { clientX: 10, clientY: 10 }, ".quno-calendar-row-grid", ".sticky")
    ).toBe(secondGrid);
  });

  it("rejects horizontal and vertical sticky chrome even when it overlaps a grid", () => {
    const calendar = document.createElement("section");
    const horizontalGrid = calendar.appendChild(document.createElement("div"));
    horizontalGrid.className = "quno-calendar-row-grid";
    const horizontalLabel = horizontalGrid.appendChild(document.createElement("div"));
    horizontalLabel.className = "quno-calendar-day-header";
    const verticalGrid = calendar.appendChild(document.createElement("div"));
    verticalGrid.className = "icv-calendar-column-grid";
    const verticalLabel = verticalGrid.appendChild(document.createElement("div"));
    verticalLabel.className = "icv-time-pane";
    document.body.append(calendar);

    resolvePointTo(horizontalLabel);
    expect(
      timelineGridAtPoint(
        calendar,
        { clientX: 20, clientY: 20 },
        ".quno-calendar-row-grid",
        ".quno-calendar-day-header"
      )
    ).toBeNull();

    resolvePointTo(verticalLabel);
    expect(
      timelineGridAtPoint(calendar, { clientX: 20, clientY: 20 }, ".icv-calendar-column-grid", ".icv-time-pane")
    ).toBeNull();
  });

  it("reads date and resource identity from the mounted grid", () => {
    const day = document.createElement("div");
    day.dataset.testid = "calendar-day";
    day.dataset.date = "2026-07-18";
    day.dataset.index = "31";
    const row = day.appendChild(document.createElement("div"));
    row.dataset.calendarId = "room-b";
    const grid = row.appendChild(document.createElement("div"));

    expect(timelineGridIdentity(grid, ["room-a", "room-b"])).toEqual({
      dateKey: "2026-07-18",
      calendarId: "room-b",
      dayIndex: 31,
      rowIndex: 1
    });
  });
});
