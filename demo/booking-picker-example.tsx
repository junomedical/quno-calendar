import { useState } from "react";
import {
  QunoBookingDateTimePicker,
  QunoAvailabilitySourcePanel,
  compareBookingAvailabilityEnvelopes,
  formatBookingDate,
  type QunoAvailabilityDisplayMode
} from "@quno/calendar/booking-picker";
import "@quno/calendar/booking-picker/styles.css";
import "#quno-demo/booking-picker-example.css";

const slot = (hour: string, selectable = true) => ({
  start: `2026-11-05T${hour}:00:00Z`,
  end: `2026-11-05T${hour}:30:00Z`,
  selectable
});
const periods = [{ start: "2026-11-01T00:00:00Z", end: "2026-12-01T00:00:00Z" }];
const cronofy = { booking_availability: { slots: [slot("09"), slot("10")], query_periods: periods } };
const api = { booking_availability: { slots: [slot("09", false), slot("11", false)], query_periods: periods } };
export function BookingPickerExample() {
  const [mode, setMode] = useState<QunoAvailabilityDisplayMode>("compare");
  const [dateOnly, setDateOnly] = useState(false);
  const [selected, setSelected] = useState("");
  const compared = compareBookingAvailabilityEnvelopes({ cronofy, quno: api });
  const slots =
    mode === "compare"
      ? compared.options.booking_availability.slots
      : (mode === "cronofy" ? cronofy : api).booking_availability.slots;
  return (
    <section id="booking-picker" className="booking-picker-example guide-section">
      <h2>Booking picker example</h2>
      <p>Demo data · November 2026</p>
      <label>
        <input
          type="checkbox"
          checked={dateOnly}
          onChange={(event) => {
            setDateOnly(event.currentTarget.checked);
            setSelected("");
          }}
        />{" "}
        Date-only booking
      </label>
      <QunoAvailabilitySourcePanel
        mode={mode}
        loading={false}
        counts={compared.counts}
        timings={null}
        onSelect={({ mode }) => setMode(mode)}
        labels={{
          label: "Availability source",
          cronofy: "Cronofy",
          quno: "API",
          compare: "Compare",
          matching: ({ count }) => `Matching ${count}`,
          qunoOnly: ({ count }) => `API only ${count}`,
          cronofyOnly: ({ count }) => `Cronofy only ${count}`,
          bootstrapIn: ({ milliseconds }) => `Bootstrap ${milliseconds} ms`,
          availabilityIn: ({ milliseconds }) => `Availability ${milliseconds} ms`
        }}
      />
      <QunoBookingDateTimePicker
        slots={slots}
        queryPeriods={periods}
        dateOnly={dateOnly}
        timeZone="UTC"
        showTimeZone={false}
        labels={{ selectedDate: formatBookingDate }}
        onSlotSelected={({ slot }) => setSelected(slot.start)}
      />
      <output aria-live="polite">
        {selected ? `Selected ${selected}` : dateOnly ? "Choose a day, then confirm" : "Choose a date and time"}
      </output>
    </section>
  );
}
