import type { JSX } from "react";
import { FieldGuideRecipe } from "#quno-demo/guide/shared/FieldGuideFeature";
import { FieldGuideProduction } from "#quno-demo/guide/shared/FieldGuideProduction";
import { datepickerProduction } from "#quno-demo/guide/shared/productionProfiles";
import { TypeToEditExample } from "./TypeToEditExample";

const comparisons = [
  ["Forced order", "Choose From first, then choose To", "Click, paint, resize, or move in any order"],
  [
    "Layout stability",
    "Uneven month geometry or shifting two-panel layouts",
    "One stable six-week month and one-line title"
  ],
  [
    "Editing an existing range",
    "Restart the From–To selection sequence",
    "Jump near an endpoint, click nearby, or drag it directly"
  ],
  ["Selecting one day", "Often click the same date twice", "One click creates start equal to end"],
  [
    "Fixing a wrong guess",
    "An outside date often starts a new selection",
    "One click applies context; repeat it for the other endpoint or one day"
  ],
  [
    "Cross-month dragging",
    "Only the small adjacent-date overlap is usable",
    "A trailing context row plus a hidden prior week in the day names"
  ],
  [
    "Mobile parity",
    "Touch is often a reduced tap-only flow",
    "Tap, paint, resize, move, and hidden-week drag use the same model"
  ]
];

export const DifferenceStory = (): JSX.Element => (
  <section className="story__wide" id="difference">
    <div className="story__section-heading">
      <span>Why another datepicker?</span>
      <h2>Range editing, not two date inputs sharing a box</h2>
      <p>
        The difference is not the number of calendars by itself. It is whether choosing and correcting a period follows
        the user’s intent or forces a From–To sequence to start over.
      </p>
    </div>
    <div className="story__comparison" role="table" aria-label="Range picker friction comparison">
      <div className="story__comparison-row story__comparison-head" role="row">
        <span role="columnheader">Friction</span>
        <span role="columnheader">Conventional pattern</span>
        <span role="columnheader">Direct range editing</span>
      </div>
      {comparisons.map(([concern, common, directEditing]) => (
        <div className="story__comparison-row" role="row" key={concern}>
          <strong role="cell">{concern}</strong>
          <span role="cell">{common}</span>
          <span role="cell">{directEditing}</span>
        </div>
      ))}
    </div>
    <aside className="field-guide__try">
      <strong>Try it</strong>
      Focus the selected-period input to open the picker. Type a new endpoint or choose dates directly; both edit the
      same range.
    </aside>
    <div className="field-guide__example">
      <TypeToEditExample />
    </div>
    <FieldGuideRecipe
      title="Use one range model"
      language="TS"
      copy="Represent both one day and an inclusive period with the same timezone-free contract."
      code={"type Selection = null | { start: IsoDate; end: IsoDate };\n// One day: start === end"}
    />
  </section>
);

export const ArchitectureStory = (): JSX.Element => (
  <section className="story__wide story__idea" id="idea">
    <div className="story__section-heading">
      <span>The idea underneath</span>
      <h2>Small state, explicit interaction</h2>
    </div>
    <div className="story__idea-grid">
      <article>
        <strong>One value</strong>
        <code>null | {"{ start, end }"}</code>
        <p>A single day is just start equal to end.</p>
      </article>
      <article>
        <strong>One view</strong>
        <code>visibleMonth</code>
        <p>Navigation never silently edits selection.</p>
      </article>
      <article>
        <strong>One active gesture</strong>
        <code>paint · resize · move</code>
        <p>
          One gesture owns the pointer at a time, so actions cannot collide. Release returns the calendar cleanly to
          rest.
        </p>
      </article>
      <article>
        <strong>Two layers</strong>
        <code>committed + transient</code>
        <p>Hover and drag previews cannot masquerade as public state.</p>
      </article>
    </div>
    <aside className="field-guide__try">
      <strong>Try it</strong>
      Review which layer owns committed value, visible month, and the active gesture.
    </aside>
    <FieldGuideRecipe
      title="Keep state responsibilities separate"
      language="TSX"
      copy="Control the public range without coupling it to the visible month."
      code={'<QunoDatePicker value={range} onChange={setRange} initialMonth="2026-08" />'}
    />
  </section>
);

export const FootprintStory = (): JSX.Element => (
  <section className="story__wide story__footprint" id="footprint">
    <div className="story__section-heading">
      <span>Production</span>
      <h3>Ship Datepicker independently.</h3>
      <p>
        Datepicker JavaScript is 9.00 KiB gzip. Its optional stylesheet is a separate 3.20 KiB gzip import; neither
        number includes external application runtimes.
      </p>
    </div>
    <FieldGuideProduction profile={datepickerProduction} anchorIds={["reference"]} />
  </section>
);
