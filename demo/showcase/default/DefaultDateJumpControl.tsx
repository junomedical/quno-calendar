import { CalendarDays, LocateFixed } from "lucide-react";
import type { IsoDate } from "@quno/calendar";

type DefaultDateJumpControlProps = {
  date: IsoDate;
  time: string;
  onDateChange: (date: IsoDate) => void;
  onTimeChange: (time: string) => void;
  onToday: () => void;
  onGo: () => void;
};

export function DefaultDateJumpControl({
  date,
  time,
  onDateChange,
  onTimeChange,
  onToday,
  onGo
}: DefaultDateJumpControlProps) {
  return (
    <div className="date-jump">
      <label className="date-jump-date">
        Go to date
        <input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value as IsoDate)}
          data-testid="jump-date-input"
        />
      </label>
      <label className="date-jump-time">
        Time
        <input
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          data-testid="jump-time-input"
        />
      </label>
      <div className="date-jump-actions">
        <button type="button" onClick={onToday} data-testid="today-button">
          <LocateFixed size={15} aria-hidden />
          Today
        </button>
        <button type="button" onClick={onGo} data-testid="go-date-button">
          <CalendarDays size={15} aria-hidden />
          Go
        </button>
      </div>
    </div>
  );
}
