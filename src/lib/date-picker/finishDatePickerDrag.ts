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
import type { MonthChangeSource } from "./datePickerControllerTypes";
import type { DatePickerInteraction } from "./datePickerTypes";

type Args = {
  changeMonth: (month: IsoDate, motion?: MonthDirection | null, source?: MonthChangeSource) => void;
  clickCycle: DateClickCycle | null;
  commit: (value: DateRange | null) => void;
  interaction: DatePickerInteraction;
  selectionMode: DateSelectionMode;
  setClickCycle: (cycle: DateClickCycle | null) => void;
  setInteraction: (interaction: DatePickerInteraction) => void;
  stopEdgeNavigation: () => void;
  visibleMonth: IsoDate;
};

export function createFinishDatePickerDrag(args: Args) {
  return (date: IsoDate): void => {
    args.stopEdgeNavigation();
    if (args.selectionMode === "single") {
      args.setInteraction(idle());
      args.setClickCycle(null);
      args.commit(singleDay(date));
      navigateAfterAdjacentDate(args, date);
      return;
    }
    const clickCycle = args.clickCycle;
    const repeatedClick = args.interaction.type !== "idle" && !args.interaction.moved;
    if (clickCycle?.date === date && repeatedClick) {
      const next = advanceDateClickCycle(clickCycle);
      args.setClickCycle(next.cycle);
      args.setInteraction(idle());
      if (next.changed) args.commit(next.value);
      return;
    }
    const result = finishInteraction(args.interaction, date);
    args.setInteraction(result.interaction);
    args.setClickCycle(result.cycle ?? null);
    if (result.value) args.commit(result.value);
    navigateAfterAdjacentDate(args, date);
  };
}

function navigateAfterAdjacentDate(args: Args, date: IsoDate) {
  if (isInMonth(date, args.visibleMonth)) return;
  const direction = compareDates(date, args.visibleMonth) < 0 ? -1 : 1;
  args.changeMonth(startOfMonth(date), direction, "interaction");
}
