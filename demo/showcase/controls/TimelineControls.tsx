type CalendarCountControlProps = {
  count: number;
  maximum: number;
  onChange: (count: number) => void;
};

export function CalendarCountControl({ count, maximum, onChange }: CalendarCountControlProps) {
  return (
    <label>
      Calendars
      <input
        data-testid="calendar-count"
        type="range"
        min="1"
        max={maximum}
        value={count}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span>{count}</span>
    </label>
  );
}

type ZoomControlProps = {
  className: string;
  zoom: number;
  onChange: (zoom: number) => void;
};

export function ZoomControl({ className, zoom, onChange }: ZoomControlProps) {
  return (
    <label>
      Zoom
      <div className={className}>
        <input
          data-testid="zoom-slider"
          type="range"
          min="0.5"
          max="8"
          step="0.1"
          value={zoom}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <output data-testid="zoom-value">{zoom.toFixed(2)}</output>
      </div>
    </label>
  );
}

type SnapControlProps = {
  minutes: number;
  onChange: (minutes: number) => void;
};

export function SnapControl({ minutes, onChange }: SnapControlProps) {
  return (
    <label>
      Snap
      <select value={minutes} onChange={(event) => onChange(Number(event.target.value))} data-testid="snap-select">
        {[5, 10, 15, 30].map((value) => (
          <option value={value} key={value}>
            {value} minutes
          </option>
        ))}
      </select>
    </label>
  );
}

type TimeRangeControlProps = {
  className: string;
  startHour: number;
  endHour: number;
  onStartHourChange: (hour: number) => void;
  onEndHourChange: (hour: number) => void;
};

export function TimeRangeControl({
  className,
  startHour,
  endHour,
  onStartHourChange,
  onEndHourChange
}: TimeRangeControlProps) {
  return (
    <div className={className}>
      <label>
        Start
        <input
          type="number"
          min="0"
          max="22"
          value={startHour}
          onChange={(event) => onStartHourChange(Number(event.target.value))}
        />
      </label>
      <label>
        End
        <input
          type="number"
          min="1"
          max="24"
          value={endHour}
          onChange={(event) => onEndHourChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}

type ToggleControlProps = {
  checked: boolean;
  className: string;
  label: string;
  testId: string;
  onChange: (checked: boolean) => void;
};

export function ToggleControl({ checked, className, label, testId, onChange }: ToggleControlProps) {
  return (
    <label className={className}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        data-testid={testId}
      />
      {label}
    </label>
  );
}
