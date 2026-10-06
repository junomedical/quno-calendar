import { useState } from "react";
import { classNames as cx } from "#quno-internal/shared/classNames";
import { TimeOptions } from "./TimeOptions";
import type { QunoTimePickerProps } from "./timePickerTypes";

const defaultLabels = {
  timeNavigation: "Choose a time",
  noEnabledHours: "No enabled hours",
  empty: "Choose a time",
  clear: "Clear time"
};
const timeFormatter = ({ time }: { time: string; locale: string }) => time;

export function QunoTimePicker({
  value,
  defaultValue = null,
  onChange,
  enabledHours,
  minuteCadence = 15,
  disabled = false,
  locale = "en-GB",
  labels,
  formatters,
  classNames,
  className,
  ...rootProps
}: QunoTimePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value !== undefined ? value : internalValue;
  const config = {
    locale,
    classNames,
    labels: { ...defaultLabels, ...labels },
    formatters: { time: timeFormatter, ...formatters }
  };
  const publish = ({ value: next }: { value: string | null }) => {
    if (disabled) return;
    if (value === undefined) setInternalValue(next);
    onChange?.({ value: next });
  };
  return (
    <div
      {...rootProps}
      className={cx({ values: ["quno-time-picker", classNames?.root, className] })}
      data-slot="root"
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      <div className="quno-time-picker-header">
        <span className={classNames?.selectionSummary} data-slot="selection-summary" aria-live="polite">
          {selected ? config.formatters.time({ time: selected, locale }) : config.labels.empty}
        </span>
        <button
          type="button"
          className={classNames?.clearButton}
          data-slot="clear-button"
          disabled={disabled || !selected}
          onClick={() => publish({ value: null })}
        >
          {config.labels.clear}
        </button>
      </div>
      <TimeOptions
        clock={{ time: selected, enabledHours, minuteCadence }}
        config={config}
        classPrefix="quno-time-picker"
        disabled={disabled}
        onSelect={({ time }) => publish({ value: time })}
      />
    </div>
  );
}
