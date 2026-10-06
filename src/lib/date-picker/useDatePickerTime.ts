import { useState } from "react";
import type { QunoDatePickerProps } from "./datePickerTypes";
import type { DateRange } from "#quno-internal/shared/dateRangeModel";
import { clockTimeIsEnabled } from "#quno-internal/shared/clockTime";

export function useDatePickerTime({
  timeMode,
  selectionMode,
  time,
  defaultTime = null,
  enabledHours,
  minuteCadence = 15,
  onChange
}: Pick<
  QunoDatePickerProps,
  "timeMode" | "selectionMode" | "time" | "defaultTime" | "enabledHours" | "minuteCadence" | "onChange"
>) {
  const [internalTime, setInternalTime] = useState(defaultTime);
  const selectedTime = time !== undefined ? time : internalTime;
  const enabled = Boolean(timeMode && selectionMode === "single");
  const publish = ({ value, time: nextTime }: { value: DateRange | null; time: string | null }) => {
    if (time === undefined) setInternalTime(nextTime);
    onChange?.({ value, ...(enabled ? { time: nextTime } : {}) });
  };
  return {
    enabled,
    time: selectedTime,
    enabledHours,
    minuteCadence,
    onDateChange: ({ value }: { value: DateRange | null }) => publish({ value, time: value ? selectedTime : null }),
    select: ({ value, time }: { value: DateRange; time: string }) => {
      if (clockTimeIsEnabled({ time, enabledHours, minuteCadence })) publish({ value, time });
    }
  };
}

export type DatePickerClock = ReturnType<typeof useDatePickerTime>;
