import { lazy } from "react";
import { ProjectHome } from "#quno-demo/app/ProjectHome";
import { DocumentationShell } from "#quno-demo/app/DocumentationShell";
import { DocumentPage } from "#quno-demo/app/DocumentPage";
const pages = {
  "infinite-calendar": lazy(() =>
    import("./timeline/IntegrationWalkthrough").then((m) => ({ default: m.IntegrationWalkthrough }))
  ),
  datepicker: lazy(() => import("./date-picker/DatePickerStory").then((m) => ({ default: m.DatePickerStory }))),
  "date-input": lazy(() =>
    import("./date-input/DateInputFieldGuide").then((m) => ({ default: m.DateInputFieldGuide }))
  ),
  timepicker: lazy(() =>
    import("./time-picker/TimePickerFieldGuide").then((m) => ({ default: m.TimePickerFieldGuide }))
  ),
  "date-parser": lazy(() =>
    import("./date-parser/DateParserFieldGuide").then((m) => ({ default: m.DateParserFieldGuide }))
  )
};
export function CurrentDocs({ product }: { product: string }) {
  const Page = Object.prototype.hasOwnProperty.call(pages, product)
    ? pages[product as keyof typeof pages]
    : ProjectHome;
  return (
    <DocumentationShell product={product}>
      <DocumentPage key={product} page={Page} />
    </DocumentationShell>
  );
}
