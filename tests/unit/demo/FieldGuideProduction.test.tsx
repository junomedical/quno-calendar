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
    [infiniteCalendarProduction, "36.30 KiB gzip", "1.95 KiB gzip"],
    [datepickerProduction, "9.81 KiB gzip", "3.22 KiB gzip"],
    [dateInputProduction, "7.65 KiB gzip", "0.58 KiB gzip"],
    [dateParserProduction, "5.11 KiB gzip", "No stylesheet"]
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
