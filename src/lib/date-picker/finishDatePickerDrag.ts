import {
  compareDates,
  isInMonth,
  singleDay,
  startOfMonth,
  type DateRange,
  type DateSelectionMode,
  type IsoDate
} from "#quno-internal/shared/dateRangeModel";
import { type MonthDirection } from "#quno-internal/date-picker/datePickerModel";
import { advanceDateClickCycle, finishInteraction, idle, type DateClickCycle } from "./datePickerInteraction";
import { endpointsAreEnabled } from "./datePickerDisabledDays";
import type { MonthChangeSource } from "./datePickerControllerTypes";
import type { DatePickerInteraction, QunoDatePickerDisabledDayPredicate } from "./datePickerTypes";

type Args = {
  changeMonth: (args: { month: IsoDate; motion?: MonthDirection | null; source?: MonthChangeSource }) => void;
  clickCycle: DateClickCycle | null;
  commit: (args: { value: DateRange | null }) => void;
  interaction: DatePickerInteraction;
  selectionMode: DateSelectionMode;
  isDayDisabled?: QunoDatePickerDisabledDayPredicate;
  setClickCycle: import("react").Dispatch<import("react").SetStateAction<DateClickCycle | null>>;
  setInteraction: (interaction: DatePickerInteraction) => void;
  stopEdgeNavigation: () => void;
  visibleMonth: IsoDate;
};

export function createFinishDatePickerDrag(args: Args) {
  return ({ date }: { date: IsoDate }): void => {
    args.stopEdgeNavigation();
    if (args.selectionMode === "single") {
      const current = args.interaction.type === "idle" ? null : args.interaction.current;
      const next = singleDay({ date });
      const accepted = endpointsAreEnabled({ matcher: args.isDayDisabled, range: next }) ? next : current;
      args.setInteraction(idle());
      args.setClickCycle(null);
      if (accepted && endpointsAreEnabled({ matcher: args.isDayDisabled, range: accepted }))
        args.commit({ value: accepted });
      if (accepted === next) navigateAfterAdjacentDate({ args, date });
      return;
    }
    const clickCycle = args.clickCycle;
    const repeatedClick = args.interaction.type !== "idle" && !args.interaction.moved;
    if (clickCycle?.date === date && repeatedClick) {
      const next = advanceDateClickCycle(clickCycle);
      const accepted = next.changed && endpointsAreEnabled({ matcher: args.isDayDisabled, range: next.value });
      args.setClickCycle(accepted ? next.cycle : null);
      args.setInteraction(idle());
      if (accepted) args.commit({ value: next.value });
      return;
    }
    const result = finishInteraction({ interaction: args.interaction, date });
    const accepted =
      result.value && endpointsAreEnabled({ matcher: args.isDayDisabled, range: result.value })
        ? result.value
        : fallback(args);
    args.setInteraction(result.interaction);
    args.setClickCycle(accepted === result.value ? (result.cycle ?? null) : null);
    if (accepted) args.commit({ value: accepted });
    if (accepted && accepted === result.value) navigateAfterAdjacentDate({ args, date });
  };
}

function fallback(args: Args): DateRange | undefined {
  if (args.interaction.type === "idle" || !args.interaction.moved) return undefined;
  return endpointsAreEnabled({ matcher: args.isDayDisabled, range: args.interaction.current })
    ? args.interaction.current
    : undefined;
}

function navigateAfterAdjacentDate({ args, date }: { args: Args; date: IsoDate }) {
  if (isInMonth({ date, month: args.visibleMonth })) return;
  const direction = compareDates({ left: date, right: args.visibleMonth }) < 0 ? -1 : 1;
  args.changeMonth({ month: startOfMonth({ date }), motion: direction, source: "interaction" });
}
