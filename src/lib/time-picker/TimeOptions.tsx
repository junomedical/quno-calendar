import { useRef } from "react";
import { classNames as cx } from "#quno-internal/shared/classNames";
import type { TimeSelectionOptions } from "#quno-internal/shared/clockTime";
import type { QunoTimePickerClassNames, QunoTimePickerFormatters } from "./timePickerTypes";

import { useTimeSelectionReveal } from "./useTimeSelectionReveal";

type Config = {
  locale: string;
  labels: { timeNavigation: string; noEnabledHours: string };
  formatters: Required<QunoTimePickerFormatters>;
  classNames?: QunoTimePickerClassNames;
};

export function TimeOptions({
  clock,
  config,
  onSelect,
  classPrefix = "quno-date-picker",
  disabled = false
}: {
  clock: Pick<TimeSelectionOptions, "time" | "enabledHours"> & { minuteCadence: number };
  config: Config;
  classPrefix?: string;
  disabled?: boolean;
  onSelect: (args: { time: string }) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, hour) => hour).filter(
    (hour) => !clock.enabledHours?.length || clock.enabledHours.includes(hour)
  );
  const minutes = Array.from(
    { length: Math.ceil(60 / clock.minuteCadence) },
    (_, index) => index * clock.minuteCadence
  );
  const columns = clock.minuteCadence === 5 ? 6 : clock.minuteCadence < 10 ? 5 : minutes.length;
  const { labels, classNames, formatters, locale } = config;
  useTimeSelectionReveal({ scroller, time: clock.time, minuteCadence: clock.minuteCadence, hoursKey: hours.join(",") });
  return (
    <div
      ref={scroller}
      className={cx({ values: [`${classPrefix}-time-navigation`, classNames?.timeNavigation] })}
      data-slot="time-navigation"
      role="group"
      aria-label={labels.timeNavigation}
    >
      {hours.length === 0 && <p>{labels.noEnabledHours}</p>}
      {hours.map((hour) => (
        <section
          key={hour}
          className={cx({ values: [`${classPrefix}-hour-group`, classNames?.hourGroup] })}
          data-slot="hour-group"
          data-hour={hour}
        >
          <h3 className={classNames?.hourHeading} data-slot="hour-heading">
            {String(hour).padStart(2, "0")}
          </h3>
          <div
            className={`${classPrefix}-minute-options`}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {minutes.map((minute) => {
              const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
              return (
                <button
                  key={time}
                  type="button"
                  disabled={disabled}
                  className={cx({ values: [`${classPrefix}-minute-option`, classNames?.minuteOption] })}
                  data-slot="minute-option"
                  data-time={time}
                  aria-label={formatters.time({ time, locale })}
                  aria-pressed={clock.time === time}
                  onClick={() => onSelect({ time })}
                >
                  {String(minute).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
