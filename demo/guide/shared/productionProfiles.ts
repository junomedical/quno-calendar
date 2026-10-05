export type FieldGuideProductionProfile = {
  product: string;
  entrypoint: string;
  stylesheet: string | null;
  artifacts: ReadonlyArray<{
    label: string;
    gzip: string;
    raw: string;
    budget: string;
  }>;
  runtime: string;
  compatibility: string;
  dependencies: string;
};

export const infiniteCalendarProduction: FieldGuideProductionProfile = {
  product: "Quno/Infinite Calendar",
  entrypoint: "@quno/calendar/infinite-calendar",
  stylesheet: "@quno/calendar/infinite-calendar/styles.css",
  artifacts: [
    { label: "JavaScript", gzip: "38.59 KiB", raw: "163.08 KiB", budget: "≤ 39 KiB gzip" },
    { label: "Optional CSS", gzip: "1.95 KiB", raw: "10.21 KiB", budget: "≤ 2 KiB gzip" }
  ],
  runtime: "React 18+ and React DOM peers",
  compatibility: "Preact 10.18+ through compat aliases",
  dependencies: "@tanstack/react-virtual stays external"
};

export const datepickerProduction: FieldGuideProductionProfile = {
  product: "Quno/Datepicker",
  entrypoint: "@quno/calendar/datepicker",
  stylesheet: "@quno/calendar/datepicker/styles.css",
  artifacts: [
    { label: "JavaScript", gzip: "10.47 KiB", raw: "42.17 KiB", budget: "≤ 10.5 KiB gzip" },
    { label: "Optional CSS", gzip: "3.22 KiB", raw: "20.08 KiB", budget: "≤ 3.5 KiB gzip" }
  ],
  runtime: "React 18+ and React DOM peers",
  compatibility: "Preact 10.18+ through compat aliases",
  dependencies: "No bundled date or positioning library"
};

export const dateInputProduction: FieldGuideProductionProfile = {
  product: "Quno/Date Input",
  entrypoint: "@quno/calendar/date-input",
  stylesheet: "@quno/calendar/date-input/styles.css",
  artifacts: [
    { label: "JavaScript", gzip: "7.82 KiB", raw: "29.83 KiB", budget: "≤ 8 KiB gzip" },
    { label: "Optional CSS", gzip: "0.58 KiB", raw: "2.29 KiB", budget: "≤ 1 KiB gzip" }
  ],
  runtime: "React 18+ and React DOM peers",
  compatibility: "Preact 10.18+ through compat aliases",
  dependencies: "No bundled date library"
};

export const dateParserProduction: FieldGuideProductionProfile = {
  product: "Quno/Date Parser",
  entrypoint: "@quno/calendar/date-parser",
  stylesheet: null,
  artifacts: [{ label: "JavaScript", gzip: "5.20 KiB", raw: "21.12 KiB", budget: "≤ 6 KiB gzip" }],
  runtime: "No UI framework runtime",
  compatibility: "ESM, CommonJS, browser, Node, and SSR",
  dependencies: "No runtime dependencies"
};
