/// <reference types="vite/client" />
import config from "./demo.json";
import calendar from "#quno-demo/concept/scenarios/infinite-calendar.json";
import datepicker from "#quno-demo/concept/scenarios/datepicker.json";
import dateInput from "#quno-demo/concept/scenarios/date-input.json";
import timepicker from "#quno-demo/concept/scenarios/timepicker.json";
import dateParser from "#quno-demo/concept/scenarios/date-parser.json";

export { config };
export const files = {
  "infinite-calendar": calendar,
  datepicker,
  "date-input": dateInput,
  timepicker,
  "date-parser": dateParser
};

const discovered = import.meta.glob<unknown>("#quno-demo/concept/scenarios/*/*.json", {
  eager: true,
  import: "default"
});
export const sceneFiles = Object.fromEntries(
  Object.entries(discovered).map(([path, scene]) => [
    path
      .split("/")
      .slice(-2)
      .join("/")
      .replace(/\.json$/, ""),
    scene
  ])
);
