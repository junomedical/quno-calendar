import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
/** Keep compact booking navigation within its inclusive day bounds. */
export function datePickerMonthBounds({ month, config }: { month: IsoDate; config: ResolvedDatePickerConfig }) {
  return {
    previousDisabled: Boolean(
      config.limitNavigation && config.limitDateFrom && month.slice(0, 7) <= config.limitDateFrom.slice(0, 7)
    ),
    nextDisabled: Boolean(
      config.limitNavigation && config.limitDateTo && month.slice(0, 7) >= config.limitDateTo.slice(0, 7)
    )
  };
}
