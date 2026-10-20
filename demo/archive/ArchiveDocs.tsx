import "./archive.css";
import { lazy } from "react";
import { DocumentPage } from "#quno-demo/app/DocumentPage";
const pages = {
  "infinite-calendar": lazy(() =>
    import("./guide/timeline/IntegrationWalkthrough").then((m) => ({ default: m.IntegrationWalkthrough }))
  ),
  datepicker: lazy(() => import("./guide/date-picker/DatePickerStory").then((m) => ({ default: m.DatePickerStory }))),
  "date-input": lazy(() =>
    import("./guide/date-input/DateInputFieldGuide").then((m) => ({ default: m.DateInputFieldGuide }))
  ),
  timepicker: lazy(() =>
    import("./guide/time-picker/TimePickerFieldGuide").then((m) => ({ default: m.TimePickerFieldGuide }))
  ),
  "date-parser": lazy(() =>
    import("./guide/date-parser/DateParserFieldGuide").then((m) => ({ default: m.DateParserFieldGuide }))
  )
};
const Home = lazy(() => import("./ArchiveHome").then((m) => ({ default: m.ArchiveHome })));
export function ArchiveDocs({ product }: { product: string }) {
  const Page = Object.prototype.hasOwnProperty.call(pages, product) ? pages[product as keyof typeof pages] : Home;
  return (
    <div className="docs-archive">
      <aside style={{ padding: "12px 20px", background: "#f0eafa", color: "#393046", fontSize: 14 }}>
        Archived field guides · 20 October 2026 · <a href="/docs">Current documentation →</a>
      </aside>
      <DocumentPage key={product} page={Page} />
    </div>
  );
}
