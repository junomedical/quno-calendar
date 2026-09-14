import { useState } from "react";
import type { JSX } from "react";
import { QunoDatePicker, type WeekStart } from "@quno/calendar/datepicker";
import { useDelayedDayAvailability } from "./useDelayedDayAvailability";

const themes = ["quno", "warm", "violet", "acid", "candy"] as const;
const bookingLimitFrom = "2026-08-06";
const bookingLimitTo = "2026-09-10";

export const DayHandlerExample = (): JSX.Element => {
  const { isDayDisabled, getDayCellProps, loadingCount, setVisibleMonth } = useDelayedDayAvailability({
    initialMonth: "2026-08-01",
    limitDateFrom: bookingLimitFrom,
    limitDateTo: bookingLimitTo
  });
  return (
    <div className="story__controlled-example">
      <div className="story__legend" aria-label="Day state legend">
        <span data-kind="loading">Checking</span>
        <span data-kind="weekend">Weekend</span>
        <span data-kind="off">Unavailable</span>
        <span data-kind="holiday">Holiday: 27 Aug</span>
        <span data-kind="error">Check failed: 24 Aug</span>
      </div>
      <output className="story__day-status" aria-live="polite">
        {loadingCount > 0 ? `Checking ${loadingCount} dates…` : "Availability loaded"}
      </output>
      <QunoDatePicker
        className="story__picker"
        initialMonth="2026-08-01"
        limitDateFrom={bookingLimitFrom}
        limitDateTo={bookingLimitTo}
        labels={{ hint: "" }}
        isDayDisabled={({ date }) => isDayDisabled(date)}
        getDayCellProps={getDayCellProps}
        onVisibleMonthChange={({ month }) => setVisibleMonth(month)}
      />
    </div>
  );
};

export const LocalizationExample = (): JSX.Element => (
  <QunoDatePicker
    className="story__picker story__picker--violet"
    defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
    initialMonth="2026-08-01"
    locale="fr-FR"
    weekStartsOn={1}
    labels={{
      calendar: "Sélecteur de période",
      selectedPeriod: "Période sélectionnée",
      chooseDate: "Choisir une date",
      clear: "Effacer",
      start: "Début",
      end: "Fin",
      previousMonth: "Mois précédent",
      nextMonth: "Mois suivant",
      openMonthNavigation: "Ouvrir la navigation par mois et année",
      closeMonthNavigation: "Fermer la navigation par mois et année",
      monthNavigation: "Choisir un mois et une année",
      hint: ""
    }}
  />
);

const weekStarts = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Saturday", value: 6 }
] as const satisfies ReadonlyArray<{ label: string; value: WeekStart }>;

export const WeekStartExample = (): JSX.Element => {
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStart>(1);
  return (
    <div className="story__controlled-example">
      <div className="story__controls" role="group" aria-label="First day of week">
        {weekStarts.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            aria-pressed={weekStartsOn === value}
            onClick={() => setWeekStartsOn(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <QunoDatePicker
        className="story__picker"
        defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
        initialMonth="2026-08-01"
        weekStartsOn={weekStartsOn}
        labels={{ hint: "" }}
      />
    </div>
  );
};

export const ThemeExample = (): JSX.Element => {
  const [theme, setTheme] = useState("quno");
  return (
    <div className="story__controlled-example">
      <div className="story__controls" aria-label="Datepicker theme">
        {themes.map((option) => (
          <button
            key={option}
            aria-label={`${option} theme`}
            aria-pressed={theme === option}
            onClick={() => setTheme(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <QunoDatePicker
        className={`story__picker story__theme--${theme}`}
        defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
        initialMonth="2026-08-01"
        labels={{ hint: "" }}
      />
    </div>
  );
};
