import { render, screen, within } from "@testing-library/react";
import { FieldGuideProduction } from "#quno-demo/guide/shared/FieldGuideProduction";
import {
  dateInputProduction,
  dateParserProduction,
  datepickerProduction,
  timepickerProduction,
  infiniteCalendarProduction
} from "#quno-demo/guide/shared/productionProfiles";

describe("field guide production facts", () => {
  it.each([
    [infiniteCalendarProduction, "39.47 KiB gzip", "1.99 KiB gzip"],
    [datepickerProduction, "12.46 KiB gzip", "3.36 KiB gzip"],
    [dateInputProduction, "9.60 KiB gzip", "0.58 KiB gzip"],
    [timepickerProduction, "1.59 KiB gzip", "0.78 KiB gzip"],
    [dateParserProduction, "6.00 KiB gzip", "No stylesheet"]
  ] as const)("separates exact artifacts and runtime contracts for $product", (profile, javascript, styles) => {
    const { unmount } = render(<FieldGuideProduction profile={profile} />);
    const payload = screen.getByLabelText(`${profile.product} production payload`);
    const contract = screen.getByLabelText(`${profile.product} runtime contract`);

    expect(within(payload).getByText(javascript, { exact: true })).toBeInTheDocument();
    expect(
      within(profile.stylesheet ? payload : contract).getByText(styles, {
        exact: true
      })
    ).toBeInTheDocument();
    expect(within(contract).getByText(profile.entrypoint, { exact: true })).toBeInTheDocument();
    expect(screen.queryByText("Public API at a glance")).not.toBeInTheDocument();
    expect(screen.queryByText(/Total package/)).not.toBeInTheDocument();
    unmount();
  });
});
