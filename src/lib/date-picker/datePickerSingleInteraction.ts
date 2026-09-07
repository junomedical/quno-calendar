import { singleDay, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { DatePickerInteraction } from "./datePickerTypes";

export const updateSingleDayInteraction = ({
  interaction,
  date
}: {
  interaction: DatePickerInteraction;
  date: IsoDate;
}): DatePickerInteraction =>
  interaction.type === "create"
    ? {
        ...interaction,
        current: singleDay({ date }),
        moved: interaction.moved || date !== interaction.origin
      }
    : interaction;
