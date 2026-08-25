export const packageSnippet = `import { QunoDatePicker, type DateRange } from '@quno/calendar/datepicker';
import '@quno/calendar/datepicker/styles.css';`;

export const basicUsageSnippet = `${packageSnippet}
import { useState } from 'react';

const [dates, setDates] = useState<DateRange | null>(null);

<QunoDatePicker value={dates} onChange={setDates} />;`;

export const customDaysSnippet = `import {
  QunoDatePicker,
  type QunoDatePickerDayCellCustomizer,
} from '@quno/calendar/datepicker';

const styleDay: QunoDatePickerDayCellCustomizer = ({
  date,
  isToday,
  isWeekend,
  weekday,
}) => {
  const isNonWorking = weekday === 3; // Sunday is 0; Wednesday is 3.
  const isHoliday = date === '2026-08-27';
  return {
    className: [
      isToday && 'booking-date--today',
      isWeekend && 'booking-date--weekend',
      isNonWorking && 'booking-date--non-working',
      isHoliday && 'booking-date--holiday',
    ].filter(Boolean).join(' '),
    title: isHoliday ? 'Clinic holiday' : undefined,
  };
};

<QunoDatePicker getDayCellProps={styleDay} />;`;

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

export const singleDayInputSnippet = `import { type FocusEvent, useState } from 'react';
import { QunoDatePicker, type DateRange } from '@quno/calendar/datepicker';
import { QunoDateInput } from '@quno/calendar/date-input';
import '@quno/calendar/date-input/styles.css';

const [date, setDate] = useState<DateRange | null>(null);
const [open, setOpen] = useState(false);
const expectedRange = { start: '2025-08-19', end: '2026-08-19' };
const closeAfterFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
  if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
};

<div onFocus={() => setOpen(true)} onBlur={closeAfterFocusLeaves}>
  <QunoDateInput
    value={date}
    onChange={setDate}
    expectedRange={expectedRange}
    selectionMode="single"
  />
  {open && (
    <QunoDatePicker
      className="day-field__picker"
      value={date}
      onChange={setDate}
      selectionMode="single"
    />
  )}
</div>

/* .day-field__picker [data-slot='selection-header'] { display: none; } */`;

export const singleDaySnippet = `const [date, setDate] = useState<DateRange | null>(null);

<QunoDatePicker
  value={date}
  onChange={setDate}
  selectionMode="single"
/>;`;
