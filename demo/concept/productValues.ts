import { scenarioDocument } from "./scenarioCatalog";
export const { expectedRange, referenceDate, initialMonth } = scenarioDocument.context;
export const referenceLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
}).format(new Date(`${referenceDate}T00:00:00Z`));
