import type { DateRange, IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { DatePickerInteraction, QunoDatePickerDisabledDayMatcher } from "./datePickerTypes";

export const dayIsDisabled = (matcher: QunoDatePickerDisabledDayMatcher | undefined, date: IsoDate): boolean =>
  matcher?.(date) ?? false;

export const endpointsAreEnabled = (matcher: QunoDatePickerDisabledDayMatcher | undefined, range: DateRange): boolean =>
  !dayIsDisabled(matcher, range.start) && !dayIsDisabled(matcher, range.end);

export const interactionEndpointsAreEnabled = (
  matcher: QunoDatePickerDisabledDayMatcher | undefined,
  interaction: DatePickerInteraction
): boolean => interaction.type === "idle" || endpointsAreEnabled(matcher, interaction.current);
