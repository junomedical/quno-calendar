export const packageSnippet = `import { QunoDatePicker, type DateRange } from '@quno/calendar/datepicker';
import '@quno/calendar/datepicker/styles.css';`;

export const basicUsageSnippet = `${packageSnippet}
import { useState } from 'react';

const [dates, setDates] = useState<DateRange | null>(null);

<QunoDatePicker value={dates} onChange={setDates} />;`;

export const customDaysSnippet = `import { useEffect, useState } from 'react';
import {
  QunoDatePicker,
  calendarGrid,
  type IsoDate,
  type QunoDatePickerDayCellCustomizer,
} from '@quno/calendar/datepicker';

type DayStatus = 'loading' | 'available' | 'disabled' | 'error';
const [visibleMonth, setVisibleMonth] = useState<IsoDate>('2026-08-01');
const [status, setStatus] = useState<Partial<Record<IsoDate, DayStatus>>>({});
const [failedMonth, setFailedMonth] = useState<IsoDate | null>(null);

useEffect(() => {
  void loadAvailability(calendarGrid(visibleMonth)).then(
    (next) => setStatus((current) => ({ ...current, ...next })),
    () => setFailedMonth(visibleMonth),
  );
}, [visibleMonth]);

const statusFor = (date: IsoDate): DayStatus =>
  status[date] ?? (failedMonth === visibleMonth ? 'error' : 'loading');
const disabledDays = (date: IsoDate) => statusFor(date) !== 'available';
const styleDay: QunoDatePickerDayCellCustomizer = ({ date, isToday }) => {
  const dayStatus = statusFor(date);
  return {
    className: [
      isToday && 'booking-date--today',
      dayStatus === 'loading' && 'booking-date--loading',
      dayStatus === 'disabled' && 'booking-date--unavailable',
      dayStatus === 'error' && 'booking-date--error',
    ].filter(Boolean).join(' '),
    title: dayStatus === 'loading' ? 'Checking availability' : undefined,
  };
};

<QunoDatePicker
  disabledDays={disabledDays}
  getDayCellProps={styleDay}
  onVisibleMonthChange={setVisibleMonth}
/>;`;

export const localizationSnippet = `<QunoDatePicker
  locale="fr-FR"
  weekStartsOn={1}
  labels={{
    calendar: 'Sélecteur de période',
    selectedPeriod: 'Période sélectionnée',
    chooseDate: 'Choisir une date',
    clear: 'Effacer',
    start: 'Début',
    end: 'Fin',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    openMonthNavigation: 'Ouvrir la navigation par mois et année',
    closeMonthNavigation: 'Fermer la navigation par mois et année',
    monthNavigation: 'Choisir un mois et une année',
    hint: '',
  }}
/>`;

export const weekStartSnippet = `import { useState } from 'react';
import { QunoDatePicker, type WeekStart } from '@quno/calendar/datepicker';

const [weekStartsOn, setWeekStartsOn] =
  useState<WeekStart>(1);

<button onClick={() => setWeekStartsOn(0)}>Sunday</button>
<button onClick={() => setWeekStartsOn(1)}>Monday</button>
<button onClick={() => setWeekStartsOn(6)}>Saturday</button>

<QunoDatePicker weekStartsOn={weekStartsOn} />;`;

export const themingSnippet = `.booking-dates {
  --quno-date-picker-width: min(100%, 320px);
  --quno-date-picker-day-size: 36px;
  --quno-date-picker-primary: #6d28d9;
  --quno-date-picker-primary-soft: #f0e8ff;
  --quno-date-picker-selection-surface: #f0e8ff;
  --quno-date-picker-cycle-preview: #db2777;
  --quno-date-picker-pill-surface: #f0e8ff;
  --quno-date-picker-pill-border: #6d28d9;
  --quno-date-picker-pill-text: #4c1d95;
  --quno-date-picker-pill-radius: 8px;
  --quno-date-picker-pill-shadow: 4px 4px 0 #db2777;
  --quno-date-picker-pills-direction: row;
  --quno-date-picker-pills-wrap: nowrap;
  --quno-date-picker-pills-gap: 6px;
  --quno-date-picker-calendar-radius: 12px;
  --quno-date-picker-day-radius: 6px;
}

/* component.tsx */
<QunoDatePicker className="booking-dates" />`;

export const rangeInputSnippet = `import { type FocusEvent, useState } from 'react';
import { QunoDatePicker, type DateRange } from '@quno/calendar/datepicker';
import { QunoDateInput } from '@quno/calendar/date-input';
import '@quno/calendar/date-input/styles.css';

const [period, setPeriod] = useState<DateRange | null>(null);
const [open, setOpen] = useState(false);
const expectedRange = { start: '2025-08-19', end: '2026-08-19' };
const closeAfterFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
  if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
};

<div onFocus={() => setOpen(true)} onBlur={closeAfterFocusLeaves}>
  <QunoDateInput
    value={period}
    onChange={setPeriod}
    expectedRange={expectedRange}
    selectionMode="range"
  />
  {open && (
    <QunoDatePicker
      className="period-field__picker"
      value={period}
      onChange={setPeriod}
      selectionMode="range"
    />
  )}
</div>

/* .period-field__picker [data-slot='selection-header'] { display: none; } */`;

export const singleDaySnippet = `const [date, setDate] = useState<DateRange | null>(null);

<QunoDatePicker
  value={date}
  onChange={setDate}
  selectionMode="single"
/>;`;
