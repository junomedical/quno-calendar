import type { DateRange, IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { DatePickerInteraction, QunoDatePickerDisabledDayPredicate } from "./datePickerTypes";

export const dayIsDisabled = ({
  matcher,
  date
}: {
  matcher: QunoDatePickerDisabledDayPredicate | undefined;
  date: IsoDate;
}): boolean => matcher?.({ date }) ?? false;

export const resolveDatePickerDisabledDayPredicate = ({
  matcher,
  limitDateFrom,
  limitDateTo
}: {
  matcher?: QunoDatePickerDisabledDayPredicate;
  limitDateFrom?: IsoDate;
  limitDateTo?: IsoDate;
}): QunoDatePickerDisabledDayPredicate | undefined => {
  if (!limitDateFrom && !limitDateTo) return matcher;
  return ({ date }) => {
    if (limitDateFrom && date < limitDateFrom) return true;
    if (limitDateTo && date > limitDateTo) return true;
    return matcher?.({ date }) ?? false;
  };
};

export const endpointsAreEnabled = ({
  matcher,
  range
}: {
  matcher: QunoDatePickerDisabledDayPredicate | undefined;
  range: DateRange;
}): boolean => !dayIsDisabled({ matcher, date: range.start }) && !dayIsDisabled({ matcher, date: range.end });

export const interactionEndpointsAreEnabled = ({
  matcher,
  interaction
}: {
  matcher: QunoDatePickerDisabledDayPredicate | undefined;
  interaction: DatePickerInteraction;
}): boolean => interaction.type === "idle" || endpointsAreEnabled({ matcher, range: interaction.current });
