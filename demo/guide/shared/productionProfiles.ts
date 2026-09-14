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
    { label: "JavaScript", gzip: "34.29 KiB", raw: "139.96 KiB", budget: "≤ 35 KiB gzip" },
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
    { label: "JavaScript", gzip: "9.00 KiB", raw: "33.82 KiB", budget: "≤ 10 KiB gzip" },
    { label: "Optional CSS", gzip: "3.20 KiB", raw: "19.84 KiB", budget: "≤ 3.5 KiB gzip" }
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
    { label: "JavaScript", gzip: "6.77 KiB", raw: "22.89 KiB", budget: "≤ 7 KiB gzip" },
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
  artifacts: [{ label: "JavaScript", gzip: "4.45 KiB", raw: "15.33 KiB", budget: "≤ 6 KiB gzip" }],
  runtime: "No UI framework runtime",
  compatibility: "ESM, CommonJS, browser, Node, and SSR",
  dependencies: "No runtime dependencies"
};
