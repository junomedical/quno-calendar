import {
  compareDates,
  isInMonth,
  singleDay,
  startOfMonth,
  type DateRange,
  type DateSelectionMode,
  type IsoDate,
  type MonthDirection
} from "#quno-internal/shared/dateRangeModel";
import { advanceDateClickCycle, finishInteraction, idle, type DateClickCycle } from "./datePickerInteraction";
import { endpointsAreEnabled } from "./datePickerDisabledDays";
import type { MonthChangeSource } from "./datePickerControllerTypes";
import type { DatePickerInteraction, QunoDatePickerDisabledDayMatcher } from "./datePickerTypes";

type Args = {
  changeMonth: (month: IsoDate, motion?: MonthDirection | null, source?: MonthChangeSource) => void;
  clickCycle: DateClickCycle | null;
  commit: (value: DateRange | null) => void;
  interaction: DatePickerInteraction;
  selectionMode: DateSelectionMode;
  disabledDays?: QunoDatePickerDisabledDayMatcher;
  setClickCycle: (cycle: DateClickCycle | null) => void;
  setInteraction: (interaction: DatePickerInteraction) => void;
  stopEdgeNavigation: () => void;
  visibleMonth: IsoDate;
};

export function createFinishDatePickerDrag(args: Args) {
  return (date: IsoDate): void => {
    args.stopEdgeNavigation();
    if (args.selectionMode === "single") {
      const current = args.interaction.type === "idle" ? null : args.interaction.current;
      const next = singleDay(date);
      const accepted = endpointsAreEnabled(args.disabledDays, next) ? next : current;
      args.setInteraction(idle());
      args.setClickCycle(null);
      if (accepted && endpointsAreEnabled(args.disabledDays, accepted)) args.commit(accepted);
      if (accepted === next) navigateAfterAdjacentDate(args, date);
      return;
    }
    const clickCycle = args.clickCycle;
    const repeatedClick = args.interaction.type !== "idle" && !args.interaction.moved;
    if (clickCycle?.date === date && repeatedClick) {
      const next = advanceDateClickCycle(clickCycle);
      const accepted = next.changed && endpointsAreEnabled(args.disabledDays, next.value);
      args.setClickCycle(accepted ? next.cycle : null);
      args.setInteraction(idle());
      if (accepted) args.commit(next.value);
      return;
    }
    const result = finishInteraction(args.interaction, date);
    const accepted =
      result.value && endpointsAreEnabled(args.disabledDays, result.value) ? result.value : fallback(args);
    args.setInteraction(result.interaction);
    args.setClickCycle(accepted === result.value ? (result.cycle ?? null) : null);
    if (accepted) args.commit(accepted);
    if (accepted && accepted === result.value) navigateAfterAdjacentDate(args, date);
  };
}

function fallback(args: Args): DateRange | undefined {
  if (args.interaction.type === "idle" || !args.interaction.moved) return undefined;
  return endpointsAreEnabled(args.disabledDays, args.interaction.current) ? args.interaction.current : undefined;
}

function navigateAfterAdjacentDate(args: Args, date: IsoDate) {
  if (isInMonth(date, args.visibleMonth)) return;
  const direction = compareDates(date, args.visibleMonth) < 0 ? -1 : 1;
  args.changeMonth(startOfMonth(date), direction, "interaction");
}
