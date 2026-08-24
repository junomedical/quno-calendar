import { CalendarDays } from "lucide-react";
import type { IsoDate } from "@quno/calendar";

type DateJumpControlProps = {
  className: string;
  date: IsoDate;
  time: string;
  showIcon?: boolean;
  onDateChange: (date: IsoDate) => void;
  onTimeChange: (time: string) => void;
  onGo: () => void;
};

export function DateJumpControl({
  className,
  date,
  time,
  showIcon = false,
  onDateChange,
  onTimeChange,
  onGo
}: DateJumpControlProps) {
  return (
    <div className={className}>
      <label>
        Go to date
        <input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value as IsoDate)}
          data-testid="jump-date-input"
        />
      </label>
      <label>
        Time
        <input
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          data-testid="jump-time-input"
        />
      </label>
      <button type="button" onClick={onGo} data-testid="go-date-button">
        {showIcon ? <CalendarDays size={15} aria-hidden /> : null}
        Go
      </button>
    </div>
  );
}
