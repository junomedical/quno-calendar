import type { IsoDate } from "@quno/calendar";
import { DateNavigationInput } from "./DateNavigationInput";

type DateJumpControlProps = {
  className: string;
  date: IsoDate;
  onDateChange: (date: IsoDate) => void;
};

export function DateJumpControl({ className, date, onDateChange }: DateJumpControlProps) {
  return (
    <div className={className}>
      <label>
        <span>Go to date</span>
        <DateNavigationInput date={date} onChange={onDateChange} />
      </label>
    </div>
  );
}
