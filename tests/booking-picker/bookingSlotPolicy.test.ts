import { filterBookingSlots } from "@quno/calendar/booking-picker";

const slot = (minutes: number) => ({
  start: new Date(Date.UTC(2026, 10, 26, 8, minutes)).toISOString(),
  end: new Date(Date.UTC(2026, 10, 26, 8, minutes + 45)).toISOString(),
  participants: [{ id: "doctor" }]
});

it("aligns automatic 45-minute starts to the shared instant cadence", () => {
  const slots = Array.from({ length: 16 }, (_, i) => slot(i * 5));
  const original = [...slots];
  const result = filterBookingSlots({
    slots: slots.reverse(),
    policy: { cadenceMinutes: 45, overlappingSlots: false }
  });
  expect(result).toEqual([original[3], original[12]]);
  expect(result[0]).toBe(original[3]);
});

it("applies smaller cadence without allowing overlapping appointments", () => {
  const slots = Array.from({ length: 36 }, (_, i) => slot(i * 5));
  const result = filterBookingSlots({ slots, policy: { cadenceMinutes: 25, overlappingSlots: false } });
  expect(result.length).toBeGreaterThan(1);
  expect(result.slice(1).every((s, i) => Date.parse(s.start) >= Date.parse(result[i].end))).toBe(true);
  expect(filterBookingSlots({ slots, policy: { cadenceMinutes: 25, overlappingSlots: true } }).length).toBeGreaterThan(
    result.length
  );
});

it("preserves unconfigured results and diagnostic selection metadata", () => {
  const slots = [{ ...slot(15), selectable: false }];
  expect(filterBookingSlots({ slots })).toBe(slots);
  expect(filterBookingSlots({ slots, policy: { cadenceMinutes: 45, overlappingSlots: false } })[0]).toBe(slots[0]);
});
