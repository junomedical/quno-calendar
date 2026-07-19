import { CalendarDays } from "lucide-react";

type DateJumpControlProps = {
  className: string;
  date: string;
  time: string;
  showIcon?: boolean;
  onDateChange: (date: string) => void;
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
          onChange={(event) => onDateChange(event.target.value)}
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
