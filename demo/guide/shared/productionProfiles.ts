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
    { label: "JavaScript", gzip: "39.47 KiB", raw: "166.87 KiB", budget: "≤ 50 KiB gzip" },
    { label: "Optional CSS", gzip: "1.99 KiB", raw: "10.48 KiB", budget: "≤ 2 KiB gzip" }
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
    { label: "JavaScript", gzip: "12.46 KiB", raw: "50.37 KiB", budget: "≤ 12.5 KiB gzip" },
    { label: "Optional CSS", gzip: "3.36 KiB", raw: "21.83 KiB", budget: "≤ 3.5 KiB gzip" }
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
    { label: "JavaScript", gzip: "9.60 KiB", raw: "34.59 KiB", budget: "≤ 10 KiB gzip" },
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
  artifacts: [{ label: "JavaScript", gzip: "6.00 KiB", raw: "22.55 KiB", budget: "≤ 7 KiB gzip" }],
  runtime: "No UI framework runtime",
  compatibility: "ESM, CommonJS, browser, Node, and SSR",
  dependencies: "No runtime dependencies"
};

export const timepickerProduction: FieldGuideProductionProfile = {
  product: "Quno/Timepicker",
  entrypoint: "@quno/calendar/timepicker",
  stylesheet: "@quno/calendar/timepicker/styles.css",
  artifacts: [
    { label: "JavaScript", gzip: "1.59 KiB", raw: "4.68 KiB", budget: "≤ 3 KiB gzip" },
    { label: "Optional CSS", gzip: "0.78 KiB", raw: "2.53 KiB", budget: "≤ 1.5 KiB gzip" }
  ],
  runtime: "React 18+ and React DOM peers",
  compatibility: "Preact 10.18+ through compat aliases",
  dependencies: "No bundled date, parser, or positioning library"
};
