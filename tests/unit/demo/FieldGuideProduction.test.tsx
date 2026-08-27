import { render, screen, within } from "@testing-library/react";
import { FieldGuideProduction } from "#quno-demo/guide/shared/FieldGuideProduction";
import {
  dateInputProduction,
  dateParserProduction,
  datepickerProduction,
  infiniteCalendarProduction
} from "#quno-demo/guide/shared/productionProfiles";

describe("field guide production facts", () => {
  it.each([
    [infiniteCalendarProduction, "32.40 KiB gzip", "1.94 KiB gzip"],
    [datepickerProduction, "9.00 KiB gzip", "3.20 KiB gzip"],
    [dateInputProduction, "6.77 KiB gzip", "0.58 KiB gzip"],
    [dateParserProduction, "4.45 KiB gzip", "No stylesheet"]
  ] as const)("separates exact artifacts and runtime contracts for $product", (profile, javascript, styles) => {
    const { unmount } = render(<FieldGuideProduction profile={profile} />);
    const payload = screen.getByLabelText(`${profile.product} production payload`);
    const contract = screen.getByLabelText(`${profile.product} runtime contract`);

    expect(within(payload).getByText(javascript, { exact: true })).toBeInTheDocument();
    expect(within(profile.stylesheet ? payload : contract).getByText(styles, { exact: true })).toBeInTheDocument();
    expect(within(contract).getByText(profile.entrypoint, { exact: true })).toBeInTheDocument();
    expect(screen.queryByText("Public API at a glance")).not.toBeInTheDocument();
    expect(screen.queryByText(/Total package/)).not.toBeInTheDocument();
    unmount();
  });
});
