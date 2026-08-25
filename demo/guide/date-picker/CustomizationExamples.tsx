import { useState } from "react";
import type { JSX } from "react";
import { QunoDatePicker, type QunoDatePickerDayCellCustomizer, type WeekStart } from "@quno/calendar/datepicker";

const themes = ["quno", "warm", "violet", "acid", "candy"] as const;

const businessDay: QunoDatePickerDayCellCustomizer = ({ date, isToday, isWeekend, weekday }) => ({
  className: [
    isToday && "story__day--today",
    isWeekend && "story__day--weekend",
    weekday === 3 && "story__day--non-working",
    date === "2026-08-27" && "story__day--holiday"
  ]
    .filter(Boolean)
    .join(" "),
  title: isToday
    ? "Today"
    : date === "2026-08-27"
      ? "Clinic holiday"
      : weekday === 3
        ? "Non-working day"
        : isWeekend
          ? "Weekend"
          : undefined
});

export const DayHandlerExample = (): JSX.Element => (
  <div className="story__controlled-example">
    <div className="story__legend" aria-label="Day style legend">
      <span data-kind="today">Today</span>
      <span data-kind="weekend">Weekend</span>
      <span data-kind="off">Non-working</span>
      <span data-kind="holiday">Holiday: 27 Aug</span>
    </div>
    <QunoDatePicker
      className="story__picker"
      defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
      initialMonth="2026-08-01"
      labels={{ hint: "" }}
      getDayCellProps={businessDay}
    />
  </div>
);

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
