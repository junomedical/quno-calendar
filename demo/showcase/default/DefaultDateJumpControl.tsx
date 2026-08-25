import { LocateFixed } from "lucide-react";
import type { IsoDate } from "@quno/calendar";
import { DateNavigationInput } from "#quno-demo/showcase/controls/DateNavigationInput";

type DefaultDateJumpControlProps = {
  date: IsoDate;
  onDateChange: (date: IsoDate) => void;
  onToday: () => void;
};

export function DefaultDateJumpControl({ date, onDateChange, onToday }: DefaultDateJumpControlProps) {
  return (
    <div className="date-jump">
      <label>
        <span>Go to date</span>
        <DateNavigationInput date={date} onChange={onDateChange} />
      </label>
      <button type="button" onClick={onToday} data-testid="today-button">
        <LocateFixed size={15} aria-hidden />
        Today
      </button>
    </div>
  );
}
