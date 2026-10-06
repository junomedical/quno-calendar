import { useEffect, useRef, useState } from "react";
import { addDays, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { DatePickerController } from "./datePickerControllerTypes";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import type { MonthDirection } from "./datePickerModel";

export function useTimeDayNavigation({
  active,
  controller,
  config
}: {
  active: boolean;
  controller: DatePickerController;
  config: ResolvedDatePickerConfig;
}) {
  const selectedDate = controller.selection?.start;
  const { isDayDisabled, limitDateFrom, limitDateTo } = config;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const liveController = useRef(controller);
  liveController.current = controller;
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(0);
  useEffect(() => {
    setBusy(false);
    setBlocked(0);
    return () => clearTimeout(timer.current);
  }, [active, selectedDate, isDayDisabled, limitDateFrom, limitDateTo]);
  const navigate = ({ direction }: { direction: MonthDirection }) => {
    if (!active || !selectedDate || busy) return;
    clearTimeout(timer.current);
    const scan = ({ date }: { date: IsoDate }) => {
      for (let step = 0; step < 128; step++) {
        const next = addDays({ date, amount: direction });
        if (next.length !== 10 || (limitDateFrom && next < limitDateFrom) || (limitDateTo && next > limitDateTo)) {
          setBusy(false);
          setBlocked((current) => current | (direction === -1 ? 1 : 2));
          return;
        }
        date = next;
        if (!isDayDisabled?.({ date })) {
          setBusy(false);
          liveController.current.selectDay({ date });
          return;
        }
      }
      setBusy(true);
      timer.current = setTimeout(() => scan({ date }), 0);
    };
    scan({ date: selectedDate });
  };
  return {
    navigate,
    previousDisabled:
      busy || Boolean(blocked & 1) || Boolean(selectedDate && limitDateFrom && selectedDate <= limitDateFrom),
    nextDisabled: busy || Boolean(blocked & 2) || Boolean(selectedDate && limitDateTo && selectedDate >= limitDateTo)
  };
}
