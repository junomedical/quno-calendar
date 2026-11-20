export type QunoBookingSlotPolicy = {
  cadenceMinutes: number;
  overlappingSlots: boolean;
};

/** Apply consumer policy after complete pagination, preserving the exact selected slot payload. */
export const filterBookingSlots = <TSlot extends { start: string; end: string }>({
  slots,
  policy
}: {
  slots: TSlot[];
  policy?: QunoBookingSlotPolicy;
}): TSlot[] => {
  if (!policy) {
    return slots;
  }
  const cadence = policy.cadenceMinutes * 60_000;
  let previousEnd = -Infinity;
  return [...slots]
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .filter((slot) => {
      const start = Date.parse(slot.start);
      if (start % cadence !== 0 || (!policy.overlappingSlots && start < previousEnd)) {
        return false;
      }
      previousEnd = Date.parse(slot.end);
      return true;
    });
};
