import type { JSX } from "react";
import type { FieldGuideProductionProfile } from "./productionProfiles";
import "./fieldGuideProduction.css";

type Props = {
  profile: FieldGuideProductionProfile;
  anchorIds?: ReadonlyArray<string>;
  testId?: string;
};

export function FieldGuideProduction({ profile, anchorIds = [], testId }: Props): JSX.Element {
  return (
    <div className="field-guide-production" data-testid={testId}>
      {anchorIds.map((id) => (
        <span className="field-guide-production__anchor" id={id} key={id} />
      ))}
      <dl aria-label={`${profile.product} production payload`} className="field-guide-production__payload">
        {profile.artifacts.map((artifact) => (
          <div key={artifact.label}>
            <dt>{artifact.label}</dt>
            <dd>
              <strong>{artifact.gzip} gzip</strong>
              <span>{artifact.raw} raw</span>
              <small>Budget {artifact.budget}</small>
            </dd>
          </div>
        ))}
      </dl>
      <dl aria-label={`${profile.product} runtime contract`} className="field-guide-production__contract">
        <div>
          <dt>Entry point</dt>
          <dd>
            <code>{profile.entrypoint}</code>
          </dd>
        </div>
        <div>
          <dt>Styles</dt>
          <dd>{profile.stylesheet ? <code>{profile.stylesheet}</code> : "No stylesheet"}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{profile.runtime}</dd>
        </div>
        <div>
          <dt>Compatibility</dt>
          <dd>{profile.compatibility}</dd>
        </div>
        <div>
          <dt>Dependencies</dt>
          <dd>{profile.dependencies}</dd>
        </div>
      </dl>
      <p className="field-guide-production__note">
        Measured from the production package build with maximum gzip compression, before consumer tree-shaking.
        {profile.stylesheet
          ? " JavaScript and CSS are separate imports; no combined total is shown."
          : " This entry has no CSS artifact or combined total."}{" "}
        External runtimes are not included.
      </p>
    </div>
  );
}
